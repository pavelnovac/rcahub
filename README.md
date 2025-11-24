# RCA Hub

Aplicație web pentru vizualizarea și gestionarea ratelor de referință pentru asigurarea RCA (Răspundere Civilă Auto) din Republica Moldova.

## Funcționalități

- **Vizualizare rate de referință**: Tabel interactiv cu toate ratele BNM și ale altor companii de asigurare
- **Suport multi-year**: Stocarea și vizualizarea datelor pentru mai mulți ani (2025, 2026, etc.)
- **Comparație prețuri**: Comparare side-by-side între 2025 și 2026 cu afișarea creșterilor/scăderilor
- **Filtrare**: Filtrare după an, teritoriu și categorie de vehicul
- **Gestionare companii**: Pagină de setări pentru adăugarea, editarea și ștergerea companiilor personalizate
- **Stocare locală**: Datele companiilor sunt salvate în localStorage, separate pe ani

## Instalare

```bash
npm install
```

## Dezvoltare

```bash
npm run dev
```

Aplicația va rula pe `http://localhost:5173`

## Funcționalitate Multi-Year

### Vizualizare pe Ani

1. Pe pagina principală "Rate de Referință", selectează anul dorit (2025 sau 2026) din dropdown
2. Prețurile se vor actualiza automat pentru anul selectat
3. Poți vedea prețurile minime sau ale unei companii specifice

### Comparație 2025 vs 2026

1. Mergi la tab-ul "Comparație 2025 vs 2026"
2. Vezi tabelul cu 3 secțiuni:
   - Prețuri 2025 (coloane albastre)
   - Prețuri 2026 (coloane mov)
   - Schimbări (coloane galbene - roșu pentru creșteri, verde pentru scăderi)
3. Comută între procente și valori absolute cu butonul din dreapta sus

### Încărcarea Datelor

#### Pentru 2025:
- Folosește fișierul `public/all_companies.json`
- Apasă butonul "Încarcă datele" după selectarea anului 2025

#### Pentru 2026:
- Creează fișierul `public/all_companies_2026.json` cu prețurile noi
- Apasă butonul "Încarcă datele" după selectarea anului 2026

### Migrarea Datelor Existente

Dacă ai deja date încărcate în format vechi:

1. Deschide Developer Console (F12)
2. Copiază și execută scriptul din `scripts/migrate-to-multi-year.js`
3. Reîncarcă pagina

📖 **Ghid complet**: Vezi [MULTI_YEAR_GUIDE.md](./MULTI_YEAR_GUIDE.md) pentru detalii complete.

## Build pentru producție

```bash
npm run build
```

## Structura datelor

### rca_cells.json
Conține definițiile pentru:
- Categorii de vehicule (A1-A8, B1-B4, C1-C3, D1-D3, E1-E2)
- Teritorii (CH - Chișinău și raioane, AL - Alte localități)
- Categorii de persoane (PF - persoane fizice cu diferite criterii, PJ - persoane juridice)

### rca_bnm_cells.json
Conține ratele de referință stabilite de Banca Națională a Moldovei.

Formatul unei companii:
```json
{
  "company_id": "unique_id",
  "company_name": "Nume Companie",
  "is_reference": false,
  "premiums": [
    { "cell_id": "A1_CH_PF_AGE_LT23_EXP_LT2", "value": 3901.23 }
  ]
}
```

## Tehnologii

- React 18
- React Router
- Tailwind CSS
- Vite


