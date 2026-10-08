import { getCurrentLang, getText, getUiString } from './i18n.js';
import { setupPlateView } from './plate-view.js';
import { createItemOrderControl, updateOrderUi } from './order.js';

/**
 * render.js — Al-Faida Premium Smoked Paper Menu Renderer
 */
export function renderApp(data) {
  const lang = getCurrentLang();
  renderHeader(data, lang);
  renderStrip(data, lang);
  renderMenu(data, lang);
  renderB2B(data, lang);
  renderPartners(data, lang);
  renderColophon(data, lang);
  setupWhatsAppFloat(data);
  setupPlateView();
  updateOrderUi();
}

/* ─── Helper: read settings ──────────────────────────────────── */
function getSetting(data, key) {
  const s = data.settings || {};
  return s[key] !== undefined ? s[key] : null;
}
function getSettingText(data, key, lang) {
  const val = getSetting(data, key);
  if (!val) return '';
  if (typeof val === 'object') return getText(val, lang);
  return val;
}

/* ─── 1. MASTHEAD & LOGO RENDERING ───────────────────────────── */
function renderHeader(data, lang) {
  const logoArea = document.getElementById('logo-area');
  if (!logoArea) return;
  logoArea.innerHTML = '';

  const s = data.settings || {};

  // Multiple candidates to guarantee the logo renders without failure
  const candidates = [
    './assets/brand/logo.png',
    '/assets/brand/logo.png',
    'assets/brand/logo.png',
    './images/logo.png',
    '/images/logo.png',
    'images/logo.png',
    s.logo_url,
    s.logo_drive_direct,
    s.logo_file && s.logo_file.startsWith('http') ? toDirectImg(s.logo_file) : null,
    'https://lh3.googleusercontent.com/d/1OW514CcEpMw3sMovOZqygsCMQqO7o8M8'
  ].filter(Boolean);

  let candidateIdx = 0;

  // Ornamental Vintage Frame with deep smoked-edge burn effect
  const frame = document.createElement('div');
  frame.className = 'logo-frame stamp-in';

  // Inner smoked vignette burn overlay
  const vignette = document.createElement('div');
  vignette.className = 'logo-smoked-vignette';
  frame.appendChild(vignette);

  const img = document.createElement('img');
  img.alt = getText(s.brand_name, lang) || 'Al-Faida Logo';
  img.className = 'logo-img';

  function tryNextCandidate() {
    if (candidateIdx < candidates.length) {
      const nextSrc = candidates[candidateIdx++];
      img.src = nextSrc;
    } else {
      // If all image attempts fail, fallback to ornamental letterpress text logo
      logoArea.innerHTML = '';
      makeTextLogo(logoArea, data, lang);
    }
  }

  img.onerror = tryNextCandidate;
  tryNextCandidate();

  frame.appendChild(img);
  logoArea.appendChild(frame);

  const taglineEl = document.getElementById('tagline');
  if (taglineEl) taglineEl.textContent = getText(s.tagline, lang);

  // Since badge intentionally hidden as requested
  const sinceBadge = document.getElementById('since-badge');
  if (sinceBadge) sinceBadge.style.display = 'none';

  // Active language in switcher
  document.querySelectorAll('#lang-switcher a').forEach(a => {
    a.classList.toggle('active', a.dataset.lang === lang);
  });
}

function makeTextLogo(container, data, lang) {
  const h1 = document.createElement('h1');
  h1.className = 'brand-text-logo stamp-in';
  h1.textContent = getText(data.settings?.brand_name, lang) || 'الفائدة';
  container.appendChild(h1);
}

function toDirectImg(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (url === '"' || url === '""') return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  return url;
}

/* ─── 2. CATEGORY STRIP NAVIGATION (Pure Visual Affordance) ─── */
let _categoryObserver = null;

