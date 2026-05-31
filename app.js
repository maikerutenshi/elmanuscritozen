// EL MANUSCRITO ZEN — NÚCLEO LOGIC (app.js)

// 1. CONFIGURACIÓN GENERAL Y ESTADO
const ADMIN_USER = "miguel"; 
const ADMIN_PASS = "zen2026"; // Puedes cambiar tu contraseña aquí si lo deseas

let currentPosts = [];
let postsPerPage = 6;
let currentPage = 1;

// 2. INICIALIZACIÓN DEL SITIO
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Cargar entradas desde la memoria local del navegador (localStorage)
    const storedPosts = localStorage.getItem('zen_posts');
    
    if (storedPosts) {
        currentPosts = JSON.parse(storedPosts);
    } else {
        // Inicializar completamente vacío, listo para tus textos reales
        currentPosts = [];
        localStorage.setItem('zen_posts', JSON.stringify(currentPosts));
    }

    // Comprobar si el modo administrador estaba activo
    if (localStorage.getItem('zen_admin_logged') === 'true') {
        showAdminFeatures();
    }

    // Renderizar la interfaz según la página en la que estemos
    if (document.getElementById('posts-grid')) {
        renderHomePage();
    }
    
    // Generar frase zen del día en el Hero si existe el elemento
    if (document.getElementById('daily-quote')) {
        generateDailyQuote();
    }
    
    setupNavbarScroll();
}

// 3. OBTENER Y GUARDAR ENTRADAS
function getPosts() {
    // Devolver entradas ordenadas por fecha (las más recientes primero)
    return currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function savePostsToStorage() {
    localStorage.setItem('zen_posts', JSON.stringify(currentPosts));
}

// 4. RENDERIZAR PÁGINA DE INICIO
function renderHomePage() {
    const posts = getPosts();
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('posts-grid');
    const loadMoreWrap = document.getElementById('load-more-wrap');

    if (!featuredContainer || !gridContainer) return;

    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    // CAMBIO: Se elimina por completo la mención al login del pie de página
    if (posts.length === 0) {
        featuredContainer.innerHTML = `
            <div style="text-align:center; width:100%; padding:60px 20px; color:var(--muted); font-family:var(--font-serif); font-style:italic; font-size:1.2rem;">
                El manuscrito está en silencio.
            </div>
        `;
        if (loadMoreWrap) loadMoreWrap.style.display = 'none';
        return;
    }

    // 1. Entrada Destacada (La última publicada)
    const featuredPost = posts[0];
    featuredContainer.innerHTML = createFeaturedPostHTML(featuredPost);

    // 2. Rejilla del resto de entradas con paginación
    const remainingPosts = posts.slice(1);
    const limit = currentPage * postsPerPage;
    const postsToRender = remainingPosts.slice(0, limit);

    if (postsToRender.length === 0) {
        gridContainer.style.display = 'none';
    } else {
        gridContainer.style.display = 'grid';
        postsToRender.forEach(post => {
            gridContainer.innerHTML += createGridPostHTML(post);
        });
    }

    // Mostrar u ocultar botón de "Cargar más"
    if (loadMoreWrap) {
        if (postsToRender.length < remainingPosts.length) {
            loadMoreWrap.style.display = 'block';
        } else {
            loadMoreWrap.style.display = 'none';
        }
    }
}

function loadMorePosts() {
    currentPage++;
    renderHomePage();
}

// 5. CREACIÓN DE PLANTILLAS HTML (HTML TEMPLATES)
function createFeaturedPostHTML(post) {
    const coverImg = post.cover || 'zen_hero.png';
    return `
        <article class="featured-card" onclick="openPostView('${post.id}')">
            <div class="featured-img-box">
                <img src="${coverImg}" alt="${post.title}" class="featured-img" />
            </div>
            <div class="featured-content">
                <div class="post-meta">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h3 class="featured-title">${post.title}</h3>
                <p class="featured-excerpt">${post.excerpt}</p>
                <span class="read-more-link">Leer reflexión ✦</span>
            </div>
        </article>
    `;
}

function createGridPostHTML(post) {
    const coverImg = post.cover || 'zen_hero.png';
    return `
        <article class="post-card" onclick="openPostView('${post.id}')">
            <div class="post-card-img-box">
                <img src="${coverImg}" alt="${post.title}" class="post-card-img" />
            </div>
            <div class="post-card-content">
                <div class="post-meta">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${formatDate(post.date)}</span>
                </div>
                <h4 class="post-card-title">${post.title}</h4>
                <p class="post-card-excerpt">${post.excerpt}</p>
            </div>
        </article>
    `;
}

// 6. PUBLICAR NUEVA ENTRADA (DESDE EL EDITOR)
function publishPost() {
    const title = document.getElementById('post-title-input').value.trim();
    const category = document.getElementById('post-category-input').value;
    const excerpt = document.getElementById('post-excerpt-input').value.trim();
    const content = document.getElementById('post-content-input').innerHTML; 
    const tagsInput = document.getElementById('post-tags-input').value;

    if (!title || !excerpt || !content || content === '<br>' || content.trim() === '') {
        showToast("Por favor, rellena los campos principales (Título, Resumen y Contenido).");
        return;
    }

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');

    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        category: category,
        excerpt: excerpt,
        content: content,
        tags: tags,
        date: new Date().toISOString(),
        cover: window.currentUploadedCover || null
    };

    // Añadir al inicio del array
    currentPosts.unshift(newPost);
    savePostsToStorage();

    showToast("La reflexión ha sido publicada con éxito.");
    closeEditor();
    
    // Limpiar variables temporales de imágenes
    window.currentUploadedCover = null;

    // Recargar la página en la que estemos
    if (document.getElementById('posts-grid')) {
        currentPage = 1;
        renderHomePage();
    } else if (typeof renderArchive === 'function') {
        renderArchive('all');
    }
}

