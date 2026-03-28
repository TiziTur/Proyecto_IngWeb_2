// ============================================================
// KLARITY — i18n  (EN / ES)
// ============================================================
(function () {
  const STORAGE_KEY = 'klarity-lang';
  const DEFAULT_LANG = 'es';

  // ── Translation strings ───────────────────────────────────
  const TRANSLATIONS = {
    es: {
      // Navbar
      'nav.how':       'Cómo funciona',
      'nav.features':  'Funciones',
      'nav.pricing':   'Precios',
      'nav.demo':      'Demo Lab',
      'nav.login':     'Iniciar sesión',

      // Hero
      'hero.eyebrow':  '✦ Gestión financiera inteligente',
      'hero.title':    'Sabe exactamente<br><span class="text-gradient">adónde va tu dinero.</span>',
      'hero.sub':      'Registra gastos en segundos, analiza patrones con IA y toma<br>decisiones que realmente importan.',
      'hero.cta':      'Empieza gratis',
      'hero.cta2':     'Ver demo',
      'hero.trust':    'Sin tarjeta de crédito · Cancela cuando quieras',

      // Stats strip
      'stats.users':      'usuarios activos',
      'stats.savings':    'en ahorros detectados',
      'stats.satisf':     'de satisfacción',
      'stats.advisors':   'asesores certificados',

      // How it works
      'how.badge':        '¿Cómo funciona?',
      'how.title':        'Del gasto al insight<br class="d-none d-md-block"> en tres pasos.',
      'how.sub':          'Sin hojas de cálculo, sin fricción. Solo claridad.',
      'how.s1.title':     'Conecta tus gastos',
      'how.s1.sub':       'Importa desde tu banco, sube tickets o carga manual.',
      'how.s2.title':     'Visualiza tus patrones',
      'how.s2.sub':       'Gráficas en tiempo real, categorías automáticas y alertas inteligentes.',
      'how.s3.title':     'Toma el control',
      'how.s3.sub':       'Fija metas, recibe sugerencias de ahorro y comparte informes.',

      // Features
      'feat.badge':       '¿Qué incluye?',
      'feat.title':       'Todo lo que necesitas,<br class="d-none d-md-block"> nada que no necesitas.',
      'feat.f1.title':    'OCR de tickets',
      'feat.f1.sub':      'Fotografía cualquier recibo y extrae el gasto automáticamente.',
      'feat.f2.title':    'IA Consejera',
      'feat.f2.sub':      'Análisis personalizado, alertas proactivas y recomendaciones de ahorro.',
      'feat.f3.title':    'Multi-divisa',
      'feat.f3.sub':      'Gastos en cualquier moneda convertidos en tiempo real.',
      'feat.f4.title':    'Suscripciones',
      'feat.f4.sub':      'Detecta y controla cargos recurrentes antes de que te sorprendan.',
      'feat.f5.title':    'Presupuestos',
      'feat.f5.sub':      'Crea límites por categoría con alertas cuando te acercas al máximo.',
      'feat.f6.title':    'Asesores',
      'feat.f6.sub':      'Conecta con un asesor certificado para revisión 1 a 1 de tus finanzas.',

      // Testimonials
      'test.badge':       'Lo que dicen',
      'test.title':       'Personas reales,<br class="d-none d-md-block"> resultados reales.',

      // Pricing
      'price.badge':      'Planes',
      'price.title':      'Simple y transparente.',
      'price.sub':        'Sin sorpresas. Cancela cuando quieras.',
      'price.free.name':  'Gratis',
      'price.free.desc':  'Para personas que están empezando a organizarse.',
      'price.free.cta':   'Crear cuenta',
      'price.pro.name':   'Pro',
      'price.pro.desc':   'Para quienes quieren el máximo control.',
      'price.pro.cta':    'Empezar Pro',
      'price.pro.badge':  'Más popular',

      // FAQ
      'faq.badge':        'FAQ',
      'faq.title':        'Preguntas frecuentes.',
      'faq.q1':           '¿Mis datos financieros están seguros?',
      'faq.a1':           'Sí. Usamos cifrado AES-256 en reposo y TLS en tránsito. Tu información nunca se comparte con terceros.',
      'faq.q2':           '¿Puedo importar gastos de mi banco?',
      'faq.a2':           'Actualmente puedes subir tickets con OCR o añadir gastos manualmente. La integración bancaria directa está en el roadmap para Q3.',
      'faq.q3':           '¿Qué diferencia hay entre el plan Gratis y Pro?',
      'faq.a3':           'El plan Gratis incluye hasta 50 gastos/mes y análisis básico. Pro desbloquea gastos ilimitados, IA avanzada, suscripciones y asesoría personalizada.',
      'faq.q4':           '¿Puedo cancelar en cualquier momento?',
      'faq.a4':           'Claro. Sin compromisos ni penalizaciones. Cancelas desde tu perfil en un clic.',
      'faq.q5':           '¿Hay aplicación móvil?',
      'faq.a5':           'La app móvil está en desarrollo activo. Por ahora la versión web está optimizada para móviles.',

      // Lab section
      'lab.badge':        'Demo Labs',
      'lab.title':        'Prueba la plataforma en vivo.',
      'lab.sub':          'Inicia sesión con una cuenta de demostración y explora todas las funcionalidades.',

      // CTA
      'cta.title':        'Empieza hoy.<br>Tu futuro financiero te lo agradecerá.',
      'cta.sub':          'Sin tarjeta de crédito · 5 minutos para configurar · 100% seguro',
      'cta.btn':          'Crear cuenta gratis',

      // Footer
      'footer.product':   'Producto',
      'footer.resources': 'Recursos',
      'footer.company':   'Empresa',
      'footer.legal':     'Legal',
      'footer.tagline':   'Claridad financiera para todos.',
      'footer.copy':      '© 2025 Klarity. Todos los derechos reservados.',

      // Login page
      'login.back':       '← Volver al inicio',
      'login.title':      'Bienvenido a<br>Klarity',
      'login.tagline':    'Know where it goes.',
      'login.benefit1':   'Registra gastos en segundos',
      'login.benefit2':   'Analiza tus patrones con IA',
      'login.benefit3':   'Controla tus suscripciones',
      'login.benefit4':   'Conecta con asesores certificados',
      'login.tab.in':     'Ingresar',
      'login.tab.reg':    'Crear cuenta',
      'login.label.email': 'Correo electrónico',
      'login.label.pass':  'Contraseña',
      'login.label.name':  'Nombre completo',
      'login.btn.enter':   'Entrar',
      'login.btn.create':  'Crear cuenta',
      'login.demo.title':  'Cuentas de demo',

      // Dashboard
      'dash.overview':    'Resumen',
      'dash.expenses':    'Gastos',
      'dash.add':         'Añadir gasto',
      'dash.ocr':         'Subir ticket',
      'dash.budgets':     'Presupuestos',
      'dash.advisor':     'Asesor IA',
      'dash.profile':     'Perfil',
      'dash.logout':      'Cerrar sesión',
    },

    en: {
      // Navbar
      'nav.how':       'How it works',
      'nav.features':  'Features',
      'nav.pricing':   'Pricing',
      'nav.demo':      'Demo Lab',
      'nav.login':     'Log in',

      // Hero
      'hero.eyebrow':  '✦ Smart financial management',
      'hero.title':    'Know exactly where<br><span class="text-gradient">your money goes.</span>',
      'hero.sub':      'Log expenses in seconds, analyse patterns with AI and make<br>decisions that actually matter.',
      'hero.cta':      'Start for free',
      'hero.cta2':     'Watch demo',
      'hero.trust':    'No credit card · Cancel anytime',

      // Stats strip
      'stats.users':      'active users',
      'stats.savings':    'in detected savings',
      'stats.satisf':     'satisfaction rate',
      'stats.advisors':   'certified advisors',

      // How it works
      'how.badge':        'How it works',
      'how.title':        'From expense to insight<br class="d-none d-md-block"> in three steps.',
      'how.sub':          'No spreadsheets, no friction. Just clarity.',
      'how.s1.title':     'Connect your expenses',
      'how.s1.sub':       'Import from your bank, upload receipts or add them manually.',
      'how.s2.title':     'Visualise your patterns',
      'how.s2.sub':       'Real-time charts, automatic categories and smart alerts.',
      'how.s3.title':     'Take control',
      'how.s3.sub':       'Set goals, get saving tips and share reports.',

      // Features
      'feat.badge':       "What's included?",
      'feat.title':       'Everything you need,<br class="d-none d-md-block"> nothing you don\'t.',
      'feat.f1.title':    'Receipt OCR',
      'feat.f1.sub':      'Photograph any receipt and extract the expense automatically.',
      'feat.f2.title':    'AI Advisor',
      'feat.f2.sub':      'Personalised analysis, proactive alerts and saving recommendations.',
      'feat.f3.title':    'Multi-currency',
      'feat.f3.sub':      'Expenses in any currency converted in real time.',
      'feat.f4.title':    'Subscriptions',
      'feat.f4.sub':      'Detect and control recurring charges before they surprise you.',
      'feat.f5.title':    'Budgets',
      'feat.f5.sub':      'Set category limits with alerts as you approach the max.',
      'feat.f6.title':    'Advisors',
      'feat.f6.sub':      'Connect with a certified advisor for 1-on-1 financial review.',

      // Testimonials
      'test.badge':       'Testimonials',
      'test.title':       'Real people,<br class="d-none d-md-block"> real results.',

      // Pricing
      'price.badge':      'Plans',
      'price.title':      'Simple and transparent.',
      'price.sub':        'No surprises. Cancel anytime.',
      'price.free.name':  'Free',
      'price.free.desc':  'For people who are starting to get organised.',
      'price.free.cta':   'Create account',
      'price.pro.name':   'Pro',
      'price.pro.desc':   'For those who want maximum control.',
      'price.pro.cta':    'Start Pro',
      'price.pro.badge':  'Most popular',

      // FAQ
      'faq.badge':        'FAQ',
      'faq.title':        'Frequently asked questions.',
      'faq.q1':           'Is my financial data safe?',
      'faq.a1':           'Yes. We use AES-256 encryption at rest and TLS in transit. Your data is never shared with third parties.',
      'faq.q2':           'Can I import expenses from my bank?',
      'faq.a2':           'You can currently upload receipts via OCR or add expenses manually. Direct bank integration is on the Q3 roadmap.',
      'faq.q3':           "What's the difference between Free and Pro?",
      'faq.a3':           'Free includes up to 50 expenses/month and basic analytics. Pro unlocks unlimited expenses, advanced AI, subscriptions and personal advisory.',
      'faq.q4':           'Can I cancel at any time?',
      'faq.a4':           'Absolutely. No commitments, no penalties. Cancel from your profile in one click.',
      'faq.q5':           'Is there a mobile app?',
      'faq.a5':           'The mobile app is in active development. For now the web version is mobile-optimised.',

      // Lab section
      'lab.badge':        'Demo Labs',
      'lab.title':        'Try the platform live.',
      'lab.sub':          'Log in with a demo account and explore all the features.',

      // CTA
      'cta.title':        'Start today.<br>Your future self will thank you.',
      'cta.sub':          'No credit card · 5 minutes to set up · 100% secure',
      'cta.btn':          'Create free account',

      // Footer
      'footer.product':   'Product',
      'footer.resources': 'Resources',
      'footer.company':   'Company',
      'footer.legal':     'Legal',
      'footer.tagline':   'Financial clarity for everyone.',
      'footer.copy':      '© 2025 Klarity. All rights reserved.',

      // Login page
      'login.back':       '← Back to home',
      'login.title':      'Welcome to<br>Klarity',
      'login.tagline':    'Know where it goes.',
      'login.benefit1':   'Log expenses in seconds',
      'login.benefit2':   'Analyse your patterns with AI',
      'login.benefit3':   'Control your subscriptions',
      'login.benefit4':   'Connect with certified advisors',
      'login.tab.in':     'Log in',
      'login.tab.reg':    'Create account',
      'login.label.email': 'Email address',
      'login.label.pass':  'Password',
      'login.label.name':  'Full name',
      'login.btn.enter':   'Enter',
      'login.btn.create':  'Create account',
      'login.demo.title':  'Demo accounts',

      // Dashboard
      'dash.overview':    'Overview',
      'dash.expenses':    'Expenses',
      'dash.add':         'Add expense',
      'dash.ocr':         'Upload receipt',
      'dash.budgets':     'Budgets',
      'dash.advisor':     'AI Advisor',
      'dash.profile':     'Profile',
      'dash.logout':      'Log out',
    }
  };

  // ── Apply language ────────────────────────────────────────
  function applyLang(lang) {
    var dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // Active state on language buttons
    ['btnES', 'btnEN'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    var activeBtn = document.getElementById(lang === 'es' ? 'btnES' : 'btnEN');
    if (activeBtn) activeBtn.classList.add('active');

    document.documentElement.setAttribute('lang', lang === 'es' ? 'es' : 'en');
    localStorage.setItem(STORAGE_KEY, lang);

    if (window.klarityLang && typeof window.klarityLang.syncButtons === 'function') {
      window.klarityLang.syncButtons(document);
    }
  }

  // ── Public API ────────────────────────────────────────────
  window.setLang = function (lang) {
    if (window.klarityLang && typeof window.klarityLang.setLangAndNavigate === 'function') {
      window.klarityLang.setLangAndNavigate(lang);
      return;
    }
    applyLang(lang);
  };

  window.getLang = function () {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  };

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (window.klarityLang && typeof window.klarityLang.getLang === 'function') {
      var stored = window.klarityLang.getLang();
      localStorage.setItem(STORAGE_KEY, stored);
    }
    var saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    applyLang(saved);
  });
})();
