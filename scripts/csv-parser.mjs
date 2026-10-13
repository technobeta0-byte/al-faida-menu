export function parseCSV(text) {
  let p = '', row = [], ret = [row], i = 0, inQuotes = false;
  if (!text) return [];
  // Handle BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const l = text.length;
  for (i = 0; i < l; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        p += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(p);
      p = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(p);
      p = '';
      row = [];
      ret.push(row);
    } else {
      p += c;
    }
  }
  row.push(p);
  // Remove trailing empty row if exists
  if (ret.length > 0 && ret[ret.length - 1].length === 1 && ret[ret.length - 1][0] === '') {
    ret.pop();
  }
  return ret;
}

export function csvToObjects(csvText) {
  const parsed = parseCSV(csvText);
  if (parsed.length === 0) return [];
  const headers = parsed[0].map(h => h.trim());
  const rows = [];
  for (let i = 1; i < parsed.length; i++) {
    const rowArray = parsed[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = rowArray[j] !== undefined ? rowArray[j] : '';
      if (typeof val === 'string') {
        val = val.trim();
        // Strip stray wrapping quotes if present
        if (val === '"' || val === '""') val = '';
      }
      obj[headers[j]] = val;
    }
    rows.push(obj);
  }
  return rows;
}