function renderStrip(data, lang) {
  const strip = document.getElementById('contents-strip');
  if (!strip) return;
  strip.innerHTML = '';

  data.categories.forEach((cat, idx) => {
    const a = document.createElement('a');
    a.href = `#cat-${cat.id}`;
    a.textContent = getText(cat.name, lang);
    a.className = 'strip-tab' + (idx === 0 ? ' active' : '');
    a.dataset.catId = cat.id;

    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(`cat-${cat.id}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        strip.querySelectorAll('.strip-tab').forEach(t => t.classList.remove('active'));
        a.classList.add('active');
      }
    });

    strip.appendChild(a);
    if (idx < data.categories.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'strip-sep';
      sep.textContent = '✦';
      strip.appendChild(sep);
    }
  });

  setupCategoryScrollSpy();
}

function setupCategoryScrollSpy() {
  if (_categoryObserver) _categoryObserver.disconnect();
  const strip = document.getElementById('contents-strip');
  if (!strip) return;

  _categoryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const catId = entry.target.id.replace('cat-', '');
        const escapedCatId = window.CSS && CSS.escape ? CSS.escape(catId) : catId.replace(/"/g, '\\"');
        const activeLink = strip.querySelector(`a[data-cat-id="${escapedCatId}"]`);
        if (activeLink) {
          strip.querySelectorAll('.strip-tab').forEach(a => a.classList.remove('active'));
          activeLink.classList.add('active');
          activeLink.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      }
    });
  }, { threshold: 0.25, rootMargin: '-70px 0px -40% 0px' });

  document.querySelectorAll('.category').forEach(cat => _categoryObserver.observe(cat));
}

/* ─── 3. MENU SECTIONS & VINTAGE DIVIDERS ───────────────────── */
function renderMenu(data, lang) {
  const container = document.getElementById('menu-container');
  if (!container) return;
  container.innerHTML = '';

  container.appendChild(renderGlobalFeatures(data, lang));

  data.categories.forEach((cat, catIdx) => {
    const catItems = data.items.filter(i => i.category_id === cat.id);
    if (!catItems.length) return;

    const section = document.createElement('section');
    section.className = 'category';
    section.id = `cat-${cat.id}`;
    section.style.setProperty('--cat-i', catIdx);

    // Visual Section Divider: Centered vintage flourish rule
    const divider = document.createElement('div');
    divider.className = 'category-divider';
    divider.innerHTML = `
      <span class="divider-rule"></span>
      <span class="divider-ornament">❦</span>
      <span class="divider-rule"></span>
    `;
    section.appendChild(divider);

    // Category Header
    const hdr = document.createElement('div');
    hdr.className = 'category-header';
    const title = document.createElement('h2');
    title.className = 'category-title ink-draw';
    title.textContent = getText(cat.name, lang);
    hdr.appendChild(title);

    if (lang !== 'ru' && cat.name?.ru) {
      const sub = document.createElement('div');
      sub.className = 'category-subtitle';
      sub.textContent = cat.name.ru;
      hdr.appendChild(sub);
    }
    section.appendChild(hdr);

    // Straight Category Representative Banner
    const defaultCatImages = {
      c_pieces: './images/c_pieces.jpg',
      c_salami: './images/c_salami.jpg',
      c_sausage: './images/c_sausage.jpg',
      c_franks: './images/c_franks.jpg',
      c_hotdog: './images/c_hotdog.jpg',
      c_boiled_pieces: './images/c_boiled_pieces.jpg',
      c_fish: './images/c_fish.jpg',
      c_frozen: './images/c_frozen.jpg',
      c_sausage_shish: './images/c_sausage_shish.jpg',
      'c_sausage Shish': './images/c_sausage_shish.jpg',
      c_smoked: './images/c_pieces.jpg',
      c_luncheon: './images/c_luncheon.jpg',
      c_specialty: './images/c_specialty.jpg'
    };

    const cleanDirect = toDirectImg(cat.image);
    const safeCatId = cat.id.replace(/\s+/g, '_');
    const shortId = safeCatId.replace('c_', '');
    const bannerCandidates = [
      cleanDirect && (cleanDirect.startsWith('http') || cleanDirect.startsWith('/') || cleanDirect.startsWith('.')) ? cleanDirect : (cleanDirect ? `./images/${cleanDirect}` : null),
      `./images/${cat.id}.webp`,
      `./images/${cat.id}.jpg`,
      `./images/${cat.id}.png`,
      `./images/${safeCatId}.webp`,
      `./images/${safeCatId}.jpg`,
      `./images/${safeCatId}.png`,
      `./images/${shortId}.webp`,
      `./images/${shortId}.jpg`,
      `./images/${shortId}.png`,
      defaultCatImages[cat.id],
      defaultCatImages[safeCatId]
    ].filter(Boolean);

    const bannerWrap = document.createElement('div');
    bannerWrap.className = 'category-banner-wrap';
    const bannerImg = document.createElement('img');
    bannerImg.className = 'category-banner-img';
    bannerImg.alt = getText(cat.name, lang);
    bannerImg.loading = 'lazy';

    let cIdx = 0;
    function tryNextBanner() {
      if (cIdx < bannerCandidates.length) {
        bannerImg.src = bannerCandidates[cIdx++];
      }
    }
    bannerImg.onerror = tryNextBanner;
    tryNextBanner();

    bannerWrap.appendChild(bannerImg);
    section.appendChild(bannerWrap);

    // Price Header — Strict Half-kg Standard
    const ph = document.createElement('div');
    ph.className = 'price-header';
    const phSpan = document.createElement('span');
    const halfHdrs = {
      ar: 'السعر / نصف كيلو (½ كجم)',
      en: 'Price / Half kg (½ kg)',
      ru: 'Цена / 0.5 кг'
    };
    phSpan.textContent = halfHdrs[lang] || halfHdrs.ar;
    ph.appendChild(phSpan);
    section.appendChild(ph);

    catItems.forEach((item, itemIdx) => {
      const el = buildItem(item, data, lang, itemIdx);
      section.appendChild(el);
    });

    container.appendChild(section);
  });
}

function buildItem(item, data, lang, idx) {
  const el = document.createElement('div');
  el.className = 'menu-item' + (!item.available ? ' unavailable' : '');
  el.dataset.id = item.id;
  el.style.setProperty('--item-i', idx);
  el.classList.add('item-enter');

  /* Primary line */
  const primary = document.createElement('div');
  primary.className = 'menu-line-primary';

  // Individual item thumbnail removed for clean classic paper menu appearance

  const nameWrap = document.createElement('div');
  nameWrap.className = 'item-name-wrap';
  const nameText = document.createElement('span');
  nameText.className = 'item-name-text';
  nameText.textContent = getText(item.name, lang);
  nameWrap.appendChild(nameText);

  if (item.badge) {
    const badge = document.createElement('span');
    badge.className = `badge-stamp badge-${item.badge}`;
    badge.textContent = getUiString(data.ui, `badge_${item.badge}`, lang) || item.badge;
    nameWrap.appendChild(badge);
  }
  if (!item.available) {
    const u = document.createElement('span');
    u.className = 'unavailable-tag';
    u.textContent = getUiString(data.ui, 'unavailable', lang) || 'غير متاح حاليًا';
    nameWrap.appendChild(u);
  }
  primary.appendChild(nameWrap);

  /* Dotted leader */
  const leader = document.createElement('div');
  leader.className = 'item-leaders';
  primary.appendChild(leader);

  /* Price — وحدة نصف كيلو القياسية */
  const priceWrap = document.createElement('div');
  priceWrap.className = 'item-price-single';

  const half = item.price_half_kg;
  const kg   = item.price_per_kg;
  const oldKg = item.old_price_per_kg;

  if (half && !isNaN(Number(half))) {
    if (oldKg) {
      priceWrap.innerHTML = `<span class="price-old">${oldKg}</span> ${half}`;
    } else {
      priceWrap.textContent = half;
    }
  } else if (kg && !isNaN(Number(kg))) {
    const computedHalf = Math.round(Number(kg) / 2);
    if (oldKg && !isNaN(Number(oldKg))) {
      const computedOldHalf = Math.round(Number(oldKg) / 2);
      priceWrap.innerHTML = `<span class="price-old">${computedOldHalf}</span> ${computedHalf}`;
    } else {
      priceWrap.textContent = computedHalf;
    }
  } else if (half || kg) {
    priceWrap.textContent = half || kg;
  } else {
    priceWrap.classList.add('price-soon');
    priceWrap.textContent = getUiString(data.ui, 'price_soon', lang) || 'قريبًا';
  }
  primary.appendChild(priceWrap);

  /* Order Action Button */
  const orderCtrl = createItemOrderControl(item, data, lang);
  primary.appendChild(orderCtrl);

  el.appendChild(primary);

  /* Secondary line */
  const sec = document.createElement('div');
  sec.className = 'menu-line-secondary';

  const altName = lang !== 'ru' ? item.name?.ru : item.name?.en;
  if (altName) {
    const s = document.createElement('span');
    s.className = 'item-alt-name';
    s.textContent = `«${altName}»`;
    sec.appendChild(s);
  }
  const desc = getText(item.desc, lang);
  if (desc) {
    const s = document.createElement('span');
    s.className = 'item-desc';
    s.textContent = desc;
    sec.appendChild(s);
  }

  if (sec.children.length) el.appendChild(sec);
  return el;
}

/* ─── Feature Badges ─────────────────────────────────────────── */
const FEATURES = [
  { key: 'halal',    icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.37 0 2.68-.28 3.86-.78-4.52-1.07-7.86-5.12-7.86-9.98 0-4.85 3.34-8.9 7.86-9.97C14.68 2.28 13.37 2 12 2z"/></svg>', uiKey: 'filter_halal'    },
  { key: 'natural',  icon: '<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.96.3 1.34.3c3.02 0 6-2.01 6-5.01c0-1.01-.52-2.01-1.3-3c-.11-.14-.23-.28-.35-.42C14.77 10.37 15.93 9.4 17 8zM6.9 17.58c-.64-1.14-.9-2.35-.9-3.58c0-3 1.95-6.19 6-8.24C12 7.76 10 11.02 6.9 17.58z"/></svg>', uiKey: 'filter_natural'  },
  { key: 'soy_free', icon: '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',  uiKey: 'filter_soy_free' },
  { key: 'keto',     icon: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>', uiKey: 'filter_keto'     },
];

function renderGlobalFeatures(data, lang) {
  const wrap = document.createElement('div');
  wrap.className = 'global-features-strip';
  
  FEATURES.forEach(f => {
    const b = document.createElement('div');
    b.className = 'feature-item';
    
    const iconWrap = document.createElement('div');
    iconWrap.className = 'feature-icon';
    iconWrap.innerHTML = f.icon;
    
    const label = document.createElement('div');
    label.className = 'feature-label';
    label.textContent = getUiString(data.ui, f.uiKey, lang) || f.key;
    
    b.appendChild(iconWrap);
    b.appendChild(label);
    b.title = label.textContent;
    wrap.appendChild(b);
  });
  
  return wrap;
}

/* ─── B2B ────────────────────────────────────────────────────── */
function renderB2B(data, lang) {
  const container = document.getElementById('b2b-section');
  if (!container) return;
  container.innerHTML = '';
  
  let title = getUiString(data.ui, 'b2b_title', lang);
  if (!title) {
    title = lang === 'en' ? 'Wholesale & B2B Supply' : (lang === 'ru' ? 'Оптовые поставки' : 'طلبات الجملة والتوريد');
  }
  
  let text = getUiString(data.ui, 'b2b_text', lang);
  if (!text || text.includes('Run a restaurant')) {
    text = lang === 'en' 
      ? 'Do you run a restaurant, café, or hotel? Contact us for wholesale supply.' 
      : (lang === 'ru' ? 'Владеете рестораном, кафе или отелем? Свяжитесь с нами для оптовых поставок.' 
      : 'هل تدير مطعماً، مقهى أو فندقاً؟ تواصل معنا لطلبات التوريد بأسعار الجملة.');
  }

  if (!title && !text) { container.style.display = 'none'; return; }
  container.style.display = '';
  container.className = 'b2b-frame';
  const inner = document.createElement('div');
  inner.className = 'b2b-inner';
  if (title) { const h = document.createElement('h3'); h.textContent = title; inner.appendChild(h); }
  if (text)  { const p = document.createElement('p');  p.textContent = text;  inner.appendChild(p); }
  const cta = getUiString(data.ui, 'b2b_cta', lang);
  const wa  = data.settings?.whatsapp?.[0] || data.settings?.whatsapp_1;
  if (cta && wa) {
    const msg = getUiString(data.ui, 'whatsapp_msg_ar', lang) || '';
    const a = document.createElement('a');
    a.href = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
    a.className = 'cta-btn'; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = cta;
    inner.appendChild(a);
  }
  container.appendChild(inner);
}

/* ─── Partners & Distributors (Luxury Infinite Marquee) ──────── */
function createPartnerPill(p, lang) {
  const isLink = Boolean(p.url);
  const pill = document.createElement(isLink ? 'a' : 'div');
  if (isLink) {
    pill.href = p.url;
    pill.target = '_blank';
    pill.rel = 'noopener';
  }
  pill.className = 'partner-pill' + (isLink ? ' partner-pill-link' : '');
  pill.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const nameText = getText(p.name, lang) || p.id;
  const branchText = getText(p.branches, lang) || '';

  if (p.logo) {
    const wrap = document.createElement('div');
    wrap.className = 'partner-pill-logo-wrap';
    const img = document.createElement('img');
    img.src = toDirectImg(p.logo);
    img.alt = nameText;
    img.className = 'partner-pill-logo';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      wrap.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'partner-pill-fallback';
      fallback.textContent = (nameText[0] || '✦').toUpperCase();
      pill.prepend(fallback);
    };
    wrap.appendChild(img);
    pill.appendChild(wrap);
  }

  const info = document.createElement('div');
  info.className = 'partner-pill-info';

  const nameEl = document.createElement('span');
  nameEl.className = 'partner-pill-name';
  nameEl.textContent = nameText;
  info.appendChild(nameEl);

  if (branchText) {
    const brEl = document.createElement('span');
    brEl.className = 'partner-pill-branch';
    brEl.textContent = branchText;
    info.appendChild(brEl);
  }

  pill.appendChild(info);
  return pill;
}

function setupMarqueeScroller(viewport, track, container) {
  let isHovered = false;
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let hasDragged = false;
  let rafId = null;
  const speed = 0.75; // smooth luxury speed

  const getHalfWidth = () => {
    const g1 = track.querySelector('.partners-marquee-group');
    return g1 ? g1.offsetWidth : (track.offsetWidth / 2);
  };

  const step = () => {
    if (!isHovered && !isDown) {
      viewport.scrollLeft += speed;
      const halfWidth = getHalfWidth();
      if (halfWidth > 0) {
        if (viewport.scrollLeft >= halfWidth) {
          viewport.scrollLeft -= halfWidth;
        } else if (viewport.scrollLeft <= 0) {
          viewport.scrollLeft += halfWidth;
        }
      }
    }
    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);

  // Mouse hover detection (pause on hover)
  viewport.addEventListener('mouseenter', () => { isHovered = true; });
  viewport.addEventListener('mouseleave', () => {
    isHovered = false;
    isDown = false;
    viewport.classList.remove('is-dragging');
  });

  // Dragging support (Mouse & Touch)
  const onPointerDown = (e) => {
    isDown = true;
    hasDragged = false;
    viewport.classList.add('is-dragging');
    const pageX = e.pageX ?? (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
    startX = pageX;
    startScrollLeft = viewport.scrollLeft;
  };

  const onPointerMove = (e) => {
    if (!isDown) return;
    const pageX = e.pageX ?? (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
    const walk = (pageX - startX) * 1.35;
    if (Math.abs(walk) > 4) {
      hasDragged = true;
    }
    viewport.scrollLeft = startScrollLeft - walk;
    const halfWidth = getHalfWidth();
    if (halfWidth > 0) {
      if (viewport.scrollLeft >= halfWidth) {
        viewport.scrollLeft -= halfWidth;
        startScrollLeft -= halfWidth;
      } else if (viewport.scrollLeft < 0) {
        viewport.scrollLeft += halfWidth;
        startScrollLeft += halfWidth;
      }
    }
  };

  const onPointerUp = () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove('is-dragging');
  };

  viewport.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch support for mobile devices
  viewport.addEventListener('touchstart', (e) => {
    isHovered = true;
    onPointerDown(e);
  }, { passive: true });

  viewport.addEventListener('touchmove', onPointerMove, { passive: true });

  viewport.addEventListener('touchend', () => {
    onPointerUp();
    setTimeout(() => { isHovered = false; }, 1000);
  });

  // Prevent link navigation if user dragged
  viewport.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);

  // Cleanup handler for language changes
  container._marqueeCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
  };
}

function renderPartners(data, lang) {
  const container = document.getElementById('partners-section');
  if (!container) return;

  if (container._marqueeCleanup) {
    container._marqueeCleanup();
    container._marqueeCleanup = null;
  }

  container.innerHTML = '';

  const rawPartners = data.partners || [];
  // Filter active partners: must have id, and visible must NOT be false / 'FALSE'
  const activePartners = rawPartners.filter(p => {
    if (!p.id) return false;
    if (p.visible === false || p.visible === 'FALSE') return false;
    if (p.show === false || p.show === 'FALSE') return false;
    return true;
  });

  // If there are NO active partners (or none is TRUE), completely hide the frame
  if (activePartners.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';
  container.className = 'partners-section';

  const title = lang === 'en' 
    ? 'Authorized Distributors' 
    : (lang === 'ru' ? 'Авторизованные дистрибьюторы' : 'موزعونا المعتمدون');
  const subtitle = lang === 'en'
    ? 'Find authentic Al-Faida products at premium stores and partner outlets'
    : (lang === 'ru' ? 'Вы можете найти продукцию «Фаида» в магазинах наших партнёров' : 'تجدون منتجات الفائدة الفاخرة لدى كبرى المتاجر ومنافذ التوزيع المعتمدة');

  // Header
  const header = document.createElement('div');
  header.className = 'partners-header';

  const h = document.createElement('h3');
  h.className = 'partners-title';
  h.innerHTML = `<span class="partners-ornament">✦</span> ${title} <span class="partners-ornament">✦</span>`;
  header.appendChild(h);

  const sub = document.createElement('p');
  sub.className = 'partners-subtitle';
  sub.textContent = subtitle;
  header.appendChild(sub);

  container.appendChild(header);

  // Marquee Viewport & Track
  const viewport = document.createElement('div');
  viewport.className = 'partners-marquee-viewport';
  viewport.setAttribute('dir', 'ltr');

  const track = document.createElement('div');
  track.className = 'partners-marquee-track';
  track.setAttribute('dir', 'ltr');

  // Build a seamless infinite loop: ensure minimum 6 items per group
  let baseSet = [...activePartners];
  while (baseSet.length < 6) {
    baseSet = baseSet.concat(activePartners);
  }

  // Two identical groups for seamless, infinite wrap-around
  const group1 = document.createElement('div');
  group1.className = 'partners-marquee-group group-1';
  baseSet.forEach(p => group1.appendChild(createPartnerPill(p, lang)));

  const group2 = document.createElement('div');
  group2.className = 'partners-marquee-group group-2';
  group2.setAttribute('aria-hidden', 'true');
  baseSet.forEach(p => group2.appendChild(createPartnerPill(p, lang)));

  track.appendChild(group1);
  track.appendChild(group2);
  viewport.appendChild(track);
  container.appendChild(viewport);

  setupMarqueeScroller(viewport, track, container);
}

/* ─── 4. COLOPHON, SOCIAL MEDIA & ATTRIBUTION ────────────────── */
function renderColophon(data, lang) {
  const addr = document.getElementById('address-block');
  if (addr) {
    addr.innerHTML = '';
    const locTitle = getUiString(data.ui, 'location_title', lang);
    if (locTitle) {
      const d = document.createElement('div');
      d.className = 'footer-section-title'; d.textContent = locTitle;
      addr.appendChild(d);
    }
    const address = getSettingText(data, 'address', lang);
    if (address) {
      const p = document.createElement('p');
      p.className = 'footer-address'; p.textContent = address;
      addr.appendChild(p);
    }
    const hours = getSettingText(data, 'hours', lang);
    if (hours && hours !== '"') {
      const p = document.createElement('p');
      p.className = 'footer-hours';
      p.textContent = `${getUiString(data.ui, 'hours_title', lang)}: ${hours}`;
      addr.appendChild(p);
    }
    const mapsUrl = getSetting(data, 'maps_url');
    if (mapsUrl) {
      const a = document.createElement('a');
      a.href = mapsUrl; a.target = '_blank'; a.rel = 'noopener';
      a.className = 'map-link';
      a.textContent = `📍 ${getUiString(data.ui, 'open_map', lang)}`;
      addr.appendChild(a);
    }
  }

  // Social Links Section - Bulletproof rendering of all active platforms
  const socialBlock = document.getElementById('social-links');
  if (socialBlock) {
    socialBlock.innerHTML = '';
    const rawSocial = data.social || [];
    if (rawSocial.length > 0) {
      const buildSocialGroup = (title, items, groupType) => {
        if (!items.length) return;
        const groupWrap = document.createElement('div');
        groupWrap.className = `social-group social-group-${groupType}`;

        const groupTitle = document.createElement('h4');
        groupTitle.className = 'social-cta';
        groupTitle.innerHTML = title;
        groupWrap.appendChild(groupTitle);

        const row = document.createElement('div');
        row.className = 'social-row';
        items.forEach(s => {
          const isLink = Boolean(s.url);
          const el = document.createElement(isLink ? 'a' : 'div');
          if (isLink) {
            el.href = s.url;
            el.target = '_blank';
            el.rel = 'noopener';
            if (s.url.includes('wa.me') || s.type === 'whatsapp') {
              el.addEventListener('click', () => {
                try {
                  if (typeof window.fbq === 'function') {
                    window.fbq('track', 'Contact', { content_name: s.id || 'WhatsApp Social Link' });
                  }
                } catch (e) {}
              });
            }
          }
          el.className = `social-link social-${groupType}` + (!isLink ? ' social-no-link' : '');
          
          let iconHtml = getSocialIcon(s);
          if (groupType === 'community') {
            // Distinct community / group badge indicator
            iconHtml += `<span class="community-indicator" title="مجتمع / جروب">👥</span>`;
          }
          el.innerHTML = iconHtml;

          const label = getText(s.name, lang) || s.id;
          el.title = isLink ? label : `${label} (${lang === 'ar' ? 'قريبًا' : (lang === 'ru' ? 'Скоро' : 'Coming soon')})`;
          el.setAttribute('aria-label', label);
          row.appendChild(el);
        });
        groupWrap.appendChild(row);
        socialBlock.appendChild(groupWrap);
      };

      // Strict and robust categorization for Community, Contact Us, and Follow Us
      const isCommunity = (s) => {
        const t = String(s.type || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
        const id = String(s.id || '').toLowerCase();
        const icon = String(s.icon || '').toLowerCase();
        return t === 'community' || t === 'group' || id.includes('group') || id.includes('community') || icon.includes('user') || icon === 'users';
      };

      const isContact = (s) => {
        const t = String(s.type || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
        const id = String(s.id || '').toLowerCase();
        return t === 'contact' || t === 'contactus' || t === 'chat' || id.startsWith('wa_business') || id === 'wa_business_1' || id === 'wa_business_2' || id.includes('phone') || id.includes('call');
      };

      const community = rawSocial.filter(s => isCommunity(s));
      const contact = rawSocial.filter(s => !community.includes(s) && isContact(s));
      const follow = rawSocial.filter(s => !community.includes(s) && !contact.includes(s));

      const tCommunity = lang === 'en' ? '👥 Our Community' : (lang === 'ru' ? '👥 Наше сообщество' : '👥 مجتمعنا');
      const tFollow = lang === 'en' ? '📢 Follow Us' : (lang === 'ru' ? '📢 Следите за нами' : '📢 تابعنا');
      const tContact = lang === 'en' ? '💬 Contact Us' : (lang === 'ru' ? '💬 Связаться с нами' : '💬 تواصل معنا');

      buildSocialGroup(tCommunity, community, 'community');
      buildSocialGroup(tFollow, follow, 'follow');
      buildSocialGroup(tContact, contact, 'contact');
    }
  }

  // Footer attribution styling: Trilingual seamless format
  const rightsText = document.getElementById('footer-rights');
  if (rightsText) {
    if (lang === 'ar') {
      rightsText.innerHTML = '© 2026 الفائدة — جميع الحقوق محفوظة<br><span class="powered-by">Powered by TechnoBeta</span>';
    } else if (lang === 'ru') {
      rightsText.innerHTML = '© 2026 Фаида — Все права защищены<br><span class="powered-by">Powered by TechnoBeta</span>';
    } else {
      rightsText.innerHTML = '© 2026 Al-Faida — All rights reserved<br><span class="powered-by">Powered by TechnoBeta</span>';
    }
  }
}

/* ─── 5. OFFICIAL BRAND VECTOR SVG ICONS ───────────────────────── */
export function getSocialIcon(item) {
  const key = String(item.icon || item.id || item.type || '').toLowerCase();

  // Instagram
  if (key.includes('instagram')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  }

  // Facebook Group / Community / Users
  if (key.includes('group') || key.includes('users') || key.includes('community')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;
  }

  // Facebook Page
  if (key.includes('facebook')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
  }

  // WhatsApp
  if (key.includes('whatsapp') || key.includes('wa_')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;
  }

  // Telegram
  if (key.includes('telegram')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>`;
  }

  // TikTok
  if (key.includes('tiktok')) {
    return `<svg viewBox="0 0 448 512" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>`;
  }

  // Threads
  if (key.includes('threads')) {
    return `<svg viewBox="0 0 448 512" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8 29.2 14.1 50.6 35.2 61.8 61.4 15.7 36.5 17.2 95.8-30.3 143.2-36.2 36.2-86.6 54.3-146.4 54.3-64.4 0-117.8-21.4-158.4-63.5C22.6 390.6 0 338 0 274c0-67.7 22.8-121.2 67.9-158.9C108.6 81.2 163.5 62.7 227 62.7c33.1 0 63.8 6.5 91 19 28.5 13.2 51.6 32.2 68.6 56.4 20.1 28.6 28.5 63 24 100.8-2.6 21.6-11 40-24.7 53.6-13.6 13.5-31.5 20.5-51.5 20.5-22.3 0-40.4-8-52.6-23.2-6.5-8.1-10.9-18.4-12.8-29.6-4.5-25.9-11.8-49.4-21.5-69.6-5.4-11.2-12-21.8-19.4-31.4-1.9-2.5-3.9-5-6-7.3-17.5-19.5-43-30.8-69.5-30.8-46.7 0-84.6 37.9-84.6 84.6 0 46.7 37.9 84.6 84.6 84.6 21.4 0 41.5-8.2 57.1-23.1 7.2-6.8 13.3-14.7 18.2-23.3l1.8 2.2c13.7 17.4 33.3 26.7 54.2 26.7 30 0 55.6-15.6 72-43.9 11.2-19.2 17.6-43 18.6-69.6 .9-25.7-.3-52.9-2.7-71.1-2.2-16.7-7-31.2-13.8-43-15-26.3-39.6-43.9-69.9-50.6-28.5-6.3-59.5-3.3-84.6 8.3-21.9 10.1-40.8 25.5-54.8 44.7-18.6 25.3-28.1 55.8-28.1 89.8 0 35.8 10.5 68.3 30.5 94.7 20 26.3 48.3 40.6 82.2 40.6 42.1 0 77.2-18 101.4-52.1 .5-.8 1.1-1.5 1.6-2.3zm-104.5-98.8c-18.7 0-33.9 15.2-33.9 33.9 0 18.7 15.2 33.9 33.9 33.9 18.7 0 33.9-15.2 33.9-33.9 0-18.7-15.2-33.9-33.9-33.9z"/></svg>`;
  }

  // YouTube
  if (key.includes('youtube')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
  }

  // LinkedIn
  if (key.includes('linkedin')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
  }

  // X / Twitter
  if (key === 'x' || key.includes('twitter')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  }

  // Map / Location
  if (key.includes('location') || key.includes('map')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 4.5 12 4.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`;
  }

  // Pinterest
  if (key.includes('pinterest')) {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.537.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>`;
  }

  // Fallback Chat
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.14 2 11.25c0 2.96 1.545 5.59 3.924 7.288L4 22l3.864-1.897C9.176 20.686 10.551 21 12 21c5.523 0 10-4.14 10-9.25S17.523 2 12 2z"/></svg>`;
}

/* ─── WhatsApp Float ─────────────────────────────────────────── */
export function setupWhatsAppFloat(data) {
  const btn = document.getElementById('whatsapp-float');
  if (!btn) return;
  const chat = (data.social || []).find(s => s.type === 'chat' && s.url);
  const wa   = data.settings?.whatsapp?.[0] || data.settings?.whatsapp_1;
  if (chat?.url) {
    btn.href = chat.url; btn.style.display = 'flex';
  } else if (wa) {
    btn.href = `https://wa.me/${wa}`; btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }

  // Meta Pixel tracking: Contact event
  if (!btn.dataset.pixelBound) {
    btn.dataset.pixelBound = 'true';
    btn.addEventListener('click', () => {
      try {
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Contact', {
            content_name: 'WhatsApp Float Chat'
          });
        }
      } catch (e) {}
    });
  }
}
