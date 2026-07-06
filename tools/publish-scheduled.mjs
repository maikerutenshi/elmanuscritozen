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

function loadNotifyConfig() {
  const configPath = path.join(root, 'admin-config.js');
  const raw = fs.readFileSync(configPath, 'utf8');
  const webhook = raw.match(/postNotifyWebhook:\s*'([^']*)'/)?.[1] || '';
  const token = raw.match(/postNotifyToken:\s*'([^']*)'/)?.[1] || '';
  return {
    webhook: process.env.POST_NOTIFY_WEBHOOK || webhook,
    token: process.env.POST_NOTIFY_TOKEN || token,
  };
}

const NOTIFY = loadNotifyConfig();
const NOTIFY_PENDING = path.join(root, '.notify-pending.json');
const args = new Set(process.argv.slice(2));
const deferNotify = args.has('--defer-notify');
const notifyOnly = args.has('--notify-only');

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

async function waitForPublicUrl(url, maxMs = 20 * 60 * 1000, intervalMs = 30 * 1000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (response.ok) {
        console.log(`En línea: ${url}`);
        return true;
      }
      console.log(`Esperando despliegue (${response.status}): ${url}`);
    } catch (err) {
      console.log(`Esperando despliegue (${err.message}): ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  console.warn(`Tiempo de espera agotado: ${url}`);
  return false;
}

async function notifyPostPublished(entry, { waitForDeploy = false } = {}) {
  if (!NOTIFY.webhook) return;
  const url = postPublicUrl(entry.id);
  if (waitForDeploy && !(await waitForPublicUrl(url))) {
    console.warn(`No se envía aviso Dojo: la entrada aún no está online (${entry.id})`);
    return;
  }
  try {
    const response = await fetch(NOTIFY.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: NOTIFY.token,
        title: entry.title,
        excerpt: entry.excerpt || '',
        postId: entry.id,
        url,
      }),
    });
    if (!response.ok) {
      console.warn('Aviso Dojo:', response.status);
    } else {
      console.log(`Aviso Dojo enviado: ${entry.id}`);
    }
  } catch (err) {
    console.warn('Aviso Dojo:', err.message);
  }
}

function savePendingNotifications(entries) {
  if (!entries.length) return;
  writeJson(NOTIFY_PENDING, entries);
}

function loadPendingNotifications() {
  if (!fs.existsSync(NOTIFY_PENDING)) return [];
  return readJson(NOTIFY_PENDING, []);
}

function clearPendingNotifications() {
  if (fs.existsSync(NOTIFY_PENDING)) fs.unlinkSync(NOTIFY_PENDING);
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

async function notifyPendingEntries() {
  const pending = loadPendingNotifications();
  if (!pending.length) {
    console.log('No hay avisos Dojo pendientes.');
    return;
  }

  for (const entry of pending) {
    await notifyPostPublished(entry, { waitForDeploy: true });
  }
  clearPendingNotifications();
}

async function main() {
  if (notifyOnly) {
    await notifyPendingEntries();
    return;
  }

  const published = publishDueEntries();
  if (!published) {
    process.exit(0);
  }

  if (deferNotify) {
    savePendingNotifications(published);
    console.log(`Avisos Dojo diferidos (${published.length}).`);
    return;
  }

  for (const entry of published) {
    await notifyPostPublished(entry);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
