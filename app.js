// EL MANUSCRITO ZEN — entradas locales (posts/posts.json + JPG en posts/)

let currentPosts = [];
const POSTS_URL = 'posts/posts.json';

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();

  const loadMoreWrap = document.getElementById('load-more-wrap');
  if (loadMoreWrap) loadMoreWrap.style.display = 'none';
});

function postPageUrl(postId) {
  return `/entrada/${encodeURIComponent(postId)}/`;
}

async function loadPosts() {
  try {
    const response = await fetch(`${POSTS_URL}?v=${Date.now()}`);
    if (!response.ok) throw new Error('No se encontró posts/posts.json');
    const data = await response.json();
    currentPosts = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(err);
    currentPosts = [];
  }

  if (document.getElementById('posts-grid')) renderHomePage();
  if (document.getElementById('archive-container')) renderArchivePage();
  redirectLegacyPostUrl();
}

function redirectLegacyPostUrl() {
  const postId = new URLSearchParams(window.location.search).get('entrada');
  if (!postId || !currentPosts.some((post) => post.id === postId)) return;
  window.location.replace(postPageUrl(postId));
}

function renderHomePage() {
  const posts = [...currentPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featuredContainer = document.getElementById('featured-post-container');
  const gridContainer = document.getElementById('posts-grid');

  if (!featuredContainer || !gridContainer) return;

  featuredContainer.innerHTML = '';
  gridContainer.innerHTML = '';

  if (posts.length === 0) {
    gridContainer.innerHTML =
      '<p class="posts-empty">Aún no hay entradas publicadas. Pronto habrá reflexiones aquí.</p>';
    return;
  }

  featuredContainer.innerHTML = buildFeaturedCard(posts[0]);

  posts.slice(1).forEach((post) => {
    gridContainer.insertAdjacentHTML('beforeend', buildPostCard(post));
  });
}

function renderArchivePage() {
  renderArchivePageAsync();
}

async function renderArchivePageAsync() {
  const container = document.getElementById('archive-container');
  if (!container) return;

  const posts = [...currentPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = '<p class="posts-empty">Cargando archivo…</p>';

  if (posts.length === 0) {
    container.innerHTML = '<p class="posts-empty">El archivo está vacío por ahora.</p>';
    return;
  }

  let commentCounts = {};
  if (typeof fetchCommentCountsForPosts === 'function') {
    commentCounts = await fetchCommentCountsForPosts(posts.map((post) => post.id));
  }

  container.innerHTML = '';
  posts.forEach((post) => {
    container.insertAdjacentHTML(
      'beforeend',
      buildArchiveItem(post, commentCounts[post.id] ?? 0)
    );
  });

  const hint = document.getElementById('archive-hint');
  if (hint) hint.hidden = false;
}

function buildArchiveItem(post, commentCount) {
  const alt = escapeAttr(post.title || 'Entrada del blog');
  return `
    <article class="archive-item">
      <img src="${escapeAttr(post.cover)}" alt="${alt}" class="archive-item-img" onerror="this.src='zen_hero.png'" />
      <div class="archive-item-body">
        <h2 class="archive-item-heading">
          <a href="${escapeAttr(postPageUrl(post.id))}" class="archive-item-title">
            ${escapeHtml(post.title)}
          </a>
        </h2>
        <div class="archive-item-meta">
          <time datetime="${escapeAttr(post.date)}">${formatArchiveDate(post.date)}</time>
          <span class="archive-item-comments">${formatCommentCount(commentCount)}</span>
        </div>
      </div>
    </article>`;
}

function formatArchiveDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatCommentCount(count) {
  const n = Number(count) || 0;
  if (n === 0) return '0 comentarios';
  if (n === 1) return '1 comentario';
  return `${n} comentarios`;
}

function buildFeaturedCard(post) {
  const alt = escapeAttr(post.title || 'Entrada del blog');
  const href = escapeAttr(postPageUrl(post.id));
  return `
    <a href="${href}" class="featured-card post-card-link">
      <img src="${escapeAttr(post.cover)}" alt="${alt}" class="featured-img" onerror="this.src='zen_hero.png'" />
      <div class="featured-content">
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt || '')}</p>
      </div>
    </a>`;
}

function buildPostCard(post) {
  const alt = escapeAttr(post.title || 'Entrada del blog');
  const href = escapeAttr(postPageUrl(post.id));
  return `
    <a href="${href}" class="post-card post-card-link">
      <img src="${escapeAttr(post.cover)}" alt="${alt}" class="post-card-img" onerror="this.src='zen_hero.png'" />
      <div class="post-card-body">
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt || '')}</p>
      </div>
    </a>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;');
}

function loadMorePosts() {}
