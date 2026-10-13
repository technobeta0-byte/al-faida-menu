/**
 * order.js — نظام إدارة وتجميع الطلب وإرساله عبر واتساب لمنيو الفائدة
 * يدعم اللغات الثلاث (العربية، الإنجليزية، الروسية) بالكامل
 * إيصال حراري عتيق 58 مم POS مع وحدة نصف كيلو القياسية وزر حذف السلة
 */
import { getCurrentLang, getText } from './i18n.js';

const STORAGE_KEY = 'alfaida_cart_v2';
let cartState = {}; // { [itemId]: { id, nameObj, priceHalf, qty } }
let menuDataRef = null;

export const I18N = {
  ar: {
    add: 'أضف',
    itemsCount: (n) => {
      if (n === 1) return 'صنف واحد';
      if (n === 2) return 'صنفان';
      if (n >= 3 && n <= 10) return `${n} أصناف`;
      return `${n} صنف`;
    },
    checkout: 'إتمام الطلب',
    clear: 'مسح',
    clearConfirm: 'هل تريد تفريغ سلة الطلب بالكامل؟',
    brandStars: '*** AL-FAIDA • الفائدة ***',
    brandTitle: 'الفائدة — لحوم مدخنة فاخرة',
    brandSub: 'وصفات روسية أصيلة • صُنعت في مصر',
    recNoPrefix: 'إيصال:',
    datePrefix: 'التاريخ:',
    noticeTabTitle: '⚠️ تنبيه الاستلام وتوافر الأصناف',
    itemsTabTitle: '🛒 تفاصيل الأصناف والطلب',
    customerTabTitle: '👤 بيانات المستلم للتواصل',
    pickupNoticeTitle: '⚠️ تنبيه الاستلام وتوافر الأصناف:',
    pickupNoticeText: 'الاستلام حاليًا من مقر الفرع مباشرةً (مدينة نصر) حسب توافر المنتجات في الفرع وقت الاستلام، لحين الإعلان عن توفر خدمة التوصيل للمنازل قريبًا.',
    colQty: 'الكمية',
    colItem: 'الصنف (½ كجم)',
    colPrice: 'المبلغ',
    emptyCart: 'سلة الطلب فارغة، يرجى اختيار أصناف من المنيو.',
    totalLabel: 'المجموع الكلي:',
    customerTag: '[ بيانات العميل / CUSTOMER ]',
    nameLabel: 'الاسم الكريم:',
    namePlaceholder: 'اكتب اسمك هنا...',
    phoneLabel: 'رقم الهاتف (اختياري):',
    phonePlaceholder: '010xxxxxxxx',
    notesLabel: 'العنوان أو أي ملاحظات:',
    notesPlaceholder: 'المنطقة أو أي تعليمات خاصة...',
    sendWhatsApp: 'إرسال الطلب عبر واتساب',
    nameRequired: 'يرجى كتابة الاسم الكريم لإتمام الطلب',
    unitHalf: 'نصف كيلو (½ كجم)',
    unitShort: '½ كجم',
    curr: 'ج.م',
    deleteItem: 'حذف',
    priceOnConfirm: 'يحدد مع الفرع',
    thanks: '*** شكراً لزيارتكم • THANK YOU ***',
    waHeader: '🥩 *طلب جديد من منيو الفائدة* 🥩',
    waName: '👤 *الاسم:*',
    waPhone: '📱 *الهاتف:*',
    waNotes: '📍 *العنوان / ملاحظات:*',
    waItemsTitle: '🛒 *الأصناف المطلوبة (جميع الأوزان بوحدة نصف كيلو):*',
    waTotal: '💰 *المجموع التقريبي:*',
    waTotalConfirm: '💰 *المجموع:* يحدد مع الفرع حسب الأوزان وتوافر الأصناف وقت الاستلام',
    waPickupNotice: '⚠️ *طريقة الاستلام:* استلام من مقر الفرع (مدينة نصر) — يخضع الطلب لتوافر المنتجات في الفرع وقت الاستلام.',
    waFooter: '_(تم إنشاء الطلب عبر المنيو الرقمي — alfaida.technobeta.co)_'
  },
  en: {
    add: 'Add',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
    checkout: 'Review Order',
    clear: 'Clear',
    clearConfirm: 'Are you sure you want to clear your entire order?',
    brandStars: '*** AL-FAIDA SMOKED DELI ***',
    brandTitle: 'Al-Faida — Premium Smoked Deli',
    brandSub: 'Authentic Russian Recipes • Crafted in Egypt',
    recNoPrefix: 'REC:',
    datePrefix: 'DATE:',
    noticeTabTitle: '⚠️ Pickup & Availability Notice',
    itemsTabTitle: '🛒 Ordered Items & Total',
    customerTabTitle: '👤 Customer Contact Details',
    pickupNoticeTitle: '⚠️ Branch Pickup & In-Store Availability:',
    pickupNoticeText: 'Orders are currently for pickup directly from our branch (Nasr City) subject to product availability in-store at the time of pickup, until delivery service is announced.',
    colQty: 'Qty',
    colItem: 'Item (½ kg)',
    colPrice: 'Amount',
    emptyCart: 'Your cart is empty, please select items from the menu.',
    totalLabel: 'Total Amount:',
    customerTag: '[ CUSTOMER DETAILS ]',
    nameLabel: 'Customer Name:',
    namePlaceholder: 'Enter your full name...',
    phoneLabel: 'Phone number (optional):',
    phonePlaceholder: 'e.g. 010xxxxxxxx',
    notesLabel: 'Address or Notes:',
    notesPlaceholder: 'Area or special instructions...',
    sendWhatsApp: 'Send Order via WhatsApp',
    nameRequired: 'Please enter your name to complete the order',
    unitHalf: 'Half kg (½ kg)',
    unitShort: '½ kg',
    curr: 'EGP',
    deleteItem: 'Remove',
    priceOnConfirm: 'Confirmed with branch',
    thanks: '*** THANK YOU FOR VISITING ***',
    waHeader: '🥩 *NEW ORDER — AL-FAIDA MENU* 🥩',
    waName: '👤 *Customer Name:*',
    waPhone: '📱 *Phone:*',
    waNotes: '📍 *Address / Notes:*',
    waItemsTitle: '🛒 *Ordered Items (All weights per ½ kg):*',
    waTotal: '💰 *Estimated Total:*',
    waTotalConfirm: '💰 *Total:* Confirmed with branch based on actual weights and availability at pickup',
    waPickupNotice: '⚠️ *Pickup Notice:* Pickup from our branch (Nasr City) — subject to product availability at the time of pickup.',
    waFooter: '_(Order created via Digital Menu — alfaida.technobeta.co)_'
  },
  ru: {
    add: 'Добавить',
    itemsCount: (n) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} товар`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} товара`;
      return `${n} товаров`;
    },
    checkout: 'Оформить',
    clear: 'Очистить',
    clearConfirm: 'Вы уверены, что хотите полностью очистить корзину?',
    brandStars: '*** ФАИДА • ДЕЛИКАТЕСЫ ***',
    brandTitle: 'Фаида — копчёные деликатесы',
    brandSub: 'Аутентичные русские рецепты • Сделано в Египте',
    recNoPrefix: 'ЧЕК:',
    datePrefix: 'ДАТА:',
    noticeTabTitle: '⚠️ Самовывоз и наличие товаров',
    itemsTabTitle: '🛒 Позиции заказа и сумма',
    customerTabTitle: '👤 Данные получателя',
    pickupNoticeTitle: '⚠️ Самовывоз и наличие товаров:',
    pickupNoticeText: 'В настоящее время самовывоз осуществляется из филиала (Наср-Сити) при наличии товара в филиале на момент получения, до запуска доставки.',
    colQty: 'Кол-во',
    colItem: 'Товар (0.5 кг)',
    colPrice: 'Сумма',
    emptyCart: 'Ваша корзина пуста, выберите товары из меню.',
    totalLabel: 'Итого к оплате:',
    customerTag: '[ ДАННЫЕ КЛИЕНТА ]',
    nameLabel: 'Ваше имя:',
    namePlaceholder: 'Введите ваше имя...',
    phoneLabel: 'Телефон (необязательно):',
    phonePlaceholder: 'Например, 010xxxxxxxx',
    notesLabel: 'Адрес или примечания:',
    notesPlaceholder: 'Район или особые пожелания...',
    sendWhatsApp: 'Отправить заказ в WhatsApp',
    nameRequired: 'Пожалуйста, введите ваше имя для оформления заказа',
    unitHalf: 'Полкило (0.5 кг)',
    unitShort: '0.5 кг',
    curr: 'EGP',
    deleteItem: 'Удалить',
    priceOnConfirm: 'Уточняется в филиале',
    thanks: '*** СПАСИБО ЗА ЗАКАЗ • THANK YOU ***',
    waHeader: '🥩 *НОВЫЙ ЗАКАЗ — МЕНЮ ФАИДА* 🥩',
    waName: '👤 *Имя клиента:*',
    waPhone: '📱 *Телефон:*',
    waNotes: '📍 *Адрес / Примечания:*',
    waItemsTitle: '🛒 *Заказанные позиции (все веса за полкило — 0.5 кг):*',
    waTotal: '💰 *Итого (прибл.):*',
    waTotalConfirm: '💰 *Итого:* Уточняется в филиале в зависимости от фактического веса и наличия товара',
    waPickupNotice: '⚠️ *Самовывоз:* Самовывоз непосредственно из филиала (Наср-Сити) — заказ зависит от наличия товара на момент получения.',
    waFooter: '_(Оформлено через цифровое меню — alfaida.technobeta.co)_'
  }
};

