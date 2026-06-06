let commentsUnsubscribe = null;
let commentsAuthUnsubscribe = null;
let commentsCurrentPostId = null;
let commentsCurrentUser = null;

function isCommentsAdmin(user) {
  if (!user?.email || !COMMENTS_FIREBASE.adminEmail) return false;
  if (COMMENTS_FIREBASE.adminEmail.startsWith('TU_CORREO')) return false;
  return user.email.toLowerCase() === COMMENTS_FIREBASE.adminEmail.toLowerCase();
}

function getFirebaseAppConfig() {
  return {
    apiKey: COMMENTS_FIREBASE.apiKey,
    authDomain: COMMENTS_FIREBASE.authDomain,
    projectId: COMMENTS_FIREBASE.projectId,
    storageBucket: COMMENTS_FIREBASE.storageBucket,
    messagingSenderId: COMMENTS_FIREBASE.messagingSenderId,
    appId: COMMENTS_FIREBASE.appId,
  };
}

function initCommentsFirebase() {
  if (typeof firebase === 'undefined') return false;
  if (!COMMENTS_FIREBASE.apiKey || COMMENTS_FIREBASE.apiKey === 'TU_API_KEY') {
    console.warn('Configura comments-config.js con tu apiKey de Firebase.');
    return false;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(getFirebaseAppConfig());
  }
  return true;
}

const COMMENTS_REDIRECT_POST_KEY = 'commentsRedirectPostId';

