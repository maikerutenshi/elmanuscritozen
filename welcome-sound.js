(function () {
  const STORAGE_KEY = 'zen-welcome-sound-v3';

  function initWelcomeSound() {
    const audio = document.getElementById('welcome-sound');
    const enterBtn = document.getElementById('hero-enter');
    if (!audio) return;

    audio.volume = 0.5;
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    function playSound() {
      audio.currentTime = 0;
      return audio.play();
    }

    function enterSite() {
      if (sessionStorage.getItem(STORAGE_KEY)) return;

      playSound()
        .then(() => {
          sessionStorage.setItem(STORAGE_KEY, '1');
        })
        .catch(() => {});
    }

    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        enterSite();
        const main = document.getElementById('main-content');
        if (main) {
          main.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (!sessionStorage.getItem(STORAGE_KEY)) {
      playSound()
        .then(() => {
          sessionStorage.setItem(STORAGE_KEY, '1');
        })
        .catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeSound);
  } else {
    initWelcomeSound();
  }
})();
