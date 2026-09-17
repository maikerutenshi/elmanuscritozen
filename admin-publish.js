function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'entrada';
}

function makePostId(title, when = new Date()) {
  const date = (when instanceof Date ? when : new Date(when)).toISOString().slice(0, 10);
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

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function htmlToPlainText(html) {
  const inner = String(html || '')
    .replace(/<div[^>]*class="post-body"[^>]*>/i, '')
    .replace(/<\/div>\s*$/i, '')
    .trim();

  return inner
    .split(/<\/p>/i)
    .map((part) => part.replace(/<p[^>]*>/i, '').trim())
    .filter(Boolean)
    .map((paragraph) =>
      decodeHtmlEntities(paragraph.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    )
    .join('\n\n');
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

async function writeOrUpdateRepoFile(path, contentBase64, message) {
  const existing = await readRepoFile(path);
  return writeRepoFile(path, contentBase64, message, existing?.sha);
}

async function ensureUniquePostId(baseId, posts) {
  if (!posts.some((post) => post.id === baseId)) {
    return baseId;
  }
  return `${baseId}-${Date.now().toString(36)}`;
}

function buildExcerpt(content) {
  const trimmed = content.trim();
  return trimmed.slice(0, 140) + (trimmed.length > 140 ? '…' : '');
}

function seoFieldsFromContent(title, content, overrides = {}) {
  const seo = typeof ZEN_SEO !== 'undefined' ? ZEN_SEO : {};
  const seoTitle =
    String(overrides.seoTitle || '').trim() ||
    (seo.defaultSeoTitle ? seo.defaultSeoTitle(title) : title);
  const metaDescription =
    String(overrides.metaDescription || '').trim() ||
    (seo.defaultMetaDescription ? seo.defaultMetaDescription(title, content) : buildExcerpt(content));
  return { seoTitle, metaDescription };
}

async function readScheduledList() {
  const path = ZEN_ADMIN.scheduledIndexPath || 'posts/scheduled.json';
  const file = await readRepoFile(path);
  const list = file ? JSON.parse(file.content) : [];
  return {
    list: Array.isArray(list) ? list : [],
    sha: file?.sha,
    path,
  };
}

async function scheduleEntry({ title, content, imageFile, publishAt, seoTitle, metaDescription }) {
  const publishDate = new Date(publishAt);
  if (Number.isNaN(publishDate.getTime())) {
    throw new Error('Fecha u hora no válida.');
  }
  if (publishDate.getTime() <= Date.now()) {
    throw new Error('La programación debe ser en el futuro.');
  }

  let postId = makePostId(title, publishDate);
  const indexFile = await readRepoFile(ZEN_ADMIN.postsIndexPath);
  const posts = indexFile ? JSON.parse(indexFile.content) : [];
  if (!Array.isArray(posts)) {
    throw new Error('posts/posts.json no tiene un formato válido.');
  }

  const scheduledData = await readScheduledList();
  const scheduled = scheduledData.list;
  postId = await ensureUniquePostId(postId, [...posts, ...scheduled]);

  const htmlContent = textToHtml(content);
  const htmlBase64 = toBase64Utf8(htmlContent);
  const contentPath = `posts/scheduled/${postId}/content.html`;

  let coverPath = ZEN_ADMIN.defaultCover || 'zen_hero.png';

  if (imageFile) {
    const jpegBlob = await resizeImageToJpeg(imageFile);
    const imageBase64 = await blobToBase64(jpegBlob);
    coverPath = `posts/scheduled/${postId}/cover.jpg`;
    await writeRepoFile(coverPath, imageBase64, `Programar imagen: ${title}`);
  }

  await writeRepoFile(contentPath, htmlBase64, `Programar contenido: ${title}`);

  const seo = seoFieldsFromContent(title.trim(), content, { seoTitle, metaDescription });
  const entry = {
    id: postId,
    title: title.trim(),
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    excerpt: buildExcerpt(content),
    publishAt: publishDate.toISOString(),
    cover: coverPath,
    contentPath,
  };

  scheduled.push(entry);
  scheduled.sort((a, b) => new Date(a.publishAt) - new Date(b.publishAt));

  await writeRepoFile(
    scheduledData.path,
    toBase64Utf8(JSON.stringify(scheduled, null, 2) + '\n'),
    `Programar entrada: ${title}`,
    scheduledData.sha
  );

  return entry;
}

async function publishEntry({ title, content, imageFile, seoTitle, metaDescription }) {
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

  const seo = seoFieldsFromContent(title.trim(), content, { seoTitle, metaDescription });
  const entry = {
    id: postId,
    title: title.trim(),
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    excerpt: buildExcerpt(content),
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
    const entryPagePath = `entrada/${postId}/index.html`;
    await writeOrUpdateRepoFile(
      entryPagePath,
      toBase64Utf8(entryPageHtml),
      `Página SEO: ${title}`
    );
    await writeOrUpdateRepoFile(
      'sitemap.xml',
      toBase64Utf8(ZEN_SEO.buildSitemapXml(posts)),
      'Actualizar sitemap'
    );
  }

  await notifyPostPublished(entry);

  return entry;
}

async function loadPostForEditor(postId) {
  const data = await loadCalendarData();
  const scheduled = data.scheduled.find((post) => post.id === postId);
  const published = data.published.find((post) => post.id === postId);
  const entry = scheduled || published;
  if (!entry) {
    throw new Error('No se encontró la entrada.');
  }

  const contentFile = await readRepoFile(entry.contentPath);
  if (!contentFile) {
    throw new Error('No se pudo cargar el texto de la entrada.');
  }

  return {
    entry,
    kind: scheduled ? 'scheduled' : 'published',
    content: htmlToPlainText(contentFile.content),
  };
}

async function saveExistingEntry({
  postId,
  kind,
  title,
  content,
  imageFile,
  seoTitle,
  metaDescription,
  publishAt,
}) {
  const htmlContent = textToHtml(content);
  const htmlBase64 = toBase64Utf8(htmlContent);
  const seo = seoFieldsFromContent(title.trim(), content, { seoTitle, metaDescription });

  if (kind === 'scheduled') {
    const scheduledData = await readScheduledList();
    const index = scheduledData.list.findIndex((post) => post.id === postId);
    if (index < 0) {
      throw new Error('Esa entrada programada ya no está en la cola.');
    }

    const current = scheduledData.list[index];
    let coverPath = current.cover;
    if (imageFile) {
      const jpegBlob = await resizeImageToJpeg(imageFile);
      const imageBase64 = await blobToBase64(jpegBlob);
      coverPath = current.cover && current.cover.startsWith('posts/scheduled/')
        ? current.cover
        : `posts/scheduled/${postId}/cover.jpg`;
      await writeOrUpdateRepoFile(coverPath, imageBase64, `Actualizar imagen: ${title}`);
    }

    await writeOrUpdateRepoFile(current.contentPath, htmlBase64, `Actualizar contenido: ${title}`);

    let nextPublishAt = current.publishAt;
    if (publishAt) {
      const publishDate = new Date(publishAt);
      if (Number.isNaN(publishDate.getTime())) {
        throw new Error('Fecha u hora no válida.');
      }
      if (publishDate.getTime() <= Date.now()) {
        throw new Error('La programación debe ser en el futuro.');
      }
      nextPublishAt = publishDate.toISOString();
    }

    const updated = {
      ...current,
      title: title.trim(),
      seoTitle: seo.seoTitle,
      metaDescription: seo.metaDescription,
      excerpt: buildExcerpt(content),
      publishAt: nextPublishAt,
      cover: coverPath,
    };
    scheduledData.list[index] = updated;
    scheduledData.list.sort((a, b) => new Date(a.publishAt) - new Date(b.publishAt));

    await writeRepoFile(
      scheduledData.path,
      toBase64Utf8(JSON.stringify(scheduledData.list, null, 2) + '\n'),
      `Actualizar programada: ${title}`,
      scheduledData.sha
    );
    return updated;
  }

  const indexFile = await readRepoFile(ZEN_ADMIN.postsIndexPath);
  const posts = indexFile ? JSON.parse(indexFile.content) : [];
  if (!Array.isArray(posts)) {
    throw new Error('posts/posts.json no tiene un formato válido.');
  }

  const index = posts.findIndex((post) => post.id === postId);
  if (index < 0) {
    throw new Error('Esa entrada ya no está en el índice.');
  }

  const current = posts[index];
  let coverPath = current.cover;
  if (imageFile) {
    const jpegBlob = await resizeImageToJpeg(imageFile);
    const imageBase64 = await blobToBase64(jpegBlob);
    coverPath = current.cover && current.cover.startsWith(`posts/${postId}/`)
      ? current.cover
      : `posts/${postId}/cover.jpg`;
    await writeOrUpdateRepoFile(coverPath, imageBase64, `Actualizar imagen: ${title}`);
  }

  await writeOrUpdateRepoFile(current.contentPath, htmlBase64, `Actualizar contenido: ${title}`);

  const entry = {
    ...current,
    title: title.trim(),
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    excerpt: buildExcerpt(content),
    cover: coverPath,
    date: current.date,
    id: current.id,
    contentPath: current.contentPath,
  };
  posts[index] = entry;

  await writeRepoFile(
    ZEN_ADMIN.postsIndexPath,
    toBase64Utf8(JSON.stringify(posts, null, 2) + '\n'),
    `Actualizar índice: ${title}`,
    indexFile?.sha
  );

  if (typeof ZEN_SEO !== 'undefined') {
    const entryPageHtml = ZEN_SEO.buildEntryPageHtml(entry, htmlContent);
    await writeOrUpdateRepoFile(
      `entrada/${postId}/index.html`,
      toBase64Utf8(entryPageHtml),
      `Actualizar página SEO: ${title}`
    );
    await writeOrUpdateRepoFile(
      'sitemap.xml',
      toBase64Utf8(ZEN_SEO.buildSitemapXml(posts)),
      'Actualizar sitemap'
    );
  }

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
