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

function renderPublishedPostList(container, posts, activeId) {
  const sorted = [...posts].sort((a, b) => {
    const aDate = new Date(a.date || a.publishAt || 0);
    const bDate = new Date(b.date || b.publishAt || 0);
    return aDate - bDate;
  });

  if (!sorted.length) {
    container.innerHTML = '<p class="post-list-empty">Aún no hay entradas publicadas.</p>';
    return;
  }

  container.innerHTML = sorted
    .map((post, index) => {
      const itemKind = post.date ? 'published' : 'scheduled';
      const active = post.id === activeId ? ' post-list-item--active' : '';
      const badge = itemKind === 'scheduled' ? '<span class="post-list-badge">Programada</span>' : '';
      return `
    <button type="button" class="post-list-item${active}" data-post-id="${postListEscapeHtml(post.id)}" data-kind="${itemKind}">
      <span class="post-list-num">${index + 1}</span>
      <span class="post-list-meta">
        <time class="post-list-date">${formatPostListDate(post.date || post.publishAt)}</time>
        ${badge}
        <span class="post-list-title">${postListEscapeHtml(post.title)}</span>
      </span>
    </button>`;
    })
    .join('');
}

function initPublishedPostList({ containerId, onSelect }) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  let activeId = '';

  async function refresh() {
    const data = await loadCalendarData();
    const scheduledPosts = data.scheduled || [];
    const publishedPosts = data.published || [];
    const allPosts = [...scheduledPosts, ...publishedPosts];
    renderPublishedPostList(container, allPosts, activeId);
  }

  container.addEventListener('click', (event) => {
    const item = event.target.closest('[data-post-id]');
    if (!item || typeof onSelect !== 'function') return;
    activeId = item.getAttribute('data-post-id');
    container.querySelectorAll('.post-list-item--active').forEach((el) => {
      el.classList.remove('post-list-item--active');
    });
    item.classList.add('post-list-item--active');
    onSelect({
      postId: activeId,
      kind: item.getAttribute('data-kind'),
    });
  });

  refresh().catch((err) => {
    console.warn('Lista de publicadas:', err);
    container.innerHTML = '<p class="post-list-empty">No se pudo cargar la lista.</p>';
  });

  return {
    refresh,
    setActive(postId) {
      activeId = postId || '';
    },
  };
}
