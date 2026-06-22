function postListEscapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPostListDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function renderPublishedPostList(container, posts) {
  const sorted = [...posts].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sorted.length) {
    container.innerHTML = '<p class="post-list-empty">Aún no hay entradas publicadas.</p>';
    return;
  }

  container.innerHTML = sorted
    .map(
      (post, index) => `
    <div class="post-list-item">
      <span class="post-list-num">${index + 1}</span>
      <span class="post-list-meta">
        <time class="post-list-date">${formatPostListDate(post.date)}</time>
        <span class="post-list-title">${postListEscapeHtml(post.title)}</span>
      </span>
    </div>`
    )
    .join('');
}

function initPublishedPostList({ containerId }) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  async function refresh() {
    const data = await loadCalendarData();
    renderPublishedPostList(container, data.published);
  }

  refresh().catch((err) => {
    console.warn('Lista de publicadas:', err);
    container.innerHTML = '<p class="post-list-empty">No se pudo cargar la lista.</p>';
  });

  return { refresh };
}
