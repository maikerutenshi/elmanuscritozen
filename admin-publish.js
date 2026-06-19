function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'entrada';
}

function makePostId(title) {
  const date = new Date().toISOString().slice(0, 10);
  return `${date}-${slugify(title)}`;
}

function textToHtml(content) {
  const paragraphs = content
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return '<div class="post-body"><p></p></div>';
  }

  const body = paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<div class="post-body">\n${body}\n</div>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toBase64Utf8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

async function resizeImageToJpeg(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, ZEN_ADMIN.maxImageWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', ZEN_ADMIN.jpegQuality);
  });

  if (!blob) {
    throw new Error('No se pudo procesar la imagen.');
  }

  return blob;
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

async function ghApi(path, options = {}) {
  const token = getGithubToken();
  if (!token) {
    throw new Error('Falta el token de GitHub. Configúralo en Administración.');
  }

  const response = await fetch(`https://api.github.com/repos/${ZEN_ADMIN.githubRepo}/contents/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = data.message || `Error ${response.status} al hablar con GitHub.`;
    if (/bad credentials/i.test(message)) {
      message =
        'Token de GitHub inválido o caducado. Ve a Administración → Cambiar token y pega uno nuevo (Contents: Read and write).';
    }
    throw new Error(message);
  }

  return data;
}

async function readRepoFile(path) {
  try {
    const data = await ghApi(path);
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    return { content: decoded, sha: data.sha };
  } catch (err) {
    if (String(err.message).includes('Not Found')) {
      return null;
    }
    throw err;
  }
}

async function writeRepoFile(path, contentBase64, message, sha) {
  const body = {
    message,
    content: contentBase64,
    branch: 'main',
  };
  if (sha) body.sha = sha;

  return ghApi(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function ensureUniquePostId(baseId, posts) {
  if (!posts.some((post) => post.id === baseId)) {
    return baseId;
  }
  return `${baseId}-${Date.now().toString(36)}`;
}

async function publishEntry({ title, content, imageFile }) {
  let postId = makePostId(title);
  const indexFile = await readRepoFile(ZEN_ADMIN.postsIndexPath);
  const posts = indexFile ? JSON.parse(indexFile.content) : [];
  if (!Array.isArray(posts)) {
    throw new Error('posts/posts.json no tiene un formato válido.');
  }

  postId = await ensureUniquePostId(postId, posts);

  const htmlContent = textToHtml(content);
  const htmlBase64 = toBase64Utf8(htmlContent);
  const contentPath = `posts/${postId}/content.html`;

  let coverPath = ZEN_ADMIN.defaultCover || 'zen_hero.png';

  if (imageFile) {
    const jpegBlob = await resizeImageToJpeg(imageFile);
    const imageBase64 = await blobToBase64(jpegBlob);
    coverPath = `posts/${postId}/cover.jpg`;
    await writeRepoFile(coverPath, imageBase64, `Imagen: ${title}`);
  }

  await writeRepoFile(contentPath, htmlBase64, `Contenido: ${title}`);

  const excerpt = content.trim().slice(0, 140) + (content.trim().length > 140 ? '…' : '');
  const entry = {
    id: postId,
    title: title.trim(),
    excerpt,
    date: new Date().toISOString(),
    cover: coverPath,
    contentPath,
  };

  posts.unshift(entry);

  await writeRepoFile(
    ZEN_ADMIN.postsIndexPath,
    toBase64Utf8(JSON.stringify(posts, null, 2) + '\n'),
    `Actualizar índice: ${title}`,
    indexFile?.sha
  );

  if (typeof ZEN_SEO !== 'undefined') {
    const entryPageHtml = ZEN_SEO.buildEntryPageHtml(entry, htmlContent);
    await writeRepoFile(
      `entrada/${postId}/index.html`,
      toBase64Utf8(entryPageHtml),
      `Página SEO: ${title}`
    );
    await writeRepoFile(
      'sitemap.xml',
      toBase64Utf8(ZEN_SEO.buildSitemapXml(posts)),
      'Actualizar sitemap'
    );
  }

  await notifyPostPublished(entry);

  return entry;
}

function postPublicUrl(postId) {
  const base = (ZEN_ADMIN.siteBaseUrl || 'https://elmanuscritozen.com').replace(/\/$/, '');
  return `${base}/entrada/${postId}/`;
}

async function notifyPostPublished(entry) {
  const webhook = ZEN_ADMIN.postNotifyWebhook;
  if (!webhook) return;

  const payload = {
    token: ZEN_ADMIN.postNotifyToken || '',
    title: entry.title,
    excerpt: entry.excerpt || '',
    postId: entry.id,
    url: postPublicUrl(entry.id),
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn('Aviso Dojo (Make): respuesta', response.status);
    }
  } catch (err) {
    console.warn('Aviso Dojo (Make):', err);
  }
}
