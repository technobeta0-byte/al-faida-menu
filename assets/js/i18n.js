export const LANGS = ['ar', 'en', 'ru'];
let currentLang = 'ar';

export function initLanguage(defaultLang = 'ar') {
  const urlParams = new URLSearchParams(window.location.search);
  const langQuery = urlParams.get('lang');
  const pathLang = window.location.pathname.substring(1, 3); // simplistic for /ar
  
  const savedLang = localStorage.getItem('lang');
  const navLang = navigator.language.slice(0, 2);
  
  const candidate = langQuery || pathLang || savedLang || navLang || defaultLang;
  currentLang = LANGS.includes(candidate) ? candidate : defaultLang;
  
  applyLanguage(currentLang);
}

export function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lang);
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