export function getT(key) {
  const lang = getCurrentLang() || 'ar';
  return I18N[lang]?.[key] || I18N.ar[key] || '';
}

// ─── LocalStorage / SessionStorage Persistence ────────────────
function loadCart() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) cartState = JSON.parse(raw);
  } catch (_) {
    cartState = {};
  }
}

function saveCart() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
  } catch (_) {}
}

export function clearCart() {
  cartState = {};
  saveCart();
  updateOrderUi();
  closeOrderModal();
}

// ─── Helper: Compute Standard Half-Kg Price ────────────────────
export function getItemHalfKgPrice(item) {
  if (!item) return 0;
  if (item.price_half_kg && !isNaN(Number(item.price_half_kg))) {
    return Number(item.price_half_kg);
  }
  if (item.price_per_kg && !isNaN(Number(item.price_per_kg))) {
    return Math.round(Number(item.price_per_kg) / 2);
  }
  return 0;
}

// ─── Initialize Order System ───────────────────────────────────
export function initOrderSystem(data) {
  menuDataRef = data;
  loadCart();
  setupOrderBarListeners();
  setupOrderModalListeners();
  updateOrderUi();
}

// ─── Create Item Order Control (In Menu Line) ──────────────────
export function createItemOrderControl(item, data, lang) {
  const ctrl = document.createElement('div');
  ctrl.className = 'item-order-ctrl';
  ctrl.dataset.itemId = item.id;

  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'btn-item-add';
  btnAdd.setAttribute('aria-label', getT('add'));
  btnAdd.innerHTML = `<span class="btn-item-add-plus">+</span><span class="btn-item-add-label">${getT('add')}</span>`;

  const qtyBox = document.createElement('div');
  qtyBox.className = 'item-qty-selector';

  const btnMinus = document.createElement('button');
  btnMinus.type = 'button';
  btnMinus.className = 'qty-btn minus';
  btnMinus.setAttribute('aria-label', '−');
  btnMinus.textContent = '−';

  const qtySpan = document.createElement('span');
  qtySpan.className = 'qty-val';
  qtySpan.textContent = '1';

  const btnPlus = document.createElement('button');
  btnPlus.type = 'button';
  btnPlus.className = 'qty-btn plus';
  btnPlus.setAttribute('aria-label', '+');
  btnPlus.textContent = '+';

  qtyBox.appendChild(btnMinus);
  qtyBox.appendChild(qtySpan);
  qtyBox.appendChild(btnPlus);

  ctrl.appendChild(btnAdd);
  ctrl.appendChild(qtyBox);

  // All items use the strict half-kilo standard price
  const priceVal = getItemHalfKgPrice(item);

  btnAdd.addEventListener('click', (e) => {
    e.stopPropagation();
    changeItemQty(item, (cartState[item.id]?.qty || 0) + 1, priceVal);
  });

  btnPlus.addEventListener('click', (e) => {
    e.stopPropagation();
    changeItemQty(item, (cartState[item.id]?.qty || 0) + 1, priceVal);
  });

  btnMinus.addEventListener('click', (e) => {
    e.stopPropagation();
    const current = cartState[item.id]?.qty || 0;
    changeItemQty(item, Math.max(0, current - 1), priceVal);
  });

  // Set initial appearance
  updateItemControlView(ctrl, cartState[item.id]?.qty || 0);

  return ctrl;
}

