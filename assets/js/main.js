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
let isBootstrapping = false;

async function bootstrap() {
  if (isBootstrapping) return;
  isBootstrapping = true;

  // مؤقت أمان إضافي للحماية من أي تعليق في شبكة الهاتف
  const watchdog = setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
      console.warn('Watchdog: Loading timed out, showing retry UI.');
      loading.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1.5rem;font-family:Cairo,sans-serif;color:var(--text,#fff);">
          <p style="font-size:1.15rem;font-weight:700;">تعذّر تحميل المنيو</p>
          <p style="font-size:0.85rem;opacity:0.75;margin-top:.5rem;">الاتصال بالإنترنت ضعيف أو بطيء</p>
          <button onclick="location.reload()"
            style="margin-top:1.25rem;padding:.6rem 1.8rem;background:#A3281A;color:#fff;border:none;
                   border-radius:6px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.95rem;font-weight:600;">
            إعادة المحاولة
          </button>
        </div>`;
    }
  }, 6500);

  try {
    const data = await fetchMenuData();

    if (!data) {
      clearTimeout(watchdog);
      const loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML = `
          <div style="text-align:center;padding:3rem 1.5rem;font-family:Cairo,sans-serif;color:var(--text,#fff);">
            <p style="font-size:1.1rem;font-weight:700;">تعذّر تحميل المنيو</p>
            <p style="font-size:0.85rem;opacity:0.7;margin-top:.5rem;">تحقق من اتصالك بالإنترنت</p>
            <button onclick="location.reload()"
              style="margin-top:1.25rem;padding:.55rem 1.5rem;background:#A3281A;color:#fff;border:none;
                     border-radius:4px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.95rem;">
              إعادة المحاولة
            </button>
          </div>`;
      }
      return;
    }

    appData = data;
    try {
      initLanguage(data.settings?.default_language || 'ar');
    } catch (e) {
      console.warn('initLanguage failed:', e);
    }

    // إخفاء شاشة التحميل وإظهار المحتوى فوراً
    clearTimeout(watchdog);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    const content = document.getElementById('content');
    if (content) {
      content.style.display = 'block';
      requestAnimationFrame(() => content.classList.add('content-visible'));
    }

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
  } catch (err) {
    clearTimeout(watchdog);
    console.error('Bootstrap error:', err);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1.5rem;font-family:Cairo,sans-serif;color:var(--text,#fff);">
          <p style="font-size:1.1rem;font-weight:700;">تعذّر تحميل المنيو</p>
          <p style="font-size:0.85rem;opacity:0.7;margin-top:.5rem;">حدث خطأ أثناء قراءة البيانات</p>
          <button onclick="location.reload()"
            style="margin-top:1.25rem;padding:.55rem 1.5rem;background:#A3281A;color:#fff;border:none;
                   border-radius:4px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.95rem;">
            إعادة المحاولة
          </button>
        </div>`;
    }
  }
}

// تشغيل فوري بدون انتظار إذا كانت الصفحة جاهزة بالفعل (حالة قراءة QR على الموبايل)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
  window.addEventListener('load', bootstrap);
} else {
  bootstrap();
}
