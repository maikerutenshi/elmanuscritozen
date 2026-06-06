// EL MANUSCRITO ZEN — entradas locales (posts/posts.json + JPG en posts/)

let currentPosts = [];
const POSTS_URL = 'posts/posts.json';

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();

  const loadMoreWrap = document.getElementById('load-more-wrap');
  if (loadMoreWrap) loadMoreWrap.style.display = 'none';
});

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

  bindPostClicks(featuredContainer);
  bindPostClicks(gridContainer);
}

function renderArchivePage() {
  const container = document.getElementById('archive-container');
  if (!container) return;

  const posts = [...currentPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML =
      '<p class="posts-empty">El archivo está vacío por ahora.</p>';
    return;
  }

  posts.forEach((post) => {
    container.insertAdjacentHTML('beforeend', buildPostCard(post));
  });

  bindPostClicks(container);
}

function buildFeaturedCard(post) {
  return `
    <article class="featured-card post-clickable" data-post-id="${escapeAttr(post.id)}" tabindex="0" role="button">
      <img src="${escapeAttr(post.cover)}" alt="" class="featured-img" onerror="this.src='zen_hero.png'" />
      <div class="featured-content">
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || '')}</p>
      </div>
    </article>`;
}

function buildPostCard(post) {
  return `
    <article class="post-card post-clickable" data-post-id="${escapeAttr(post.id)}" tabindex="0" role="button">
      <img src="${escapeAttr(post.cover)}" alt="" class="post-card-img" onerror="this.src='zen_hero.png'" />
      <h4>${escapeHtml(post.title)}</h4>
      <p>${escapeHtml(post.excerpt || '')}</p>
    </article>`;
}

function bindPostClicks(container) {
  if (!container) return;
  container.querySelectorAll('.post-clickable').forEach((el) => {
    el.addEventListener('click', () => openPostView(el.dataset.postId));
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPostView(el.dataset.postId);
      }
    });
  });
}

async function openPostView(postId) {
  const post = currentPosts.find((item) => item.id === postId);
  const overlay = document.getElementById('post-view-overlay');
  const body = document.getElementById('post-view-body');
  if (!post || !overlay || !body) return;

  body.innerHTML = `<p class="posts-empty">Cargando…</p>`;
  overlay.classList.add('active');

  try {
    const path = post.contentPath || `posts/${post.id}/content.html`;
    const response = await fetch(path);
    const html = response.ok ? await response.text() : `<div class="post-body"><p>${escapeHtml(post.excerpt || '')}</p></div>`;
    body.innerHTML = `
      <header class="post-view-meta">
        <h2>${escapeHtml(post.title)}</h2>
        <time datetime="${escapeAttr(post.date)}">${formatDate(post.date)}</time>
      </header>
      ${html}`;

    if (typeof mountCommentsForPost === 'function') {
      mountCommentsForPost(postId);
    }
  } catch {
    body.innerHTML = `<p class="posts-empty">No se pudo cargar la entrada.</p>`;
  }
}

function formatDate(iso) {
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

function closePostView() {
  if (typeof teardownComments === 'function') teardownComments();
  const overlay = document.getElementById('post-view-overlay');
  if (overlay) overlay.classList.remove('open', 'active');
}

function closePostViewOnOverlay(event) {
  if (event.target.id === 'post-view-overlay') closePostView();
}
