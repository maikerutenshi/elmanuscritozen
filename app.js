// EL MANUSCRITO ZEN — NÚCLEO LOGIC

let currentPosts = [];

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