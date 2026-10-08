/**
 * data.js — Static JSON only. No runtime Sheets connection.
 * البيانات تأتي من /data/menu.json (ينشره Apps Script على GitHub).
 * للتطوير المحلي، يستخدم /data/menu.sample.json كـ fallback.
 */

let _data = null;

export async function fetchMenuData() {
  if (_data) return _data;

  // جرّب menu.json المنشور من Google Sheets مع كسر الكاش، ثم sample كـ fallback
  const endpoints = ['./data/menu.json', 'data/menu.json', './data/menu.sample.json'];
  for (const url of endpoints) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!res.ok) continue;
      _data = await res.json();
      return _data;
    } catch (_) { /* جرّب التالي */ }
  }
  return null;
}

export function getMenuData() { return _data; }
