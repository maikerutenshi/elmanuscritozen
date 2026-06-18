let commentsUnsubscribe = null;
let commentsAuthUnsubscribe = null;
let commentsCurrentPostId = null;
let commentsCurrentUser = null;

function isCommentsAdmin(user) {
  if (!user?.email || !COMMENTS_FIREBASE.adminEmail) return false;
  if (COMMENTS_FIREBASE.adminEmail.startsWith('TU_CORREO')) return false;
  return user.email.toLowerCase() === COMMENTS_FIREBASE.adminEmail.toLowerCase();
}

function getAdminReplyName() {
  return COMMENTS_FIREBASE.adminReplyName || 'El Manuscrito Zen';
}

function getCommentAuthorName(data) {
  if (data.authorReply) return getAdminReplyName();
  return data.displayName || 'Lector';
}

function getPostTitleForComments(postId) {
  if (typeof currentPosts === 'undefined') return '';
  const post = currentPosts.find((item) => item.id === postId);
  return post?.title || '';
}

async function fetchCommentMessage(postId, messageId) {
  const doc = await firebase
    .firestore()
    .collection('comments')
    .doc(postId)
    .collection('messages')
    .doc(messageId)
    .get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

function isEmailjsReplyNotifyConfigured() {
  return Boolean(
    COMMENTS_FIREBASE.emailjsPublicKey &&
      COMMENTS_FIREBASE.emailjsServiceId &&
      COMMENTS_FIREBASE.emailjsTemplateId
  );
}

function initEmailjs() {
  if (typeof emailjs === 'undefined' || !COMMENTS_FIREBASE.emailjsPublicKey) return false;
  emailjs.init({ publicKey: COMMENTS_FIREBASE.emailjsPublicKey });
  return true;
}

async function notifyCommentReply(postId, parentId, replyText) {
  if (!isEmailjsReplyNotifyConfigured()) {
    return { skipped: true, reason: 'no-emailjs' };
  }
  if (typeof emailjs === 'undefined') {
    console.warn('Reply notify: EmailJS no cargado');
    return { skipped: true, reason: 'emailjs-error', detail: 'script no cargado' };
  }
  initEmailjs();

  const parent = await fetchCommentMessage(postId, parentId);
  const toEmail = parent?.authorEmail?.trim().toLowerCase();
  if (!toEmail) return { skipped: true, reason: 'no-email' };

  const adminEmail = COMMENTS_FIREBASE.adminEmail?.trim().toLowerCase();
  if (adminEmail && toEmail === adminEmail) return { skipped: true, reason: 'self' };

  const postTitle = getPostTitleForComments(postId) || 'Una entrada del blog';
  const baseUrl = COMMENTS_FIREBASE.siteBaseUrl || 'https://elmanuscritozen.com';
  const postUrl = `${baseUrl}/?entrada=${encodeURIComponent(postId)}`;

  try {
    const response = await emailjs.send(
      COMMENTS_FIREBASE.emailjsServiceId,
      COMMENTS_FIREBASE.emailjsTemplateId,
      {
        to_email: toEmail,
        to_name: parent.displayName || toEmail.split('@')[0],
        post_title: postTitle,
        reply_text: replyText,
        post_url: postUrl,
        original_comment: String(parent.text || '').slice(0, 200),
      }
    );
    console.info('Reply notify emailjs OK:', response.status, toEmail);
    return { skipped: false };
  } catch (err) {
    const detail = err?.text || err?.message || String(err);
    console.warn('Reply notify emailjs:', detail, err);
    return { skipped: true, reason: 'emailjs-error', detail };
  }
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

document.addEventListener('DOMContentLoaded', () => {
  handleGoogleAuthReturn();
});

function createGoogleProvider() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

async function signInWithGoogle(statusEl, postId) {
  showCommentsStatus(statusEl, 'Conectando con Google…');
  try {
    await firebase.auth().signInWithPopup(createGoogleProvider());
    showCommentsStatus(statusEl, '', true);
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') {
      showCommentsStatus(statusEl, '', true);
      return;
    }
    if (err.code === 'auth/popup-blocked') {
      showCommentsStatus(statusEl, 'El navegador bloqueó la ventana. Redirigiendo…');
      sessionStorage.setItem(COMMENTS_REDIRECT_POST_KEY, postId);
      await firebase.auth().signInWithRedirect(createGoogleProvider());
      return;
    }
    console.error('Google sign-in:', err.code, err.message);
    showCommentsStatus(statusEl, mapAuthError(err), false, true);
  }
}

async function handleGoogleAuthReturn() {
  if (!initCommentsFirebase()) return;

  const savedPostId = sessionStorage.getItem(COMMENTS_REDIRECT_POST_KEY);
  let redirectError = null;
  let redirectUser = null;

  try {
    const result = await firebase.auth().getRedirectResult();
    if (result?.user) redirectUser = result.user;
  } catch (err) {
    redirectError = err;
    console.error('Google redirect:', err.code, err.message);
  }

  if (!savedPostId) return;

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
        <p class="comments-note">
          Entra con Google o con el mismo correo y contraseña del
          <a href="dojo.html">Dojo Virtual</a>.
        </p>
        <button type="button" id="comments-google-btn" class="btn-google">Continuar con Google</button>
        <p class="comments-divider">o</p>
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
      </div>

      <div id="comments-user" class="comments-panel" hidden>
        <p class="comments-user-line">
          Hola, <strong id="comments-user-name"></strong>.
          <button type="button" id="comments-logout-btn" class="btn-link">Salir</button>
        </p>
        <form id="comments-submit-form" class="comments-form">
          <p class="comments-admin-note" id="comments-admin-note" hidden>
            Modo administrador: puedes responder y eliminar comentarios.
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
  const submitForm = document.getElementById('comments-submit-form');
  const logoutBtn = document.getElementById('comments-logout-btn');
  const googleBtn = document.getElementById('comments-google-btn');

  googleBtn?.addEventListener('click', () => signInWithGoogle(statusEl, postId));

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
          authorEmail: user.email || '',
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
        const topLevel = snapshot.docs.filter((doc) => !doc.data().parentId);
        if (topLevel.length === 0) {
          listEl.innerHTML = '<p class="comments-empty">Sé el primero en comentar.</p>';
          return;
        }

        const repliesByParent = groupRepliesByParent(snapshot.docs);
        const admin = isCommentsAdmin(commentsCurrentUser);

        listEl.innerHTML = topLevel
          .map((doc) => renderCommentThread(doc.id, doc.data(), repliesByParent[doc.id] || [], admin))
          .join('');

        bindCommentDeleteButtons(listEl, postId);
        bindCommentReplyButtons(listEl, postId);
      },
      () => {
        listEl.innerHTML =
          '<p class="comments-empty">No se pudieron cargar los comentarios.</p>';
      }
    );
}

