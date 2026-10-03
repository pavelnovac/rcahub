/**
 * Script to convert rca_bnm_premiums_2026.json to all_companies_2026.json format
 * 
 * Input format (from browser export):
 * {
 *   "BM_7": {
 *     "A1_CH_PF_AGE_LT23_EXP_LT2": {
 *       "ACORD GRUP S.A.": 4641.4,
 *       "ASTERRA GRUP S.A.": 5800.41,
 *       ...
 *     },
 *     ...
 *   }
 * }
 * 
 * Output format (for app):
 * [
 *   {
 *     "company_id": "acord_grup_s_a",
 *     "company_name": "ACORD GRUP S.A.",
 *     "is_reference": false,
 *     "premiums": [
 *       { "cell_id": "A1_CH_PF_AGE_LT23_EXP_LT2", "value": 4641.4 },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2)
const inputPath = path.resolve(args[0] || path.join(__dirname, '..', 'data', 'rca_bnm_premiums_2026.json'))
const outputPath = path.resolve(args[1] || path.join(__dirname, '..', 'public', 'all_companies_2026.json'))

console.log('📂 Reading input file:', inputPath);
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Get the BM_7 data (standard bonus-malus level)
const bmData = inputData.BM_7;

if (!bmData) {
  console.error('❌ Error: BM_7 key not found in input data');
  process.exit(1);
}

// Păstrează identitatea folosită în seturile anterioare, ca filtrarea
// și comparația între perioade să potrivească aceeași companie.
const COMPANY_ALIASES = {
  'MOLDASIG VIENNA INSURANCE GROUP S.A.': 'MOLDASIG S.A.'
}

function canonicalCompanyName(name) {
  return COMPANY_ALIASES[name] || name
}

// Helper function to convert company name to ID
function companyNameToId(name) {
  return canonicalCompanyName(name)
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Collect all companies and their premiums
const companiesMap = new Map();

for (const [cellId, companiesData] of Object.entries(bmData)) {
  for (const [rawCompanyName, value] of Object.entries(companiesData)) {
    const companyName = canonicalCompanyName(rawCompanyName);
    const companyId = companyNameToId(companyName);
    
    if (!companiesMap.has(companyId)) {
      companiesMap.set(companyId, {
        company_id: companyId,
        company_name: companyName,
        is_reference: false,
        premiums: []
      });
    }
    
    companiesMap.get(companyId).premiums.push({
      cell_id: cellId,
      value: value
    });
  }
}

// Convert map to array
const companies = Array.from(companiesMap.values());

// Sort companies by name
companies.sort((a, b) => a.company_name.localeCompare(b.company_name));

// Sort premiums within each company by cell_id
companies.forEach(company => {
  company.premiums.sort((a, b) => a.cell_id.localeCompare(b.cell_id));
});

// Write output file
console.log(`📝 Writing output file: ${outputPath}`);
fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));

console.log('');
console.log('✅ Conversion complete!');
console.log('');
console.log('📊 Summary:');
console.log(`   Companies: ${companies.length}`);
companies.forEach(company => {
  console.log(`   - ${company.company_name}: ${company.premiums.length} premiums`);
});

console.log('');
console.log('📁 Output file:', outputPath);

