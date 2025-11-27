/**
 * Script to generate a report showing how much money clients saved
 * by buying insurance before the price increase.
 * 
 * For each insurance purchase:
 * 1. Determine the category based on vehicle, territory, and person characteristics
 * 2. Find the minimum price from all companies for that category in the new prices (BM_7)
 * 3. Apply the bonus malus coefficient to get the final new price
 * 4. Calculate savings = old price - new price
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bonus Malus coefficients
const bonusMalusCoefficients = {
    0: 2.5,
    1: 2.2,
    2: 1.9,
    3: 1.6,
    4: 1.45,
    5: 1.3,
    6: 1.15,
    7: 1.0,
    8: 0.95,
    9: 0.9,
    10: 0.85,
    11: 0.8,
    12: 0.75,
    13: 0.7,
    14: 0.65,
    15: 0.6,
    16: 0.55,
    17: 0.5
};

/**
 * Determine vehicle category from vehicleTypeId and vehicleSubtype.name
 * A1-A6 = passenger cars by engine capacity
 * A8 = electric vehicles
 * B1-B4 = passenger transport vehicles (buses by seat count)
 * C1-C3 = tractors by HP
 * D1-D3 = trucks (goods transport vehicles) by weight
 * E1-E2 = motorcycles
 */
function getVehicleCategory(vehicle) {
    const vehicleTypeId = vehicle?.vehicleTypeId || vehicle?.vehicleType?.id;
    const vehicleSubtype = vehicle?.vehicleSubtype || {};
    const vehicleSubtypeName = (vehicleSubtype?.name || '').toLowerCase();
    const vehicleSubtypeId = vehicleSubtype?.id;
    
    // Check vehicle type first to identify trucks (goods transport vehicles)
    // Vehicle Type IDs for trucks: 1048 (AUTOVEHICUL PENTRU TRANSPORTUL MARFURILOR <=3,5T), 1 (Autocamion), 15 (Pasager marfar), 967, 962
    const truckVehicleTypeIds = [1048, 1, 15, 967, 962];
    
    if (truckVehicleTypeIds.includes(vehicleTypeId)) {
        // Trucks (D1-D3) - by weight
        if (vehicleSubtypeName.includes('pina la 3500 kg') || vehicleSubtypeName.includes('până la 3500')) {
            return 'D1';
        }
        if (vehicleSubtypeName.includes('3501-12000') || vehicleSubtypeName.includes('3501 - 12000')) {
            return 'D2';
        }
        if (vehicleSubtypeName.includes('peste 12000') || vehicleSubtypeName.includes('over 12000')) {
            return 'D3';
        }
        // Fallback for trucks by subtype ID
        if (vehicleSubtypeId === 24) return 'D1';  // pina la 3500 kg
        if (vehicleSubtypeId === 25) return 'D2';  // 3501-12000 kg
        if (vehicleSubtypeId === 30) return 'D3';  // peste 12000 kg
    }
    
    // Check for tractors (vehicle type 997, 994, 998, 17)
    // Tractors should be C1-C3 (not D1-D3)
    const tractorVehicleTypeIds = [997, 994, 998, 17];
    if (tractorVehicleTypeIds.includes(vehicleTypeId)) {
        // Tractors (C1-C3) - by HP
        if (vehicleSubtypeName.includes('pina la 45 cp') || vehicleSubtypeName.includes('până la 45')) {
            return 'C1';
        }
        if (vehicleSubtypeName.includes('46 cp') && vehicleSubtypeName.includes('100 cp')) {
            return 'C2';
        }
        if (vehicleSubtypeName.includes('peste 100 cp') || vehicleSubtypeName.includes('over 100')) {
            return 'C3';
        }
        // Fallback for tractors by subtype ID
        if (vehicleSubtypeId === 13) return 'C1';  // pina la 45 CP
        if (vehicleSubtypeId === 14) return 'C2';  // 46-100 CP
        if (vehicleSubtypeId === 15) return 'C3';  // peste 100 CP
    }
    
    // Passenger cars (A1-A6, A8) - vehicle types 1045, 7, 938, 937
    if (vehicleSubtypeName.includes('pina la 1200') || vehicleSubtypeName.includes('până la 1200')) {
        return 'A1';
    }
    if (vehicleSubtypeName.includes('1201-1600') || vehicleSubtypeName.includes('1201 - 1600')) {
        return 'A2';
    }
    if (vehicleSubtypeName.includes('1601-2000') || vehicleSubtypeName.includes('1601 - 2000')) {
        return 'A3';
    }
    if (vehicleSubtypeName.includes('2001-2400') || vehicleSubtypeName.includes('2001 - 2400')) {
        return 'A4';
    }
    if (vehicleSubtypeName.includes('2401-3000') || vehicleSubtypeName.includes('2401 - 3000')) {
        return 'A5';
    }
    if (vehicleSubtypeName.includes('peste 3000') || vehicleSubtypeName.includes('over 3000')) {
        return 'A6';
    }
    if (vehicleSubtypeName.includes('cu motor electric') || vehicleSubtypeName.includes('electric')) {
        return 'A8';
    }
    
    // Buses (B1-B4) - vehicle type 1046 and other passenger transport vehicles
    // B1: 10-17 seats, B2: 18-30 seats, B3: >30 seats, B4: Trolleybuses
    if (vehicleTypeId === 1046) {
        // Check by subtype ID first (more reliable)
        if (vehicleSubtypeId === 9) return 'B1';  // Microbuze 10-17 persoane
        if (vehicleSubtypeId === 10) return 'B2'; // Autobuze 18-30 persoane
        if (vehicleSubtypeId === 11) return 'B3'; // Autobuze >30 persoane
        if (vehicleSubtypeId === 22) return 'B4'; // Troleibuze
        
        // Fallback by name
        if (vehicleSubtypeName.includes('18-30 persoane') || vehicleSubtypeName.includes('18 - 30')) {
            return 'B2';
        }
        if (vehicleSubtypeName.includes('troleibuz') || vehicleSubtypeName.includes('trolley')) {
            return 'B4';
        }
    }
    
    // Motorcycles (E1-E2) - vehicle types 1056, 1057, 931, 929, 917, 912, 24, 928, 916, 922, 1055, 903
    if (vehicleSubtypeName.includes('pina la 300 cm3') || vehicleSubtypeName.includes('până la 300')) {
        return 'E1';
    }
    if (vehicleSubtypeName.includes('peste 300 cm3') || vehicleSubtypeName.includes('over 300')) {
        return 'E2';
    }
    
    // Fallback by subtype ID if name doesn't match (only if vehicle type not already handled)
    const subtypeIdMap = {
        1: 'A1',   // pina la 1200 cm3
        2: 'A2',   // intre 1201-1600 cm3
        3: 'A3',   // intre 1601-2000 cm3
        4: 'A4',   // intre 2001-2400 cm3
        5: 'A5',   // intre 2401-3000 cm3
        6: 'A6',   // peste 3000 cm3
        9: 'B1',   // microbuze 10-17 persoane
        10: 'B2',  // autobuze 18-30 persoane
        11: 'B3',  // autobuze >30 persoane
        13: 'C1',  // tractoare pina la 45 CP
        14: 'C2',  // tractoare 46-100 CP
        15: 'C3',  // tractoare peste 100 CP
        20: 'E1',  // motociclete pina la 300 cm3
        21: 'E2',  // motociclete peste 300 cm3
        22: 'B4',  // troleibuze
        23: 'A8',  // cu motor electric
        24: 'D1',  // camioane pina la 3500 kg (trucks)
        25: 'D2',  // camioane 3501-12000 kg
        30: 'D3'   // camioane peste 12000 kg
    };
    
    if (vehicleSubtypeId && subtypeIdMap[vehicleSubtypeId]) {
        return subtypeIdMap[vehicleSubtypeId];
    }
    
    // Default to A2 (most common category)
    return 'A2';
}

