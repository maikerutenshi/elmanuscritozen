document.addEventListener('DOMContentLoaded', function() {
    const navbarHTML = `
    <nav class="navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <div class="nav-logo-symbol"><img src="enso.png" alt="Enso" class="enso-img"></div>
          <span class="nav-logo-text">El Manuscrito Zen</span>
        </a>
        <div class="nav-links">
          <a href="index.html" class="nav-link">Inicio</a>
          <a href="archivo.html" class="nav-link">Archivo</a>
          <a href="dojo.html" class="nav-link">Dojo Virtual</a>
          <a href="sobre.html" class="nav-link">Sobre este sitio</a>
        </div>
      </div>
    </nav>`;
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
});