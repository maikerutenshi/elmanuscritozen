(function () {
  const STORAGE_KEY = 'zen-welcome-sound-played';
  const SOUND_SRC = 'sounds/bienvenida.mp3';
  const VOLUME = 0.35;

  if (sessionStorage.getItem(STORAGE_KEY)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const audio = new Audio(SOUND_SRC);
  audio.volume = VOLUME;
  audio.preload = 'auto';

  let played = false;

  function markPlayed() {
    played = true;
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  function tryPlay() {
    if (played) return;
    audio.play().then(markPlayed).catch(() => {});
  }

  function playOnFirstInteraction() {
    const once = () => {
      tryPlay();
      document.removeEventListener('click', once);
      document.removeEventListener('touchstart', once);
      document.removeEventListener('keydown', once);
    };
    document.addEventListener('click', once, { once: true, passive: true });
    document.addEventListener('touchstart', once, { once: true, passive: true });
    document.addEventListener('keydown', once, { once: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    tryPlay();
    playOnFirstInteraction();
  });
})();
