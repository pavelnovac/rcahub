# 🚀 Quick Start: Multi-Year Pricing

## For First-Time Users

### 1️⃣ Load Your Company Data for 2025

```bash
# Your dev server should already be running on http://localhost:5173
```

**Important**: Your `all_companies.json` file contains the 2025 prices you collected.

1. Open http://localhost:5173
2. Select **"2025"** from "An" dropdown
3. Click **"Încarcă datele"** button
4. Wait for success message ✅

**Note**: BNM reference prices are for 2026, so they won't show for 2025 - only your collected company data will appear.

### 2️⃣ Prepare for 2026 (When You Get New Prices)

When you collect the new 2026 prices from companies:

```bash
# In your terminal
cd public
# Save the new collected data as all_companies_2026.json
```

**Note**: For 2026, you'll automatically see the BNM reference prices alongside your collected company prices.

### 3️⃣ Load Next Year Data (2026)

1. Select **"2026"** from "An" dropdown
2. Click **"Încarcă datele"** button
3. Wait for success message ✅

### 4️⃣ View Comparison

1. Click **"Comparație 2025 vs 2026"** in top navigation
2. See the comparison table with:
   - 2025 prices (blue)
   - 2026 prices (purple)
   - Changes (yellow with red/green highlights)

## For Existing Users (With Data Already Loaded)

### Migrate Your Data

1. Press **F12** to open console
2. Copy and paste from `scripts/migrate-to-multi-year.js`
3. Press Enter
4. Reload the page

That's it! Your existing data is now saved as 2025 data.

## 🎨 Visual Guide

### Main Page (Rate de Referință)

```
┌─────────────────────────────────────────────────────────┐
│  Prime de referință RCA internă - 2025  [Încarcă datele]│
├─────────────────────────────────────────────────────────┤
│  An: [2025 ▼]  Companie: [Valori minime ▼]             │
│  Categorie vehicul: [Toate categoriile ▼]              │
├─────────────────────────────────────────────────────────┤
│                    PRICING TABLE                        │
│  Vehicle | Chișinău | Alte localități                  │
│  --------+----------+----------------                  │
│   A1     | 2,500    | 1,800                           │
│   A2     | 3,200    | 2,400                           │
└─────────────────────────────────────────────────────────┘
```

### Comparison Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Comparație Prețuri: 2025 vs 2026    [Arată procente] [📅][📅] │
├─────────────────────────────────────────────────────────────────┤
│  Companie: [Valori minime ▼]  Categorie: [Toate ▼]            │
├─────────────────────────────────────────────────────────────────┤
│         │    2025    │    2026    │   Schimbare                 │
│ Vehicle │ (Blue)     │ (Purple)   │  (Yellow)                   │
│─────────┼────────────┼────────────┼─────────────                │
│   A1    │ 2,500      │ 2,875      │ 🔴 +15.0%                   │
│   A2    │ 3,200      │ 3,040      │ 🟢 -5.0%                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Common Tasks

### Switch Between Years
```
Main Page → Select year from "An" dropdown → Data updates automatically
```

### View Specific Company for a Year
```
Main Page → Select year → Select company from "Companie" dropdown
```

### Compare Prices
```
Navigation → "Comparație 2025 vs 2026" → See comparison
```

### Toggle Comparison Display
```
Comparison Page → Click "Arată valori absolute" / "Arată procente"
```

### Filter Comparison by Vehicle Type
```
Comparison Page → Select category from "Categorie vehicul" dropdown
```

## 📊 Data Flow

```
1. Create JSON file:
   public/all_companies_2026.json

2. Load via UI:
   [Încarcă datele] button

3. Saved to:
   localStorage['rca_companies_by_year_2026']

4. View in:
   - Main table (switch year)
   - Comparison page (automatic)
```

## 💾 LocalStorage Structure

```javascript
// Current format
localStorage['rca_companies_by_year_2025'] = [...companies...]
localStorage['rca_companies_by_year_2026'] = [...companies...]

// Legacy format (still supported)
localStorage['rca_companies'] = [...companies...]
```

## 🔧 Console Commands

### Check Available Data
```javascript
// See what years you have data for
Object.keys(localStorage)
  .filter(k => k.includes('rca_companies_by_year'))
```

### View Data for a Year
```javascript
// Check 2025 data
JSON.parse(localStorage.getItem('rca_companies_by_year_2025'))
```

### Backup All Data
```javascript
// Backup everything
const backup = {}
Object.keys(localStorage)
  .filter(k => k.includes('rca'))
  .forEach(k => backup[k] = localStorage.getItem(k))
console.log(JSON.stringify(backup))
```

### Restore from Backup
```javascript
// Restore (replace backupString with your backup)
const backup = JSON.parse(backupString)
Object.keys(backup).forEach(k => localStorage.setItem(k, backup[k]))
```

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Console | F12 |
| Reload Page | Ctrl+R / Cmd+R |
| Hard Reload | Ctrl+Shift+R / Cmd+Shift+R |

## 🐛 Troubleshooting

### "Date lipsă pentru comparație"
**Solution**: Load data for both 2025 and 2026

### "Eroare la încărcarea datelor 2026"
**Solution**: Make sure `public/all_companies_2026.json` exists

### Table shows all "-" values
**Solution**: Check that you loaded data for the selected year

### Comparison shows wrong values
**Solution**: Make sure cell_id formats match in both years

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Review `MULTI_YEAR_GUIDE.md` for detailed docs
3. Check `TEST_CHECKLIST.md` for testing scenarios
4. Verify data files exist in `public/` folder

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Dev server is running (http://localhost:5173)
- [ ] JSON files exist in `public/` folder
- [ ] Files have correct JSON format
- [ ] Browser console shows no errors
- [ ] localStorage has data for both years
- [ ] Page was reloaded after loading data

---

**Quick Links:**
- 📖 [Full Guide](MULTI_YEAR_GUIDE.md)
- 📝 [Changelog](CHANGELOG_MULTI_YEAR.md)
- ✅ [Test Checklist](TEST_CHECKLIST.md)
- 🎉 [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

**Status**: Ready to use! 🚀


