/**
 * Script pentru colectarea automată a prețurilor RCA de la calculatorul BNM
 * pentru toate clasele Bonus Malus (0-17) și toate configurațiile de vehicule/teritorii/categorii
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurație
const BNM_CALCULATOR_URL = 'https://rca.bnm.md/online';
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const BONUS_MALUS_CLASSES = Array.from({ length: 18 }, (_, i) => i); // 0-17

// Mapare pentru categorii de persoane
const PERSON_CATEGORIES = {
  'PF_AGE_LT23_EXP_LT2': {
    personType: 'fizica',
    age: 'Până la 23 de ani inclu iv',
    experience: 'Până la 2 de ani inclu iv'
  },
  'PF_AGE_LT23_EXP_GE2': {
    personType: 'fizica',
    age: 'Până la 23 de ani inclu iv',
    experience: 'De la 2 ani'
  },
  'PF_AGE_GE23_EXP_LT2': {
    personType: 'fizica',
    age: 'De la 23 ani',
    experience: 'Până la 2 de ani inclu iv'
  },
  'PF_AGE_GE23_EXP_GE2': {
    personType: 'fizica',
    age: 'De la 23 ani',
    experience: 'De la 2 ani'
  },
  'PJ': {
    personType: 'juridica',
    age: null,
    experience: null
  }
};

// Mapare pentru teritorii
const TERRITORIES = {
  'CH': 'Municipiul Chișinău',
  'AL': 'Alte localități'
};

// Mapare pentru vehicule (simplificat - va trebui completat cu toate opțiunile)
const VEHICLES = {
  'A1': { type: 'Autoturi me', capacity: 'Până la 1200 cm3' },
  'A2': { type: 'Autoturi me', capacity: 'De la 1201 până la 1600 cm3' },
  'A3': { type: 'Autoturi me', capacity: 'De la 1601 până la 2000 cm3' },
  'A4': { type: 'Autoturi me', capacity: 'De la 2001 până la 2400 cm3' },
  'A5': { type: 'Autoturi me', capacity: 'De la 2401 până la 3000 cm3' },
  'A6': { type: 'Autoturi me', capacity: 'Peste 3000 cm3' },
  'A7': { type: 'Autoturi me', capacity: null }, // Taxi
  'A8': { type: 'Autoturi me', capacity: null }, // Electric
  'B1': { type: 'Microbuze 10-17 per oane', capacity: null },
  'B2': { type: 'Autobuze 18-30 per oane', capacity: null },
  'B3': { type: 'Autobuze peste 30 per oane', capacity: null },
  'B4': { type: 'Troleibuze', capacity: null },
  'C1': { type: 'Tractoare', capacity: 'Până la 45 CP inclu iv' },
  'C2': { type: 'Tractoare', capacity: 'De la 46 până la 100 CP' },
  'C3': { type: 'Tractoare', capacity: 'Peste 100 CP' },
  'D1': { type: 'Camioane', capacity: 'Până la 3500 kg' },
  'D2': { type: 'Camioane', capacity: 'De la 3501 până la 12000 kg' },
  'D3': { type: 'Camioane', capacity: 'Peste 12000 kg' },
  'E1': { type: 'Motociclete', capacity: 'Păna la 300 cm3' },
  'E2': { type: 'Motociclete', capacity: 'Peste 300 cm3' }
};

/**
 * Așteaptă ca elementul să fie disponibil în pagină
 */
