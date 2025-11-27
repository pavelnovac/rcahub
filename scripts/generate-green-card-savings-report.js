/**
 * Script to generate a report showing how much money clients saved
 * by buying Green Card insurance before the price increase.
 * 
 * For each Green Card purchase:
 * 1. Determine the zone (1 or 3) and category (A, B, C1, C2, E1, E2, F)
 * 2. Get the old price from the purchase (in MDL)
 * 3. Compare with the minimal current price for that zone and category
 * 4. Calculate savings = old price - new price
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal current prices by zone and category (in MDL) - for 15 days
const minimalPrices = {
    1: { // Zone 1
        'A': 34.47,      // Autoturisme
        'C1': 42.79,     // Camioane < 3.5 tone
        'C2': 81.02,     // Camioane și tractoare > 3.5 tone
        'E1': 230.38,    // Transport de persoane < 17 locuri
        'E2': 378.15,    // Transport de persoane > 17 locuri
        'B': 40.81,      // Motociclete
        'F': null        // Remorca - 10% din costul asigurarii vehiculului care tracteaza remorca
    },
    3: { // Zone 3
        'A': 692.12,     // Autoturisme
        'C1': 2116.58,   // Camioane < 3.5 tone
        'C2': 1071.66,   // Camioane și tractoare > 3.5 tone
        'E1': 1324.42,   // Transport de persoane < 17 locuri
        'E2': 2163.13,   // Transport de persoane > 17 locuri
        'B': 658.84,     // Motociclete
        'F': null        // Remorca - 10% din costul asigurarii vehiculului care tracteaza remorca
    }
};

// Duration coefficients - prices are for 15 days, need to multiply by coefficient for other durations
const durationCoefficients = {
    '15 zile': 0.1,
    '1 lună': 0.2,
    '1 luna': 0.2,
    '2 luni': 0.3,
    '3 luni': 0.4,
    '4 luni': 0.5,
    '5 luni': 0.6,
    '6 luni': 0.7,
    '7 luni': 0.8,
    '8 luni': 0.85,
    '9 luni': 0.9,
    '10 luni': 1,
    '11 luni': 1,
    '12 luni': 1
};

/**
 * Get Green Card category from greenCardVehiclesType
 * The code is already in the correct format (A, B, C1, C2, E1, E2, F)
 */
function getGreenCardCategory(response) {
    const greenCardVehiclesType = response?.greenCardVehiclesType;
    if (!greenCardVehiclesType) {
        return null;
    }
    
    const code = greenCardVehiclesType.code;
    
    // The code is already in the correct format
    // A = Autoturisme
    // B = Motociclete
    // C1 = Camioane < 3.5 tone
    // C2 = Camioane și tractoare > 3.5 tone
    // E1 = Transport de persoane < 17 locuri
    // E2 = Transport de persoane > 17 locuri
    // F = Remorca
    
    return code || null;
}

/**
 * Get zone from greenCardArea
 */
function getZone(response) {
    const greenCardArea = response?.greenCardArea;
    if (!greenCardArea) {
        return null;
    }
    
    const areaId = greenCardArea.id;
    const name = (greenCardArea.name || '').toLowerCase();
    
    // Zone 1: id = 1, "Zona 1 - Ucraina si Belarus"
    // Zone 3: id = 3, "Zona 3 - Toate tarile sistemului carte verde"
    if (areaId === 1 || name.includes('zona 1') || name.includes('ucraina') || name.includes('belarus')) {
        return 1;
    }
    if (areaId === 3 || name.includes('zona 3') || name.includes('toate tarile')) {
        return 3;
    }
    
    return areaId || null;
}

/**
 * Get price in MDL from the purchase
 */
function getPriceInMDL(response) {
    // First try totalPrimeSumLei (already in MDL)
    if (response.totalPrimeSumLei !== undefined && response.totalPrimeSumLei !== null) {
        return parseFloat(response.totalPrimeSumLei);
    }
    
    // Otherwise convert from EUR using exchangeRate
    const primeSum = parseFloat(response.totalPrimeSum || response.primeSum || 0);
    const exchangeRate = parseFloat(response.exchangeRate || 1);
    
    if (primeSum > 0 && exchangeRate > 0) {
        return primeSum * exchangeRate;
    }
    
    return 0;
}

/**
 * Get duration coefficient from term insurance period
 */
