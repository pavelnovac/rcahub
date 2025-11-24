# Ghid Funcționalitate Multi-Year (2025 vs 2026)

## 📋 Prezentare Generală

Aplicația RCAhub a fost extinsă pentru a suporta stocarea și compararea prețurilor RCA pentru mai mulți ani (2025 și 2026). Această funcționalitate permite:

- **Stocarea separată** a datelor pentru fiecare an
- **Vizualizarea prețurilor** pentru un an specific
- **Compararea prețurilor** între 2025 și 2026
- **Analiza creșterilor/scăderilor** în procente sau valori absolute

## 🏗️ Structura Datelor

### Format Nou (Multi-Year)

Datele sunt stocate în localStorage folosind chei separate pentru fiecare an:

```
rca_companies_by_year_2025  →  Date pentru 2025
rca_companies_by_year_2026  →  Date pentru 2026
```

### Format Vechi (Compatibil)

Datele vechi rămân în:
```
rca_companies  →  Date legacy (pentru compatibilitate)
```

## 🚀 Cum să Folosești

### 1. Migrarea Datelor Existente

Dacă ai deja date încărcate în format vechi, trebuie să le migrezi:

1. Deschide Developer Console (F12)
2. Copiază conținutul din `scripts/migrate-to-multi-year.js`
3. Lipește în consolă și apasă Enter
4. Reîncarcă pagina

### 2. Încărcarea Datelor pentru 2025

**Opțiunea 1: Prin interfață**

1. Mergi la pagina principală "Rate de Referință"
2. Selectează anul "2025" din dropdown
3. Apasă butonul "Încarcă datele"
4. Datele vor fi încărcate din `public/all_companies.json`

**Opțiunea 2: Manual prin consolă**

```javascript
// Deschide Developer Console (F12)
const response = await fetch('/all_companies.json')
const companies = await response.json()

// Salvează pentru 2025
localStorage.setItem('rca_companies_by_year_2025', JSON.stringify(companies))
```

### 3. Încărcarea Datelor pentru 2026

**Pregătire:**
1. Creează fișierul `public/all_companies_2026.json` cu prețurile actualizate pentru 2026
2. Asigură-te că structura este identică cu `all_companies.json`

**Încărcare:**
1. Mergi la pagina principală "Rate de Referință"
2. Selectează anul "2026" din dropdown
3. Apasă butonul "Încarcă datele"
4. Sau mergi la "Comparație 2025 vs 2026" și apasă butonul "📅 2026"

### 4. Vizualizarea Prețurilor pe Ani

1. Mergi la pagina "Rate de Referință"
2. Selectează anul dorit (2025 sau 2026) din dropdown-ul "An"
3. Tabelul se va actualiza automat cu prețurile pentru anul selectat
4. Poți selecta orice companie sau vizualiza "Valori minime"

### 5. Compararea Prețurilor 2025 vs 2026

1. Mergi la pagina "Comparație 2025 vs 2026"
2. Vei vedea un tabel cu 3 secțiuni:
   - **2025 (Prețuri minime)** - Coloanele albastre
   - **2026 (Prețuri minime)** - Coloanele mov
   - **Schimbare (%)** sau **Diferență (MDL)** - Coloanele galbene

3. Folosește butonul "Arată valori absolute" / "Arată procente" pentru a comuta între:
   - **Procente**: Afișează schimbarea procentuală (ex: +15.5%)
   - **Valori absolute**: Afișează diferența în MDL (ex: +500.00)

4. Colorare:
   - 🟢 **Verde**: Scădere de preț (bine pentru client)
   - 🔴 **Roșu**: Creștere de preț (rău pentru client)
   - ⚪ **Gri**: Fără schimbare

## 📊 Interpretarea Comparației

### Exemplu de Citire

```
Vehicul: A1 (≤ 1200 cm³)
Categorie: PF V<23 V<2 (Persoană Fizică, sub 23 ani, experiență sub 2 ani)
Teritoriu: Chișinău

2025: 5,500.00 MDL
2026: 6,325.00 MDL
Schimbare: +15.00% (+825.00 MDL)
```

Interpretare: Prețul pentru această categorie a crescut cu 15% (825 MDL) în 2026.

## 🔧 Funcții Tehnice

