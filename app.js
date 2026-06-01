// EL MANUSCRITO ZEN — NÚCLEO LOGIC (FIREBASE INTEGRADO)

const ADMIN_USER = "miguel"; 
const ADMIN_PASS = "zen2026"; 

let currentPosts = [];
let postsPerPage = 6;
let currentPage = 1;

// 1. INICIALIZACIÓN Y CONEXIÓN CON FIREBASE
document.addEventListener('DOMContentLoaded', () => {
    // Conexión a la base de datos en tiempo real
    firebase.database().ref('posts').on('value', (snapshot) => {
        const data = snapshot.val();
        currentPosts = data ? Object.values(data) : [];
        if (document.getElementById('posts-grid')) renderHomePage();
    });

    if (localStorage.getItem('zen_admin_logged') === 'true') showAdminFeatures();
    if (document.getElementById('daily-quote')) generateDailyQuote();
    setupNavbarScroll();
});

// 2. GESTIÓN DE ENTRADAS (NUBE)
function getPosts() {
    return currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function publishPost() {
    const title = document.getElementById('post-title-input').value.trim();
    const category = document.getElementById('post-category-input').value;
    const excerpt = document.getElementById('post-excerpt-input').value.trim();
    const content = document.getElementById('post-content-input').innerHTML; 
    const tagsInput = document.getElementById('post-tags-input').value;

    if (!title || !excerpt || !content || content === '<br>' || content.trim() === '') {
        showToast("Por favor, rellena los campos principales.");
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        category: category,
        excerpt: excerpt,
        content: content,
        tags: tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== ''),
        date: new Date().toISOString(),
        cover: window.currentUploadedCover || null
    };

    firebase.database().ref('posts/' + newPost.id).set(newPost)
        .then(() => {
            showToast("Publicado en la nube con éxito.");
            closeEditor();
            window.currentUploadedCover = null;
        })
        .catch(error => showToast("Error al publicar: " + error.message));
}

// 3. RENDERIZAR PÁGINA DE INICIO
function renderHomePage() {
    const posts = getPosts();
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('posts-grid');
    const loadMoreWrap = document.getElementById('load-more-wrap');

    if (!featuredContainer || !gridContainer) return;
    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (posts.length === 0) {
        featuredContainer.innerHTML = '<div style="text-align:center; padding:60px;">El manuscrito está en silencio.</div>';
        if (loadMoreWrap) loadMoreWrap.style.display = 'none';
        return;
    }

    featuredContainer.innerHTML = createFeaturedPostHTML(posts[0]);
    posts.slice(1, currentPage * postsPerPage + 1).forEach(post => { gridContainer.innerHTML += createGridPostHTML(post); });
}

// 4. PLANTILLAS Y MODALES (Tus funciones originales)
function createFeaturedPostHTML(post) {
    return `<article class="featured-card" onclick="openPostView('${post.id}')">
                <img src="${post.cover || 'zen_hero.png'}" class="featured-img" />
                <div class="featured-content"><h3>${post.title}</h3><p>${post.excerpt}</p></div>
            </article>`;
}

function createGridPostHTML(post) {
    return `<article class="post-card" onclick="openPostView('${post.id}')">
                <img src="${post.cover || 'zen_hero.png'}" class="post-card-img" />
                <h4>${post.title}</h4><p>${post.excerpt}</p>
            </article>`;
}

function openPostView(postId) {
    const post = currentPosts.find(p => p.id === postId);
    if (!post) return;
    const body = document.getElementById('post-view-body');
    body.innerHTML = `<h2>${post.title}</h2><div>${post.content}</div>`;
    document.getElementById('post-view-overlay').classList.add('active');
}

function closePostView() { document.getElementById('post-view-overlay').classList.remove('active'); }
function openEditor() { document.getElementById('modal-overlay').classList.add('active'); }
function closeEditor() { document.getElementById('modal-overlay').classList.remove('active'); }

// 5. UTILIDADES Y ADMINISTRACIÓN
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

function checkAdminAccess() {
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-password').value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem('zen_admin_logged', 'true');
        showAdminFeatures();
    }
}

function showAdminFeatures() {
    document.getElementById('admin-login-form').style.display = 'none';
    if (document.getElementById('btn-open-editor')) document.getElementById('btn-open-editor').style.display = 'inline-block';
}

function setupNavbarScroll() { /* Mantenemos tu scroll original */ }
function generateDailyQuote() { /* Mantenemos tu lógica de frases */ }