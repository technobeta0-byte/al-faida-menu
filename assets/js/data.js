/**
 * data.js — Static JSON only. No runtime Sheets connection.
 * البيانات تأتي من /data/menu.json (ينشره Apps Script على GitHub).
 * للتطوير المحلي، يستخدم /data/menu.sample.json كـ fallback.
 */

let _data = null;

async function fetchWithTimeout(url, timeoutMs = 4000) {
  let controller = null;
  let timer = null;
  const opts = { cache: 'no-cache' };

  if (typeof AbortController !== 'undefined') {
    controller = new AbortController();
    opts.signal = controller.signal;
    timer = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, timeoutMs);
  }

  try {
    const res = await fetch(url, opts);
    if (timer) clearTimeout(timer);
    return res;
  } catch (err) {
    if (timer) clearTimeout(timer);
    throw err;
  }
}

export async function fetchMenuData() {
  if (_data) return _data;

  // جرّب menu.json المنشور من Google Sheets مع كسر الكاش، ثم sample كـ fallback بمهلة زمنية سريعة
  const endpoints = ['./data/menu.json', 'data/menu.json', './data/menu.sample.json'];
  for (const url of endpoints) {
    try {
      const res = await fetchWithTimeout(`${url}?t=${Date.now()}`, 4000);
      if (!res.ok) continue;
      _data = await res.json();
      return _data;
    } catch (_) { /* جرّب التالي */ }
  }
  return null;
}

export function getMenuData() { return _data; }
