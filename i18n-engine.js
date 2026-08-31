/* ==========================================================================
   i18n ENGINE — ROBUST SHARED TRANSLATION SYSTEM
   Óscar Agustín Beltrán García | Portal Profesional
   ========================================================================== */

/**
 * Extract active language from URL (?lang=xx) or localStorage or fallback to 'es'
 */
function getCurrentLanguage() {
  try {
    // 1. Check URL query parameters (e.g. ?lang=fr or ?lang=en)
    const url = new URL(window.location.href);
    const urlLang = url.searchParams.get('lang');
    if (urlLang && ['es', 'en', 'fr'].includes(urlLang.toLowerCase())) {
      return urlLang.toLowerCase();
    }
  } catch (e) {}

  try {
    // Fallback regex on location.search or href for file:/// support
    const match = window.location.href.match(/[?&]lang=(es|en|fr)/i);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  } catch (e) {}

  try {
    // 2. Check localStorage
    const saved = localStorage.getItem('lang');
    if (saved && ['es', 'en', 'fr'].includes(saved.toLowerCase())) {
      return saved.toLowerCase();
    }
  } catch (e) {}

  return 'es';
}

/**
 * Apply a language to all [data-i18n] elements in the page.
 * @param {string} lang  - Language code: 'es' | 'en' | 'fr'
 * @param {Object} translations - Translation dictionary object
 */
function applyLanguage(lang, translations) {
  if (!translations) return;
  lang = (lang || 'es').toLowerCase();
  const t = translations[lang] || translations['es'] || {};

  // Update all tagged elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      if (t[key].includes('<') && t[key].includes('>')) {
        el.innerHTML = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });

  // Update <title> and <meta name="description">
  if (t['page.title']) document.title = t['page.title'];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && t['page.description']) {
    metaDesc.setAttribute('content', t['page.description']);
  }

  // Update <html lang="">
  document.documentElement.lang = lang;

  // Persist preference in localStorage
  try {
    localStorage.setItem('lang', lang);
  } catch (e) {}

  // Update internal page links to propagate the active language param
  updatePageLinks(lang);

  // Highlight active option in dropdown and update button label
  document.querySelectorAll('.lang-option').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', btnLang === lang);
  });

  const langLabel = document.getElementById('lang-current');
  if (langLabel) {
    langLabel.textContent = lang.toUpperCase();
  }
}

/**
 * Update internal page links to propagate the active language param
 */
function updatePageLinks(lang) {
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http') || href.includes('docs/')) {
      return;
    }
    try {
      const [base, hash] = href.split('#');
      const cleanBase = base.split('?')[0];
      if (cleanBase.endsWith('.html') || cleanBase.endsWith('/')) {
        let newHref = cleanBase + '?lang=' + lang;
        if (hash) newHref += '#' + hash;
        a.setAttribute('href', newHref);
      }
    } catch (e) {}
  });
}

/**
 * Initialize the language switcher widget.
 * Safe to call multiple times (idempotent).
 * @param {Object} translations - Translation dictionary object
 */
function initLangSwitcher(translations) {
  const currentLang = getCurrentLanguage();
  applyLanguage(currentLang, translations);

  const toggleBtn = document.getElementById('lang-toggle');
  const switcher  = document.getElementById('lang-switcher');
  const langLabel = document.getElementById('lang-current');

  if (!toggleBtn || !switcher) return;

  // Prevent multiple event listener attachments
  if (switcher.getAttribute('data-i18n-initialized') === 'true') {
    return;
  }
  switcher.setAttribute('data-i18n-initialized', 'true');

  // Toggle dropdown on button click
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switcher.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('open');
    }
  });

  // Handle language option clicks
  switcher.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang, translations);
      switcher.classList.remove('open');
    });
  });

  if (langLabel) {
    langLabel.textContent = currentLang.toUpperCase();
  }
}
