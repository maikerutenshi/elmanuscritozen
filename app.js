// EL MANUSCRITO ZEN — NÚCLEO LOGIC (FINAL)

let currentPosts = [];

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Si Firebase está inicializado, conectamos
    if (typeof firebase !== 'undefined') {
        firebase.database().ref('posts').on('value', (snapshot) => {
            const data = snapshot.val();
            currentPosts = data ? Object.values(data) : [];
            if (document.getElementById('posts-grid')) renderHomePage();
        });
    }
});

// 2. FUNCIÓN DE PUBLICACIÓN (Universal para publicar.html)
function publishPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const imageUrl = document.getElementById('post-image-url').value.trim();

    if (!title || !content) {
        alert("Por favor, rellena el título y el contenido.");
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        excerpt: content.substring(0, 100) + "...",
        content: content,
        date: new Date().toISOString(),
        cover: imageUrl || 'zen_hero.png'
    };

    firebase.database().ref('posts/' + newPost.id).set(newPost)
        .then(() => {
            alert("¡Publicado en la nube con éxito!");
            window.location.href = "index.html";
        })
        .catch(error => alert("Error: " + error.message));
}

// 3. RENDERIZADO (Home)
function renderHomePage() {
    const posts = currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const featuredContainer = document.getElementById('featured-post-container');
    const gridContainer = document.getElementById('posts-grid');

    if (!featuredContainer || !gridContainer) return;
    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (posts.length > 0) {
        featuredContainer.innerHTML = `<article class="featured-card">
            <img src="${posts[0].cover}" onerror="this.src='zen_hero.png'" class="featured-img" />
            <h3>${posts[0].title}</h3>
        </article>`;
        
        posts.slice(1).forEach(post => {
            gridContainer.innerHTML += `<article class="post-card">
                <img src="${post.cover}" onerror="this.src='zen_hero.png'" class="post-card-img" />
                <h4>${post.title}</h4>
            </article>`;
        });
    }
}