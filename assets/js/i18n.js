export const LANGS = ['ar', 'en', 'ru'];
let currentLang = 'ar';

export function initLanguage(defaultLang = 'ar') {
  let langQuery = null;
  let pathLang = null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    langQuery = urlParams.get('lang');
    pathLang = window.location.pathname.substring(1, 3);
  } catch (_) {}
  
  let savedLang = null;
  try {
    savedLang = localStorage.getItem('lang');
  } catch (_) {}

  let navLang = 'ar';
  try {
    navLang = (navigator.language || '').slice(0, 2);
  } catch (_) {}
  
  const candidate = langQuery || pathLang || savedLang || navLang || defaultLang;
  currentLang = LANGS.includes(candidate) ? candidate : defaultLang;
  
  applyLanguage(currentLang);
}

export function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  try {
    localStorage.setItem('lang', lang);
  } catch (_) {}
}

export function getCurrentLang() {
  return currentLang;
}

export function getText(obj, lang = currentLang) {
  if (!obj) return '';
  return obj[lang] || obj['en'] || obj['ar'] || '';
}

export function getUiString(uiObj, key, lang = currentLang) {
  if (!uiObj[key]) return key; // fallback to key name
  return getText(uiObj[key], lang);
}
