/**
 * Script pentru colectarea automată a prețurilor RCA de la calculatorul BNM
 * Rulează în consola browserului și salvează datele în localStorage
 * 
 * IMPORTANT: Colectează datele doar pentru Bonus Malus clasa 7 (coeficient 1)
 * Nu modifică câmpul Bonus Malus din formular - rămâne la clasa 7
 * 
 * INSTRUCȚIUNI:
 * 1. Deschide https://rca.bnm.md/online în browser
 * 2. Click pe "Calculează acum" pentru a deschide calculatorul
 * 3. Deschide Console (F12)
 * 4. Copiază și lipește acest script în consolă
 * 5. Apasă Enter pentru a începe colectarea
 */

(function() {
  'use strict';

  // Configurație
  const DELAY_BETWEEN_CHANGES = 1000; // 2 secunde între modificări
  const DELAY_AFTER_CALCULATION = 1000; // 3 secunde după calcul
  const STORAGE_KEY = 'rca_bnm_premiums_collected';

  // Mapare pentru categorii de persoane
  const PERSON_CATEGORIES = {
    'PF_AGE_LT23_EXP_LT2': { personType: 'fizica', age: 1, experience: 1 },
    'PF_AGE_LT23_EXP_GE2': { personType: 'fizica', age: 1, experience: 2 },
    'PF_AGE_GE23_EXP_LT2': { personType: 'fizica', age: 2, experience: 1 },
    'PF_AGE_GE23_EXP_GE2': { personType: 'fizica', age: 2, experience: 2 },
    'PJ': { personType: 'juridica', age: null, experience: null }
  };

  // Mapare pentru teritorii
  const TERRITORIES = {
    'CH': 1,  // Municipiul Chișinău (și raioanele asociate) - value="1" în select
    'AL': 4   // Alte localități ale țării - value="4" în select
  };

  // Mapare pentru vehicule
  const VEHICLES = {
    'A1': { category: 1, subcategory: 1 }, // Autoturisme, Până la 1200 cm3
    'A2': { category: 1, subcategory: 2 }, // Autoturisme, între 1201-1600 cm3
    'A3': { category: 1, subcategory: 3 }, // Autoturisme, între 1601-2000 cm3
    'A4': { category: 1, subcategory: 4 }, // Autoturisme, între 2001-2400 cm3
    'A5': { category: 1, subcategory: 5 }, // Autoturisme, între 2401-3000 cm3
    'A6': { category: 1, subcategory: 6 }, // Autoturisme, Peste 3000 cm3
    'A7': { category: 1, subcategory: 1, utilizare: 2 }, // Autoturisme, Taxi
    'A8': { category: 1, subcategory: 23 }, // Autoturisme, Cu motor electric
    'B1': { category: 2, subcategory: 9 }, // Transport de persoane, Microbuze 10-17 persoane
    'B2': { category: 2, subcategory: 10 }, // Transport de persoane, Autobuze 18-30 persoane
    'B3': { category: 2, subcategory: 11 }, // Transport de persoane, Autobuze >30 persoane
    'B4': { category: 2, subcategory: 22 }, // Transport de persoane, Troleibuze
    'C1': { category: 3, subcategory: 13 }, // Tractoare, Până la 45 CP inclusiv
    'C2': { category: 3, subcategory: 14 }, // Tractoare, De la 46 CP până la 100 CP inclusiv
    'C3': { category: 3, subcategory: 15 }, // Tractoare, Peste 100 CP
    'D1': { category: 4, subcategory: 24 }, // Camioane, Până la 3500 kg
    'D2': { category: 4, subcategory: 25 }, // Camioane, între 3501-12000 kg
    'D3': { category: 4, subcategory: 30 }, // Camioane, Peste 12000 kg
    'E1': { category: 5, subcategory: 20 }, // Motociclete, Păna la 300 cm3
    'E2': { category: 5, subcategory: 21 }  // Motociclete, Peste 300 cm3
  };

  // Bonus Malus - doar clasa 7 (coeficient 1, nu influențează prețul)
  const BONUS_MALUS_CLASS = 7;

  // Funcție pentru așteptare
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Funcție pentru a seta valoarea unui select2
  async function setSelect2Value(selectId, value, label = '') {
    const $select = $(`#${selectId}`);
    if ($select.length === 0) {
      console.warn(`[WARN] Select ${selectId} nu a fost găsit`);
      return false;
    }
    
    const currentValue = $select.val();
    if (currentValue == value) {
      console.log(`[SKIP] ${selectId} deja setat la ${value}${label ? ' (' + label + ')' : ''}`);
      return false; // Nu s-a făcut modificare
    }
    
    console.log(`[SET] ${selectId}: ${currentValue} → ${value}${label ? ' (' + label + ')' : ''}`);
    
    // Setează valoarea
    $select.val(value).trigger('change');
    
    // Așteaptă ca select2 să se actualizeze
    await sleep(500);
    
    // Verifică că valoarea a fost setată corect
    const newValue = $select.val();
    if (newValue != value) {
      console.warn(`[WARN] ${selectId} nu s-a setat corect. Așteptat: ${value}, Obținut: ${newValue}`);
      return false;
    }
    
    return true; // S-a făcut modificare
  }

  // Funcție pentru a seta valoarea unui radio button
  async function setRadioValue(name, value, label = '') {
    const $radio = $(`input[name="${name}"][value="${value}"]`);
    if ($radio.length === 0) {
      console.warn(`[WARN] Radio ${name}=${value} nu a fost găsit`);
      return false;
    }
    
    // Verifică dacă este deja selectat
    if ($radio.is(':checked')) {
      console.log(`[SKIP] Radio ${name}=${value}${label ? ' (' + label + ')' : ''} deja selectat`);
      return false; // Nu s-a făcut modificare
    }
    
    const currentChecked = $(`input[name="${name}"]:checked`).val();
    console.log(`[SET] Radio ${name}: ${currentChecked || 'none'} → ${value}${label ? ' (' + label + ')' : ''}`);
    
    $radio.prop('checked', true).trigger('change').trigger('click');
    await sleep(500);
    
    // Verifică că a fost setat corect
    if (!$radio.is(':checked')) {
      console.warn(`[WARN] Radio ${name}=${value} nu s-a setat corect`);
      return false;
    }
    
    return true; // S-a făcut modificare
  }

  // Funcție pentru a seta categoria vehiculului și subcategoria
  async function setVehicleCategory(category, subcategory, utilizare = null, vehicleId = '') {
    console.log(`[VEHICLE] Setare vehicul: categoria=${category}, subcategoria=${subcategory}${vehicleId ? ' (' + vehicleId + ')' : ''}`);
    
    // Setează categoria
    const categoryChanged = await setSelect2Value('vt', category, `Categorie ${category}`);
    await sleep(300);
    
    // Ascunde toate subcategoriile
    $('#vst1d, #vst2d, #vst3d, #vst4d, #vst5d').hide();
    
    // Afișează și setează subcategoria corespunzătoare
    let subcategoryChanged = false;
    if (category === 1) {
      $('#vst1d').show();
      subcategoryChanged = await setSelect2Value('vst1', subcategory, `Subcategorie ${subcategory}`);
    } else if (category === 2) {
      $('#vst2d').show();
      subcategoryChanged = await setSelect2Value('vst2', subcategory, `Subcategorie ${subcategory}`);
    } else if (category === 3) {
      $('#vst3d').show();
      subcategoryChanged = await setSelect2Value('vst3', subcategory, `Subcategorie ${subcategory}`);
    } else if (category === 4) {
      $('#vst4d').show();
      subcategoryChanged = await setSelect2Value('vst4', subcategory, `Subcategorie ${subcategory}`);
    } else if (category === 5) {
      $('#vst5d').show();
      subcategoryChanged = await setSelect2Value('vst5', subcategory, `Subcategorie ${subcategory}`);
    }
    
    // Dacă e necesar, setează modul de utilizare (pentru Taxi)
    if (utilizare && $('#auto_utilizare').length) {
      $('#auto_utilizare').show();
      await setSelect2Value('auto_utilizare', utilizare, 'Taxi');
    } else if ($('#auto_utilizare').length) {
      $('#auto_utilizare').hide();
    }
    
    await sleep(300);
    
    return categoryChanged || subcategoryChanged; // Returnează dacă s-a făcut vreo modificare
  }

  // Funcție pentru extragerea prețurilor din DOM
  function extractPrices() {
    const prices = {};
    let foundCount = 0;
    let skippedCount = 0;
    
    console.log(`[EXTRACT] Căutare prețuri în secțiunea #calc...`);
    
    // Găsește toate rândurile cu prețuri în secțiunea #calc
    $('#calc .row').each(function() {
      const $row = $(this);
      const $priceEl = $row.find('[id^="puls"]');
      
      if ($priceEl.length > 0) {
        const priceText = $priceEl.text().trim();
        const priceMatch = priceText.match(/([\d\s,]+)\s*MDL/);
        
        if (priceMatch) {
          // Extrage numele companiei
          const companyName = $row.find('.col-9').text().trim();
          
          if (companyName && companyName !== 'Prima de asigurare pentru remorci') {
            // Convertește prețul (înlocuiește spații și virgule)
            const priceValue = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
            if (!isNaN(priceValue) && priceValue > 0) {
              prices[companyName] = priceValue;
              foundCount++;
              console.log(`[EXTRACT] ✓ ${companyName}: ${priceValue} MDL`);
            } else {
              skippedCount++;
              console.warn(`[EXTRACT] ✗ ${companyName}: preț invalid (${priceText})`);
            }
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
          console.warn(`[EXTRACT] ✗ Nu s-a găsit preț valid în: ${priceText}`);
        }
      }
    });
    
    console.log(`[EXTRACT] Rezumat: ${foundCount} prețuri extrase, ${skippedCount} omise`);
    
    return prices;
  }

  // Funcție pentru completarea formularului și extragerea prețurilor
  async function collectDataForConfig(config) {
    const { vehicle, territory, personCategory } = config;
    
    console.log(`\n[START] Colectare: ${vehicle} - ${territory} - ${personCategory}`);
    const startTime = Date.now();
    
    const personConfig = PERSON_CATEGORIES[personCategory];
    const vehicleConfig = VEHICLES[vehicle];
    
    if (!personConfig || !vehicleConfig) {
      console.error(`[ERROR] Configurație invalidă pentru ${vehicle} - ${personCategory}`);
      return null;
    }
    
    try {
      let changesMade = false;
      
      // Setează tipul de persoană
      console.log(`[STEP 1] Setare tip persoană: ${personConfig.personType}`);
      const personTypeLabel = personConfig.personType === 'fizica' ? 'Fizică' : 'Juridică';
      const personChanged = await setRadioValue('auto_pf', personConfig.personType === 'fizica' ? '1' : '2', personTypeLabel);
      if (personChanged) {
        changesMade = true;
        await sleep(DELAY_BETWEEN_CHANGES);
      } else {
        await sleep(300);
      }
      
      // Setează teritoriul (Moldova - pentru ambele teritorii CH și AL)
      // Notă: "Alte state" se referă la vehicule înmatriculate în străinătate
      // "Alte localități" se referă la reședință și se setează mai jos
      console.log(`[STEP 2] Setare teritoriu: Moldova (vehicule înmatriculate în Moldova)`);
      const territoryChanged = await setRadioValue('auto_md', '1', 'Moldova');
      if (territoryChanged) {
        changesMade = true;
        await sleep(DELAY_BETWEEN_CHANGES);
      } else {
        await sleep(300);
      }
      
      // Setează vârsta și vechimea (doar pentru persoane fizice)
      if (personConfig.personType === 'fizica') {
        console.log(`[STEP 3] Setare vârstă: ${personConfig.age === 1 ? 'Până la 23 ani' : 'Peste 23 ani'}`);
        const ageChanged = await setSelect2Value('y', personConfig.age, personConfig.age === 1 ? 'Până la 23 ani' : 'Peste 23 ani');
        if (ageChanged) {
          changesMade = true;
          await sleep(DELAY_BETWEEN_CHANGES);
        } else {
          await sleep(300);
        }
        
        console.log(`[STEP 4] Setare experiență: ${personConfig.experience === 1 ? 'Până la 2 ani' : 'Peste 2 ani'}`);
        const expChanged = await setSelect2Value('a', personConfig.experience, personConfig.experience === 1 ? 'Până la 2 ani' : 'Peste 2 ani');
        if (expChanged) {
          changesMade = true;
          await sleep(DELAY_BETWEEN_CHANGES);
        } else {
          await sleep(300);
        }
      }
      
      // NU modificăm Bonus Malus - rămâne la clasa 7 (coeficient 1)
      console.log(`[STEP 5] Bonus Malus: Clasa 7 (nu se modifică)`);
      const currentBM = $('#bm').val();
      if (currentBM != BONUS_MALUS_CLASS) {
        console.warn(`[WARN] Bonus Malus nu este 7! Valoare curentă: ${currentBM}. Setăm la 7...`);
        await setSelect2Value('bm', BONUS_MALUS_CLASS, 'Clasa 7');
        changesMade = true;
        await sleep(DELAY_BETWEEN_CHANGES);
      } else {
        await sleep(100);
      }
      
      // Setează reședința (CH = Chișinău, AL = Alte localități)
      const residenceLabel = territory === 'CH' ? 'Municipiul Chișinău' : 'Alte localități ale țării';
      console.log(`[STEP 6] Setare reședință: ${residenceLabel}`);
      const residenceChanged = await setSelect2Value('t', TERRITORIES[territory], residenceLabel);
      if (residenceChanged) {
        changesMade = true;
        await sleep(DELAY_BETWEEN_CHANGES);
      } else {
        await sleep(300);
      }
      
      // Setează categoria și subcategoria vehiculului
      console.log(`[STEP 7] Setare vehicul: ${vehicle}`);
      const vehicleChanged = await setVehicleCategory(
        vehicleConfig.category,
        vehicleConfig.subcategory,
        vehicleConfig.utilizare,
        vehicle
      );
      if (vehicleChanged) {
        changesMade = true;
        await sleep(DELAY_BETWEEN_CHANGES);
      } else {
        await sleep(300);
      }
      
      // Dacă nu s-a făcut nicio modificare, încercăm să forțăm un recalcul
      if (!changesMade) {
        console.log(`[INFO] Nu s-au făcut modificări. Forțăm un recalcul...`);
        // Facem o modificare temporară și apoi o revenim pentru a declanșa calculul
        const tempValue = $('#t').val();
        await setSelect2Value('t', tempValue === '1' ? '9' : '1');
        await sleep(500);
        await setSelect2Value('t', tempValue);
        await sleep(500);
      }
      
      // Așteaptă ca calculul să se finalizeze
      console.log(`[WAIT] Așteptare calcul (${DELAY_AFTER_CALCULATION}ms)...`);
      await sleep(DELAY_AFTER_CALCULATION);
      
      // Extrage prețurile
      console.log(`[EXTRACT] Extragere prețuri...`);
      const prices = extractPrices();
      
      if (Object.keys(prices).length === 0) {
        console.warn(`[WARN] Nu s-au găsit prețuri pentru ${vehicle} - ${territory} - ${personCategory}`);
        console.log(`[DEBUG] Verificare elemente prețuri în DOM...`);
        const priceElements = $('[id^="puls"]');
        console.log(`[DEBUG] Găsite ${priceElements.length} elemente cu prețuri`);
        return null;
      }
      
      const duration = Date.now() - startTime;
      console.log(`[SUCCESS] Prețuri extrase: ${Object.keys(prices).length} companii în ${duration}ms`);
      console.log(`[DATA] ${JSON.stringify(Object.keys(prices).slice(0, 3))}${Object.keys(prices).length > 3 ? '...' : ''}`);
      
      return prices;
    } catch (error) {
      console.error(`[ERROR] Eroare la colectarea datelor pentru ${vehicle} - ${territory} - ${personCategory}:`, error);
      console.error(`[ERROR] Stack:`, error.stack);
      return null;
    }
  }

  // Funcție pentru salvarea datelor în localStorage
  function saveData(data) {
    const existing = localStorage.getItem(STORAGE_KEY);
    let allData = existing ? JSON.parse(existing) : {};
    
    // Merge datele noi cu cele existente
    allData = { ...allData, ...data };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    console.log('Date salvate în localStorage');
  }

  // Funcție pentru exportarea datelor
  function exportData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('Nu există date de exportat');
      return;
    }
    
    // Formatează JSON-ul pentru o citire mai ușoară
    const formattedData = JSON.stringify(JSON.parse(data), null, 2);
    
    const blob = new Blob([formattedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rca_bnm_premiums_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Date exportate!');
    console.log('Folosește scripts/convert-collected-data.js pentru a converti datele în formatul aplicației.');
  }
  
  // Funcție pentru a vedea progresul
  function showProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('Nu există date salvate');
      return;
    }
    
    const collected = JSON.parse(data);
    const bmClasses = Object.keys(collected).length;
    let totalCells = 0;
    let totalPrices = 0;
    
    Object.values(collected).forEach(bmData => {
      totalCells += Object.keys(bmData).length;
      Object.values(bmData).forEach(cellPrices => {
        totalPrices += Object.keys(cellPrices).length;
      });
    });
    
    console.log('=== Progres Colectare ===');
    console.log(`Bonus Malus: Clasa 7 (coeficient 1)`);
    console.log(`Celule procesate: ${totalCells}`);
    console.log(`Total prețuri colectate: ${totalPrices}`);
  }

  // Funcția principală
  async function main() {
    console.log('=== Începe colectarea datelor ===');
    
    // Verifică dacă jQuery și Select2 sunt disponibile
    if (typeof $ === 'undefined' || typeof $.fn.select2 === 'undefined') {
      console.error('jQuery sau Select2 nu sunt disponibile. Asigură-te că ești pe pagina calculatorului BNM.');
      return;
    }
    
    // Verifică dacă formularul este disponibil
    if ($('#idnp').length === 0) {
      console.error('Formularul nu este disponibil. Asigură-te că ai deschis calculatorul (click pe "Calculează acum").');
      return;
    }
    
    // Încarcă configurația din rca_cells.json (va trebui să fie disponibilă)
    // Pentru moment, folosim configurația hardcodată
    const vehicles = [
      { vehicle_id: 'A1' }, { vehicle_id: 'A2' }, { vehicle_id: 'A3' }, { vehicle_id: 'A4' },
      { vehicle_id: 'A5' }, { vehicle_id: 'A6' }, { vehicle_id: 'A7' }, { vehicle_id: 'A8' },
      { vehicle_id: 'B1' }, { vehicle_id: 'B2' }, { vehicle_id: 'B3' }, { vehicle_id: 'B4' },
      { vehicle_id: 'C1' }, { vehicle_id: 'C2' }, { vehicle_id: 'C3' },
      { vehicle_id: 'D1' }, { vehicle_id: 'D2' }, { vehicle_id: 'D3' },
      { vehicle_id: 'E1' }, { vehicle_id: 'E2' }
    ];
    
    // Teritorii: CH (Chișinău) și AL (Alte localități)
    const territories = [
      { territory_id: 'CH' }, // Municipiul Chișinău și raioanele asociate
      { territory_id: 'AL' }  // Alte localități ale țării
    ];
    
    const personCategories = [
      { person_category_id: 'PF_AGE_LT23_EXP_LT2', person_type: 'fizica' },
      { person_category_id: 'PF_AGE_LT23_EXP_GE2', person_type: 'fizica' },
      { person_category_id: 'PF_AGE_GE23_EXP_LT2', person_type: 'fizica' },
      { person_category_id: 'PF_AGE_GE23_EXP_GE2', person_type: 'fizica' },
      { person_category_id: 'PJ', person_type: 'juridica' }
    ];
    
    const results = {};
    let totalCombinations = 0;
    let processedCombinations = 0;
    
    // Calculează totalul de combinații (doar pentru Bonus Malus 7)
    for (const vehicle of vehicles) {
      if (vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') {
        totalCombinations += territories.length; // Doar PJ
      } else {
        totalCombinations += territories.length * personCategories.length;
      }
    }
    
    console.log(`Total combinații de procesat: ${totalCombinations}`);
    console.log(`Bonus Malus: Clasa 7 (coeficient 1 - nu influențează prețul)`);
    
    // Verifică că Bonus Malus este setat la 7
    const currentBM = $('#bm').val();
    if (currentBM != BONUS_MALUS_CLASS) {
      console.warn(`Bonus Malus nu este setat la ${BONUS_MALUS_CLASS}. Setând acum...`);
      await setSelect2Value('bm', BONUS_MALUS_CLASS);
      await sleep(DELAY_BETWEEN_CHANGES);
    }
    
    // Iterează prin toate combinațiile (doar pentru Bonus Malus 7, CH și AL)
    results[`BM_${BONUS_MALUS_CLASS}`] = {};
    
    console.log(`[CONFIG] Vehicule: ${vehicles.length}, Teritorii: ${territories.length} (CH, AL), Categorii persoane: ${personCategories.length}`);
    
    for (let vehicleIndex = 0; vehicleIndex < vehicles.length; vehicleIndex++) {
      const vehicle = vehicles[vehicleIndex];
      console.log(`\n[VEHICLE ${vehicleIndex + 1}/${vehicles.length}] Procesare ${vehicle.vehicle_id}`);
      
      if (vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') {
        // Doar pentru persoane juridice
        for (const territory of territories) {
          const config = {
            vehicle: vehicle.vehicle_id,
            territory: territory.territory_id,
            personCategory: 'PJ'
          };
          
          const prices = await collectDataForConfig(config);
          processedCombinations++;
          
          if (prices && Object.keys(prices).length > 0) {
            const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_PJ`;
            results[`BM_${BONUS_MALUS_CLASS}`][cellId] = prices;
            console.log(`[SAVED] ${cellId}: ${Object.keys(prices).length} companii`);
            
            // Salvează progresul periodic
            if (processedCombinations % 10 === 0) {
              saveData(results);
              console.log(`[PROGRESS] ${processedCombinations}/${totalCombinations} (${Math.round(processedCombinations/totalCombinations*100)}%)`);
            }
          } else {
            console.warn(`[SKIP] Nu s-au salvat date pentru ${vehicle.vehicle_id} - ${territory.territory_id} - PJ`);
          }
          
          // Pauză mai scurtă între combinații dacă nu s-au făcut modificări
          await sleep(1000);
        }
      } else {
        // Pentru toate categoriile
        for (const territory of territories) {
          for (let catIndex = 0; catIndex < personCategories.length; catIndex++) {
            const personCategory = personCategories[catIndex];
            console.log(`[CATEGORY ${catIndex + 1}/${personCategories.length}] ${personCategory.person_category_id}`);
            
            const config = {
              vehicle: vehicle.vehicle_id,
              territory: territory.territory_id,
              personCategory: personCategory.person_category_id
            };
            
            const prices = await collectDataForConfig(config);
            processedCombinations++;
            
            if (prices && Object.keys(prices).length > 0) {
              const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_${personCategory.person_category_id}`;
              results[`BM_${BONUS_MALUS_CLASS}`][cellId] = prices;
              console.log(`[SAVED] ${cellId}: ${Object.keys(prices).length} companii`);
              
              // Salvează progresul periodic
              if (processedCombinations % 10 === 0) {
                saveData(results);
                console.log(`[PROGRESS] ${processedCombinations}/${totalCombinations} (${Math.round(processedCombinations/totalCombinations*100)}%)`);
              }
            } else {
              console.warn(`[SKIP] Nu s-au salvat date pentru ${vehicle.vehicle_id} - ${territory.territory_id} - ${personCategory.person_category_id}`);
            }
            
            // Pauză mai scurtă între combinații
            await sleep(1000);
          }
        }
      }
    }
    
    // Salvează datele finale
    saveData(results);
    console.log(`✓ Colectare completă pentru Bonus Malus ${BONUS_MALUS_CLASS}`);
    
    // Salvează datele finale
    saveData(results);
    console.log('\n=== Colectarea datelor este completă! ===');
    console.log(`Total procesat: ${processedCombinations}/${totalCombinations}`);
    console.log(`Bonus Malus: Clasa ${BONUS_MALUS_CLASS} (coeficient 1)`);
    console.log('Folosește exportData() pentru a descărca datele.');
    
    // Returnează funcția de export
    window.exportData = exportData;
  }

  // Expune funcțiile globale
  window.collectRcaData = main;
  window.exportData = exportData;
  window.showProgress = showProgress;
  
  console.log('=== Script Browser Collector încărcat! ===');
  console.log('Funcții disponibile:');
  console.log('  - collectRcaData() - Pornește colectarea datelor');
  console.log('  - showProgress() - Afișează progresul colectării');
  console.log('  - exportData() - Descarcă datele colectate');
  console.log('');
  console.log('Pentru a începe, rulează: collectRcaData()');
  
  // Auto-start (comentează dacă nu vrei să pornească automat)
  // main();
})();