async function waitForElement(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Element ${selector} nu a fost găsit:`, error.message);
    return false;
  }
}

/**
 * Deschide calculatorul și completează formularul
 * IMPORTANT: Modificarea oricărui câmp declanșează calculul automat
 */
async function fillCalculatorForm(page, config) {
  const { bonusMalus, vehicle, territory, personCategory } = config;
  
  // Click pe butonul "Calculează acum" pentru a deschide dialogul
  const calcButton = await page.$('button:has-text("Calculează acum")');
  if (calcButton) {
    await calcButton.click();
    await page.waitForTimeout(1500);
  }

  // Așteaptă ca dialogul să fie complet încărcat
  await page.waitForSelector('[role="dialog"]', { visible: true });
  await page.waitForTimeout(500);

  const personType = PERSON_CATEGORIES[personCategory].personType;
  
  // Selectează tipul de persoană (Fizică/Juridică) - modificarea declanșează calculul
  if (personType === 'fizica') {
    // Click pe radio button "Fizică"
    await page.click('label:has-text("Fizică") input[type="radio"]');
  } else {
    // Click pe radio button "Juridică"
    await page.click('label:has-text("Juridică") input[type="radio"]');
  }
  await page.waitForTimeout(800); // Așteaptă calculul

  // Selectează teritoriul - modificarea declanșează calculul
  if (territory === 'CH') {
    await page.click('label:has-text("Moldova") input[type="radio"]');
  } else {
    await page.click('label:has-text("Alte  tate") input[type="radio"]');
  }
  await page.waitForTimeout(800); // Așteaptă calculul

  // Selectează vârsta (doar pentru persoane fizice) - modificarea declanșează calculul
  if (personType === 'fizica') {
    const ageOption = PERSON_CATEGORIES[personCategory].age;
    // Click pe combobox-ul vârstei
    const ageCombobox = await page.$('span[role="combobox"]:has-text("Până la 23")');
    if (ageCombobox) {
      await ageCombobox.click();
      await page.waitForTimeout(500);
      
      // Selectează opțiunea corectă din dropdown
      if (ageOption.includes('23')) {
        await page.click('li:has-text("Până la 23 de ani inclu iv")');
      } else {
        await page.click('li:has-text("De la 23 ani")');
      }
      await page.waitForTimeout(800); // Așteaptă calculul
    }
  }

  // Selectează vechimea (doar pentru persoane fizice) - modificarea declanșează calculul
  if (personType === 'fizica') {
    const expOption = PERSON_CATEGORIES[personCategory].experience;
    // Găsește combobox-ul vechimii (al doilea combobox pentru vârstă/vechime)
    const expComboboxes = await page.$$('span[role="combobox"]');
    if (expComboboxes.length >= 2) {
      await expComboboxes[1].click();
      await page.waitForTimeout(500);
      
      // Selectează opțiunea corectă
      if (expOption.includes('2')) {
        await page.click('li:has-text("Până la 2 de ani inclu iv")');
      } else {
        await page.click('li:has-text("De la 2 ani")');
      }
      await page.waitForTimeout(800); // Așteaptă calculul
    }
  }

  // Selectează Bonus Malus - modificarea declanșează calculul
  // Găsește combobox-ul Bonus Malus (probabil al 4-lea sau al 5-lea combobox)
  const allComboboxes = await page.$$('span[role="combobox"]');
  // Bonus Malus este de obicei după vârstă, vechime și durată
  const bonusMalusIndex = personType === 'fizica' ? 3 : 1; // Ajustează indexul în funcție de structură
  if (allComboboxes[bonusMalusIndex]) {
    await allComboboxes[bonusMalusIndex].click();
    await page.waitForTimeout(500);
    
    // Selectează clasa Bonus Malus
    const bmOption = await page.$(`li:has-text("Cla a ${bonusMalus}")`);
    if (bmOption) {
      await bmOption.click();
      await page.waitForTimeout(800); // Așteaptă calculul
    }
  }

  // Selectează tipul de vehicul și parametrii
  const vehicleConfig = VEHICLES[vehicle];
  // Implementare pentru selectarea vehiculului
  // Va trebui să identificăm combobox-urile pentru tip vehicul și parametrii
  
  // Așteaptă ca rezultatele să fie calculate
  await page.waitForTimeout(1500);
}

/**
 * Extrage prețurile pentru toate companiile din rezultate
 * Rezultatele apar automat după modificarea câmpurilor din formular
 */
async function extractPrices(page) {
  // Așteaptă ca rezultatele să fie calculate și afișate
  // Rezultatele pot apărea în dialog sau într-o secțiune separată
  await page.waitForTimeout(2000);
  
  const prices = {};
  
  try {
    // Încearcă să găsească rezultatele în dialog
    // Poate fi un tabel, o listă sau div-uri cu companiile și prețurile
    const resultsContainer = await page.$('[role="dialog"]');
    
    if (resultsContainer) {
      // Caută toate companiile și prețurile asociate
      // Structura poate varia - poate fi:
      // - Tabel cu rânduri pentru fiecare companie
      // - Liste cu elemente pentru fiecare companie
      // - Div-uri cu clase specifice
      
      // Exemplu: căutare după text care conține numele companiei și prețul
      // Va trebui ajustat în funcție de structura reală a paginii
      const companyElements = await page.$$('[class*="company"], [class*="insurer"], tr, li');
      
      for (const element of companyElements) {
        try {
          const text = await page.evaluate(el => el.textContent, element);
          // Extrage numele companiei și prețul din text
          // Formatul poate varia: "Company Name: 1234.56 MDL" sau similar
          const priceMatch = text.match(/(\d+\.?\d*)/);
          const companyMatch = text.match(/([A-Za-z\s]+)/);
          
          if (priceMatch && companyMatch) {
            const companyName = companyMatch[1].trim();
            const price = parseFloat(priceMatch[1]);
            if (companyName && !isNaN(price)) {
              prices[companyName] = price;
            }
          }
        } catch (err) {
          // Continuă cu următorul element
          continue;
        }
      }
      
      // Alternativ: dacă rezultatele sunt într-un format JSON sau structurat
      // poate fi extras direct din DOM sau din răspunsul unei cereri API
      const jsonData = await page.evaluate(() => {
        // Caută script-uri sau elemente cu date JSON
        const scripts = document.querySelectorAll('script[type="application/json"]');
        for (const script of scripts) {
          try {
            return JSON.parse(script.textContent);
          } catch (e) {}
        }
        return null;
      });
      
      if (jsonData && jsonData.companies) {
        jsonData.companies.forEach(company => {
          prices[company.name] = company.price;
        });
      }
    }
  } catch (error) {
    console.error('Eroare la extragerea prețurilor:', error);
  }
  
  return prices;
}

/**
 * Colectează datele pentru o configurație specifică
 * Folosește o singură pagină și reîncarcă doar când e necesar
 */
async function collectDataForConfig(page, config) {
  try {
    // Dacă pagina nu este încărcată sau nu este pe URL-ul corect, navighează
    const currentUrl = page.url();
    if (!currentUrl.includes('rca.bnm.md/online')) {
      await page.goto(BNM_CALCULATOR_URL, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
    }
    
    // Monitorizează cererile de rețea pentru a detecta când se calculează rezultatele
    const responsePromise = new Promise((resolve) => {
      const handler = async (response) => {
        const url = response.url();
        if (url.includes('/online') && response.request().method() === 'POST') {
          try {
            const data = await response.json();
            if (data && (data.companies || data.premiums || data.results)) {
              page.removeListener('response', handler);
              resolve(data);
            }
          } catch (e) {
            // Nu este JSON sau nu are structura așteptată
          }
        }
      };
      page.on('response', handler);
      
      // Timeout pentru cazul în care nu se face cerere API
      setTimeout(() => {
        page.removeListener('response', handler);
        resolve(null);
      }, 10000);
    });
    
    await fillCalculatorForm(page, config);
    
    // Așteaptă fie răspunsul API, fie extragerea din DOM
    const apiData = await Promise.race([
      responsePromise,
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);
    
    let prices = {};
    
    if (apiData && (apiData.companies || apiData.premiums)) {
      // Extrage din răspunsul API
      if (apiData.companies) {
        apiData.companies.forEach(company => {
          prices[company.name || company.company_name] = company.price || company.premium;
        });
      } else if (apiData.premiums) {
        // Structură alternativă
        Object.entries(apiData.premiums).forEach(([company, price]) => {
          prices[company] = price;
        });
      }
    } else {
      // Extrage din DOM
      prices = await extractPrices(page);
    }
    
    return prices;
  } catch (error) {
    console.error(`Eroare la colectarea datelor pentru config ${JSON.stringify(config)}:`, error);
    return null;
  }
}

/**
 * Funcția principală
 */
async function main() {
  console.log('Începe colectarea datelor de la calculatorul BNM...');
  
  // Creează directorul de output dacă nu există
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: false, // Setează la true pentru rulare în background
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {};
  const page = await browser.newPage();
  
  try {
    // Navighează la pagina calculatorului o singură dată
    await page.goto(BNM_CALCULATOR_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Încarcă configurația existentă
    const rcaCellsPath = path.join(__dirname, '..', 'rca_cells.json');
    const rcaCells = JSON.parse(await fs.readFile(rcaCellsPath, 'utf-8'));
    
    const vehicles = rcaCells.vehicles;
    const territories = rcaCells.territories;
    const personCategories = rcaCells.person_categories;
    
    // Iterează prin toate combinațiile
    for (const bonusMalus of BONUS_MALUS_CLASSES) {
      console.log(`\nProcesare Bonus Malus clasa ${bonusMalus}...`);
      results[`BM_${bonusMalus}`] = {};
      
      for (const vehicle of vehicles) {
        // Skip vehicule care nu sunt disponibile pentru anumite categorii
        if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4')) {
          // Doar pentru persoane juridice
          for (const territory of territories) {
            const config = {
              bonusMalus,
              vehicle: vehicle.vehicle_id,
              territory: territory.territory_id,
              personCategory: 'PJ'
            };
            
            console.log(`  Colectare: ${vehicle.vehicle_id} - ${territory.territory_id} - PJ - BM${bonusMalus}`);
            const prices = await collectDataForConfig(page, config);
            
            if (prices && Object.keys(prices).length > 0) {
              const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_PJ`;
              results[`BM_${bonusMalus}`][cellId] = prices;
            }
            
            // Pauză între cereri pentru a nu suprasolicita serverul
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } else {
          // Pentru toate categoriile
          for (const territory of territories) {
            for (const personCategory of personCategories) {
              if (personCategory.person_type === 'juridica' && 
                  (vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4')) {
                continue; // Skip, deja procesat
              }
              
              const config = {
                bonusMalus,
                vehicle: vehicle.vehicle_id,
                territory: territory.territory_id,
                personCategory: personCategory.person_category_id
              };
              
              console.log(`  Colectare: ${vehicle.vehicle_id} - ${territory.territory_id} - ${personCategory.person_category_id} - BM${bonusMalus}`);
              const prices = await collectDataForConfig(page, config);
              
              if (prices && Object.keys(prices).length > 0) {
                const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_${personCategory.person_category_id}`;
                results[`BM_${bonusMalus}`][cellId] = prices;
              }
              
              // Pauză între cereri
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
      }
      
      // Salvează progresul după fiecare clasă Bonus Malus
      const outputPath = path.join(OUTPUT_DIR, `bnm_premiums_bm${bonusMalus}.json`);
      await fs.writeFile(outputPath, JSON.stringify(results[`BM_${bonusMalus}`], null, 2));
      console.log(`  Salvat: ${outputPath}`);
    }
    
    // Salvează toate datele într-un singur fișier
    const allDataPath = path.join(OUTPUT_DIR, 'bnm_all_premiums.json');
    await fs.writeFile(allDataPath, JSON.stringify(results, null, 2));
    console.log(`\nToate datele au fost salvate în: ${allDataPath}`);
    
  } catch (error) {
    console.error('Eroare în timpul colectării:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Rulează scriptul
main().catch(console.error);

