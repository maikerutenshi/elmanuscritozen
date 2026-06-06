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
          <a href="sobre.html" class="nav-link">Sobre este lugar</a>
          <a href="admin.html" class="nav-link">Administración</a>
        </div>
        <button type="button" class="nav-hamburger" id="nav-hamburger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-mobile-menu">
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
        <a href="sobre.html" class="nav-mobile-link">Sobre este lugar</a>
        <a href="admin.html" class="nav-mobile-link">Administración</a>
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

    hamburger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('open')) return;
        if (hamburger.contains(event.target) || mobileMenu.contains(event.target)) return;
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Abrir menú');
    });

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Abrir menú');
        });
    });
});