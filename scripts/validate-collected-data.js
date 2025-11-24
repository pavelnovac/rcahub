/**
 * Script pentru validarea și analiza datelor colectate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTED_FILE = process.argv[2] || path.join(__dirname, '..', 'data', 'rca_bnm_premiums_2025-11-23 (1).json');
const RCA_CELLS_FILE = path.join(__dirname, '..', 'rca_cells.json');

function validateData() {
  console.log('=== Validare Date Colectate ===\n');
  
  // Citește datele colectate
  if (!fs.existsSync(COLLECTED_FILE)) {
    console.error(`❌ Fișierul ${COLLECTED_FILE} nu există!`);
    process.exit(1);
  }
  
  const collectedData = JSON.parse(fs.readFileSync(COLLECTED_FILE, 'utf-8'));
  console.log(`✓ Date citite din ${COLLECTED_FILE}`);
  
  // Citește configurația RCA cells
  if (!fs.existsSync(RCA_CELLS_FILE)) {
    console.error(`❌ Fișierul ${RCA_CELLS_FILE} nu există!`);
    process.exit(1);
  }
  
  const rcaCells = JSON.parse(fs.readFileSync(RCA_CELLS_FILE, 'utf-8'));
  console.log(`✓ Configurație citită din ${RCA_CELLS_FILE}\n`);
  
  // Verifică structura de bază
  console.log('=== Structură Date ===');
  const bmKeys = Object.keys(collectedData);
  console.log(`Clase Bonus Malus: ${bmKeys.length}`);
  bmKeys.forEach(key => console.log(`  - ${key}`));
  
  // Extrage toate companiile
  const allCompanies = new Set();
  const allCellIds = new Set();
  let totalPrices = 0;
  
  Object.values(collectedData).forEach(bmData => {
    Object.keys(bmData).forEach(cellId => {
      allCellIds.add(cellId);
      const cellPrices = bmData[cellId];
      Object.keys(cellPrices).forEach(companyName => {
        allCompanies.add(companyName);
        totalPrices++;
      });
    });
  });
  
  console.log(`\nCompanii găsite: ${allCompanies.size}`);
  Array.from(allCompanies).sort().forEach(name => console.log(`  - ${name}`));
  
  console.log(`\nCelule unice: ${allCellIds.size}`);
  console.log(`Total prețuri: ${totalPrices}`);
  
  // Verifică completitudinea datelor
  console.log('\n=== Verificare Completitudine ===');
  
  const vehicles = rcaCells.vehicles;
  const territories = rcaCells.territories; // CH și AL
  const personCategories = rcaCells.person_categories;
  
  const expectedCells = new Set();
  
  vehicles.forEach(vehicle => {
    territories.forEach(territory => {
      if (vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') {
        // Doar PJ
        expectedCells.add(`${vehicle.vehicle_id}_${territory.territory_id}_PJ`);
      } else {
        personCategories.forEach(personCat => {
          expectedCells.add(`${vehicle.vehicle_id}_${territory.territory_id}_${personCat.person_category_id}`);
        });
      }
    });
  });
  
  console.log(`Celule așteptate: ${expectedCells.size}`);
  console.log(`Celule găsite: ${allCellIds.size}`);
  
  const missingCells = Array.from(expectedCells).filter(cellId => !allCellIds.has(cellId));
  const extraCells = Array.from(allCellIds).filter(cellId => !expectedCells.has(cellId));
  
  if (missingCells.length > 0) {
    console.log(`\n⚠️  Celule lipsă (${missingCells.length}):`);
    missingCells.slice(0, 10).forEach(cellId => console.log(`  - ${cellId}`));
    if (missingCells.length > 10) {
      console.log(`  ... și încă ${missingCells.length - 10} celule`);
    }
  } else {
    console.log(`\n✓ Toate celulele așteptate sunt prezente`);
  }
  
  if (extraCells.length > 0) {
    console.log(`\n⚠️  Celule extra (${extraCells.length}):`);
    extraCells.slice(0, 10).forEach(cellId => console.log(`  - ${cellId}`));
    if (extraCells.length > 10) {
      console.log(`  ... și încă ${extraCells.length - 10} celule`);
    }
  }
  
  // Verifică consistența prețurilor
  console.log('\n=== Verificare Consistență ===');
  
  let inconsistentCells = [];
  Object.values(collectedData).forEach(bmData => {
    Object.entries(bmData).forEach(([cellId, cellPrices]) => {
      const companies = Object.keys(cellPrices);
      const expectedCompanyCount = allCompanies.size;
      
      if (companies.length !== expectedCompanyCount) {
        inconsistentCells.push({
          cellId,
          found: companies.length,
          expected: expectedCompanyCount,
          missing: Array.from(allCompanies).filter(c => !companies.includes(c))
        });
      }
    });
  });
  
  if (inconsistentCells.length > 0) {
    console.log(`⚠️  Celule cu prețuri incomplete (${inconsistentCells.length}):`);
    inconsistentCells.slice(0, 5).forEach(item => {
      console.log(`  - ${item.cellId}: ${item.found}/${item.expected} companii`);
      if (item.missing.length > 0) {
        console.log(`    Lipsesc: ${item.missing.join(', ')}`);
      }
    });
    if (inconsistentCells.length > 5) {
      console.log(`  ... și încă ${inconsistentCells.length - 5} celule`);
    }
  } else {
    console.log(`✓ Toate celulele au prețuri pentru toate companiile`);
  }
  
  // Verifică valorile prețurilor
  console.log('\n=== Verificare Valori ===');
  
  let invalidPrices = [];
  Object.values(collectedData).forEach(bmData => {
    Object.entries(bmData).forEach(([cellId, cellPrices]) => {
      Object.entries(cellPrices).forEach(([companyName, price]) => {
        if (typeof price !== 'number' || isNaN(price) || price <= 0) {
          invalidPrices.push({ cellId, companyName, price });
        }
      });
    });
  });
  
  if (invalidPrices.length > 0) {
    console.log(`⚠️  Prețuri invalide (${invalidPrices.length}):`);
    invalidPrices.slice(0, 5).forEach(item => {
      console.log(`  - ${item.cellId} / ${item.companyName}: ${item.price}`);
    });
    if (invalidPrices.length > 5) {
      console.log(`  ... și încă ${invalidPrices.length - 5} prețuri`);
    }
  } else {
    console.log(`✓ Toate prețurile sunt valide`);
  }
  
  // Statistici
  console.log('\n=== Statistici ===');
  const pricesByCompany = {};
  allCompanies.forEach(company => {
    pricesByCompany[company] = 0;
  });
  
  Object.values(collectedData).forEach(bmData => {
    Object.values(bmData).forEach(cellPrices => {
      Object.entries(cellPrices).forEach(([companyName, price]) => {
        pricesByCompany[companyName]++;
      });
    });
  });
  
  console.log('Prețuri per companie:');
  Object.entries(pricesByCompany)
    .sort((a, b) => b[1] - a[1])
    .forEach(([company, count]) => {
      console.log(`  ${company}: ${count} prețuri`);
    });
  
  // Rezumat final
  console.log('\n=== Rezumat ===');
  const isValid = missingCells.length === 0 && inconsistentCells.length === 0 && invalidPrices.length === 0;
  
  if (isValid) {
    console.log('✅ Datele sunt valide și complete!');
    console.log('✅ Structura este compatibilă cu aplicația');
    console.log('\nUrmătorul pas: Rulează convert-collected-data.js pentru a converti datele');
  } else {
    console.log('⚠️  Datele au probleme:');
    if (missingCells.length > 0) console.log(`  - ${missingCells.length} celule lipsă`);
    if (inconsistentCells.length > 0) console.log(`  - ${inconsistentCells.length} celule incomplete`);
    if (invalidPrices.length > 0) console.log(`  - ${invalidPrices.length} prețuri invalide`);
  }
  
  return {
    isValid,
    companies: Array.from(allCompanies),
    cellIds: Array.from(allCellIds),
    expectedCells: Array.from(expectedCells),
    missingCells,
    inconsistentCells,
    invalidPrices,
    stats: {
      totalCompanies: allCompanies.size,
      totalCells: allCellIds.size,
      expectedCells: expectedCells.size,
      totalPrices
    }
  };
}

// Rulează validarea
validateData();

export { validateData };

