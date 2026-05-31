document.addEventListener('DOMContentLoaded', function() {
    // 1. Inyectar el HTML del Navbar
    const navbarHTML = `
    <nav class="navbar" id="navbar">
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
        <button class="nav-hamburger" id="nav-hamburger">
            <span></span>
            <span></span>
            <span></span>
        </button>
      </div>
    </nav>
    <div class="nav-mobile-menu" id="nav-mobile-menu">
        <a href="index.html" class="nav-mobile-link">Inicio</a>
        <a href="archivo.html" class="nav-mobile-link">Archivo</a>
        <a href="dojo.html" class="nav-mobile-link">Dojo Virtual</a>
        <a href="sobre.html" class="nav-mobile-link">Sobre este sitio</a>
    </div>`;
    
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // 2. Lógica del Scroll (Efecto cristal al bajar)
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Lógica del Menú Hamburguesa (Móvil)
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('nav-mobile-menu');

    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    });
});