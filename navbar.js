document.addEventListener('DOMContentLoaded', function() {
    const navbarHTML = `
    <nav class="navbar">
      <div class="nav-inner">
        <a href="/" class="nav-logo">
          <div class="nav-logo-symbol"><img src="enso.png" alt="Enso" class="enso-img"></div>
          <span class="nav-logo-text">El manuscrito Zen</span>
        </a>
        <div class="nav-links">
          <a href="/" class="nav-link">Inicio</a>
          <a href="/archivo.html" class="nav-link">Archivo</a>
          <a href="/sobre-este-sitio" class="nav-link">Sobre este sitio</a>
          <a href="/admin" class="nav-link">Administración</a>
        </div>
      </div>
    </nav>`;
    
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
});