function changeItemQty(item, newQty, priceVal) {
  if (newQty <= 0) {
    delete cartState[item.id];
  } else {
    cartState[item.id] = {
      id: item.id,
      nameObj: item.name,
      price: priceVal || 0,
      qty: newQty
    };
  }
  saveCart();
  updateOrderUi();
}

function updateItemControlView(ctrl, qty) {
  const btnAdd = ctrl.querySelector('.btn-item-add');
  const qtyBox = ctrl.querySelector('.item-qty-selector');
  const qtySpan = ctrl.querySelector('.qty-val');
  const addLabel = ctrl.querySelector('.btn-item-add-label');

  if (addLabel) addLabel.textContent = getT('add');

  if (!btnAdd || !qtyBox) return;

  if (qty > 0) {
    btnAdd.style.display = 'none';
    qtyBox.style.display = 'inline-flex';
    if (qtySpan) qtySpan.textContent = String(qty);
  } else {
    btnAdd.style.display = 'inline-flex';
    qtyBox.style.display = 'none';
  }
}

// ─── Update All UI (Bar, Controls, Modal, Trilingual Labels) ───
export function updateOrderUi() {
  const lang = getCurrentLang() || 'ar';

  // 1. Sync all item controls currently in DOM
  document.querySelectorAll('.item-order-ctrl').forEach(ctrl => {
    const id = ctrl.dataset.itemId;
    const qty = cartState[id]?.qty || 0;
    updateItemControlView(ctrl, qty);
  });

  // 2. Calculate totals
  const items = Object.values(cartState);
  const totalCount = items.reduce((acc, cur) => acc + cur.qty, 0);
  const totalPrice = items.reduce((acc, cur) => acc + (cur.qty * (cur.price || 0)), 0);

  // 3. Update Floating Order Bar
  const orderBar = document.getElementById('order-bar');
  const badge = document.getElementById('order-bar-badge');
  const countLabel = document.getElementById('order-bar-count-label');
  const priceLabel = document.getElementById('order-bar-total');
  const clearText = document.getElementById('order-clear-text');
  const checkoutText = document.getElementById('order-checkout-text');

  if (clearText) clearText.textContent = getT('clear');
  if (checkoutText) checkoutText.textContent = getT('checkout');

  if (orderBar) {
    if (totalCount > 0) {
      orderBar.style.display = 'block';
      document.body.classList.add('has-order-bar');
      if (badge) badge.textContent = String(totalCount);
      if (countLabel) {
        const fn = I18N[lang]?.itemsCount || I18N.ar.itemsCount;
        countLabel.textContent = fn(totalCount);
      }
      if (priceLabel) {
        priceLabel.textContent = totalPrice > 0 ? `${totalPrice} ${getT('curr')}` : getT('priceOnConfirm');
      }
    } else {
      orderBar.style.display = 'none';
      document.body.classList.remove('has-order-bar');
    }
  }

  // 4. Update Modal Static Receipt Labels to Active Language
  updateModalStaticLabels(lang);

  // 5. Update Modal Items List
  renderModalItemsList(lang, items, totalPrice);
}

