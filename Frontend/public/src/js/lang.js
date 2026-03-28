(function () {
  var STORAGE_KEY = 'klarity-lang';
  var DEFAULT_LANG = 'es';

  function normalizeLang(lang) {
    var safe = String(lang || '').toLowerCase();
    return safe === 'en' ? 'en' : 'es';
  }

  function getLang() {
    return normalizeLang(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
  }

  function setLang(lang) {
    var safe = normalizeLang(lang);
    localStorage.setItem(STORAGE_KEY, safe);
    document.documentElement.setAttribute('lang', safe);
    return safe;
  }

  function syncButtons(root) {
    var current = getLang();
    var scope = root || document;
    var esBtn = scope.getElementById ? scope.getElementById('btnES') : null;
    var enBtn = scope.getElementById ? scope.getElementById('btnEN') : null;

    if (esBtn) esBtn.classList.toggle('active', current === 'es');
    if (enBtn) enBtn.classList.toggle('active', current === 'en');
  }

  function redirectToLocalizedLanding(lang) {
    var safe = normalizeLang(lang || getLang());
    var target = safe === 'en' ? '/en' : '/';
    if (window.location.pathname !== target) {
      window.location.href = target;
    }
  }

  function isLandingPath(pathname) {
    var path = String(pathname || window.location.pathname || '').toLowerCase();
    return path === '/' || path === '/en' || path.endsWith('/src/html/index.html') || path.endsWith('/src/html/en.html');
  }

  function applyPathLanguageDefault() {
    var path = String(window.location.pathname || '').toLowerCase();
    if (path === '/en' || path.endsWith('/src/html/en.html')) {
      setLang('en');
      return;
    }
    if (path === '/' || path.endsWith('/src/html/index.html')) {
      if (getLang() === 'en') {
        redirectToLocalizedLanding('en');
      } else {
        setLang('es');
      }
    }
  }

  function setLangAndNavigate(lang) {
    var safe = setLang(lang);
    syncButtons(document);
    if (isLandingPath(window.location.pathname)) {
      redirectToLocalizedLanding(safe);
      return;
    }
    window.location.reload();
  }

  window.klarityLang = {
    getLang: getLang,
    setLang: setLang,
    syncButtons: syncButtons,
    redirectToLocalizedLanding: redirectToLocalizedLanding,
    setLangAndNavigate: setLangAndNavigate,
    applyPathLanguageDefault: applyPathLanguageDefault,
  };

  window.getLang = getLang;
  window.setLang = setLangAndNavigate;

  document.addEventListener('DOMContentLoaded', function () {
    applyPathLanguageDefault();
    setLang(getLang());
    syncButtons(document);
  });
})();
