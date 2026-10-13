import fs from 'fs';
import path from 'path';
import { csvToObjects } from './csv-parser.mjs';

const SHEET_ID = '1PpojNoAQbveB-sAO__guyyoO_S8thefJIFbqsU00ggw';
const getUrl = (sheetName) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(sheetName)}`;

const args = process.argv.slice(2);
const includeUnavailable = args.includes('--include-unavailable');

async function fetchWithRetry(url, retries = 4, delayMs = 1200) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
      console.warn(`Fetch returned status ${res.status} on attempt ${attempt}`);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Fetch attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

async function fetchTab(name) {
  const text = await fetchWithRetry(getUrl(name));
  return { rawCsv: text, objects: csvToObjects(text) };
}

async function downloadLogoIfGoogleDrive(fileUrl) {
  if (!fileUrl) return null;
  const m = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  const fileId = m[1];
  const directUrls = [
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`
  ];

  const brandLogo = path.join(process.cwd(), 'assets', 'brand', 'logo.png');
  const imgLogo = path.join(process.cwd(), 'images', 'logo.png');
  if (fs.existsSync(brandLogo) && fs.existsSync(imgLogo)) {
    return { fileId, directUrl: directUrls[0] };
  }

  for (const u of directUrls) {
    try {
      const res = await fetch(u);
      if (res.ok && res.headers.get('content-type')?.includes('image')) {
        const buf = Buffer.from(await res.arrayBuffer());
        const brandDir = path.join(process.cwd(), 'assets', 'brand');
        const imagesDir = path.join(process.cwd(), 'images');
        if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        fs.writeFileSync(path.join(brandDir, 'logo.png'), buf);
        fs.writeFileSync(path.join(imagesDir, 'logo.png'), buf);
        console.log(`- Downloaded official logo.png (${buf.length} bytes) to assets/brand and images`);
        return { fileId, directUrl: directUrls[0] };
      }
    } catch (e) {
      console.warn(`Could not download logo from ${u}: ${e.message}`);
    }
  }
  return { fileId, directUrl: directUrls[0] };
}

