// --- EL MANUSCRITO ZEN — NÚCLEO LÓGICO (FIREBASE INTEGRADO) ---

const ADMIN_USER = "miguel";
const ADMIN_PASS = "zen2026";
let currentPosts = [];
let postsPerPage = 6;
let currentPage = 1;

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.database();
    const postsRef = db.ref('posts');

    // Escuchar cambios en la nube en tiempo real
    postsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        currentPosts = data ? Object.values(data) : [];
        if (document.getElementById('posts-grid')) renderHomePage();
    });

    if (localStorage.getItem('zen_admin_logged') === 'true') showAdminFeatures();
    if (document.getElementById('daily-quote')) generateDailyQuote();
    setupNavbarScroll();
});

// 2. RENDERIZADO
function getPosts() {
    return currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderHomePage() {
    const posts = getPosts();
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('posts-grid');
    if (!featuredContainer || !gridContainer) return;

    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (posts.length === 0) {
        featuredContainer.innerHTML = '<div style="text-align:center; padding:60px;">El manuscrito está en silencio.</div>';
        return;
    }

    featuredContainer.innerHTML = createFeaturedPostHTML(posts[0]);
    posts.slice(1, currentPage * postsPerPage + 1).forEach(post => {
        gridContainer.innerHTML += createGridPostHTML(post);
    });
}

// 3. PUBLICACIÓN EN LA NUBE
function publishPost() {
    const title = document.getElementById('post-title-input').value.trim();
    const content = document.getElementById('post-content-input').innerHTML;
    
    if (!title || !content) {
        showToast("Faltan campos obligatorios.");
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        category: document.getElementById('post-category-input').value,
        excerpt: document.getElementById('post-excerpt-input').value.trim(),
        content: content,
        date: new Date().toISOString(),
        cover: window.currentUploadedCover || null
    };

    // Guardar en Firebase
    firebase.database().ref('posts/' + newPost.id).set(newPost)
        .then(() => {
            showToast("Publicado en la nube.");
            closeEditor();
            window.currentUploadedCover = null;
        })
        .catch(err => showToast("Error: " + err.message));
}

// ... (Mantén aquí el resto de tus funciones: openEditor, closeEditor, 
//      handleImageUpload, openPostView, checkAdminAccess, etc. 
//      tal como las tenías originalmente, ya que no necesitan cambios).