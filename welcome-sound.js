(function () {
  const STORAGE_KEY = 'zen-welcome-sound-v2';

  function initWelcomeSound() {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const audio = document.getElementById('welcome-sound');
    if (!audio) return;

    audio.volume = 0.45;

    let played = false;
    let listenersActive = false;

    function stopListening() {
      if (!listenersActive) return;
      listenersActive = false;
      window.removeEventListener('pointerdown', onInteract, true);
      window.removeEventListener('keydown', onInteract, true);
      window.removeEventListener('scroll', onInteract, true);
    }

    function markPlayed() {
      if (played) return;
      played = true;
      sessionStorage.setItem(STORAGE_KEY, '1');
      stopListening();
    }

    function tryPlay() {
      if (played) return;
      audio.play().then(markPlayed).catch(() => {});
    }

    function onInteract() {
      tryPlay();
    }

    function startListening() {
      if (listenersActive) return;
      listenersActive = true;
      window.addEventListener('pointerdown', onInteract, { capture: true, passive: true });
      window.addEventListener('keydown', onInteract, { capture: true });
      window.addEventListener('scroll', onInteract, { capture: true, passive: true });
    }

    audio.addEventListener(
      'canplaythrough',
      () => {
        tryPlay();
      },
      { once: true }
    );

    audio.addEventListener('error', () => {
      console.warn('No se pudo cargar sounds/bienvenida.mp3');
    });

    startListening();
    tryPlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeSound);
  } else {
    initWelcomeSound();
  }
})();
