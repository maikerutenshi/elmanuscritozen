function teardownComments() {
  document.querySelectorAll('script[data-giscus]').forEach((script) => script.remove());
  const frame = document.querySelector('.giscus-frame');
  if (frame) frame.remove();
}

function isGiscusConfigured() {
  return (
    GISCUS_CONFIG.repoId &&
    GISCUS_CONFIG.categoryId &&
    !GISCUS_CONFIG.repoId.startsWith('TU_') &&
    !GISCUS_CONFIG.categoryId.startsWith('TU_')
  );
}

function mountCommentsForPost(postId) {
  teardownComments();

  const body = document.getElementById('post-view-body');
  if (!body) return;

  if (!isGiscusConfigured()) {
    body.insertAdjacentHTML(
      'beforeend',
      `<section class="comments-section comments-section--disabled">
        <h3 class="comments-title">Comentarios</h3>
        <p class="comments-empty">Configura Giscus en <code>giscus-config.js</code> (ver GISCUS-SETUP.txt).</p>
      </section>`
    );
    return;
  }

  body.insertAdjacentHTML(
    'beforeend',
    `<section class="comments-section">
      <h3 class="comments-title">Comentarios</h3>
      <p class="comments-note">Inicia sesión con tu cuenta de GitHub para comentar.</p>
      <div class="giscus-container" id="giscus-container"></div>
    </section>`
  );

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-giscus', '1');
  script.setAttribute('data-repo', GISCUS_CONFIG.repo);
  script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
  script.setAttribute('data-category', GISCUS_CONFIG.category);
  script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
  script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
  script.setAttribute('data-term', postId);
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled ? '1' : '0');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
  script.setAttribute('data-theme', GISCUS_CONFIG.theme);
  script.setAttribute('data-lang', GISCUS_CONFIG.lang);
  script.crossOrigin = 'anonymous';
  script.async = true;

  document.getElementById('giscus-container').appendChild(script);
}
