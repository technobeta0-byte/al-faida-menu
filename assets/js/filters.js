import { getCurrentLang, getUiString } from './i18n.js';

/**
 * filters.js — شريط البحث فقط.
 * المميزات (حلال، طبيعي، كيتو، بدون صويا) تظهر كشارات جمالية
 * على كل عنصر، وليست فلاتر للبحث.
 */
export function renderFilters(data) {
  const container = document.getElementById('filters-section');
  const lang = getCurrentLang();
  container.innerHTML = '';

  // ─── Search Bar ───────────────────────────────────────────
  const searchWrap = document.createElement('div');
  searchWrap.className = 'search-wrap';

  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-icon';
  searchIcon.setAttribute('aria-hidden', 'true');
  searchIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.id = 'menu-search';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = getUiString(data.ui, 'search_placeholder', lang) || (lang === 'ar' ? 'ابحث في المنيو...' : 'Search menu...');

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'search-clear-btn';
  clearBtn.setAttribute('aria-label', lang === 'ar' ? 'مسح البحث' : 'Clear search');
  clearBtn.innerHTML = '&times;';
  clearBtn.style.display = 'none';

  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(clearBtn);
  container.appendChild(searchWrap);

  // ─── Event Listeners ──────────────────────────────────────
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
    applySearch(data);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
    applySearch(data);
  });
}

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function applySearch(data) {
  const query = normalize(document.getElementById('menu-search')?.value || '');

  document.querySelectorAll('.menu-item').forEach(el => {
    const id = el.dataset.id;
    const item = data.items.find(i => i.id === id);
    if (!item) return;

    let matches = true;
    if (query) {
      const ar = normalize(item.name.ar);
      const en = normalize(item.name.en);
      const ru = normalize(item.name.ru);
      const descAr = normalize(item.desc?.ar || '');
      const descEn = normalize(item.desc?.en || '');
      matches = ar.includes(query) || en.includes(query) || ru.includes(query)
             || descAr.includes(query) || descEn.includes(query);
    }

    el.style.display = matches ? '' : 'none';
  });

  // إخفاء الأقسام الفارغة
  document.querySelectorAll('.category').forEach(catEl => {
    const visible = catEl.querySelectorAll('.menu-item:not([style*="display: none"])');
    catEl.style.display = visible.length === 0 ? 'none' : '';
  });
}
