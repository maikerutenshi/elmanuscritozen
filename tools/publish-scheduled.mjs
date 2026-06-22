#!/usr/bin/env node
/**
 * Publica entradas cuya fecha programada ya ha llegado.
 * Lo ejecuta GitHub Actions cada 15 minutos (sin Make ni servidor propio).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { buildEntryPageHtml, buildSitemapXml } = require('../admin-seo.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const POSTS_INDEX = path.join(root, 'posts/posts.json');
const SCHEDULED_INDEX = path.join(root, 'posts/scheduled.json');
const SITEMAP = path.join(root, 'sitemap.xml');

const NOTIFY_WEBHOOK = process.env.POST_NOTIFY_WEBHOOK || '';
const NOTIFY_TOKEN = process.env.POST_NOTIFY_TOKEN || '';

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function postPublicUrl(postId) {
  return `https://elmanuscritozen.com/entrada/${postId}/`;
}

async function notifyPostPublished(entry) {
  if (!NOTIFY_WEBHOOK) return;
  try {
    const response = await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: NOTIFY_TOKEN,
        title: entry.title,
        excerpt: entry.excerpt || '',
        postId: entry.id,
        url: postPublicUrl(entry.id),
      }),
    });
    if (!response.ok) {
      console.warn('Aviso Dojo:', response.status);
    }
  } catch (err) {
    console.warn('Aviso Dojo:', err.message);
  }
}

function moveScheduledToPublished(item) {
  const scheduledDir = path.join(root, 'posts/scheduled', item.id);
  const publishedDir = path.join(root, 'posts', item.id);
  fs.mkdirSync(publishedDir, { recursive: true });

  const scheduledContent = path.join(scheduledDir, 'content.html');
  const publishedContent = path.join(publishedDir, 'content.html');
  fs.copyFileSync(scheduledContent, publishedContent);

  let coverPath = item.cover || 'zen_hero.png';
  const scheduledCover = path.join(scheduledDir, 'cover.jpg');
  if (fs.existsSync(scheduledCover)) {
    fs.copyFileSync(scheduledCover, path.join(publishedDir, 'cover.jpg'));
    coverPath = `posts/${item.id}/cover.jpg`;
  }

  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt || '',
    date: item.publishAt,
    cover: coverPath,
    contentPath: `posts/${item.id}/content.html`,
  };
}

function removeScheduledFolder(id) {
  const dir = path.join(root, 'posts/scheduled', id);
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function publishDueEntries() {
  const now = Date.now();
  const scheduled = readJson(SCHEDULED_INDEX, []);
  if (!Array.isArray(scheduled) || scheduled.length === 0) {
    console.log('No hay entradas programadas.');
    return false;
  }

  const due = scheduled.filter((item) => new Date(item.publishAt).getTime() <= now);
  if (due.length === 0) {
    console.log('Ninguna entrada pendiente de publicar ahora.');
    return false;
  }

  const posts = readJson(POSTS_INDEX, []);
  const published = [];

  for (const item of due) {
    const entry = moveScheduledToPublished(item);
    posts.unshift(entry);
    published.push(entry);

    const contentHtml = fs.readFileSync(path.join(root, entry.contentPath), 'utf8');
    const outDir = path.join(root, 'entrada', entry.id);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), buildEntryPageHtml(entry, contentHtml), 'utf8');
    removeScheduledFolder(item.id);
    console.log(`Publicada: ${entry.id}`);
  }

  const remaining = scheduled.filter((item) => !due.some((d) => d.id === item.id));
  writeJson(POSTS_INDEX, posts);
  writeJson(SCHEDULED_INDEX, remaining);
  fs.writeFileSync(SITEMAP, buildSitemapXml(posts), 'utf8');

  return published;
}

async function main() {
  const published = publishDueEntries();
  if (!published) {
    process.exit(0);
  }

  for (const entry of published) {
    await notifyPostPublished(entry);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