/**
 * Determine territory code from territory rectification coefficient
 * CH = Chisinau region (territoryRectificationCoefficient = 1.4)
 * AL = Other localities (territoryRectificationCoefficient = 1.0)
 */
function getTerritoryCode(territory) {
    const coefficient = parseFloat(territory?.territoryRectificationCoefficient || 1);
    // If coefficient is greater than 1 (typically 1.4), it's Chisinau region
    if (coefficient > 1) {
        return 'CH';
    }
    return 'AL'; // Alte localitati ale tarii
}

/**
 * Determine person category from person data
 */
function getPersonCategory(person) {
    const isJuridical = person?.isJuridical || false;
    
    if (isJuridical) {
        return 'PJ';
    }
    
    // Physical person
    const age = person?.personAge || person?.age || 0;
    const experience = person?.drivingExperience || person?.drivingExperience || 0;
    
    if (age < 23) {
        if (experience < 2) {
            return 'PF_AGE_LT23_EXP_LT2';
        } else {
            return 'PF_AGE_LT23_EXP_GE2';
        }
    } else {
        if (experience < 2) {
            return 'PF_AGE_GE23_EXP_LT2';
        } else {
            return 'PF_AGE_GE23_EXP_GE2';
        }
    }
}

/**
 * Build category key from components
 */
