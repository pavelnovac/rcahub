/**
 * Script pentru conversia datelor colectate din localStorage în formatul rca_bnm_cells.json
 * 
 * Utilizare:
 * 1. Rulează browser-collector.js și colectează datele
 * 2. Rulează exportData() pentru a descărca datele
 * 3. Rulează acest script pentru a converti datele în formatul corect
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calea către fișierul JSON colectat
const INPUT_FILE = process.argv[2] || path.join(__dirname, '..', 'data', 'rca_bnm_premiums_2025-11-23.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'data');

/**
 * Convertește datele din formatul colectat în formatul rca_bnm_cells.json
 */
function convertData(collectedData) {
  const companies = {};
  
  // Extrage toate companiile unice din datele colectate
  const allCompanies = new Set();
  
  Object.values(collectedData).forEach(bmData => {
    Object.values(bmData).forEach(cellData => {
      Object.keys(cellData).forEach(companyName => {
        allCompanies.add(companyName);
      });
    });
  });
  
  // Creează un obiect pentru fiecare companie
  allCompanies.forEach(companyName => {
    // Generează un ID pentru companie (simplificat)
    const companyId = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    companies[companyId] = {
      company_id: companyId,
      company_name: companyName,
      is_reference: false,
      premiums: []
    };
  });
  
  // Populează premiumurile pentru fiecare companie
  Object.entries(collectedData).forEach(([bmKey, bmData]) => {
    const bonusMalus = bmKey.replace('BM_', '');
    
    Object.entries(bmData).forEach(([cellId, cellPrices]) => {
      Object.entries(cellPrices).forEach(([companyName, price]) => {
        const companyId = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        if (companies[companyId]) {
          // Adaugă premiumul cu cell_id și valoarea (fără bonus_malus - nu este folosit de aplicație)
          companies[companyId].premiums.push({
            cell_id: cellId,
            value: price
          });
        }
      });
    });
  });
  
  return Object.values(companies);
}

/**
 * Funcția principală
 */
function main() {
  console.log('=== Conversie date colectate ===');
  
  // Citește fișierul de intrare
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Fișierul ${INPUT_FILE} nu există!`);
    console.log('Asigură-te că ai exportat datele din browser folosind exportData()');
    process.exit(1);
  }
  
  const collectedData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Date citite din ${INPUT_FILE}`);
  
  // Convertește datele
  const companies = convertData(collectedData);
  console.log(`Găsite ${companies.length} companii`);
  
  // Creează directorul de output dacă nu există
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Salvează fiecare companie într-un fișier separat
  companies.forEach(company => {
    const outputFile = path.join(OUTPUT_DIR, `${company.company_id}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(company, null, 2), 'utf-8');
    console.log(`✓ Salvat: ${outputFile}`);
  });
  
  // Salvează și un fișier cu toate companiile
  const allCompaniesFile = path.join(OUTPUT_DIR, 'all_companies.json');
  fs.writeFileSync(allCompaniesFile, JSON.stringify(companies, null, 2), 'utf-8');
  console.log(`✓ Salvat: ${allCompaniesFile}`);
  
  // Creează un fișier index pentru a ușura încărcarea
  const indexFile = path.join(OUTPUT_DIR, 'companies_index.json');
  const index = companies.map(c => ({
    company_id: c.company_id,
    company_name: c.company_name,
    is_reference: c.is_reference,
    premiums_count: c.premiums.length
  }));
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`✓ Salvat: ${indexFile}`);
  
  console.log('\n=== Conversie completă! ===');
}

// Rulează scriptul
main();

export { convertData };