// 7. SISTEMA DE CONTROL DE IMÁGENES (LOCAL)
window.currentUploadedCover = null;

function triggerImageUpload() { document.getElementById('img-upload-input').click(); }
function triggerCoverUpload() { document.getElementById('cover-upload-input').click(); }

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        if (type === 'cover') {
            window.currentUploadedCover = base64Data;
            showToast("Imagen de portada lista.");
        } else {
            const imgHtml = `<img src="${base64Data}" class="post-inline-img" alt="Imagen adjunta" />`;
            document.getElementById('post-content-input').focus();
            document.execCommand('insertHTML', false, imgHtml);
            showToast("Imagen insertada en el texto.");
        }
    };
    reader.readAsDataURL(file);
}

// 8. FORMATO DEL EDITOR TEXTAREA
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('post-content-input').focus();
}

function insertQuote() {
    const selectedText = window.getSelection().toString();
    const quoteHtml = `<blockquote class="post-blockquote">"${selectedText || 'Cita inspiradora...'}"</blockquote><p></p>`;
    document.execCommand('insertHTML', false, quoteHtml);
}

function insertDivider() {
    const dividerHtml = `<div class="post-body-divider">❖   ❖   ❖</div><p></p>`;
    document.execCommand('insertHTML', false, dividerHtml);
}

// 9. MODALES: ABRIR Y CERRAR EDITOR/VISOR
function openEditor() {
    document.getElementById('modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    // Limpiar formulario anterior
    document.getElementById('post-title-input').value = '';
    document.getElementById('post-excerpt-input').value = '';
    document.getElementById('post-content-input').innerHTML = '';
    document.getElementById('post-tags-input').value = '';
}

function closeEditor() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function closeEditorOnOverlay(e) {
    if (e.target.id === 'modal-overlay') closeEditor();
}

function openPostView(postId) {
    const post = currentPosts.find(p => p.id === postId);
    if (!post) return;

    const overlay = document.getElementById('post-view-overlay');
    const body = document.getElementById('post-view-body');
    
    const coverHtml = post.cover ? `<div class="post-view-cover-wrap"><img src="${post.cover}" class="post-view-cover" /></div>` : '';
    const tagsHtml = post.tags && post.tags.length > 0 ? `<div class="post-view-tags">${post.tags.map(t => `<span class="post-view-tag">#${t}</span>`).join('')}</div>` : '';

    body.innerHTML = `
        ${coverHtml}
        <div class="post-view-header-meta">
            <span class="post-view-category">${post.category}</span>
            <span class="post-view-date">${formatDate(post.date)}</span>
        </div>
        <h2 class="post-view-title">${post.title}</h2>
        <div class="post-view-content-text">${post.content}</div>
        ${tagsHtml}
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostView() {
    document.getElementById('post-view-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function closePostViewOnOverlay(e) {
    if (e.target.id === 'post-view-overlay') closePostView();
}

// 10. ACCESO ADMINISTRADOR (LOGIN DISCRETO)
function checkAdminAccess() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-password').value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem('zen_admin_logged', 'true');
        showAdminFeatures();
        showToast("Modo Editor Activado, Miguel.");
        // Limpiar inputs
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-password').value = '';
    } else {
        showToast("Acceso denegado. Inténtalo con calma.");
    }
}

function showAdminFeatures() {
    document.getElementById('admin-login-form').style.display = 'none';
    document.getElementById('admin-status').style.display = 'flex';
    
    if (document.getElementById('btn-open-editor')) document.getElementById('btn-open-editor').style.display = 'inline-block';
    if (document.getElementById('btn-open-editor-mobile')) document.getElementById('btn-open-editor-mobile').style.display = 'block';
}

function logoutAdmin() {
    localStorage.removeItem('zen_admin_logged');
    document.getElementById('admin-login-form').style.display = 'flex';
    document.getElementById('admin-status').style.display = 'none';
    
    if (document.getElementById('btn-open-editor')) document.getElementById('btn-open-editor').style.display = 'none';
    if (document.getElementById('btn-open-editor-mobile')) document.getElementById('btn-open-editor-mobile').style.display = 'none';
    
    showToast("Modo Editor Desactivado.");
}

// 11. UTILIDADES: FECHAS, MENÚ MÓVIL, TOASTS, FRASE DAILY
function formatDate(isoString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('es-ES', options);
}

function toggleMobileMenu() {
    const menu = document.getElementById('nav-mobile-menu');
    const burger = document.getElementById('nav-hamburger');
    menu.classList.toggle('active');
    burger.classList.toggle('active');
}

function setupNavbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    if (document.getElementById('posts-grid')) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    } else {
        nav.classList.add('scrolled');
    }
}

// Muestra avisos discretos en pantalla
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

function generateDailyQuote() {
    const quotes = [
        { q: "El momento presente siempre será.", a: "Eckhart Tolle" },
        { q: "La mente es como el agua. Cuando está calmada, puede reflejar el mundo.", a: "Proverbio Zen" },
        { q: "No busques el camino. El caminar es el camino.", a: "Dōgen" },
        { q: "Si estás libre de temor, nada puede perturbar tu paz.", a: "Gautama Buda" },
        { q: "Buscando el buda fuera de ti, te conviertes en un esclavo.", a: "Linji" }
    ];
    const day = new Date().getDate();
    const index = day % quotes.length;
    const quoteEl = document.getElementById('daily-quote');
    const authorEl = quoteEl ? quoteEl.nextElementSibling : null;
    
    if (quoteEl && authorEl) {
        quoteEl.innerHTML = `"${quotes[index].q}"`;
        authorEl.innerHTML = `— ${quotes[index].a}`;