function buildCategoryKey(vehicleCategory, territoryCode, personCategory) {
    return `${vehicleCategory}_${territoryCode}_${personCategory}`;
}

/**
 * Find minimum price for a category from all companies
 */
function findMinPriceForCategory(newPrices, categoryKey) {
    if (!newPrices.BM_7 || !newPrices.BM_7[categoryKey]) {
        return null;
    }
    
    const prices = newPrices.BM_7[categoryKey];
    const priceValues = Object.values(prices);
    
    if (priceValues.length === 0) {
        return null;
    }
    
    return Math.min(...priceValues);
}

/**
 * Process insurance purchase and calculate savings
 */
function processInsurancePurchase(purchase, newPrices) {
    const response = purchase.rca_data?.response;
    
    if (!response) {
        return null;
    }
    
    // Extract data
    const oldPrice = parseFloat(response.totalPrimeSum || response.primeSum || 0);
    const bonusMalusClass = response.bonusMalusClass;
    const person = response.person || response.persons?.person;
    const vehicle = response.vehicle;
    const territory = response.territory;
    const territoryName = territory?.name || '';
    
    if (!person || !vehicle || bonusMalusClass === undefined || oldPrice === 0) {
        return null;
    }
    
    // Determine category using territory rectification coefficient
    const vehicleCategory = getVehicleCategory(vehicle);
    const territoryCode = getTerritoryCode(territory);
    const personCategory = getPersonCategory(person);
    const categoryKey = buildCategoryKey(vehicleCategory, territoryCode, personCategory);
    
    // Find minimum base price for this category
    const minBasePrice = findMinPriceForCategory(newPrices, categoryKey);
    
    if (minBasePrice === null) {
        return {
            success: false,
            error: `Category not found: ${categoryKey}`,
            categoryKey,
            contractNumber: response.contractNumber,
            oldPrice
        };
    }
    
    // Apply bonus malus coefficient
    const coefficient = bonusMalusCoefficients[bonusMalusClass];
    if (!coefficient) {
        return {
            success: false,
            error: `Invalid bonus malus class: ${bonusMalusClass}`,
            categoryKey,
            contractNumber: response.contractNumber,
            oldPrice
        };
    }
    
    const newPrice = minBasePrice * coefficient;
    const savings = oldPrice - newPrice;
    
    return {
        success: true,
        contractNumber: response.contractNumber,
        personName: response.personName || person.fullName,
        personalCode: person.personalCode || '',
        territoryName,
        vehicle: {
            markName: vehicle.markName || '',
            model: vehicle.model || '',
            registrationNumber: vehicle.registrationNumber || '',
            registrationCertificateNumber: vehicle.registrationCertificateNumber || ''
        },
        oldPrice,
        newPrice,
        savings,
        bonusMalusClass,
        categoryKey,
        minBasePrice,
        coefficient
    };
}