function updateModalStaticLabels(lang) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const setHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  const setPlaceholder = (id, ph) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = ph;
  };

  setText('receipt-stars', getT('brandStars'));
  setText('receipt-brand-title', getT('brandTitle'));
  setText('receipt-brand-sub', getT('brandSub'));

  // Live formatted Date & Rec #
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  setText('receipt-meta-no', `${getT('recNoPrefix')} #ALF-${yyyy}${mm}${dd}`);
  setText('receipt-meta-date', `${getT('datePrefix')} ${yyyy}-${mm}-${dd}`);

  setText('receipt-pickup-title', getT('pickupNoticeTitle'));
  setText('receipt-pickup-text', getT('pickupNoticeText'));

  setText('receipt-notice-tab', getT('noticeTabTitle'));
  setText('receipt-items-tab', getT('itemsTabTitle'));
  setText('receipt-customer-tab', getT('customerTabTitle'));

  setText('col-head-qty', getT('colQty'));
  setText('col-head-item', getT('colItem'));
  setText('col-head-price', getT('colPrice'));

  setText('receipt-total-label', getT('totalLabel'));
  setText('receipt-customer-tag', getT('customerTag'));

  setHtml('label-cust-name', `${getT('nameLabel')} <span class="req">*</span>`);
  setPlaceholder('order-cust-name', getT('namePlaceholder'));

  setText('label-cust-phone', getT('phoneLabel'));
  setPlaceholder('order-cust-phone', getT('phonePlaceholder'));

  setText('label-cust-notes', getT('notesLabel'));
  setPlaceholder('order-cust-notes', getT('notesPlaceholder'));

  setText('btn-submit-text', getT('sendWhatsApp'));
  setText('receipt-thanks-text', getT('thanks'));
}