function waitForPostsReady() {
  return new Promise((resolve) => {
    if (typeof currentPosts !== 'undefined' && currentPosts.length) {
      resolve();
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if ((typeof currentPosts !== 'undefined' && currentPosts.length) || Date.now() - started > 8000) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
}

async function resumeCommentsAfterGoogleRedirect() {
  if (!initCommentsFirebase()) return;

  const savedPostId = sessionStorage.getItem(COMMENTS_REDIRECT_POST_KEY);
  if (!savedPostId) return;

  let redirectError = null;
  let redirectUser = null;
  try {
    const result = await firebase.auth().getRedirectResult();
    redirectUser = result.user || firebase.auth().currentUser;
  } catch (err) {
    redirectError = err;
    console.error('Google redirect:', err.code, err.message);
  }

  sessionStorage.removeItem(COMMENTS_REDIRECT_POST_KEY);
  await waitForPostsReady();

  if (typeof openPostView !== 'function') return;
  await openPostView(savedPostId);

  const statusEl = document.getElementById('comments-status');
  if (redirectError) {
    showCommentsStatus(statusEl, mapAuthError(redirectError), false, true);
  } else if (redirectUser) {
    showCommentsStatus(statusEl, 'Sesión iniciada con Google.', false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  resumeCommentsAfterGoogleRedirect();
});

function teardownComments() {
  if (commentsUnsubscribe) {
    commentsUnsubscribe();
    commentsUnsubscribe = null;
  }
}

function buildCommentsSectionHtml() {
  return `
    <section class="comments-section">
      <h3 class="comments-title">Comentarios</h3>
      <div id="comments-list" class="comments-list">
        <p class="comments-empty">Cargando comentarios…</p>
      </div>

      <div id="comments-guest" class="comments-panel">
        <p class="comments-note">Entra con Google (rápido) o con correo y contraseña.</p>
        <button type="button" class="btn-google" id="comments-google-btn">Continuar con Google</button>
        <p class="comments-divider">o con tu correo</p>
        <div class="comments-tabs" role="tablist">
          <button type="button" class="comments-tab active" data-tab="login">Entrar</button>
          <button type="button" class="comments-tab" data-tab="register">Registrarse</button>
        </div>
        <form id="comments-login-form" class="comments-form">
          <div class="form-control">
            <label for="login-email">Correo</label>
            <input type="email" id="login-email" required autocomplete="email" />
          </div>
          <div class="form-control">
            <label for="login-password">Contraseña</label>
            <input type="password" id="login-password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-submit-post">Entrar</button>
        </form>
        <form id="comments-register-form" class="comments-form" hidden>
          <div class="form-control">
            <label for="register-name">Nombre (visible)</label>
            <input type="text" id="register-name" required maxlength="40" autocomplete="name" />
          </div>
          <div class="form-control">
            <label for="register-email">Correo</label>
            <input type="email" id="register-email" required autocomplete="email" />
          </div>
          <div class="form-control">
            <label for="register-password">Contraseña (mín. 6 caracteres)</label>
            <input type="password" id="register-password" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn-submit-post">Crear cuenta</button>
        </form>
      </div>

      <div id="comments-user" class="comments-panel" hidden>
        <p class="comments-user-line">
          Hola, <strong id="comments-user-name"></strong>.
          <button type="button" id="comments-logout-btn" class="btn-link">Salir</button>
        </p>
        <form id="comments-submit-form" class="comments-form">
          <p class="comments-admin-note" id="comments-admin-note" hidden>
            Modo administrador: puedes eliminar comentarios de otros.
          </p>
          <div class="form-control">
            <label for="comment-text">Tu comentario</label>
            <textarea id="comment-text" rows="3" maxlength="500" required placeholder="Escribe con calma y respeto…"></textarea>
          </div>
          <button type="submit" class="btn-submit-post">Publicar comentario</button>
        </form>
      </div>

      <p id="comments-status" class="admin-status" hidden></p>
    </section>`;
}

function mountCommentsForPost(postId) {
  teardownComments();
  commentsCurrentPostId = postId;

  const body = document.getElementById('post-view-body');
  if (!body) return;

  if (!initCommentsFirebase()) {
    body.insertAdjacentHTML(
      'beforeend',
      `<section class="comments-section comments-section--disabled">
        <h3 class="comments-title">Comentarios</h3>
        <p class="comments-empty">Comentarios en configuración. Mientras tanto, gracias por leer.</p>
      </section>`
    );
    return;
  }

  body.insertAdjacentHTML('beforeend', buildCommentsSectionHtml());
  bindCommentsUi(postId);
}

function bindCommentsUi(postId) {
  const guestPanel = document.getElementById('comments-guest');
  const userPanel = document.getElementById('comments-user');
  const statusEl = document.getElementById('comments-status');
  const loginForm = document.getElementById('comments-login-form');
  const registerForm = document.getElementById('comments-register-form');
  const submitForm = document.getElementById('comments-submit-form');
  const logoutBtn = document.getElementById('comments-logout-btn');

  document.getElementById('comments-google-btn').addEventListener('click', async () => {
    showCommentsStatus(statusEl, 'Redirigiendo a Google…');
    try {
      sessionStorage.setItem(COMMENTS_REDIRECT_POST_KEY, postId);
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await firebase.auth().signInWithRedirect(provider);
    } catch (err) {
      sessionStorage.removeItem(COMMENTS_REDIRECT_POST_KEY);
      console.error('Google sign-in:', err.code, err.message);
      showCommentsStatus(statusEl, mapAuthError(err), false, true);
    }
  });

  document.querySelectorAll('.comments-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.comments-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      loginForm.hidden = !isLogin;
      registerForm.hidden = isLogin;
    });
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showCommentsStatus(statusEl, 'Entrando…');
    try {
      await firebase.auth().signInWithEmailAndPassword(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      );
      showCommentsStatus(statusEl, '', true);
    } catch (err) {
      showCommentsStatus(statusEl, mapAuthError(err), false, true);
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    showCommentsStatus(statusEl, 'Creando cuenta…');
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      showCommentsStatus(statusEl, 'Cuenta creada. Ya puedes comentar.', false);
    } catch (err) {
      showCommentsStatus(statusEl, mapAuthError(err), false, true);
    }
  });

  submitForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) return;

    const text = document.getElementById('comment-text').value.trim();
    if (!text) return;

    showCommentsStatus(statusEl, 'Publicando…');
    try {
      await firebase
        .firestore()
        .collection('comments')
        .doc(postId)
        .collection('messages')
        .add({
          uid: user.uid,
          displayName: user.displayName || user.email.split('@')[0],
          text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      document.getElementById('comment-text').value = '';
      showCommentsStatus(statusEl, 'Comentario publicado.', false);
    } catch (err) {
      console.error(err);
      showCommentsStatus(statusEl, 'No se pudo publicar. Revisa Firebase.', false, true);
    }
  });

  logoutBtn.addEventListener('click', () => firebase.auth().signOut());

  if (commentsAuthUnsubscribe) commentsAuthUnsubscribe();
  commentsAuthUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
    commentsCurrentUser = user;
    if (user) {
      guestPanel.hidden = true;
      userPanel.hidden = false;
      document.getElementById('comments-user-name').textContent =
        user.displayName || user.email.split('@')[0];
      const adminNote = document.getElementById('comments-admin-note');
      if (adminNote) adminNote.hidden = !isCommentsAdmin(user);
    } else {
      guestPanel.hidden = false;
      userPanel.hidden = true;
    }
    refreshCommentsList(postId);
  });

  refreshCommentsList(postId);
}

