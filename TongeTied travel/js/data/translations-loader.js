const translationCache = new Map();
let allTranslationsCache = null;

async function getAllTranslations() {
  if (allTranslationsCache) return allTranslationsCache;

  const url = 'js/data/translations/all-translations.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);

  allTranslationsCache = await res.json();
  return allTranslationsCache;
}

window.loadTranslation = async function (langCode) {
  if (translationCache.has(langCode)) return translationCache.get(langCode);

  const all = await getAllTranslations();
  const dict = all?.[langCode] || all?.ru || all?.en || {};

  translationCache.set(langCode, dict);

  window.TRANSLATIONS = window.TRANSLATIONS || {};
  window.TRANSLATIONS[langCode] = dict;

  return dict;
};

window.preloadTranslations = async function (langs = ['ru', 'en']) {
  await Promise.all(langs.map((l) => window.loadTranslation(l)));
};

window.t = function (key) {
  const lang = localStorage.getItem('language') || 'ru';
  const dict = translationCache.get(lang) || window.TRANSLATIONS?.[lang] || {};
  const en = translationCache.get('en') || window.TRANSLATIONS?.en || {};
  return dict[key] || en[key] || key;
};

window.updateInterfaceLanguage = async function (langCode = null) {
  const lang = langCode || localStorage.getItem('language') || 'ru';
  const translations = await window.loadTranslation(lang);

  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('xml:lang', lang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = translations[key];
    if (val) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = translations[key];
    if (val) el.setAttribute('placeholder', val);
  });

  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
};
