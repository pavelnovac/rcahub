# Colectare Date RCA - Metoda Browser

Această metodă folosește un script JavaScript care rulează direct în browserul tău pentru a colecta datele din calculatorul BNM.

## Avantaje

- ✅ Nu necesită instalarea Puppeteer sau alte dependențe
- ✅ Folosește browserul real (Chrome, Firefox, Safari, etc.)
- ✅ Datele sunt salvate în localStorage (nu se pierd dacă se întâmplă ceva)
- ✅ Poți vedea progresul în timp real
- ✅ Poți opri și relua procesul

## Pași de Utilizare

### 1. Pregătire

1. Deschide browserul și navighează la: **https://rca.bnm.md/online**
2. Click pe butonul **"Calculează acum"** pentru a deschide calculatorul
3. Deschide **Developer Console**:
   - Chrome/Edge: `F12` sau `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - Firefox: `F12` sau `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - Safari: Activează "Develop" menu, apoi `Cmd+Option+C`

### 2. Încarcă Scriptul

1. Deschide fișierul `scripts/browser-collector.js`
2. **Copiază tot conținutul** scriptului
3. **Lipește-l în consola browserului**
4. Apasă `Enter`

Ar trebui să vezi mesajul:
```
=== Script Browser Collector încărcat! ===
```

### 3. Pornește Colectarea

În consolă, scrie:
```javascript
collectRcaData()
```

Sau, dacă vrei să pornească automat, decomentează linia `// main();` din script.

### 4. Monitorizează Progresul

În timpul colectării, poți verifica progresul:
```javascript
showProgress()
```

Vei vedea:
- Bonus Malus: Clasa 7 (coeficient 1)
- Câte celule au fost procesate
- Câte prețuri au fost colectate

### 5. Exportă Datele

După ce colectarea este completă (sau dacă vrei să salvezi progresul):
```javascript
exportData()
```

Aceasta va descărca un fișier JSON cu toate datele colectate.

### 6. Convertește Datele

Pentru a converti datele în formatul aplicației:

```bash
npm run convert-data [cale_catre_fisier_json]
```

Sau direct:
```bash
node scripts/convert-collected-data.js [cale_catre_fisier_json]
```

Dacă nu specifici calea, scriptul va căuta în `data/rca_bnm_premiums_collected.json`.

## Structura Datelor

### Format Colectat (localStorage/JSON exportat)
```json
{
  "BM_0": {
    "A1_CH_PF_AGE_LT23_EXP_LT2": {
      "ACORD GRUP S.A.": 4768.92,
      "ASTERRA GRUP S.A.": 3331.28,
      ...
    }
  },
  "BM_1": { ... }
}
```

### Format Convertit (pentru aplicație)
```json
{
  "company_id": "acord_grup_sa",
  "company_name": "ACORD GRUP S.A.",
  "is_reference": false,
  "premiums": [
    {
      "cell_id": "A1_CH_PF_AGE_LT23_EXP_LT2",
      "value": 4768.92,
      "bonus_malus": 0
    }
  ]
}
```

## Configurare

Poți ajusta timpii de așteptare în script (`browser-collector.js`):

```javascript
const DELAY_BETWEEN_CHANGES = 2000; // 2 secunde între modificări
const DELAY_AFTER_CALCULATION = 3000; // 3 secunde după calcul
```

**Recomandări:**
- Nu reduce timpii sub 1.5 secunde - risc de rate limiting
- Dacă vezi erori, mărește timpii la 3-4 secunde

## Probleme și Soluții

### Scriptul nu pornește
- ✅ Verifică că ai deschis calculatorul (click pe "Calculează acum")
- ✅ Verifică că jQuery este încărcat (ar trebui să fie automat)
- ✅ Verifică consola pentru erori

### Nu se extrag prețuri
- ✅ Verifică că rezultatele sunt afișate în calculator
- ✅ Verifică manual dacă există elemente cu id-uri `puls1`, `puls2`, etc.
- ✅ Poți testa manual: `extractPrices()` în consolă

### Browserul se blochează
- ✅ Mărește `DELAY_BETWEEN_CHANGES` și `DELAY_AFTER_CALCULATION`
- ✅ Nu închide tab-ul browserului
- ✅ Nu naviga către alte pagini

### Datele nu se salvează
- ✅ Verifică că localStorage este activat în browser
- ✅ Verifică cu `localStorage.getItem('rca_bnm_premiums_collected')`
- ✅ Datele se salvează automat după fiecare 10 combinații

## Notă Importantă

- ⚠️ **Nu închide tab-ul browserului** în timpul colectării
- ⚠️ **Nu naviga către alte pagini** - datele sunt salvate doar în localStorage
- ⚠️ Procesul poate dura **aproximativ 2-3 ore** (~184 combinații × 2-3 secunde = 2-3 ore)
  - 92 celule pentru CH + 92 celule pentru AL = 184 combinații totale
- ✅ Poți **opri și relua** scriptul - datele sunt salvate periodic
- ✅ Poți **verifica progresul** oricând cu `showProgress()`

## Verificare Date

Pentru a verifica datele salvate în localStorage:

```javascript
const data = JSON.parse(localStorage.getItem('rca_bnm_premiums_collected'));
console.log(data);
```

Pentru a vedea câte date au fost colectate:

```javascript
showProgress();
```

## Workflow Complet

1. **Deschide calculatorul BNM** în browser
2. **Încarcă scriptul** în consolă
3. **Pornește colectarea**: `collectRcaData()`
4. **Lasă browserul să ruleze** (poți minimiza, dar nu închide tab-ul)
5. **Verifică progresul periodic**: `showProgress()`
6. **Exportă datele**: `exportData()` (după finalizare sau periodic)
7. **Convertește datele**: `npm run convert-data`
8. **Folosește datele** în aplicație

## Suport

Dacă întâmpini probleme:
1. Verifică consola pentru erori
2. Verifică că toate câmpurile din formular sunt disponibile
3. Testează manual cu o singură combinație înainte de a rula scriptul complet

