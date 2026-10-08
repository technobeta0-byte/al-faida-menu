import { fetchMenuData } from './data.js';
import { initLanguage, applyLanguage, getCurrentLang } from './i18n.js';
import { renderApp } from './render.js';
import { renderFilters } from './filters.js';
import { initOrderSystem, updateOrderUi } from './order.js';

let appData = null;

/* ─── Theme (dark / light) ───────────────────────────────────── */
const THEME_KEY = 'alfaida-theme';
const THEME_LABELS = {
  dark:  { ar: 'الوضع الفاتح', en: 'Light mode', ru: 'Светлая тема' },
  light: { ar: 'الوضع الداكن', en: 'Dark mode',  ru: 'Тёмная тема'  },
};

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function updateThemeUi() {
  const theme = currentTheme();
  const lang = getCurrentLang() || 'ar';
  const label = document.getElementById('theme-toggle-label');
  if (label) label.textContent = THEME_LABELS[theme][lang] || THEME_LABELS[theme].en;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#E6D6B5' : '#24170f');
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    updateThemeUi();
  });
  updateThemeUi();
}

/* ─── Bootstrap ──────────────────────────────────────────────── */
async function bootstrap() {
  const data = await fetchMenuData();

  if (!data) {
    document.getElementById('loading').innerHTML = `
      <div style="text-align:center;padding:3rem;font-family:Cairo,sans-serif;">
        <p style="font-size:1.1rem;">تعذّر تحميل المنيو</p>
        <p style="font-size:0.85rem;opacity:0.7;margin-top:.5rem;">تحقق من اتصالك بالإنترنت</p>
        <button onclick="location.reload()"
          style="margin-top:1.25rem;padding:.55rem 1.5rem;background:#A3281A;color:#fff;border:none;
                 border-radius:4px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.95rem;">
          إعادة المحاولة
        </button>
      </div>`;
    return;
  }

  appData = data;
  initLanguage(data.settings.default_language || 'ar');

  document.getElementById('loading').style.display = 'none';
  const content = document.getElementById('content');
  content.style.display = 'block';
  requestAnimationFrame(() => content.classList.add('content-visible'));

  renderApp(data);
  renderFilters(data);
  initOrderSystem(data);
  setupThemeToggle();

  document.querySelectorAll('#lang-switcher a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      applyLanguage(e.target.dataset.lang);
      renderApp(appData);
      renderFilters(appData);
      updateOrderUi();
      updateThemeUi();
    });
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
