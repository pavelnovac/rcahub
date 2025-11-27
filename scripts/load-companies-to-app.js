/**
 * Script pentru încărcarea companiilor convertite în aplicație
 * Acest script poate fi rulat în consola browserului pentru a încărca datele convertite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALL_COMPANIES_FILE = path.join(__dirname, '..', 'data', 'all_companies.json');

function generateBrowserScript() {
  if (!fs.existsSync(ALL_COMPANIES_FILE)) {
    console.error(`❌ Fișierul ${ALL_COMPANIES_FILE} nu există!`);
    console.log('Rulează mai întâi convert-collected-data.js');
    process.exit(1);
  }
  
  const companies = JSON.parse(fs.readFileSync(ALL_COMPANIES_FILE, 'utf-8'));
  
  // Generează scriptul JavaScript pentru browser
  const script = `
/**
 * Script pentru încărcarea companiilor convertite în aplicație
 * Copiază și lipește acest script în consola browserului pe pagina aplicației
 */

(function() {
  const companies = ${JSON.stringify(companies, null, 2)};
  
  // Elimină câmpul bonus_malus din premiumuri (nu este folosit de aplicație)
  companies.forEach(company => {
    if (company.premiums) {
      company.premiums = company.premiums.map(premium => ({
        cell_id: premium.cell_id,
        value: premium.value
      }));
    }
  });
  
  // Salvează în localStorage
  const STORAGE_KEY = 'rca_companies';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  
  console.log('✅ ' + companies.length + ' companii încărcate în localStorage!');
  console.log('Reîncarcă pagina pentru a vedea companiile în aplicație.');
  
  // Returnează companiile pentru verificare
  return companies;
})();
`;
  
  const outputFile = path.join(__dirname, '..', 'data', 'load-companies-browser.js');
  fs.writeFileSync(outputFile, script, 'utf-8');
  console.log(`✓ Script generat: ${outputFile}`);
  console.log(`\nPentru a încărca companiile în aplicație:`);
  console.log(`1. Deschide aplicația în browser`);
  console.log(`2. Deschide Console (F12)`);
  console.log(`3. Copiază conținutul din ${outputFile}`);
  console.log(`4. Lipește-l în consolă și apasă Enter`);
  console.log(`5. Reîncarcă pagina`);
}

generateBrowserScript();