function groupRepliesByParent(docs) {
  const grouped = {};
  docs.forEach((doc) => {
    const parentId = doc.data().parentId;
    if (!parentId) return;
    if (!grouped[parentId]) grouped[parentId] = [];
    grouped[parentId].push({ id: doc.id, data: doc.data() });
  });
  return grouped;
}

function bindCommentReplyButtons(listEl, postId) {
  listEl.querySelectorAll('[data-reply-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentId = btn.getAttribute('data-reply-toggle');
      const form = listEl.querySelector(`[data-reply-form="${parentId}"]`);
      if (!form) return;
      const isHidden = form.hidden;
      listEl.querySelectorAll('.comment-reply-form').forEach((el) => {
        el.hidden = true;
      });
      form.hidden = !isHidden;
      if (!form.hidden) {
        form.querySelector('textarea')?.focus();
      }
    });
  });

  listEl.querySelectorAll('.comment-reply-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const user = firebase.auth().currentUser;
      if (!user || !isCommentsAdmin(user)) return;

      const parentId = form.getAttribute('data-reply-form');
      const textarea = form.querySelector('textarea');
      const text = textarea?.value.trim();
      if (!parentId || !text) return;

      const statusEl = document.getElementById('comments-status');
      showCommentsStatus(statusEl, 'Publicando respuesta…');
      try {
        await firebase
          .firestore()
          .collection('comments')
          .doc(postId)
          .collection('messages')
          .add({
            uid: user.uid,
            displayName: getAdminReplyName(),
            authorReply: true,
            text,
            parentId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        textarea.value = '';
        form.hidden = true;
        const notifyResult = await notifyCommentReply(postId, parentId, text);
        if (notifyResult.skipped && notifyResult.reason === 'no-email') {
          showCommentsStatus(
            statusEl,
            'Respuesta publicada. Ese comentario no tiene correo guardado (coméntalo de nuevo con otra cuenta).',
            false
          );
        } else if (notifyResult.skipped && notifyResult.reason === 'no-emailjs') {
          showCommentsStatus(statusEl, 'Respuesta publicada.', false);
        } else if (notifyResult.skipped && notifyResult.reason === 'emailjs-error') {
          showCommentsStatus(
            statusEl,
            `Respuesta publicada. Email no enviado: ${notifyResult.detail || 'revisa EmailJS'}.`,
            false,
            true
          );
        } else if (notifyResult.skipped) {
          showCommentsStatus(statusEl, 'Respuesta publicada. No se pudo enviar el aviso por correo.', false);
        } else {
          showCommentsStatus(statusEl, 'Respuesta publicada. Se ha avisado al lector por correo.', false);
        }
      } catch (err) {
        console.error(err);
        showCommentsStatus(statusEl, 'No se pudo publicar la respuesta.', false, true);
      }
    });
  });
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

