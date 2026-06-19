const SEO_SITE_BASE = 'https://elmanuscritozen.com';

function seoEscapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function seoPlainText(text) {
  return seoEscapeHtml(String(text).replace(/\s+/g, ' ').trim());
}

function seoFormatDateEs(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function postPublicPath(postId) {
  return `/entrada/${postId}/`;
}

function postPublicUrl(postId) {
  return `${SEO_SITE_BASE}${postPublicPath(postId)}`;
}

function absoluteAssetUrl(path) {
  if (!path) return `${SEO_SITE_BASE}/zen_hero.png`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SEO_SITE_BASE}/${String(path).replace(/^\//, '')}`;
}

function buildArticleJsonLd(entry) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.excerpt || '',
    datePublished: entry.date,
    dateModified: entry.date,
    image: [absoluteAssetUrl(entry.cover)],
    author: {
      '@type': 'Organization',
      name: 'El Manuscrito Zen',
    },
    publisher: {
      '@type': 'Organization',
      name: 'El Manuscrito Zen',
    },
    mainEntityOfPage: postPublicUrl(entry.id),
  });
}

function buildEntryPageHtml(entry, contentHtml) {
  const title = seoEscapeHtml(entry.title);
  const description = seoPlainText(entry.excerpt || entry.title);
  const canonical = postPublicUrl(entry.id);
  const ogImage = absoluteAssetUrl(entry.cover);
  const dateLabel = seoFormatDateEs(entry.date);
  const dateAttr = seoEscapeHtml(entry.date);
  const postId = seoEscapeHtml(entry.id);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-6X3J9MSSP4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-6X3J9MSSP4');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#f5f0e8" />
  <title>${title} — El Manuscrito Zen</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:locale" content="es_ES" />
  <meta property="article:published_time" content="${dateAttr}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />
  <script type="application/ld+json">${buildArticleJsonLd(entry)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Zen+Kaku+Gothic+New:wght@300;400;500&family=Noto+Serif:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../styles.css?v=17" />
</head>
<body>
  <main class="main-content post-page">
    <article class="post-page-article">
      <div class="post-view-body" id="post-view-body">
        <header class="post-view-meta">
          <h1>${title}</h1>
          <time datetime="${dateAttr}">${dateLabel}</time>
        </header>
        ${contentHtml}
      </div>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-logo">
        <span class="footer-symbol"><img src="../../enso.png" alt="Ensō" class="enso-img" /></span>
        <span class="footer-name">El Manuscrito Zen</span>
      </div>
      <p class="footer-phrase">"Respira. Estás aquí."</p>
      <p class="footer-copy">© 2026 El Manuscrito Zen · Hecho con presencia</p>
    </div>
  </footer>

  <script src="../../navbar.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) navbar.classList.add('scrolled');
    });
  </script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
  <script src="../../comments-config.js"></script>
  <script src="../../comments.js?v=8"></script>
  <script>
    window.currentPosts = [{ id: '${postId}', title: ${JSON.stringify(entry.title)} }];
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof mountCommentsForPost === 'function') {
        mountCommentsForPost('${postId}');
      }
    });
  </script>
</body>
</html>
`;
}

function buildSitemapXml(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const staticPages = [
    { loc: `${SEO_SITE_BASE}/`, priority: '1.0' },
    { loc: `${SEO_SITE_BASE}/archivo.html`, priority: '0.8' },
    { loc: `${SEO_SITE_BASE}/sobre.html`, priority: '0.6' },
    { loc: `${SEO_SITE_BASE}/dojo.html`, priority: '0.5' },
  ];

  const entries = Array.isArray(posts) ? posts : [];
  const urls = [
    ...staticPages.map((page) => ({ ...page, lastmod: today })),
    ...entries.map((post) => ({
      loc: postPublicUrl(post.id),
      lastmod: (post.date || today).slice(0, 10),
      priority: '0.7',
    })),
  ];

  const body = urls
    .map(
      (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SEO_SITE_BASE,
    postPublicPath,
    postPublicUrl,
    buildEntryPageHtml,
    buildSitemapXml,
  };
} else if (typeof window !== 'undefined') {
  window.ZEN_SEO = {
    SEO_SITE_BASE,
    buildEntryPageHtml,
    buildSitemapXml,
  };
}
