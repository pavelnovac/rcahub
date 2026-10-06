/**
 * Convertește exportul din collectGreenCardData() în fișierele folosite de pagină.
 *
 * Utilizare:
 *   node scripts/convert-green-card-data.js data/green_card_bnm_premiums_2026-10-06.json
 *
 * Scrie:
 *   public/green_card_companies.json
 *   public/green_card_cells.json
 *   data/green_card_companies.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = process.argv[2] || path.join(__dirname, '..', 'data', 'green_card_bnm_premiums.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DATA_DIR = path.join(__dirname, '..', 'data');

const CATEGORIES = [
  { id: 'A', label: 'Autoturisme', description: '(A) Autoturisme' },
  { id: 'C1', label: 'Camioane < 3.5 tone', description: '(C1) Camioane < 3.5 tone' },
  { id: 'C2', label: 'Camioane și tractoare > 3.5 tone', description: '(C2) Camioane și tractoare > 3.5 tone' },
  { id: 'E1', label: 'Transport < 17 locuri', description: '(E1) Transport de persoane < 17 locuri' },
  { id: 'E2', label: 'Transport > 17 locuri', description: '(E2) Transport de persoane > 17 locuri' },
  { id: 'B', label: 'Motociclete', description: '(B) Motociclete' },
  { id: 'F', label: 'Remorcă', description: '(F) Remorcă —  prima depinde de vehiculul care tractează' }
];

const ZONES = [
  { id: 'Z1', label: 'Zona 1 — Ucraina', short: 'Ucraina' },
  { id: 'Z3', label: 'Zona 3 — Toate țările', short: 'Toate țările' }
];

const PERIODS = [
  { id: 'D15', label: '15 zile', short: '15 zile' },
  { id: 'M1', label: '1 lună', short: '1 lună' },
  { id: 'M2', label: '2 luni', short: '2 luni' },
  { id: 'M3', label: '3 luni', short: '3 luni' },
  { id: 'M4', label: '4 luni', short: '4 luni' },
  { id: 'M5', label: '5 luni', short: '5 luni' },
  { id: 'M6', label: '6 luni', short: '6 luni' },
  { id: 'M7', label: '7 luni', short: '7 luni' },
  { id: 'M8', label: '8 luni', short: '8 luni' },
  { id: 'M9', label: '9 luni', short: '9 luni' },
  { id: 'M10', label: '10 luni', short: '10 luni' },
  { id: 'M11', label: '11 luni', short: '11 luni' },
  { id: 'M12', label: '12 luni', short: '12 luni' }
];

const TOWING_CATEGORIES = CATEGORIES
  .filter(category => category.id !== 'F')
  .map(category => ({ id: category.id, label: category.label }));

function companyIdFromName(companyName) {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function readCollected(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (parsed && parsed.cells && typeof parsed.cells === 'object') {
    return parsed;
  }
  return {
    collected_at: null,
    source: 'https://rca.bnm.md/online',
    cells: parsed
  };
}

function convertCompanies(cells) {
  const companies = {};

  Object.entries(cells).forEach(([cellKey, cellPrices]) => {
    if (!cellPrices || typeof cellPrices !== 'object') return;

    Object.entries(cellPrices).forEach(([companyName, price]) => {
      const name = String(companyName).replace(/\s+/g, ' ').trim();
      const value = typeof price === 'number' ? price : parseFloat(price);
      if (!name || !Number.isFinite(value)) return;

      const companyId = companyIdFromName(name);
      if (!companies[companyId]) {
        companies[companyId] = {
          company_id: companyId,
          company_name: name,
          is_reference: false,
          premiums: []
        };
      }
      companies[companyId].premiums.push({
        cell_id: cellKey,
        value
      });
    });
  });

  return Object.values(companies).sort((a, b) => a.company_name.localeCompare(b.company_name, 'ro'));
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Fișierul ${INPUT_FILE} nu există.`);
    console.log('Exportă datele din browser cu exportGreenCardData(), apoi pasează calea fișierului.');
    process.exit(1);
  }

  const collected = readCollected(INPUT_FILE);
  const companies = convertCompanies(collected.cells || {});
  const cellsCatalog = {
    collected_at: collected.collected_at || null,
    source: collected.source || 'https://rca.bnm.md/online',
    currency: 'MDL',
    categories: CATEGORIES,
    zones: ZONES,
    periods: PERIODS,
    towing_categories: TOWING_CATEGORIES
  };

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const companiesJson = JSON.stringify(companies, null, 2);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'green_card_companies.json'), companiesJson);
  fs.writeFileSync(path.join(DATA_DIR, 'green_card_companies.json'), companiesJson);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'green_card_cells.json'), JSON.stringify(cellsCatalog, null, 2));

  const premiumCount = companies.reduce((sum, company) => sum + company.premiums.length, 0);
  console.log(`Companii: ${companies.length}`);
  console.log(`Prețuri: ${premiumCount}`);
  console.log(`Colectat la: ${cellsCatalog.collected_at || 'necunoscut'}`);
  console.log('Scris public/green_card_companies.json');
  console.log('Scris public/green_card_cells.json');
}

main();
