/**
 * EL MANUSCRITO ZEN — app.js
 * Blog engine: posts storage, rendering, editor, post viewer
 */

/* ==========================================
   DATA LAYER — LocalStorage persistence
   ========================================== */

const STORAGE_KEY = 'zen_manuscrito_posts';

const SAMPLE_POSTS = [
  {
    id: 'p001',
    title: 'El silencio que habla entre las palabras',
    category: 'Zen',
    excerpt: 'Hay una voz que no usa sonido, que no necesita palabras. Aprender a escucharla es el primer paso del camino.',
    content: `<p>En el Zendo, durante los primeros días de práctica, uno llega creyendo que la meditación consiste en apagar la mente. Se sienta, cierra los ojos, y espera el silencio como quien espera un tren.</p>
<p>Pero el silencio no llega. Llegan los pensamientos, los recuerdos, la lista de la compra, el nombre de alguien que no has visto en años.</p>
<blockquote>No trates de detener el pensamiento. Déjalo pasar como las nubes pasan por el cielo abierto.</blockquote>
<p>Esta enseñanza del maestro Dogen tardé meses en entenderla verdaderamente. El cielo no lucha contra las nubes. Las contiene. Y cuando las nubes pasan, el cielo sigue siendo el mismo cielo.</p>
<hr />
<p>Hoy, mientras meditaba al amanecer, escuché algo que podría llamar silencio pero que en realidad era plenitud. No la ausencia de sonido, sino la presencia de todo: el canto de un pájaro lejano, el ritmo de mi respiración, el pulso lento del mundo despertando.</p>
<p>El zen nos enseña que el silencio no está fuera del ruido. Está en medio de él, sosteniendo todo.</p>`,
    tags: ['zen', 'silencio', 'meditación'],
    date: new Date(Date.now() - 0).toISOString(),
    symbol: '☽',
    theme: 'theme-indigo',
    readTime: 4
  },
  {
    id: 'p002',
    title: 'Las Cuatro Nobles Verdades en el desayuno',
    category: 'Budismo',
    excerpt: 'El Buda no enseñó en templos alejados del mundo. Enseñó en la vida misma. Incluso en el desayuno.',
    content: `<p>Esta mañana, mientras esperaba que el agua hirviera, me encontré pensando en las Cuatro Nobles Verdades.</p>
<p>La primera: dukkha, el sufrimiento o insatisfacción. Ahí estaba yo, impaciente porque el agua tardaba. Queriendo que el momento fuera diferente a lo que era.</p>
<blockquote>Dukkha no es solo el dolor grande. Es también la pequeña fricción de querer que las cosas sean distintas.</blockquote>
<p>La segunda verdad habla del origen del sufrimiento: el apego, el deseo. Yo deseaba mi café. Deseaba la mañana tranquila. Deseaba que el mundo se detuviera y me esperara.</p>
<hr />
<p>La tercera verdad es la más hermosa: el cese del sufrimiento es posible. No porque desaparezcan las dificultades, sino porque cambia nuestra relación con ellas.</p>
<p>Y la cuarta —el Óctuple Sendero— es simplemente la práctica. Cada momento, cada elección, cada respiración consciente.</p>
<p>El agua hirvió. Preparé el café. Lo tomé despacio, presente. Las Cuatro Nobles Verdades en una taza.</p>`,
    tags: ['budismo', 'dharma', 'práctica diaria'],
    date: new Date(Date.now() - 86400000).toISOString(),
    symbol: '☸',
    theme: 'theme-amber',
    readTime: 5
  },
  {
    id: 'p003',
    title: 'Anicca: la impermanencia como maestra',
    category: 'Filosofía',
    excerpt: 'Todo lo que comienza también termina. Esta no es una enseñanza pesimista. Es la verdad más liberadora que existe.',
    content: `<p>Anicca es una de las tres marcas de la existencia en el budismo: la impermanencia. Nada dura. Los momentos pasan. Las personas cambian. Los imperios caen.</p>
<p>Cuando meditamos sobre la impermanencia, no lo hacemos para deprimirnos. Lo hacemos para aprender a no aferrarnos.</p>
<blockquote>Lo que te causa sufrimiento no es la pérdida. Es el apego a lo que creías permanente.</blockquote>
<p>Hoy contemplé una flor en el jardín. En unos días habrá caído. Y sin embargo, qué hermosa es ahora, precisamente porque es efímera.</p>
<hr />
<p>La práctica de mindfulness está profundamente conectada con anicca. Cuando prestamos atención al momento presente, vemos cómo todo fluye: el pensamiento aparece y desaparece, la sensación surge y se disuelve, el sonido nace y muere.</p>
<p>En ese fluir constante, si podemos soltar el control, hay una libertad inmensa. La libertad de no resistir lo que es.</p>`,
    tags: ['impermanencia', 'filosofía', 'anicca'],
    date: new Date(Date.now() - 172800000).toISOString(),
    symbol: '◈',
    theme: 'theme-teal',
    readTime: 4
  },
  {
    id: 'p004',
    title: 'La respiración como ancla',
    category: 'Meditación',
    excerpt: 'La respiración siempre está aquí. No en el pasado ni en el futuro. Solo en este momento exacto.',
    content: `<p>Cuando la mente se dispersa —y siempre se dispersa— la respiración es el faro al que regresar. No porque sea mágica, sino porque es el proceso más inmediato y constante que tenemos: ocurre ahora, en este preciso instante.</p>
<p>La práctica Anapanasati, la meditación en la respiración, es una de las más antiguas y completas del budismo. El Buda la describió en extenso en el Anapanasati Sutta.</p>
<blockquote>Inhala conscientemente. Exhala conscientemente. En ese ciclo simple está toda la práctica.</blockquote>
<p>Hoy, durante treinta minutos, solo respiré. Cada vez que mi mente se fue —a los planes, a las preocupaciones, al futuro— regresé. Sin juicio. Sin frustración. Solo el suave gesto de volver.</p>
<hr />
<p>Esto es lo que se llama "comenzar de nuevo". No como fracaso, sino como práctica. Cada regreso a la respiración es un momento de despertar.</p>
<p>Y cuantos más momentos de despertar, más presente se vuelve la vida.</p>`,
    tags: ['respiración', 'meditación', 'anapanasati'],
    date: new Date(Date.now() - 259200000).toISOString(),
    symbol: '∞',
    theme: 'theme-purple',
    readTime: 4
  },
  {
    id: 'p005',
    title: 'Metta: el amor incondicional como práctica',
    category: 'Práctica',
    excerpt: 'Hay un amor que no depende de condiciones. No es sentimental. Es una capacidad del corazón que puede cultivarse.',
    content: `<p>Metta Bhavana — el cultivo del amor bondadoso — es una de las prácticas más transformadoras del budismo. Comienza con uno mismo, y se expande hacia afuera como círculos en el agua.</p>
<p>La práctica tradicional es sencilla. Repites en silencio, con sinceridad:</p>
<blockquote>Que yo sea feliz. Que esté libre de sufrimiento. Que esté en paz.</blockquote>
<p>Luego llevas esa misma intención hacia alguien que amas, hacia alguien neutro, hacia alguien difícil, y finalmente hacia todos los seres.</p>
<hr />
<p>Lo que descubres, si practicas con constancia, es que el corazón tiene una capacidad ilimitada para el amor. No el amor romántico, lleno de condiciones y expectativas, sino algo más parecido al sol: que brilla por igual sobre todos.</p>
<p>Hoy practiqué metta durante veinte minutos. Llegué al momento de dirigirlo hacia alguien difícil en mi vida. Fue incómodo. Pero también fue liberador. La hostilidad que cargaba se hizo un poco más ligera.</p>`,
    tags: ['metta', 'compasión', 'amor bondadoso'],
    date: new Date(Date.now() - 345600000).toISOString(),
    symbol: '❧',
    theme: 'theme-rose',
    readTime: 5
  },
  {
    id: 'p006',
    title: 'El koan del árbol que cae en el bosque',
    category: 'Zen',
    excerpt: 'Los koans no tienen respuesta intelectual. Su función es llevar la mente más allá de sí misma.',
    content: `<p>En la tradición Zen, los koans son paradojas o preguntas que el maestro propone al estudiante. No se resuelven con el intelecto. Se trabajan durante semanas, meses, a veces años.</p>
<p>Uno de los más conocidos fuera del Zen: "Si un árbol cae en el bosque y nadie lo escucha, ¿hace sonido?"</p>
<blockquote>La mente busca la respuesta correcta. El Zen pregunta: ¿quién es el que busca?</blockquote>
<p>Esta es la función del koan: agotar el pensamiento conceptual hasta que algo diferente pueda emerger. No una respuesta. Una apertura.</p>
<hr />
<p>Mi maestro Zen me dio un koan simple hace años: "¿Cuál es tu rostro original, antes de que nacieran tus padres?"</p>
<p>Pasé meses intelectualizando. Luego, un día, mientras barría el jardín, algo se aclaró. No sé explicarlo. El pensamiento se detuvo un instante, y en ese instante estaba la respuesta que no es una respuesta.</p>
<p>Eso es el Zen.</p>`,
    tags: ['zen', 'koan', 'despertar'],
    date: new Date(Date.now() - 432000000).toISOString(),
    symbol: '❖',
    theme: 'theme-indigo',
    readTime: 4
  }
];

function getPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const posts = JSON.parse(stored);
      if (posts && posts.length > 0) return posts;
    }
  } catch(e) {}
  // Initialize with sample posts
  savePosts(SAMPLE_POSTS);
  return SAMPLE_POSTS;
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function addPost(post) {
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
  return posts;
}

/* ==========================================
   UTILITIES
   ========================================== */

function generateId() {
  return 'p' + Date.now() + Math.random().toString(36).substr(2,5);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatDateShort(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function estimateReadTime(html) {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.round(words / 200));
}

const SYMBOLS = ['☽', '☸', '◈', '∞', '❧', '❖', '✦', '◯', '⊕', '⌘'];
const THEMES = ['theme-purple', 'theme-teal', 'theme-amber', 'theme-rose', 'theme-indigo'];

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}
function randomTheme() {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
}

/* ==========================================
   NAVBAR SCROLL BEHAVIOR
   ========================================== */

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

function toggleMobileMenu() {
  const menu = document.getElementById('nav-mobile-menu');
  if (menu) menu.classList.toggle('open');
}

/* ==========================================
   HOME PAGE — RENDER POSTS
   ========================================== */

let postsPage = 0;
const POSTS_PER_PAGE = 6;

function renderHomePage() {
  const featuredContainer = document.getElementById('featured-post-container');
  const postsGrid = document.getElementById('posts-grid');
  if (!featuredContainer && !postsGrid) return;

  const posts = getPosts();
  postsPage = 0;

  // Featured post (most recent)
  if (featuredContainer && posts.length > 0) {
    featuredContainer.innerHTML = renderFeaturedPost(posts[0]);
  }

  // Grid posts
  if (postsGrid) {
    postsGrid.innerHTML = '';
    const gridPosts = posts.slice(1, 1 + POSTS_PER_PAGE);
    gridPosts.forEach(post => {
      postsGrid.insertAdjacentHTML('beforeend', renderPostCard(post));
    });
    postsPage = 1;
    updateLoadMoreBtn(posts);
  }
}

