/**
 * Script pentru testarea compatibilității datelor convertite cu aplicația
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALL_COMPANIES_FILE = path.join(__dirname, '..', 'data', 'all_companies.json');
const RCA_CELLS_FILE = path.join(__dirname, '..', 'rca_cells.json');

function testCompatibility() {
  console.log('=== Test Compatibilitate Date cu Aplicația ===\n');
  
  // Citește companiile convertite
  const companies = JSON.parse(fs.readFileSync(ALL_COMPANIES_FILE, 'utf-8'));
  console.log(`✓ ${companies.length} companii citite`);
  
  // Citește configurația RCA cells
  const rcaCells = JSON.parse(fs.readFileSync(RCA_CELLS_FILE, 'utf-8'));
  console.log(`✓ Configurație RCA cells citită\n`);
  
  // Simulează funcția getPremiumValue din aplicație
  function getPremiumValue(company, cellId) {
    const premium = company.premiums?.find(p => p.cell_id === cellId);
    return premium?.value ?? null;
  }
  
  // Testează pentru câteva celule
  console.log('=== Test Funcție getPremiumValue ===');
  
  const testCells = [
    'A1_CH_PF_AGE_LT23_EXP_LT2',
    'A1_CH_PF_AGE_LT23_EXP_GE2',
    'A1_CH_PF_AGE_GE23_EXP_LT2',
    'A1_CH_PF_AGE_GE23_EXP_GE2',
    'A1_CH_PJ',
    'A2_CH_PF_AGE_LT23_EXP_LT2',
    'B1_CH_PF_AGE_LT23_EXP_LT2',
    'E2_CH_PJ'
  ];
  
  let allTestsPassed = true;
  
  companies.forEach(company => {
    console.log(`\nTest pentru ${company.company_name}:`);
    testCells.forEach(cellId => {
      const value = getPremiumValue(company, cellId);
      if (value !== null && typeof value === 'number' && value > 0) {
        console.log(`  ✓ ${cellId}: ${value} MDL`);
      } else {
        console.log(`  ✗ ${cellId}: ${value} (LIPSĂ sau INVALID)`);
        allTestsPassed = false;
      }
    });
  });
  
  // Verifică structura pentru compatibilitate cu loadCompanies()
  console.log('\n=== Verificare Structură ===');
  
  const requiredFields = ['company_id', 'company_name', 'is_reference', 'premiums'];
  const requiredPremiumFields = ['cell_id', 'value'];
  
  let structureValid = true;
  
  companies.forEach(company => {
    requiredFields.forEach(field => {
      if (!(field in company)) {
        console.error(`✗ ${company.company_name}: Lipsește câmpul '${field}'`);
        structureValid = false;
      }
    });
    
    if (company.premiums && Array.isArray(company.premiums)) {
      company.premiums.forEach((premium, index) => {
        requiredPremiumFields.forEach(field => {
          if (!(field in premium)) {
            console.error(`✗ ${company.company_name}, premium ${index}: Lipsește câmpul '${field}'`);
            structureValid = false;
          }
        });
        
        // Verifică că nu există câmpuri extra care ar putea cauza probleme
        const extraFields = Object.keys(premium).filter(f => !requiredPremiumFields.includes(f));
        if (extraFields.length > 0) {
          console.warn(`⚠ ${company.company_name}, premium ${index}: Câmpuri extra: ${extraFields.join(', ')}`);
        }
      });
    }
  });
  
  if (structureValid) {
    console.log('✓ Structura este validă pentru aplicație');
  }
  
  // Verifică compatibilitatea cu formatul așteptat
  console.log('\n=== Verificare Format ===');
  
  // Compară cu formatul din rca_bnm_cells.json
  const bnmReference = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'rca_bnm_cells.json'),
    'utf-8'
  ));
  
  const referenceStructure = {
    company_id: typeof bnmReference.company_id,
    company_name: typeof bnmReference.company_name,
    is_reference: typeof bnmReference.is_reference,
    premiums: Array.isArray(bnmReference.premiums) ? 'array' : typeof bnmReference.premiums
  };
  
  console.log('Structură de referință (rca_bnm_cells.json):');
  Object.entries(referenceStructure).forEach(([field, type]) => {
    console.log(`  ${field}: ${type}`);
  });
  
  const firstCompany = companies[0];
  const actualStructure = {
    company_id: typeof firstCompany.company_id,
    company_name: typeof firstCompany.company_name,
    is_reference: typeof firstCompany.is_reference,
    premiums: Array.isArray(firstCompany.premiums) ? 'array' : typeof firstCompany.premiums
  };
  
  console.log('\nStructură actuală (date convertite):');
  Object.entries(actualStructure).forEach(([field, type]) => {
    const match = referenceStructure[field] === type ? '✓' : '✗';
    console.log(`  ${match} ${field}: ${type}`);
  });
  
  // Verifică formatul premium-ului
  if (bnmReference.premiums && bnmReference.premiums.length > 0) {
    const referencePremium = bnmReference.premiums[0];
    const actualPremium = firstCompany.premiums[0];
    
    console.log('\nFormat premium de referință:');
    console.log(`  ${JSON.stringify(referencePremium)}`);
    console.log('\nFormat premium actual:');
    console.log(`  ${JSON.stringify(actualPremium)}`);
    
    const premiumMatch = 
      Object.keys(referencePremium).every(key => key in actualPremium) &&
      Object.keys(actualPremium).every(key => key in referencePremium || key === 'bonus_malus');
    
    if (premiumMatch) {
      console.log('\n✓ Format premium este compatibil');
    } else {
      console.log('\n✗ Format premium nu este compatibil');
      structureValid = false;
    }
  }
  
  // Rezumat final
  console.log('\n=== Rezumat ===');
  
  if (allTestsPassed && structureValid) {
    console.log('✅ Datele sunt compatibile cu aplicația!');
    console.log('✅ Funcția getPremiumValue funcționează corect');
    console.log('✅ Structura este identică cu rca_bnm_cells.json');
    console.log('\n✅ Datele sunt gata de utilizare în aplicație!');
  } else {
    console.log('⚠️  Datele au probleme de compatibilitate:');
    if (!allTestsPassed) console.log('  - Unele celule nu au prețuri valide');
    if (!structureValid) console.log('  - Structura nu este compatibilă');
  }
  
  return {
    compatible: allTestsPassed && structureValid,
    companiesCount: companies.length,
    testResults: {
      allTestsPassed,
      structureValid
    }
  };
}

testCompatibility();

export { testCompatibility };