function getDurationCoefficient(response) {
    const termCoefficient = response?.termInsuranceCoefficient;
    if (!termCoefficient) {
        // Default to 15 days if not specified
        return durationCoefficients['15 zile'] || 0.1;
    }
    
    const period = termCoefficient.termInsurancePeriod;
    if (!period) {
        // Default to 15 days if not specified
        return durationCoefficients['15 zile'] || 0.1;
    }
    
    // Normalize the period string (handle variations like "1 luna" vs "1 lună")
    const normalizedPeriod = period.toLowerCase().trim();
    
    // Try exact match first
    if (durationCoefficients[normalizedPeriod] !== undefined) {
        return durationCoefficients[normalizedPeriod];
    }
    
    // Try to match by number of months/days
    const daysMonthsNumber = termCoefficient.daysMonthsNumber;
    const isDays = termCoefficient.isDays;
    
    if (isDays) {
        // For days, map to "15 zile" coefficient
        if (daysMonthsNumber <= 15) {
            return durationCoefficients['15 zile'] || 0.1;
        }
        // For other day periods, approximate
        return durationCoefficients['15 zile'] || 0.1;
    } else {
        // For months, map to the appropriate coefficient
        if (daysMonthsNumber === 1) {
            return durationCoefficients['1 luna'] || 0.2;
        } else if (daysMonthsNumber === 2) {
            return durationCoefficients['2 luni'] || 0.3;
        } else if (daysMonthsNumber === 3) {
            return durationCoefficients['3 luni'] || 0.4;
        } else if (daysMonthsNumber === 4) {
            return durationCoefficients['4 luni'] || 0.5;
        } else if (daysMonthsNumber === 5) {
            return durationCoefficients['5 luni'] || 0.6;
        } else if (daysMonthsNumber === 6) {
            return durationCoefficients['6 luni'] || 0.7;
        } else if (daysMonthsNumber === 7) {
            return durationCoefficients['7 luni'] || 0.8;
        } else if (daysMonthsNumber === 8) {
            return durationCoefficients['8 luni'] || 0.85;
        } else if (daysMonthsNumber === 9) {
            return durationCoefficients['9 luni'] || 0.9;
        } else if (daysMonthsNumber >= 10) {
            return durationCoefficients['10 luni'] || 1;
        }
    }
    
    // Default to 15 days if we can't determine
    return durationCoefficients['15 zile'] || 0.1;
}

/**
 * Get minimal price for zone and category (for 15 days)
 */
function getMinimalPrice(zone, category) {
    if (!zone || !category) {
        return null;
    }
    
    const zonePrices = minimalPrices[zone];
    if (!zonePrices) {
        return null;
    }
    
    const price = zonePrices[category];
    
    // F (Remorca) is special - 10% of towing vehicle price
    // We can't calculate it without knowing the towing vehicle
    if (category === 'F' && price === null) {
        return null;
    }
    
    return price;
}

/**
 * Process Green Card purchase and calculate savings
 */
function processGreenCardPurchase(purchase) {
    const response = purchase.rca_data?.response;
    
    if (!response) {
        return null;
    }
    
    // Extract data
    const oldPrice = getPriceInMDL(response);
    const zone = getZone(response);
    const category = getGreenCardCategory(response);
    
    const person = response.person || response.persons?.person;
    const vehicle = response.vehicle;
    
    if (!person || !vehicle || oldPrice === 0 || !zone || !category) {
        return {
            success: false,
            error: `Missing data: zone=${zone}, category=${category}, oldPrice=${oldPrice}`,
            contractNumber: response.contractNumber,
            oldPrice
        };
    }
    
    // Get minimal price for this zone and category (for 15 days)
    const minimalPrice15Days = getMinimalPrice(zone, category);
    
    if (minimalPrice15Days === null) {
        return {
            success: false,
            error: `No minimal price found for zone ${zone}, category ${category}`,
            zone,
            category,
            contractNumber: response.contractNumber,
            oldPrice
        };
    }
    
    // Get duration coefficient for this purchase
    const durationCoeff = getDurationCoefficient(response);
    
    // Calculate new price: minimal price for 15 days * duration coefficient
    // Note: The minimal prices are for 15 days, so we need to scale them
    // If durationCoeff is 0.1 (15 days), price stays the same
    // If durationCoeff is 0.2 (1 month), price is 2x
    // If durationCoeff is 1.0 (12 months), price is 10x
    const newPrice = minimalPrice15Days * (durationCoeff / 0.1);
    const savings = oldPrice - newPrice;
    
    // Get term period for reporting
    const termPeriod = response?.termInsuranceCoefficient?.termInsurancePeriod || '15 zile';
    
    return {
        success: true,
        contractNumber: response.contractNumber,
        personName: response.personName || person.fullName,
        personalCode: person.personalCode || '',
        zone,
        category,
        vehicle: {
            markName: vehicle.markName || '',
            model: vehicle.model || '',
            registrationNumber: vehicle.registrationNumber || '',
            registrationCertificateNumber: vehicle.registrationCertificateNumber || ''
        },
        oldPrice,
        newPrice,
        savings,
        termPeriod,
        durationCoefficient: durationCoeff,
        minimalPrice15Days,
        greenCardArea: response.greenCardArea?.name || '',
        greenCardCategory: response.greenCardVehiclesType?.name || ''
    };
}

