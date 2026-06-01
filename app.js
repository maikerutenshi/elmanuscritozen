// EL MANUSCRITO ZEN — CÓDIGO ACTUALIZADO

let currentPosts = [];

// 1. Conexión a Firebase
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.database().ref('posts').on('value', (snapshot) => {
            const data = snapshot.val();
            currentPosts = data ? Object.values(data) : [];
        });
    }
});

// 2. Función corregida para publicar
function publishPost() {
    // Obtenemos los valores de los inputs nuevos de publicar.html
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const imageUrl = document.getElementById('post-image-url').value;

    // Validación básica
    if (!title.trim() || !content.trim()) {
        alert("Por favor, escribe al menos un título y contenido.");
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        title: title,
        content: content,
        date: new Date().toISOString(),
        cover: imageUrl || 'zen_hero.png' // Si no hay URL, usa la imagen por defecto
    };

    // Envío a Firebase
    firebase.database().ref('posts/' + newPost.id).set(newPost)
        .then(() => {
            alert("¡Publicado con éxito!");
            window.location.href = "index.html"; // Volver a la página principal
        })
        .catch(error => {
            alert("Error al publicar: " + error.message);
        });
}