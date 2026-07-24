import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '121TJowkkWLeaPSAYp5Cokg0If9iwBtFDF6CZ5JWIYO0';

const GIDS = [
  { name: 'Question Bank & PYQs', gid: '1168952937' },
  { name: 'Sectionals & Mocks & OMETs', gid: '1315114032' },
  { name: 'Concept Videos', gid: '0' },
  { name: 'Doubt Solving', gid: '1713721988' },
  { name: 'XAT Exam', gid: '1901495051' }
];

async function fetchTabCsv(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.error(`❌ Failed to fetch gid=${gid}:`, e.message);
    return null;
  }
}

async function fetchHtmlView() {
  const url = `https://docs.google.com/spreadsheets/u/0/d/${SPREADSHEET_ID}/htmlview`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.error(`❌ Failed to fetch htmlview:`, e.message);
    return null;
  }
}

// Parse hyperlinks from htmlview HTML
function extractHyperlinksFromHtml(html) {
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (href && !href.startsWith('#') && !href.includes('google.com/spreadsheets')) {
      links.push({ text, url: href });
    }
  }
  return links;
}

// Parse CSV lines into structured rows
function parseCsv(csvText) {
  const lines = csvText.split('\n');
  const rows = lines.map(line => {
    // Simple CSV parser handling quotes
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
  return rows.filter(row => row.some(cell => cell.length > 0));
}

async function main() {
  console.log('🚀 Extracting CAT & Allied Exam Question Resources from Google Sheets...');

  const htmlData = await fetchHtmlView();
  const htmlLinks = htmlData ? extractHyperlinksFromHtml(htmlData) : [];
  console.log(`🔗 Extracted ${htmlLinks.length} hyperlinks from HTML View`);

  const extractedTabs = [];

  for (const tab of GIDS) {
    console.log(`\n📥 Fetching tab: ${tab.name} (gid=${tab.gid})...`);
    const csvContent = await fetchTabCsv(tab.gid);
    if (csvContent) {
      const rows = parseCsv(csvContent);
      extractedTabs.push({
        gid: tab.gid,
        name: tab.name,
        total_rows: rows.length,
        rows: rows
      });
      console.log(`✅ Parsed ${rows.length} rows from ${tab.name}`);
    }
  }

  // Save raw and structured JSON
  const outputData = {
    spreadsheet_id: SPREADSHEET_ID,
    fetched_at: new Date().toISOString(),
    html_links_count: htmlLinks.length,
    tabs: extractedTabs,
    html_hyperlinks: htmlLinks
  };

  const outputPath = path.join(__dirname, '../public/data/cat_and_allied_resources.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n🎉 Extracted all resources successfully to ${outputPath}`);
}

main();