// ─── Setup Floating Order Bar Listeners ────────────────────────
function setupOrderBarListeners() {
  const btnOpen = document.getElementById('btn-open-order');
  if (btnOpen) {
    btnOpen.addEventListener('click', openOrderModal);
  }

  // Clear cart button in floating bar
  const btnClear = document.getElementById('btn-clear-order');
  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.stopPropagation();
      const count = Object.values(cartState).reduce((acc, cur) => acc + cur.qty, 0);
      if (count === 0) return;
      if (confirm(getT('clearConfirm'))) {
        clearCart();
      }
    });
  }
}

// ─── Modal Open / Close ────────────────────────────────────────
export function openOrderModal() {
  const modal = document.getElementById('order-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  updateOrderUi();
  setTimeout(() => {
    const input = document.getElementById('order-cust-name');
    if (input) input.focus();
  }, 100);
}

export function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function setupOrderModalListeners() {
  const modal = document.getElementById('order-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.order-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeOrderModal);

  const backdrop = modal.querySelector('.order-modal-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeOrderModal);

  const submitBtn = document.getElementById('btn-submit-whatsapp');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitOrderViaWhatsApp);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeOrderModal();
    }
  });
}

// ─── Render 58mm Thermal Cashier Receipt Item Rows ─────────────
function renderModalItemsList(lang, items, totalPrice) {
  const listContainer = document.getElementById('order-items-list');
  const totalDisplay = document.getElementById('modal-total-amount');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (items.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center;padding:1.4rem .5rem;color:#73685C;font-size:.82rem;">${getT('emptyCart')}</div>`;
    if (totalDisplay) totalDisplay.textContent = `0 ${getT('curr')}`;
    return;
  }

  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'receipt-item-row';

    // Quantity selector
    const qtyCol = document.createElement('div');
    qtyCol.className = 'receipt-item-qty-ctrl';

    const btnDec = document.createElement('button');
    btnDec.type = 'button';
    btnDec.className = 'receipt-qty-btn minus';
    btnDec.textContent = '−';
    btnDec.setAttribute('aria-label', '−');
    btnDec.addEventListener('click', () => {
      const itemObj = menuDataRef?.items?.find(x => x.id === it.id) || { id: it.id, name: it.nameObj };
      changeItemQty(itemObj, it.qty - 1, it.price);
    });

    const qtySpan = document.createElement('span');
    qtySpan.className = 'receipt-qty-num';
    qtySpan.textContent = String(it.qty);

    const btnInc = document.createElement('button');
    btnInc.type = 'button';
    btnInc.className = 'receipt-qty-btn plus';
    btnInc.textContent = '+';
    btnInc.setAttribute('aria-label', '+');
    btnInc.addEventListener('click', () => {
      const itemObj = menuDataRef?.items?.find(x => x.id === it.id) || { id: it.id, name: it.nameObj };
      changeItemQty(itemObj, it.qty + 1, it.price);
    });

    qtyCol.appendChild(btnDec);
    qtyCol.appendChild(qtySpan);
    qtyCol.appendChild(btnInc);

    // Item name cell
    const nameCol = document.createElement('div');
    nameCol.className = 'receipt-item-name-cell';
    const mainTitle = getText(it.nameObj, lang) || it.id;
    const altTitle = lang !== 'ru' && it.nameObj?.ru ? `«${it.nameObj.ru}»` : (lang === 'ru' && it.nameObj?.ar ? `(${it.nameObj.ar})` : '');

    nameCol.innerHTML = `
      <span class="receipt-item-title">${mainTitle}</span>
      <span class="receipt-item-unit-tag">${getT('unitShort')}${altTitle ? ' • ' + altTitle : ''}</span>
    `;

    // Price cell + Remove button
    const priceCol = document.createElement('div');
    priceCol.className = 'receipt-item-price-cell';

    const priceValSpan = document.createElement('span');
    priceValSpan.className = 'receipt-item-price-val';
    if (it.price > 0) {
      priceValSpan.textContent = `${it.price * it.qty} ${getT('curr')}`;
    } else {
      priceValSpan.textContent = getT('priceOnConfirm');
      priceValSpan.style.fontSize = '.7rem';
      priceValSpan.style.opacity = '.85';
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'receipt-item-del-btn';
    delBtn.title = getT('deleteItem');
    delBtn.innerHTML = '🗑';
    delBtn.addEventListener('click', () => {
      const itemObj = menuDataRef?.items?.find(x => x.id === it.id) || { id: it.id, name: it.nameObj };
      changeItemQty(itemObj, 0, it.price);
    });

    priceCol.appendChild(priceValSpan);
    priceCol.appendChild(delBtn);

    row.appendChild(qtyCol);
    row.appendChild(nameCol);
    row.appendChild(priceCol);
    listContainer.appendChild(row);
  });

  if (totalDisplay) {
    totalDisplay.textContent = totalPrice > 0 ? `${totalPrice} ${getT('curr')}` : getT('priceOnConfirm');
    if (totalPrice === 0) totalDisplay.style.fontSize = '1.05rem';
  }
}

