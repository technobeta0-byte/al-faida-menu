import fs from 'fs';
import path from 'path';

const file = process.argv[2] || 'data/menu.sample.json';
const targetPath = path.resolve(process.cwd(), file);

if (!fs.existsSync(targetPath)) {
  console.error(`File not found: ${targetPath}`);
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  let errors = 0;

  const logError = (msg) => {
    console.error(`[ERROR] ${msg}`);
    errors++;
  };

  if (!data.schema || data.schema < 1) logError("Schema must be >= 1.");
  if (!data.items || !Array.isArray(data.items)) logError("Missing items array.");
  if (!data.categories || !Array.isArray(data.categories)) logError("Missing categories array.");
  if (!data.ui) logError("Missing ui object.");
  
  const categoryIds = new Set((data.categories || []).map(c => c.id));
  const itemIds = new Set();

  (data.items || []).forEach(i => {
    if (!i.id) logError(`Item missing id: ${JSON.stringify(i)}`);
    if (itemIds.has(i.id)) logError(`Duplicate item id: ${i.id}`);
    itemIds.add(i.id);

    if (!categoryIds.has(i.category_id)) logError(`Item ${i.id} has unknown category_id: ${i.category_id}`);
    
    ['ar', 'en', 'ru'].forEach(lang => {
      if (!i.name || typeof i.name[lang] !== 'string') {
        logError(`Item ${i.id} missing name for language: ${lang}`);
      }
    });

    if (i.price_per_kg !== null && typeof i.price_per_kg !== 'number') logError(`Item ${i.id} invalid price_per_kg`);
  });

  if (errors > 0) {
    console.error(`Validation failed with ${errors} errors.`);
    process.exit(1);
  } else {
    console.log(`Validation passed for ${file}`);
  }
} catch (e) {
  console.error(`Failed to parse JSON: ${e.message}`);
  process.exit(1);
}
