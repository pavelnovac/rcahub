/**
 * Script pentru verificarea că toate combinațiile necesare sunt colectate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RCA_CELLS_FILE = path.join(__dirname, '..', 'rca_cells.json');
const RCA_BNM_CELLS_FILE = path.join(__dirname, '..', 'rca_bnm_cells.json');

function verifyCombinations() {
  console.log('=== Verificare Combinații Necesare ===\n');
  
  // Citește configurația
  const rcaCells = JSON.parse(fs.readFileSync(RCA_CELLS_FILE, 'utf-8'));
  const bnmCells = JSON.parse(fs.readFileSync(RCA_BNM_CELLS_FILE, 'utf-8'));
  
  const vehicles = rcaCells.vehicles;
  const territories = rcaCells.territories;
  const personCategories = rcaCells.person_categories;
  
  // Extrage toate celulele din rca_bnm_cells.json
  const expectedCells = new Set();
  bnmCells.premiums.forEach(premium => {
    expectedCells.add(premium.cell_id);
  });
  
  console.log(`Celule din rca_bnm_cells.json: ${expectedCells.size}`);
  
  // Generează toate combinațiile așteptate
  const generatedCells = new Set();
  
  vehicles.forEach(vehicle => {
    territories.forEach(territory => {
      if (vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') {
        // Doar pentru persoane juridice
        generatedCells.add(`${vehicle.vehicle_id}_${territory.territory_id}_PJ`);
      } else {
        // Pentru toate categoriile
        personCategories.forEach(personCat => {
          generatedCells.add(`${vehicle.vehicle_id}_${territory.territory_id}_${personCat.person_category_id}`);
        });
      }
    });
  });
  
  console.log(`Combinații generate: ${generatedCells.size}`);
  
  // Compară
  console.log('\n=== Comparație ===');
  
  const missingInGenerated = Array.from(expectedCells).filter(cell => !generatedCells.has(cell));
  const extraInGenerated = Array.from(generatedCells).filter(cell => !expectedCells.has(cell));
  
  if (missingInGenerated.length > 0) {
    console.log(`\n⚠️  Celule din rca_bnm_cells.json care NU sunt generate (${missingInGenerated.length}):`);
    missingInGenerated.forEach(cell => console.log(`  - ${cell}`));
  } else {
    console.log(`\n✓ Toate celulele din rca_bnm_cells.json sunt generate`);
  }
  
  if (extraInGenerated.length > 0) {
    console.log(`\n⚠️  Celule generate care NU sunt în rca_bnm_cells.json (${extraInGenerated.length}):`);
    extraInGenerated.forEach(cell => console.log(`  - ${cell}`));
  } else {
    console.log(`\n✓ Nu există celule extra generate`);
  }
  
  // Verifică specific pentru A7 și B4
  console.log('\n=== Verificare A7 (Taxi) și B4 (Troleibuze) ===');
  
  const a7Cells = Array.from(generatedCells).filter(cell => cell.startsWith('A7_'));
  const b4Cells = Array.from(generatedCells).filter(cell => cell.startsWith('B4_'));
  
  console.log(`Celule A7 generate: ${a7Cells.length}`);
  a7Cells.forEach(cell => console.log(`  - ${cell}`));
  
  console.log(`\nCelule B4 generate: ${b4Cells.length}`);
  b4Cells.forEach(cell => console.log(`  - ${cell}`));
  
  // Verifică dacă sunt doar PJ
  const a7NonPJ = a7Cells.filter(cell => !cell.endsWith('_PJ'));
  const b4NonPJ = b4Cells.filter(cell => !cell.endsWith('_PJ'));
  
  if (a7NonPJ.length > 0) {
    console.log(`\n⚠️  A7 are celule non-PJ: ${a7NonPJ.join(', ')}`);
  } else {
    console.log(`\n✓ A7 are doar celule PJ`);
  }
  
  if (b4NonPJ.length > 0) {
    console.log(`\n⚠️  B4 are celule non-PJ: ${b4NonPJ.join(', ')}`);
  } else {
    console.log(`\n✓ B4 are doar celule PJ`);
  }
  
  // Verifică dacă sunt pentru ambele teritorii
  const a7CH = a7Cells.filter(cell => cell.includes('_CH_'));
  const a7AL = a7Cells.filter(cell => cell.includes('_AL_'));
  const b4CH = b4Cells.filter(cell => cell.includes('_CH_'));
  const b4AL = b4Cells.filter(cell => cell.includes('_AL_'));
  
  console.log(`\nA7: CH=${a7CH.length}, AL=${a7AL.length}`);
  console.log(`B4: CH=${b4CH.length}, AL=${b4AL.length}`);
  
  if (a7CH.length === 1 && a7AL.length === 1 && b4CH.length === 1 && b4AL.length === 1) {
    console.log(`\n✓ A7 și B4 au celule pentru ambele teritorii`);
  } else {
    console.log(`\n⚠️  A7 sau B4 nu au celule pentru ambele teritorii`);
  }
  
  // Rezumat
  console.log('\n=== Rezumat ===');
  const isComplete = 
    missingInGenerated.length === 0 &&
    a7CH.length === 1 && a7AL.length === 1 &&
    b4CH.length === 1 && b4AL.length === 1 &&
    a7NonPJ.length === 0 && b4NonPJ.length === 0;
  
  if (isComplete) {
    console.log('✅ Toate combinațiile necesare sunt generate corect!');
    console.log(`✅ Total: ${generatedCells.size} celule`);
    console.log(`   - A7 (Taxi): ${a7Cells.length} celule (CH + AL, doar PJ)`);
    console.log(`   - B4 (Troleibuze): ${b4Cells.length} celule (CH + AL, doar PJ)`);
  } else {
    console.log('⚠️  Există probleme cu combinațiile generate');
  }
  
  return {
    isComplete,
    expectedCells: Array.from(expectedCells),
    generatedCells: Array.from(generatedCells),
    missingInGenerated,
    extraInGenerated,
    a7Cells,
    b4Cells
  };
}

verifyCombinations();

export { verifyCombinations };