function renderCommentThread(messageId, data, replies, showAdminActions) {
  return `
    <article class="comment-item">
      ${renderCommentBody(messageId, data, showAdminActions, false)}
      ${replies.map((reply) => renderCommentBody(reply.id, reply.data, showAdminActions, true)).join('')}
      ${showAdminActions ? renderReplyForm(messageId) : ''}
    </article>`;
}

function renderReplyForm(parentId) {
  return `
    <div class="comment-reply-actions">
      <button type="button" class="btn-comment-reply" data-reply-toggle="${escapeAttr(parentId)}">
        Responder
      </button>
      <form class="comment-reply-form" data-reply-form="${escapeAttr(parentId)}" hidden>
        <textarea rows="2" maxlength="500" required placeholder="Escribe tu respuesta…"></textarea>
        <button type="submit" class="btn-submit-post btn-submit-reply">Publicar respuesta</button>
      </form>
    </div>`;
}

function renderCommentBody(messageId, data, showDelete, isReply) {
  const name = escapeHtml(getCommentAuthorName(data));
  const text = escapeHtml(data.text || '');
  const date = formatCommentDate(data.createdAt);
  const itemClass = isReply ? 'comment-reply' : '';

  const deleteBtn = showDelete
    ? `<button type="button" class="btn-comment-delete" data-delete-comment="${escapeAttr(messageId)}">Eliminar</button>`
    : '';

  return `
    <div class="${itemClass}">
      <header class="comment-header">
        <strong>${name}</strong>
        ${date ? `<time>${date}</time>` : ''}
        ${deleteBtn}
      </header>
      <p>${text}</p>
    </div>`;
}

function formatCommentDate(createdAt) {
  if (!createdAt?.toDate) return '';
  return createdAt.toDate().toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

async function fetchCommentCountsForPosts(postIds) {
  const counts = Object.fromEntries(postIds.map((id) => [id, 0]));
  if (!postIds.length || !initCommentsFirebase()) return counts;

  await Promise.all(
    postIds.map(async (postId) => {
      try {
        const snapshot = await firebase
          .firestore()
          .collection('comments')
          .doc(postId)
          .collection('messages')
          .get();
        counts[postId] = snapshot.docs.filter((doc) => !doc.data().parentId).length;
      } catch (err) {
        console.warn('Conteo comentarios:', postId, err);
      }
    })
  );

  return counts;
}
