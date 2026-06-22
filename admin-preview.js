function showPreviewWindow(pageHtml) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    throw new Error('Permite ventanas emergentes para ver la vista previa.');
  }

  previewWindow.document.open();
  previewWindow.document.write(pageHtml);
  previewWindow.document.close();
}

function buildPreviewOptions({ publishAt, imageFile, coverSrc }) {
  const publishDate = publishAt ? new Date(publishAt) : new Date();
  const scheduledLabel = publishAt
    ? publishDate.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : '';

  return {
    coverSrc: coverSrc || (imageFile ? URL.createObjectURL(imageFile) : ''),
    scheduled: Boolean(publishAt),
    scheduledLabel,
    publishDate,
  };
}

function openPostPreview({ title, content, imageFile, publishAt }) {
  if (!title && !content) {
    throw new Error('Escribe al menos título o texto para la vista previa.');
  }

  const { coverSrc, scheduled, scheduledLabel, publishDate } = buildPreviewOptions({
    publishAt,
    imageFile,
  });

  if (publishAt && Number.isNaN(publishDate.getTime())) {
    throw new Error('La fecha de publicación no es válida.');
  }

  const entry = {
    id: 'vista-previa',
    title: title.trim() || 'Sin título',
    excerpt: buildExcerpt(content),
    date: publishDate.toISOString(),
    cover: imageFile ? 'preview-cover.jpg' : 'zen_hero.png',
  };

  showPreviewWindow(
    ZEN_SEO.buildPreviewPageHtml(entry, textToHtml(content || ''), {
      coverSrc,
      scheduled,
      scheduledLabel,
    })
  );
}

async function readRepoImageDataUrl(path) {
  try {
    const data = await ghApi(path);
    const mime = /\.png$/i.test(path) ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${data.content.replace(/\n/g, '')}`;
  } catch {
    return '';
  }
}

async function openScheduledPostPreview(postId) {
  const schedData = await readScheduledList();
  const item = schedData.list.find((post) => post.id === postId);
  if (!item) {
    throw new Error('No se encontró la entrada programada.');
  }

  const contentFile = await readRepoFile(item.contentPath);
  if (!contentFile) {
    throw new Error('No se pudo cargar el contenido programado.');
  }

  let coverSrc = '';
  const cover = item.cover || '';
  if (cover && !/zen_hero/i.test(cover)) {
    coverSrc = await readRepoImageDataUrl(cover);
  }

  const publishDate = new Date(item.publishAt);
  const entry = {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt || '',
    date: item.publishAt,
    cover: item.cover,
  };

  showPreviewWindow(
    ZEN_SEO.buildPreviewPageHtml(entry, contentFile.content.trim(), {
      coverSrc,
      scheduled: true,
      scheduledLabel: publishDate.toLocaleString('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    })
  );
}