function loadMorePosts() {
  const postsGrid = document.getElementById('posts-grid');
  if (!postsGrid) return;
  const posts = getPosts();
  const start = 1 + postsPage * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const morePosts = posts.slice(start, end);
  morePosts.forEach(post => {
    postsGrid.insertAdjacentHTML('beforeend', renderPostCard(post));
  });
  postsPage++;
  updateLoadMoreBtn(posts);
}

function updateLoadMoreBtn(posts) {
  const btn = document.getElementById('load-more-wrap');
  if (!btn) return;
  const totalShown = 1 + postsPage * POSTS_PER_PAGE;
  btn.style.display = totalShown >= posts.length ? 'none' : 'flex';
}

function renderFeaturedPost(post) {
  const visualContent = post.cover
    ? `<img src="${post.cover}" alt="Portada de ${post.title}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div class="featured-card-pattern"></div><div class="featured-card-symbol">${post.symbol || '☽'}</div>`;
  const visualClass = post.cover ? 'has-cover' : '';
  return `
    <div class="featured-card" id="featured-card-${post.id}" onclick="openPostView('${post.id}')">
      <div class="featured-card-visual ${post.theme || 'theme-indigo'} ${visualClass}">
        ${visualContent}
        <div class="featured-label">✦ Entrada más reciente</div>
      </div>
      <div class="featured-card-content">
        <div class="post-meta">
          <span class="post-category">${post.category}</span>
          <span class="post-dot">•</span>
          <span class="post-date">${formatDate(post.date)}</span>
          <span class="post-dot">•</span>
          <span class="post-read-time">${post.readTime || estimateReadTime(post.content)} min lectura</span>
        </div>
        <h2 class="featured-card-title">${post.title}</h2>
        <p class="featured-card-excerpt">${post.excerpt}</p>
        <span class="btn-read-more">Leer entrada</span>
      </div>
    </div>
  `;
}