function refreshCommentsList(postId) {
  const listEl = document.getElementById('comments-list');
  if (!listEl) return;

  if (commentsUnsubscribe) {
    commentsUnsubscribe();
    commentsUnsubscribe = null;
  }

  commentsUnsubscribe = firebase
    .firestore()
    .collection('comments')
    .doc(postId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          listEl.innerHTML = '<p class="comments-empty">Sé el primero en comentar.</p>';
          return;
        }
        const admin = isCommentsAdmin(commentsCurrentUser);
        listEl.innerHTML = snapshot.docs
          .map((doc) => renderComment(doc.id, doc.data(), admin))
          .join('');
        bindCommentDeleteButtons(listEl, postId);
      },
      () => {
        listEl.innerHTML =
          '<p class="comments-empty">No se pudieron cargar los comentarios.</p>';
      }
    );
}

function bindCommentDeleteButtons(listEl, postId) {
  listEl.querySelectorAll('[data-delete-comment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!isCommentsAdmin(commentsCurrentUser)) return;
      const messageId = btn.getAttribute('data-delete-comment');
      if (!messageId || !confirm('¿Eliminar este comentario?')) return;

      const statusEl = document.getElementById('comments-status');
      showCommentsStatus(statusEl, 'Eliminando…');
      try {
        await firebase
          .firestore()
          .collection('comments')
          .doc(postId)
          .collection('messages')
          .doc(messageId)
          .delete();
        showCommentsStatus(statusEl, 'Comentario eliminado.', false);
      } catch (err) {
        console.error(err);
        showCommentsStatus(statusEl, 'No se pudo eliminar. Revisa las reglas de Firestore.', false, true);
      }
    });
  });
}

function renderComment(messageId, data, showDelete) {
  const name = escapeHtml(data.displayName || 'Lector');
  const text = escapeHtml(data.text || '');
  const date = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const deleteBtn = showDelete
    ? `<button type="button" class="btn-comment-delete" data-delete-comment="${escapeAttr(messageId)}">Eliminar</button>`
    : '';

  return `
    <article class="comment-item">
      <header class="comment-header">
        <strong>${name}</strong>
        ${date ? `<time>${date}</time>` : ''}
        ${deleteBtn}
      </header>
      <p>${text}</p>
    </article>`;
}

function showCommentsStatus(el, message, hide = false, isError = false) {
  if (!el) return;
  if (hide || !message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.className = 'admin-status' + (isError ? ' admin-status--error' : ' admin-status--ok');
}

function mapAuthError(err) {
  const code = err.code || '';
  const map = {
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/invalid-email': 'Correo no válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No hay cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.',
    'auth/cancelled-popup-request': 'Espera un momento e inténtalo otra vez.',
    'auth/unauthorized-domain': 'Dominio no autorizado en Firebase. Revisa Authentication → Configuración → Dominios.',
    'auth/operation-not-allowed': 'Google no está habilitado en Firebase → Authentication → Método de acceso.',
    'auth/account-exists-with-different-credential':
      'Ya existe una cuenta con ese correo. Usa correo y contraseña.',
    'auth/internal-error':
      'Error de Google OAuth. En Google Cloud → Pantalla de consentimiento: añade tu Gmail como usuario de prueba o publica la app.',
    'auth/network-request-failed': 'Sin conexión. Comprueba tu red e inténtalo otra vez.',
    'auth/invalid-api-key': 'apiKey incorrecta en comments-config.js.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'apiKey bloqueada o incorrecta. Firebase → Configuración → copia de nuevo la apiKey. Google Cloud → Credenciales → Browser key → quita restricciones o añade tu dominio.',
  };
  if (map[code]) return map[code];
  if (code) return `Error (${code}). Revisa Firebase Authentication.`;
  return 'No se pudo completar. Inténtalo de nuevo.';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;');
}