/**
 * Generate report
 */
async function generateReport() {
    console.log('Loading data files...');
    
    // Load RCA insurance purchases
    const rcaDataPath = path.join(__dirname, '..', 'data', 'omnis_public_app_rca.json');
    const rcaDataContent = await fs.readFile(rcaDataPath, 'utf-8');
    const rcaPurchases = JSON.parse(rcaDataContent);
    
    // Load new prices
    const newPricesPath = path.join(__dirname, '..', 'data', 'rca_bnm_premiums_2026_new.json');
    const newPricesContent = await fs.readFile(newPricesPath, 'utf-8');
    const newPrices = JSON.parse(newPricesContent);
    
    console.log(`Processing ${rcaPurchases.length} insurance purchases...`);
    
    const results = [];
    const errors = [];
    let totalSavings = 0;
    let totalOldPrice = 0;
    let totalNewPrice = 0;
    
    for (const purchase of rcaPurchases) {
        const result = processInsurancePurchase(purchase, newPrices);
        
        if (result) {
            if (result.success) {
                results.push(result);
                totalSavings += result.savings;
                totalOldPrice += result.oldPrice;
                totalNewPrice += result.newPrice;
            } else {
                errors.push(result);
            }
        }
    }
    
    console.log(`\nProcessed ${results.length} successful calculations`);
    console.log(`Found ${errors.length} errors`);
    
    // Separate into increased and decreased prices
    // savings = oldPrice - newPrice
    // If newPrice > oldPrice: prices INCREASED (savings < 0, clients would pay more now)
    // If newPrice < oldPrice: prices DECREASED (savings > 0, clients saved by buying before)
    const increasedPrices = results.filter(r => r.newPrice > r.oldPrice); // Prices increased (newPrice > oldPrice)
    const decreasedPrices = results.filter(r => r.newPrice < r.oldPrice); // Prices decreased (newPrice < oldPrice)
    const noChange = results.filter(r => r.savings === 0);
    
    // Sort decreased prices by savings (descending - highest savings first)
    decreasedPrices.sort((a, b) => b.savings - a.savings);
    
    // Sort increased prices by savings (ascending - biggest increase first, most negative)
    increasedPrices.sort((a, b) => a.savings - b.savings);
    
    // Calculate statistics for decreased prices (would pay less now - prices went down)
    let decreasedTotalSavings = decreasedPrices.reduce((sum, r) => sum + r.savings, 0);
    let decreasedTotalOldPrice = decreasedPrices.reduce((sum, r) => sum + r.oldPrice, 0);
    let decreasedTotalNewPrice = decreasedPrices.reduce((sum, r) => sum + r.newPrice, 0);
    
    // Calculate statistics for increased prices (clients saved by buying before - prices went up)
    // savings = oldPrice - newPrice (negative), but clients SAVED (newPrice - oldPrice) by buying before
    let increasedTotalSavings = increasedPrices.reduce((sum, r) => sum + r.savings, 0);
    let increasedTotalOldPrice = increasedPrices.reduce((sum, r) => sum + r.oldPrice, 0);
    let increasedTotalNewPrice = increasedPrices.reduce((sum, r) => sum + r.newPrice, 0);
    
    // Calculate total savings from increased prices (clients saved by buying before price increase)
    // This is the amount clients saved = newPrice - oldPrice (positive value)
    let totalSavingsFromIncrease = increasedPrices.reduce((sum, r) => sum + (r.newPrice - r.oldPrice), 0);
    
    // Generate report for decreased prices (clients saved by buying before)
    const decreasedReport = {
        summary: {
            totalPurchases: decreasedPrices.length,
            totalOldPrice: Math.round(decreasedTotalOldPrice * 100) / 100,
            totalNewPrice: Math.round(decreasedTotalNewPrice * 100) / 100,
            totalSavings: Math.round(decreasedTotalSavings * 100) / 100,
            averageSavings: decreasedPrices.length > 0 ? Math.round((decreasedTotalSavings / decreasedPrices.length) * 100) / 100 : 0,
            errors: 0
        },
        topSavings: decreasedPrices.slice(0, 50),
        allResults: decreasedPrices
    };
    
    // Generate report for increased prices (clients saved by buying before)
    const increasedReport = {
        summary: {
            totalPurchases: increasedPrices.length,
            totalOldPrice: Math.round(increasedTotalOldPrice * 100) / 100,
            totalNewPrice: Math.round(increasedTotalNewPrice * 100) / 100,
            totalSavings: Math.round(totalSavingsFromIncrease * 100) / 100, // Amount clients saved by buying before
            averageSavings: increasedPrices.length > 0 ? Math.round((totalSavingsFromIncrease / increasedPrices.length) * 100) / 100 : 0,
            errors: 0
        },
        topIncreases: increasedPrices.slice(0, 50),
        allResults: increasedPrices
    };
    
    // Calculate total savings (from both decreased and increased prices)
    // For decreased: savings = oldPrice - newPrice (positive, but prices went down)
    // For increased: savings = newPrice - oldPrice (positive, clients saved by buying before)
    let totalSavingsCombined = decreasedTotalSavings + totalSavingsFromIncrease;
    
    // Calculate total loss (when prices decreased, clients would pay less now - this is a "loss" of opportunity)
    let totalLossFromDecrease = decreasedPrices.reduce((sum, r) => sum + (r.oldPrice - r.newPrice), 0);
    
    // Generate combined report
    const         combinedReport = {
        summary: {
            totalPurchases: results.length,
            totalOldPrice: Math.round(totalOldPrice * 100) / 100,
            totalNewPrice: Math.round(totalNewPrice * 100) / 100,
            totalSavings: Math.round(totalSavingsFromIncrease * 100) / 100, // Total saved by buying before price increases
            totalLoss: Math.round(totalLossFromDecrease * 100) / 100, // Total "loss" from prices decreasing (would pay less now)
            netSavings: Math.round(totalSavings * 100) / 100, // Net savings (can be negative)
            averageSavings: Math.round((totalSavingsFromIncrease / results.length) * 100) / 100,
            errors: errors.length,
            increasedCount: increasedPrices.length,
            decreasedCount: decreasedPrices.length,
            noChangeCount: noChange.length
        },
        decreased: decreasedReport,
        increased: increasedReport,
        errors: errors.slice(0, 100)
    };
    
    // Save reports
    const decreasedReportPath = path.join(__dirname, '..', 'data', 'savings_report_decreased.json');
    const increasedReportPath = path.join(__dirname, '..', 'data', 'savings_report_increased.json');
    const combinedReportPath = path.join(__dirname, '..', 'data', 'savings_report.json');
    
    await fs.writeFile(decreasedReportPath, JSON.stringify(decreasedReport, null, 2), 'utf-8');
    await fs.writeFile(increasedReportPath, JSON.stringify(increasedReport, null, 2), 'utf-8');
    await fs.writeFile(combinedReportPath, JSON.stringify(combinedReport, null, 2), 'utf-8');
    
    // Generate CSV reports
    const generateCSV = (data, header) => {
        const lines = [header];
        for (const result of data) {
            lines.push(
                `"${result.contractNumber}","${result.personName}","${result.personalCode || ''}","${result.territoryName || ''}",${result.oldPrice},${result.newPrice},${result.savings},${result.bonusMalusClass},"${result.categoryKey}"`
            );
        }
        return lines.join('\n');
    };
    
    const csvHeader = 'Contract Number,Person Name,Personal Code,Territory,Old Price,New Price,Savings,Bonus Malus Class,Category';
    
    const decreasedCsvPath = path.join(__dirname, '..', 'data', 'savings_report_decreased.csv');
    const increasedCsvPath = path.join(__dirname, '..', 'data', 'savings_report_increased.csv');
    const combinedCsvPath = path.join(__dirname, '..', 'data', 'savings_report.csv');
    
    await fs.writeFile(decreasedCsvPath, generateCSV(decreasedPrices, csvHeader), 'utf-8');
    await fs.writeFile(increasedCsvPath, generateCSV(increasedPrices, csvHeader), 'utf-8');
    await fs.writeFile(combinedCsvPath, generateCSV(results, csvHeader), 'utf-8');
    
    // Print summary
    console.log('\n=== SAVINGS REPORT SUMMARY ===');
    console.log(`Total Purchases: ${results.length}`);
    console.log(`  - Prices Increased (Clients Saved): ${increasedPrices.length}`);
    console.log(`  - Prices Decreased: ${decreasedPrices.length}`);
    console.log(`  - No Change: ${noChange.length}`);
    console.log(`\nTotal Old Price: ${combinedReport.summary.totalOldPrice.toFixed(2)} MDL`);
    console.log(`Total New Price: ${combinedReport.summary.totalNewPrice.toFixed(2)} MDL`);
    console.log(`Net Savings: ${combinedReport.summary.netSavings.toFixed(2)} MDL`);
    console.log(`Total Savings (Clients Saved by Buying Before): ${combinedReport.summary.totalSavings.toFixed(2)} MDL`);
    console.log(`Total Loss (Prices Decreased - Would Pay Less Now): ${combinedReport.summary.totalLoss.toFixed(2)} MDL`);
    
    console.log(`\n=== PRICES DECREASED (Would Pay Less Now) ===`);
    console.log(`Count: ${decreasedPrices.length}`);
    console.log(`Total Difference: ${decreasedReport.summary.totalSavings.toFixed(2)} MDL (would pay less now)`);
    console.log(`Average Difference: ${decreasedReport.summary.averageSavings.toFixed(2)} MDL`);
    console.log(`\nTop 10 Savings:`);
    for (let i = 0; i < Math.min(10, decreasedPrices.length); i++) {
        const r = decreasedPrices[i];
        console.log(`  ${i + 1}. ${r.personName} - ${r.savings.toFixed(2)} MDL (Old: ${r.oldPrice.toFixed(2)}, New: ${r.newPrice.toFixed(2)})`);
    }
    
    console.log(`\n=== PRICES INCREASED (Clients Saved by Buying Before) ===`);
    console.log(`Count: ${increasedPrices.length}`);
    console.log(`Total Savings: ${increasedReport.summary.totalSavings.toFixed(2)} MDL`);
    console.log(`Average Savings: ${increasedReport.summary.averageSavings.toFixed(2)} MDL`);
    console.log(`\nTop 10 Increases:`);
    for (let i = 0; i < Math.min(10, increasedPrices.length); i++) {
        const r = increasedPrices[i];
        console.log(`  ${i + 1}. ${r.personName} - ${r.savings.toFixed(2)} MDL (Old: ${r.oldPrice.toFixed(2)}, New: ${r.newPrice.toFixed(2)})`);
    }
    
    console.log(`\nReports saved to:`);
    console.log(`  - ${decreasedReportPath}`);
    console.log(`  - ${increasedReportPath}`);
    console.log(`  - ${combinedReportPath}`);
    console.log(`  - ${decreasedCsvPath}`);
    console.log(`  - ${increasedCsvPath}`);
    console.log(`  - ${combinedCsvPath}`);
    
    // Copy files to public/data for web dashboard
    const publicDataDir = path.join(__dirname, '..', 'public', 'data');
    await fs.mkdir(publicDataDir, { recursive: true });
    await fs.copyFile(decreasedReportPath, path.join(publicDataDir, 'savings_report_decreased.json'));
    await fs.copyFile(increasedReportPath, path.join(publicDataDir, 'savings_report_increased.json'));
    await fs.copyFile(combinedReportPath, path.join(publicDataDir, 'savings_report.json'));
    await fs.copyFile(
        path.join(__dirname, '..', 'data', 'omnis_public_app_rca.json'),
        path.join(publicDataDir, 'omnis_public_app_rca.json')
    );
    console.log(`  - Copied to public/data/ for web dashboard`);
    
    if (errors.length > 0) {
        console.log(`\nWarnings: ${errors.length} purchases could not be processed. Check errors in report.`);
    }
}

// Run the script
generateReport().catch(console.error);