function renderPostCard(post) {
  const tags = (post.tags || []).slice(0, 2).map(t => `<span class="post-tag">#${t}</span>`).join('');
  const visualContent = post.cover
    ? `<img src="${post.cover}" alt="Portada" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div class="post-card-gradient ${post.theme || 'theme-indigo'}"></div><div class="post-card-symbol">${post.symbol || '☽'}</div>`;
  const visualClass = post.cover ? 'has-cover' : '';
  return `
    <div class="post-card" id="post-card-${post.id}" onclick="openPostView('${post.id}')">
      <div class="post-card-visual ${post.theme || 'theme-indigo'} ${visualClass}">
        ${visualContent}
      </div>
      <div class="post-card-content">
        <div class="post-meta">
          <span class="post-category">${post.category}</span>
          <span class="post-dot">•</span>
          <span class="post-date">${formatDateShort(post.date)}</span>
        </div>
        <h3 class="post-card-title">${post.title}</h3>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <div class="post-card-footer">
          <div class="post-tags">${tags}</div>
          <span class="post-card-arrow">&rarr;</span>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================
   POST VIEWER MODAL
   ========================================== */

function openPostView(postId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const overlay = document.getElementById('post-view-overlay');
  const body = document.getElementById('post-view-body');
  if (!overlay || !body) return;

  const tags = (post.tags || []).map(t => `<span class="post-tag">#${t}</span>`).join('');
  const coverHTML = post.cover
    ? `<img src="${post.cover}" alt="Portada" class="pv-cover" />`
    : '';

  body.innerHTML = `
    ${coverHTML}
    <div class="pv-category">${post.category}</div>
    <h1 class="pv-title">${post.title}</h1>
    <div class="pv-meta">
      <span class="post-date">${formatDate(post.date)}</span>
      <span class="post-dot">•</span>
      <span class="post-read-time">${post.readTime || estimateReadTime(post.content)} min lectura</span>
    </div>
    <div class="pv-content">${post.content}</div>
    <div class="pv-tags">${tags}</div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePostView() {
  const overlay = document.getElementById('post-view-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function closePostViewOnOverlay(event) {
  if (event.target === document.getElementById('post-view-overlay')) {
    closePostView();
  }
}

/* ==========================================
   EDITOR MODAL
   ========================================== */

function openEditor() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Reset form
  const titleInput    = document.getElementById('post-title-input');
  const excerptInput  = document.getElementById('post-excerpt-input');
  const tagsInput     = document.getElementById('post-tags-input');
  const contentInput  = document.getElementById('post-content-input');
  const imgInput      = document.getElementById('img-upload-input');
  const coverInput    = document.getElementById('cover-upload-input');
  if (titleInput)   titleInput.value = '';
  if (excerptInput) excerptInput.value = '';
  if (tagsInput)    tagsInput.value = '';
  if (contentInput) contentInput.innerHTML = '';
  if (imgInput)     imgInput.value = '';
  if (coverInput)   coverInput.value = '';
  // Remove any existing cover preview
  const existingPreview = document.getElementById('cover-preview-wrap');
  if (existingPreview) existingPreview.remove();
  // Clear pending cover
  window._pendingCoverBase64 = null;
  // Init drag-drop
  initEditorDragDrop();
}

function closeEditor() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function closeEditorOnOverlay(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    closeEditor();
  }
}

function formatText(command) {
  document.execCommand(command, false, null);
  document.getElementById('post-content-input').focus();
}

function insertQuote() {
  const textarea = document.getElementById('post-content-input');
  if (!textarea) return;
  const selection = window.getSelection();
  let selectedText = '';
  if (selection && selection.rangeCount > 0) {
    selectedText = selection.toString();
  }
  const quoteText = selectedText || 'Tu cita aquí...';
  document.execCommand('insertHTML', false, `<blockquote>${quoteText}</blockquote><p><br></p>`);
  textarea.focus();
}

function insertDivider() {
  const textarea = document.getElementById('post-content-input');
  if (!textarea) return;
  document.execCommand('insertHTML', false, `<hr /><p><br></p>`);
  textarea.focus();
}

/* ==========================================
   IMAGE HANDLING
   ========================================== */

function triggerImageUpload() {
  const input = document.getElementById('img-upload-input');
  if (input) input.click();
}

function triggerCoverUpload() {
  const input = document.getElementById('cover-upload-input');
  if (input) input.click();
}

function handleImageUpload(event, mode) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Solo se permiten archivos de imagen.');
    return;
  }
  // Warn if file is very large (> 3MB)
  if (file.size > 3 * 1024 * 1024) {
    showToast('La imagen es grande — puede tardar un momento...');
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    if (mode === 'cover') {
      insertCoverPreview(base64);
    } else {
      insertImageInline(base64, file.name);
    }
  };
  reader.readAsDataURL(file);
  // Reset so same file can be re-selected
  event.target.value = '';
}

function insertImageInline(base64, fileName) {
  const textarea = document.getElementById('post-content-input');
  if (!textarea) return;
  textarea.focus();
  // Try to place cursor at end if nothing selected
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    const range = document.createRange();
    range.selectNodeContents(textarea);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  const altText = fileName ? fileName.replace(/\.[^.]+$/, '') : 'imagen';
  document.execCommand('insertHTML', false,
    `<figure><img src="${base64}" alt="${altText}" style="max-width:100%;border-radius:8px;margin:12px 0;" /><figcaption>${altText}</figcaption></figure><p><br></p>`
  );
  showToast('🖼 Imagen insertada en el contenido');
}

function insertCoverPreview(base64) {
  // Store for later
  window._pendingCoverBase64 = base64;
  // Show preview below the toolbar area
  let wrap = document.getElementById('cover-preview-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'cover-preview-wrap';
    wrap.className = 'cover-preview-wrap';
    // Insert before the tags field
    const tagsField = document.querySelector('.editor-field:last-child');
    if (tagsField) {
      tagsField.parentNode.insertBefore(wrap, tagsField);
    }
  }
  wrap.innerHTML = `
    <label class="editor-label" style="display:block;margin-bottom:8px">Imagen de portada</label>
    <div style="position:relative">
      <img src="${base64}" class="cover-preview-img" alt="Portada" />
      <button class="cover-preview-remove" onclick="removeCoverPreview()">✕ Quitar</button>
    </div>
  `;
  showToast('✦ Imagen de portada añadida');
}

function removeCoverPreview() {
  window._pendingCoverBase64 = null;
  const wrap = document.getElementById('cover-preview-wrap');
  if (wrap) wrap.remove();
}

/* Drag & drop images onto the editor textarea */
function initEditorDragDrop() {
  const textarea = document.getElementById('post-content-input');
  const hint = document.getElementById('img-drop-hint');
  if (!textarea) return;

  ['dragenter', 'dragover'].forEach(evt => {
    textarea.addEventListener(evt, e => {
      e.preventDefault();
      if (hint) hint.classList.add('drag-over');
    }, false);
  });
  ['dragleave', 'drop'].forEach(evt => {
    textarea.addEventListener(evt, e => {
      if (hint) hint.classList.remove('drag-over');
    }, false);
  });
  textarea.addEventListener('drop', e => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => insertImageInline(ev.target.result, file.name);
      reader.readAsDataURL(file);
    });
  }, false);

  // Also allow paste of images
  textarea.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = ev => insertImageInline(ev.target.result, 'imagen-pegada');
        reader.readAsDataURL(file);
        break;
      }
    }
  });
}

function publishPost() {
  const title     = (document.getElementById('post-title-input')    || {}).value || '';
  const category  = (document.getElementById('post-category-input') || {}).value || 'Reflexión';
  const excerpt   = (document.getElementById('post-excerpt-input')  || {}).value || '';
  const content   = (document.getElementById('post-content-input')  || {}).innerHTML || '';
  const tagsRaw   = (document.getElementById('post-tags-input')     || {}).value || '';
  const cover     = window._pendingCoverBase64 || null;

  if (!title.trim()) {
    showToast('Por favor escribe un título para tu entrada.');
    document.getElementById('post-title-input').focus();
    return;
  }
  if (!content.trim() || content === '<br>') {
    showToast('El contenido no puede estar vacío.');
    document.getElementById('post-content-input').focus();
    return;
  }

  const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

  const newPost = {
    id: generateId(),
    title: title.trim(),
    category,
    excerpt: excerpt.trim() || title.trim(),
    content: content,
    cover: cover,
    tags,
    date: new Date().toISOString(),
    symbol: randomSymbol(),
    theme: randomTheme(),
    readTime: estimateReadTime(content)
  };

  addPost(newPost);
  closeEditor();
  showToast('✦ Entrada publicada con éxito');

  // Refresh page content if on home
  if (document.getElementById('posts-grid')) {
    renderHomePage();
  }
  // Refresh archive if on that page
  if (typeof renderArchive === 'function') {
    renderArchive('all');
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allBtn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
    }
  }
}

/* ==========================================
   TOAST NOTIFICATION
   ========================================== */

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

/* ==========================================
   DAILY QUOTE ROTATION
   ========================================== */

const ZEN_QUOTES = [
  { text: '"El momento presente siempre será."', author: '— Eckhart Tolle' },
  { text: '"Si eres tranquilo, el mundo también lo será."', author: '— Thich Nhat Hanh' },
  { text: '"No hagas nada. Sé la conciencia."', author: '— Osho' },
  { text: '"En la mente del principiante hay muchas posibilidades."', author: '— Shunryu Suzuki' },
  { text: '"La paz viene de adentro. No la busques afuera."', author: '— Buda' },
  { text: '"Antes de la iluminación, corta leña y acarrea agua. Después, lo mismo."', author: '— Proverbio Zen' },
  { text: '"La vida es sufrimiento; el origen del sufrimiento es el apego."', author: '— Siddhartha Gautama' },
  { text: '"No corras detrás del placer ni huyas del dolor."', author: '— Atisha' },
  { text: '"Un vaso sólo puede ser útil cuando está vacío."', author: '— Lao Tzu' },
  { text: '"La compasión no es un lujo, es una necesidad."', author: '— Dalai Lama' },
];

function setDailyQuote() {
  const quoteEl = document.getElementById('daily-quote');
  const authorEl = document.querySelector('.hero-quote-author');
  if (!quoteEl || !authorEl) return;
  const today = new Date().toDateString();
  const stored = localStorage.getItem('zen_quote_day');
  const storedIdx = localStorage.getItem('zen_quote_idx');
  let idx;
  if (stored === today && storedIdx !== null) {
    idx = parseInt(storedIdx, 10);
  } else {
    idx = Math.floor(Math.random() * ZEN_QUOTES.length);
    localStorage.setItem('zen_quote_day', today);
    localStorage.setItem('zen_quote_idx', idx);
  }
  const q = ZEN_QUOTES[idx];
  quoteEl.textContent = q.text;
  authorEl.textContent = q.author;
}

/* ==========================================
   KEYBOARD SHORTCUTS
   ========================================== */

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditor();
    closePostView();
  }
});

/* ==========================================
   INTERSECTION OBSERVER — Animate on scroll
   ========================================== */

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const els = document.querySelectorAll('.post-card, .featured-card, .archive-item, .intro-inner');
  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

/* ==========================================
   INITIALIZE
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Set daily quote if on home page
  setDailyQuote();

  // Render home page posts
  renderHomePage();

  // Start scroll animations after a tick
  setTimeout(initScrollAnimations, 100);
});
// ==========================================================================
// CONTROL DE ACCESO ADMINISTRADOR LOCAL (MIGUEL)
// ==========================================================================

// Comprobar si el usuario ya estaba logueado al cargar el documento
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isZenAdmin") === "true") {
        showEditorButtons(true);
    }
    
    // Permitir hacer login pulsando Enter desde cualquiera de los dos campos
    const handleEnter = (e) => { if (e.key === "Enter") checkAdminAccess(); };
    document.getElementById("admin-user")?.addEventListener("keypress", handleEnter);
    document.getElementById("admin-password")?.addEventListener("keypress", handleEnter);
});

// Función para verificar las credenciales introducidas
function checkAdminAccess() {
    const userInput = document.getElementById("admin-user");
    const passwordInput = document.getElementById("admin-password");
    
    // Tus credenciales configuradas
    const USUARIO_CORRECTO = "miguelbardisaherreros";
    const CLAVE_CORRECTA = "966331339.Gemma"; 

    if (userInput && passwordInput) {
        if (userInput.value === USUARIO_CORRECTO && passwordInput.value === CLAVE_CORRECTA) {
            localStorage.setItem("isZenAdmin", "true");
            showEditorButtons(true);
            
            userInput.value = "";
            passwordInput.value = "";
            
            if (typeof showToast === "function") {
                showToast("¡Bienvenido, Miguel! Modo editor activado.");
            }
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    }
}

// Controla la visibilidad de los botones en la barra de navegación e interfaz
function showEditorButtons(isAdmin) {
    const btnDesktop = document.getElementById("btn-open-editor");
    const btnMobile = document.getElementById("btn-open-editor-mobile");
    const loginForm = document.getElementById("admin-login-form");
    const statusZone = document.getElementById("admin-status");

    if (isAdmin) {
        if (btnDesktop) btnDesktop.style.display = "inline-block";
        if (btnMobile) btnMobile.style.display = "block";
        if (loginForm) loginForm.style.display = "none";
        if (statusZone) statusZone.style.display = "flex";
    } else {
        if (btnDesktop) btnDesktop.style.display = "none";
        if (btnMobile) btnMobile.style.display = "none";
        if (loginForm) loginForm.style.display = "flex";
        if (statusZone) statusZone.style.display = "none";
    }
}

// Cierra la sesión del administrador
function logoutAdmin() {
    localStorage.removeItem("isZenAdmin");
    showEditorButtons(false);
}