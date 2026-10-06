/**
 * Script pentru colectarea prețurilor Carte Verde de la calculatorul BNM.
 * Rulează în consola browserului și salvează datele în localStorage.
 *
 * Colectează prima în MDL pentru fiecare companie, pe:
 * - categorie vehicul: A, C1, C2, E1, E2, B și F (remorcă, pentru fiecare vehicul care tractează)
 * - zonă: Z1 (Ucraina), Z3 (toate țările sistemului Carte Verde)
 * - perioadă: 15 zile și 1–12 luni
 *
 * INSTRUCȚIUNI:
 * 1. Deschide https://rca.bnm.md/online
 * 2. Click pe „Calculează acum” de la „Calculatorul primei de asigurare Carte Verde”
 *    (scriptul deschide modalul singur dacă butonul #click-calculator-cv există)
 * 3. Deschide Console (F12)
 * 4. Copiază și lipește tot scriptul în consolă, apoi apasă Enter
 *    Colectarea pornește singură. La final se descarcă JSON-ul.
 * 5. Convertește fișierul: node scripts/convert-green-card-data.js <fișier.json>
 *
 * Poți relua o colectare întreruptă lipind scriptul din nou:
 * celulele deja salvate în localStorage sunt sărite.
 * Reset: localStorage.removeItem('green_card_bnm_premiums_collected')
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'green_card_bnm_premiums_collected';
  const DELAY_BETWEEN_REQUESTS = 400;
  const PRICE_TIMEOUT = 12000;

  const CATEGORIES = [
    { id: 'A', label: 'Autoturisme', value: '1' },
    { id: 'C1', label: 'Camioane < 3.5 tone', value: '2' },
    { id: 'C2', label: 'Camioane și tractoare > 3.5 tone', value: '3' },
    { id: 'E1', label: 'Transport de persoane < 17 locuri', value: '4' },
    { id: 'E2', label: 'Transport de persoane > 17 locuri', value: '5' },
    { id: 'B', label: 'Motociclete', value: '6' },
    { id: 'F', label: 'Remorcă', value: '7' }
  ];

  const TOWING_CATEGORIES = CATEGORIES.filter(category => category.id !== 'F');

  const ZONES = [
    { id: 'Z1', label: 'Zona 1 - Ucraina', value: '1' },
    { id: 'Z3', label: 'Zona 3 - Toate tarile sistemului carte verde', value: '3' }
  ];

  // Valorile din <select id="period"> sar peste 5.
  const PERIODS = [
    { id: 'D15', label: '15 zile', value: '1' },
    { id: 'M1', label: '1 lună', value: '2' },
    { id: 'M2', label: '2 luni', value: '3' },
    { id: 'M3', label: '3 luni', value: '4' },
    { id: 'M4', label: '4 luni', value: '6' },
    { id: 'M5', label: '5 luni', value: '7' },
    { id: 'M6', label: '6 luni', value: '8' },
    { id: 'M7', label: '7 luni', value: '9' },
    { id: 'M8', label: '8 luni', value: '10' },
    { id: 'M9', label: '9 luni', value: '11' },
    { id: 'M10', label: '10 luni', value: '12' },
    { id: 'M11', label: '11 luni', value: '13' },
    { id: 'M12', label: '12 luni', value: '14' }
  ];

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function cellId(categoryId, zoneId, periodId, towingId) {
    if (categoryId === 'F') {
      return `F_${towingId}_${zoneId}_${periodId}`;
    }
    return `${categoryId}_${zoneId}_${periodId}`;
  }

  function buildJobs() {
    const jobs = [];
    for (const category of CATEGORIES) {
      const towingList = category.id === 'F' ? TOWING_CATEGORIES : [null];
      for (const towing of towingList) {
        for (const zone of ZONES) {
          for (const period of PERIODS) {
            jobs.push({
              category,
              towing,
              zone,
              period,
              cellId: cellId(category.id, zone.id, period.id, towing && towing.id)
            });
          }
        }
      }
    }
    return jobs;
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { collected_at: null, source: 'https://rca.bnm.md/online', cells: {} };
      }
      const parsed = JSON.parse(raw);
      if (!parsed.cells || typeof parsed.cells !== 'object') {
        return { collected_at: null, source: 'https://rca.bnm.md/online', cells: {} };
      }
      return parsed;
    } catch (error) {
      console.warn('[WARN] Datele din localStorage nu pot fi citite. Se reia de la zero.', error);
      return { collected_at: null, source: 'https://rca.bnm.md/online', cells: {} };
    }
  }

  function saveStore(store) {
    store.collected_at = new Date().toISOString();
    store.source = 'https://rca.bnm.md/online';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function setStatus(patch) {
    window.__gcStatus = { ...(window.__gcStatus || {}), ...patch };
  }

  function ensureCalculatorOpen() {
    const modal = document.getElementById('kt_modal_scrollable_2');
    const isOpen = modal && (modal.classList.contains('show') || modal.getAttribute('aria-modal') === 'true');
    if (isOpen && document.getElementById('category')) {
      return true;
    }
    const button = document.getElementById('click-calculator-cv');
    if (button) {
      button.click();
    }
    return Boolean(document.getElementById('category'));
  }

  function setSelectValue(id, value) {
    const select = document.getElementById(id);
    if (!select) {
      throw new Error(`Select #${id} nu a fost găsit. Deschide calculatorul Carte Verde.`);
    }
    select.value = String(value);
    if (select.value !== String(value)) {
      throw new Error(`#${id} nu a acceptat valoarea ${value}`);
    }
  }

  function extractPrices() {
    const prices = {};
    const root = document.querySelector('#kt_modal_scrollable_2 #calc') || document.querySelector('#calc');
    if (!root) return prices;

    root.querySelectorAll('.row').forEach(row => {
      const priceEl = row.querySelector('[id^="puls"]');
      if (!priceEl) return;

      const priceText = (priceEl.textContent || '').trim();
      const priceMatch = priceText.match(/([\d\s]+(?:,\d+)?)\s*MDL/);
      if (!priceMatch) return;

      const companyName = (row.querySelector('.col-9')?.textContent || '').replace(/\s+/g, ' ').trim();
      if (!companyName || companyName === 'Prima de asigurare pentru remorci') return;

      const priceValue = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(priceValue) && priceValue > 0) {
        prices[companyName] = priceValue;
      }
    });

    return prices;
  }

  async function waitForPrices() {
    const started = Date.now();
    let lastSignature = '';
    let stableReads = 0;

    while (Date.now() - started < PRICE_TIMEOUT) {
      const prices = extractPrices();
      const count = Object.keys(prices).length;
      const signature = JSON.stringify(prices);

      if (count >= 3) {
        if (signature === lastSignature) {
          stableReads += 1;
          if (stableReads >= 1) return prices;
        } else {
          lastSignature = signature;
          stableReads = 0;
        }
      }

      await sleep(200);
    }

    const fallback = extractPrices();
    return Object.keys(fallback).length > 0 ? fallback : null;
  }

  async function collectJob(job) {
    const calc = document.querySelector('#kt_modal_scrollable_2 #calc');
    if (calc) calc.innerHTML = '';

    setSelectValue('category', job.category.value);
    setSelectValue('territory', job.zone.value);
    setSelectValue('period', job.period.value);
    if (job.category.id === 'F') {
      setSelectValue('categoryr', job.towing.value);
    }

    if (typeof get_calc !== 'function') {
      throw new Error('Funcția get_calc() nu există. Ești pe pagina calculatorului BNM?');
    }

    get_calc();
    let prices = await waitForPrices();
    if (!prices) {
      console.warn(`[RETRY] ${job.cellId}`);
      get_calc();
      prices = await waitForPrices();
    }
    return prices;
  }

  function exportData() {
    const store = loadStore();
    const count = Object.keys(store.cells || {}).length;
    if (!count) {
      console.log('Nu există date de exportat');
      return;
    }

    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const day = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `green_card_bnm_premiums_${day}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Exportat ${count} celule. Rulează: node scripts/convert-green-card-data.js <fișier.json>`);
  }

  function showProgress() {
    const store = loadStore();
    const saved = Object.keys(store.cells || {}).length;
    const total = buildJobs().length;
    console.log('=== Progres Carte Verde ===');
    console.log(`Celule salvate: ${saved}/${total}`);
    console.log('Status:', window.__gcStatus || null);
  }

  async function main() {
    if (window.__gcRunning) {
      console.warn('Colectarea Carte Verde rulează deja. Progres: showGreenCardProgress()');
      return;
    }
    if (typeof window.jQuery === 'undefined') {
      console.error('jQuery nu este disponibil. Deschide https://rca.bnm.md/online');
      return;
    }
    window.__gcRunning = true;

    if (!ensureCalculatorOpen()) {
      await sleep(600);
    }
    if (!document.getElementById('category') || !document.getElementById('kt_modal_scrollable_2')) {
      window.__gcRunning = false;
      console.error('Calculatorul Carte Verde nu este deschis. Click pe „Calculează acum” la Carte Verde, apoi lipește scriptul din nou.');
      return;
    }

    const jobs = buildJobs();
    const store = loadStore();
    let saved = Object.keys(store.cells).length;
    let failed = 0;
    let processed = 0;

    setStatus({
      total: jobs.length,
      saved,
      failed: 0,
      current: null,
      done: false,
      startedAt: new Date().toISOString()
    });

    console.log(`=== Colectare Carte Verde: ${jobs.length} combinații ===`);
    console.log('Celulele deja salvate sunt sărite. Pentru reluare de la zero: localStorage.removeItem("' + STORAGE_KEY + '")');

    for (const job of jobs) {
      processed += 1;
      if (store.cells[job.cellId] && Object.keys(store.cells[job.cellId]).length > 0) {
        continue;
      }

      const towingLabel = job.towing ? ` tractat de ${job.towing.id}` : '';
      const label = `${job.category.id}${towingLabel} | ${job.zone.id} | ${job.period.label}`;
      setStatus({ current: job.cellId, saved, failed, processed, total: jobs.length });
      console.log(`[${processed}/${jobs.length}] ${label}`);

      try {
        const prices = await collectJob(job);
        if (!prices || Object.keys(prices).length === 0) {
          failed += 1;
          console.warn(`[SKIP] Fără prețuri pentru ${job.cellId}`);
        } else {
          store.cells[job.cellId] = prices;
          saved += 1;
          console.log(`[OK] ${job.cellId}: ${Object.keys(prices).length} companii`);
          if (saved % 5 === 0) saveStore(store);
        }
      } catch (error) {
        failed += 1;
        console.error(`[ERROR] ${job.cellId}`, error);
      }

      setStatus({ current: job.cellId, saved, failed, processed, total: jobs.length });
      await sleep(DELAY_BETWEEN_REQUESTS);
    }

    saveStore(store);
    setStatus({
      total: jobs.length,
      saved,
      failed,
      current: null,
      done: true,
      finishedAt: new Date().toISOString()
    });

    window.__gcRunning = false;
    console.log('=== Colectare Carte Verde completă ===');
    console.log(`Salvate: ${saved}/${jobs.length}, eșuate: ${failed}`);
    exportData();
    return store;
  }

  window.collectGreenCardData = main;
  window.exportGreenCardData = exportData;
  window.showGreenCardProgress = showProgress;

  console.log('=== Script Carte Verde încărcat. Pornesc colectarea... ===');
  console.log('Progres: showGreenCardProgress()');
  main();
})();
