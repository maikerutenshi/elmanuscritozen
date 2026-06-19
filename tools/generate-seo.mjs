import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { buildEntryPageHtml, buildSitemapXml } = require('../admin-seo.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const posts = JSON.parse(fs.readFileSync(path.join(root, 'posts/posts.json'), 'utf8'));

for (const entry of posts) {
  const contentPath = path.join(root, entry.contentPath || `posts/${entry.id}/content.html`);
  const contentHtml = fs.readFileSync(contentPath, 'utf8');
  const pageHtml = buildEntryPageHtml(entry, contentHtml);
  const outDir = path.join(root, 'entrada', entry.id);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml, 'utf8');
  console.log('entrada/' + entry.id + '/index.html');
}

fs.writeFileSync(path.join(root, 'sitemap.xml'), buildSitemapXml(posts), 'utf8');
console.log('sitemap.xml');