/**
 * Generate report
 */
async function generateReport() {
    console.log('Loading Green Card data file...');
    
    // Load Green Card insurance purchases
    const greenCardDataPath = path.join(__dirname, '..', 'data', 'omnis_public_app_green_card.json');
    const greenCardDataContent = await fs.readFile(greenCardDataPath, 'utf-8');
    const greenCardPurchases = JSON.parse(greenCardDataContent);
    
    console.log(`Processing ${greenCardPurchases.length} Green Card insurance purchases...`);
    
    const results = [];
    const errors = [];
    let totalSavings = 0;
    let totalOldPrice = 0;
    let totalNewPrice = 0;
    
    for (const purchase of greenCardPurchases) {
        const result = processGreenCardPurchase(purchase);
        
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
    const combinedReport = {
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
    const decreasedReportPath = path.join(__dirname, '..', 'data', 'green_card_savings_report_decreased.json');
    const increasedReportPath = path.join(__dirname, '..', 'data', 'green_card_savings_report_increased.json');
    const combinedReportPath = path.join(__dirname, '..', 'data', 'green_card_savings_report.json');
    
    await fs.writeFile(decreasedReportPath, JSON.stringify(decreasedReport, null, 2), 'utf-8');
    await fs.writeFile(increasedReportPath, JSON.stringify(increasedReport, null, 2), 'utf-8');
    await fs.writeFile(combinedReportPath, JSON.stringify(combinedReport, null, 2), 'utf-8');
    
    // Generate CSV reports
    const generateCSV = (data, header) => {
        const lines = [header];
        for (const result of data) {
            lines.push(
                `"${result.contractNumber}","${result.personName}","${result.personalCode || ''}","${result.zone}","${result.category}","${result.termPeriod || ''}","${result.greenCardArea || ''}","${result.greenCardCategory || ''}",${result.oldPrice},${result.newPrice},${result.savings}`
            );
        }
        return lines.join('\n');
    };
    
    const csvHeader = 'Contract Number,Person Name,Personal Code,Zone,Category,Term Period,Green Card Area,Green Card Category,Old Price,New Price,Savings';
    
    const decreasedCsvPath = path.join(__dirname, '..', 'data', 'green_card_savings_report_decreased.csv');
    const increasedCsvPath = path.join(__dirname, '..', 'data', 'green_card_savings_report_increased.csv');
    const combinedCsvPath = path.join(__dirname, '..', 'data', 'green_card_savings_report.csv');
    
    await fs.writeFile(decreasedCsvPath, generateCSV(decreasedPrices, csvHeader), 'utf-8');
    await fs.writeFile(increasedCsvPath, generateCSV(increasedPrices, csvHeader), 'utf-8');
    await fs.writeFile(combinedCsvPath, generateCSV(results, csvHeader), 'utf-8');
    
    // Print summary
    console.log('\n=== GREEN CARD SAVINGS REPORT SUMMARY ===');
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
        console.log(`  ${i + 1}. ${r.personName} - ${(r.newPrice - r.oldPrice).toFixed(2)} MDL (Old: ${r.oldPrice.toFixed(2)}, New: ${r.newPrice.toFixed(2)})`);
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
    await fs.copyFile(decreasedReportPath, path.join(publicDataDir, 'green_card_savings_report_decreased.json'));
    await fs.copyFile(increasedReportPath, path.join(publicDataDir, 'green_card_savings_report_increased.json'));
    await fs.copyFile(combinedReportPath, path.join(publicDataDir, 'green_card_savings_report.json'));
    console.log(`  - Copied to public/data/ for web dashboard`);
    
    if (errors.length > 0) {
        console.log(`\nWarnings: ${errors.length} purchases could not be processed. Check errors in report.`);
        console.log(`\nSample errors:`);
        for (let i = 0; i < Math.min(10, errors.length); i++) {
            console.log(`  - ${errors[i].error}`);
        }
    }
}

// Run the script
generateReport().catch(console.error);