### API JavaScript

```javascript
// Încarcă companii pentru un an specific
import { loadCompaniesByYear } from './utils/dataLoader'
const companies = await loadCompaniesByYear(2025)

// Salvează companie pentru un an specific
import { saveCompanyByYear } from './utils/dataLoader'
saveCompanyByYear(companyData, 2026)

// Încarcă din fișier pentru un an specific
import { loadCompaniesFromFileByYear } from './utils/dataLoader'
const companies = await loadCompaniesFromFileByYear(2026, 'all_companies_2026.json')

// Obține anii disponibili
import { getAvailableYears } from './utils/dataLoader'
const years = getAvailableYears() // [2025, 2026, ...]
```

## 📁 Structura Fișierelor

```
/public
  ├── all_companies.json         # Date pentru 2025
  ├── all_companies_2026.json    # Date pentru 2026 (de creat)
  ├── rca_cells.json             # Definiții categorii
  └── rca_bnm_cells.json         # Date BNM

/src
  ├── components
  │   ├── PremiumsTable.jsx      # Tabel cu selector de an
  │   └── PriceComparison.jsx    # Comparație 2025 vs 2026
  └── utils
      └── dataLoader.js          # Funcții pentru multi-year

/scripts
  └── migrate-to-multi-year.js   # Script de migrare
```

## ⚠️ Note Importante

1. **Backup**: Înainte de migrare, fă backup la datele din localStorage:
   ```javascript
   const backup = localStorage.getItem('rca_companies')
   console.log(backup) // Salvează acest output
   ```

2. **Compatibilitate**: Funcțiile vechi (`loadCompanies()`, `saveCompany()`) continuă să funcționeze pentru compatibilitate retroactivă.

3. **Sincronizare**: Datele pentru fiecare an sunt complet independente. Modificările pentru 2025 nu afectează 2026 și vice-versa.

4. **BNM Reference**: Datele BNM (is_reference: true) din `rca_bnm_cells.json` sunt primele de referință pentru anul 2026 și vor apărea automat doar când vizualizați sau comparați datele pentru 2026. Pentru 2025, veți vedea doar companiile ale căror date le-ați încărcat.

## 🐛 Depanare

### Problema: "Date lipsă pentru comparație"

**Soluție**: Asigură-te că ai încărcat datele pentru ambii ani (2025 și 2026).

### Problema: "Eroare la încărcarea datelor 2026"

**Soluție**: Verifică că există fișierul `public/all_companies_2026.json` cu structura corectă.

### Problema: "Nu văd opțiunea de an"

**Soluție**: Reîncarcă pagina după migrarea datelor.

### Problema: "Comparația arată toate valorile ca '-'"

**Soluție**: Verifică că ambele seturi de date (2025 și 2026) au același format de cell_id.

## 📞 Suport

Pentru probleme sau întrebări, verifică:
1. Console-ul browserului (F12) pentru erori
2. localStorage pentru a verifica datele: `localStorage.getItem('rca_companies_by_year_2025')`
3. Network tab pentru a verifica încărcarea fișierelor JSON

## 🎯 Exemple de Utilizare

### Exemplu 1: Găsirea Celui Mai Mare Creștere

1. Mergi la "Comparație 2025 vs 2026"
2. Selectează "Arată procente"
3. Caută celulele roșii cu cei mai mari procenți
4. Notează categoria și vehiculul cu cea mai mare creștere

### Exemplu 2: Analiza pe Categorie Specifică

1. Mergi la "Comparație 2025 vs 2026"
2. Selectează categoria de vehicul dorită (ex: "Autoturisme A")
3. Analizează doar rândurile relevante
4. Compară între Chișinău și "Alte localități"

### Exemplu 3: Export Date pentru Raportare

```javascript
// În consolă (F12)
const data2025 = JSON.parse(localStorage.getItem('rca_companies_by_year_2025'))
const data2026 = JSON.parse(localStorage.getItem('rca_companies_by_year_2026'))

// Calculează statistici
const stats = {
  companies2025: data2025.length,
  companies2026: data2026.length,
  // ... alte calcule
}

console.table(stats)
```

---

**Versiune**: 2.0  
**Data**: 2025-11-24  
**Autor**: RCAhub Development Team


