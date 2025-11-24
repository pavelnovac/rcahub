# Ghid de Utilizare - Script Colectare Prețuri BNM

## Instalare

1. Instalează dependențele:
```bash
npm install
```

## Rulare

```bash
npm run collect-premiums
```

## Funcționare

Scriptul:
1. Deschide calculatorul BNM în browser
2. Pentru fiecare clasă Bonus Malus (0-17):
   - Pentru fiecare vehicul, teritoriu și categorie de persoană:
     - Deschide dialogul calculatorului
     - Completează formularul cu configurația corespunzătoare
     - **Modificarea oricărui câmp declanșează calculul automat**
     - Așteaptă ca rezultatele să fie calculate
     - Extrage prețurile pentru toate companiile
     - Salvează datele

## Ajustări Necesare

Scriptul necesită ajustări în funcție de structura exactă a paginii BNM:

### 1. Selectoare pentru Combobox-uri

În funcția `fillCalculatorForm`, ajustează indexurile combobox-urilor:

```javascript
// Găsește combobox-ul Bonus Malus
const allComboboxes = await page.$$('span[role="combobox"]');
// Ajustează indexul în funcție de ordinea reală în formular
const bonusMalusIndex = personType === 'fizica' ? 3 : 1;
```

### 2. Selectoare pentru Vehicule

Completează logica pentru selectarea tipului de vehicul și parametrilor:

```javascript
// Selectează tipul de vehicul și parametrii
const vehicleConfig = VEHICLES[vehicle];
// TODO: Implementează selectarea vehiculului
```

### 3. Extragerea Prețurilor

În funcția `extractPrices`, ajustează selectoarele pentru a găsi corect companiile și prețurile:

```javascript
// Ajustează selectorul pentru elementele cu companiile
const companyElements = await page.$$('[class*="company"], [class*="insurer"], tr, li');
```

### 4. Structura Răspunsului API

Dacă calculatorul folosește un API, ajustează structura de date în funcția `collectDataForConfig`:

```javascript
if (apiData && (apiData.companies || apiData.premiums)) {
  // Ajustează în funcție de structura reală a răspunsului
}
```

## Debugging

Pentru a vedea ce se întâmplă:

1. **Rulează cu `headless: false`** (deja setat în script) pentru a vedea browserul
2. **Adaugă console.log** în funcțiile critice:
   ```javascript
   console.log('Combobox-uri găsite:', allComboboxes.length);
   console.log('Prețuri extrase:', prices);
   ```
3. **Verifică Network tab** în browser pentru a vedea cererile API

## Testare Incrementală

1. Testează cu o singură clasă Bonus Malus:
   ```javascript
   const BONUS_MALUS_CLASSES = [7]; // Doar clasa 7
   ```

2. Testează cu un singur vehicul:
   ```javascript
   const vehicles = [rcaCells.vehicles[0]]; // Doar primul vehicul
   ```

3. Verifică dacă rezultatele sunt corecte înainte de a rula scriptul complet

## Note Importante

- **Modificarea oricărui câmp declanșează calculul automat** - scriptul așteaptă după fiecare modificare
- Pauzele între cereri (1.5 secunde) sunt importante pentru a nu suprasolicita serverul
- Progresul este salvat după fiecare clasă Bonus Malus pentru a evita pierderea datelor
- Dacă scriptul se oprește, poți relua de la ultima clasă procesată

## Structura Datelor Salvate

Datele sunt salvate în format:
```json
{
  "BM_0": {
    "A1_CH_PF_AGE_LT23_EXP_LT2": {
      "Company 1": 3901.23,
      "Company 2": 3850.50
    }
  },
  "BM_1": { ... },
  ...
}
```

Fiecare cheie `BM_X` conține toate combinațiile pentru clasa respectivă de Bonus Malus.

