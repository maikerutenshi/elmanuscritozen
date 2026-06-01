// EL MANUSCRITO ZEN — NÚCLEO LOGIC

let currentPosts = [];

// 1. INICIALIZACIÓN Y CONEXIÓN CON FIREBASE
document.addEventListener('DOMContentLoaded', () => {
    // Conexión a la base de datos
    if (typeof firebase !== 'undefined') {
        firebase.database().ref('posts').on('value', (snapshot) => {
            const data = snapshot.val();
            currentPosts = data ? Object.values(data) : [];
            // Si estamos en la página principal, renderizamos
            if (document.getElementById('posts-grid')) renderHomePage();
        });
    }
});

// 2. FUNCIÓN PARA PUBLICAR (Con soporte para URL de imagen)
function guardarPost() {
    // Obtenemos los valores de los campos
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const coverUrl = document.getElementById('post-cover').value.trim();

    // Validación básica
    if (!title || !content) {
        alert("Por favor, rellena el título y el contenido.");
        return;
    }

    // Objeto del post
    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        content: content,
        excerpt: content.substring(0, 100) + "...",
        date: new Date().toISOString(),
        // Si no pegas una URL, usará la imagen por defecto
        cover: coverUrl || 'zen_hero.png' 
    };

    // Envío a Firebase
    firebase.database().ref('posts/' + newPost.id).set(newPost)
        .then(() => {
            alert("¡Publicado en la nube con éxito!");
            window.location.href = "index.html"; // Volver a la home
        })
        .catch(error => {
            alert("Error al publicar: " + error.message);
        });
}

// 3. RENDERIZAR PÁGINA DE INICIO
function renderHomePage() {
    const posts = currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('posts-grid');

    if (!featuredContainer || !gridContainer) return;
    
    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (posts.length > 0) {
        // Post destacado
        featuredContainer.innerHTML = `
            <article class="featured-card">
                <img src="${posts[0].cover}" class="featured-img" onerror="this.src='zen_hero.png'" />
                <div class="featured-content">
                    <h3>${posts[0].title}</h3>
                    <p>${posts[0].excerpt}</p>
                </div>
            </article>`;

        // Resto de posts
        posts.slice(1).forEach(post => {
            gridContainer.innerHTML += `
                <article class="post-card">
                    <img src="${post.cover}" class="post-card-img" onerror="this.src='zen_hero.png'" />
                    <h4>${post.title}</h4>
                    <p>${post.excerpt}</p>
                </article>`;
        });
    }
}

// 4. UTILIDADES
function setupNavbarScroll() { /* ... */ }
function generateDailyQuote() { /* ... */ }