// ─── Format & Send via WhatsApp in Active Customer Language ───
function submitOrderViaWhatsApp() {
  const items = Object.values(cartState);
  if (!items.length) {
    alert(getT('emptyCart'));
    return;
  }

  const nameInput = document.getElementById('order-cust-name');
  const phoneInput = document.getElementById('order-cust-phone');
  const notesInput = document.getElementById('order-cust-notes');

  const custName = (nameInput?.value || '').trim();
  const custPhone = (phoneInput?.value || '').trim();
  const custNotes = (notesInput?.value || '').trim();

  if (!custName) {
    alert(getT('nameRequired'));
    if (nameInput) nameInput.focus();
    return;
  }

  const lang = getCurrentLang() || 'ar';
  const totalPrice = items.reduce((acc, cur) => acc + (cur.qty * (cur.price || 0)), 0);

  // Target WhatsApp number (settings.whatsapp_1 or fallback)
  const waTarget = menuDataRef?.settings?.whatsapp_1 || '201043460317';

  // Construct localized WhatsApp message text strictly based on customer language
  let lines = [];
  lines.push(getT('waHeader'));
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`${getT('waName')} ${custName}`);
  if (custPhone) lines.push(`${getT('waPhone')} ${custPhone}`);
  if (custNotes) lines.push(`${getT('waNotes')} ${custNotes}`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(getT('waItemsTitle'));

  items.forEach((it, idx) => {
    let itemDisplayName = getText(it.nameObj, lang) || it.id;
    // For non-Arabic customers, also include Arabic name so branch staff easily fulfills the order
    if (lang !== 'ar' && it.nameObj?.ar) {
      itemDisplayName += ` (${it.nameObj.ar})`;
    }
    const subtotal = it.price > 0 ? ` = ${it.price * it.qty} ${getT('curr')}` : ` (${getT('priceOnConfirm')})`;
    lines.push(`${idx + 1}. *${itemDisplayName}* (${getT('unitShort')}) × ${it.qty}${subtotal}`);
  });

  lines.push('━━━━━━━━━━━━━━━━━━');
  if (totalPrice > 0) {
    lines.push(`${getT('waTotal')} ${totalPrice} ${getT('curr')}`);
  } else {
    lines.push(getT('waTotalConfirm'));
  }
  lines.push(getT('waPickupNotice'));
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(getT('waFooter'));

  const fullText = lines.join('\n');
  const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(fullText)}`;

  // Meta Pixel Tracking: WhatsApp Order sent
  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'WhatsApp Order',
        num_items: cart.length,
        value: totalPrice > 0 ? totalPrice : 0,
        currency: 'EGP'
      });
      window.fbq('track', 'Lead', {
        content_name: 'WhatsApp Order Completed',
        currency: 'EGP',
        value: totalPrice > 0 ? totalPrice : 0
      });
    }
  } catch (err) {
    console.debug('Pixel track error:', err);
  }

  // Open WhatsApp in new tab
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