async function run() {
  try {
    console.log('Fetching Google Sheet tabs from spreadsheet...');
    const catData = await fetchTab('Categories');
    console.log('✔ Categories fetched');
    const itemsData = await fetchTab('Items');
    console.log('✔ Items fetched');
    const settingsData = await fetchTab('Settings');
    console.log('✔ Settings fetched');
    const uiData = await fetchTab('UI_Text');
    console.log('✔ UI_Text fetched');
    const socialData = await fetchTab('Social');
    console.log('✔ Social fetched');
    let partnersData = { rawCsv: '', objects: [] };
    try {
      partnersData = await fetchTab('Partners');
      console.log('✔ Partners fetched');
    } catch (e) {
      try {
        partnersData = await fetchTab('partners');
        console.log('✔ partners fetched');
      } catch (e2) {
        console.log('ℹ Partners tab not found or empty (skipped)');
      }
    }

    // Save fresh local CSVs
    fs.writeFileSync(path.join(process.cwd(), 'categories.csv'), catData.rawCsv, 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'items.csv'), itemsData.rawCsv, 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'settings.csv'), settingsData.rawCsv, 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'ui_text.csv'), uiData.rawCsv, 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'social.csv'), socialData.rawCsv, 'utf8');
    if (partnersData.rawCsv) {
      fs.writeFileSync(path.join(process.cwd(), 'partners.csv'), partnersData.rawCsv, 'utf8');
    }
    console.log('✔ Updated local CSV backups');

    const categories = catData.objects;
    const items = itemsData.objects;
    const settings = settingsData.objects;
    const uiText = uiData.objects;
    const social = socialData.objects;

    const out = {
      _generated_by: 'Al-Faida Build Script',
      schema: 2,
      version: new Date().toISOString(),
      settings: {},
      ui: {},
      social: [],
      categories: [],
      items: []
    };

    // Settings
    const colors = { navy: "#0A192F", red: "#8B0000", gold: "#D4AF37", cream: "#F8F5F0", white: "#FFFFFF" };
    let logoDriveInfo = null;

    for (const s of settings) {
      const k = s.key;
      let v = s.value;
      if (!k) continue;
      if (typeof v === 'string') {
        v = v.trim();
        if (v === '"' || v === '""') v = '';
      }
      if (v === 'TRUE') v = true;
      if (v === 'FALSE') v = false;

      if (k === 'logo_file' && typeof v === 'string' && v.includes('drive.google.com')) {
        logoDriveInfo = await downloadLogoIfGoogleDrive(v);
      }
      
      const m = k.match(/^(.*)_(ar|en|ru)$/);
      if (m) {
        const base = m[1];
        const lang = m[2];
        if (!out.settings[base]) out.settings[base] = {};
        out.settings[base][lang] = v;
      } else if (k === 'phones' || k === 'whatsapp') {
        out.settings[k] = String(v).split(',').map(x => x.trim()).filter(Boolean);
      } else {
        out.settings[k] = v;
      }
    }
    out.settings.colors = out.settings.colors || colors;
    if (logoDriveInfo) {
      out.settings.logo_url = 'assets/brand/logo.png';
      out.settings.logo_drive_direct = logoDriveInfo.directUrl;
    } else {
      out.settings.logo_url = 'assets/brand/logo.png';
    }

    // UI Text
    uiText.forEach(u => {
      if (!u.key) return;
      out.ui[u.key] = { ar: u.ar, en: u.en, ru: u.ru };
    });

    // Social - Bulletproof extraction: parse every row where show = TRUE (or truthy)
    social.forEach(s => {
      const isShow = s.show === 'TRUE' || s.show === true || s.show === '1' || String(s.show).trim().toLowerCase() === 'true';
      if (!isShow) return;

      let cleanUrl = (s.url || '').replace(/[\r\n]+/g, '').trim();
      if (cleanUrl === '"' || cleanUrl === '""') cleanUrl = '';

      out.social.push({
        id: s.id || '',
        type: s.type || 'social',
        name: { ar: s.name_ar || '', en: s.name_en || '', ru: s.name_ru || '' },
        url: cleanUrl,
        icon: s.icon || s.id || '',
        featured: s.featured === 'TRUE' || s.featured === true || s.featured === '1',
        order: parseInt(s.order) || 0
      });
    });
    out.social.sort((a, b) => a.order - b.order);
    console.log(`✔ Processed ${out.social.length} active social platforms`);

    function toDirectDriveUrl(url) {
      if (!url || typeof url !== 'string') return '';
      url = url.trim();
      if (url === '"' || url === '""') return '';
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
      return url;
    }

    // Categories
    const validCategoryIds = new Set();
    const categoriesMap = {};
    categories.forEach(c => {
      const isVisible = c.visible === 'TRUE' || c.visible === true || c.visible === '1' || c.visible !== 'FALSE';
      if (!isVisible) return;
      const cleanImg = toDirectDriveUrl(c.image || c.image_url || '');
      categoriesMap[c.id] = {
        id: c.id,
        name: { ar: c.name_ar, en: c.name_en, ru: c.name_ru },
        image: cleanImg || null,
        order: parseInt(c.order) || 0
      };
    });

    // Items
    items.forEach(i => {
      if (!i.id) return;
      if (!categoriesMap[i.category_id]) return; // orphan or invisible category
      
      const price_per_kg = i.price_per_kg ? parseFloat(i.price_per_kg) : null;
      const price_half_kg = i.price_half_kg ? parseFloat(i.price_half_kg) : null;
      const price_quarter_kg = i.price_quarter_kg ? parseFloat(i.price_quarter_kg) : null;
      const old_price_per_kg = i.old_price_per_kg ? parseFloat(i.old_price_per_kg) : null;

      validCategoryIds.add(i.category_id);
      
      out.items.push({
        id: i.id,
        category_id: i.category_id,
        name: { ar: i.name_ar, en: i.name_en, ru: i.name_ru },
        desc: { ar: i.desc_ar, en: i.desc_en, ru: i.desc_ru },
        price_per_kg,
        price_half_kg,
        price_quarter_kg,
        old_price_per_kg,
        image: toDirectDriveUrl(i.image || ''),
        badge: i.badge && i.badge !== '"' ? i.badge.trim() : '',
        available: i.available !== 'FALSE',
        tags: {
          halal: i.halal === 'TRUE' || i.halal === true,
          natural: i.natural === 'TRUE' || i.natural === true,
          soy_free: i.soy_free === 'TRUE' || i.soy_free === true,
          keto: i.keto === 'TRUE' || i.keto === true
        },
        order: parseInt(i.order) || 0
      });
    });

    out.items.sort((a, b) => a.order - b.order);
    
    // Categories with items (or visible categories)
    for (const catId of Object.keys(categoriesMap)) {
      if (validCategoryIds.has(catId) || categoriesMap[catId]) {
        out.categories.push(categoriesMap[catId]);
      }
    }
    out.categories.sort((a, b) => a.order - b.order);

    // Partners / Distributors
    out.partners = [];
    if (partnersData.objects && partnersData.objects.length > 0) {
      out.partners = partnersData.objects
        .filter(p => p.id && p.id.trim() && p.visible !== 'FALSE' && p.visible !== false && p.show !== 'FALSE' && p.show !== false)
        .map(p => ({
          id: p.id.trim(),
          name: {
            ar: p.name_ar || '',
            en: p.name_en || p.name_ar || '',
            ru: p.name_ru || p.name_en || p.name_ar || ''
          },
          logo: toDirectDriveUrl(p.logo || p.logo_url || p.image || ''),
          branches: {
            ar: p.branches_ar || p.location_ar || '',
            en: p.branches_en || p.location_en || p.branches_ar || '',
            ru: p.branches_ru || p.location_ru || p.branches_en || p.branches_ar || ''
          },
          url: p.url || '',
          order: parseInt(p.order || '99', 10) || 99
        }))
        .sort((a, b) => a.order - b.order);
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // Write to both menu.sample.json and menu.json
    const samplePath = path.join(dataDir, 'menu.sample.json');
    const prodPath = path.join(dataDir, 'menu.json');

    const jsonString = JSON.stringify(out, null, 2);
    fs.writeFileSync(samplePath, jsonString, 'utf8');
    fs.writeFileSync(prodPath, jsonString, 'utf8');

    console.log(`✔ Successfully generated data/menu.sample.json and data/menu.json`);
    console.log(`  - Items: ${out.items.length}`);
    console.log(`  - Categories: ${out.categories.length}`);
    console.log(`  - Social platforms: ${out.social.length}`);
  } catch (err) {
    console.error('Extraction failed:', err);
    process.exit(1);
  }
}

run();
