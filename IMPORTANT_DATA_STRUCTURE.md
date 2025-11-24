# 📊 Important: Data Structure and Years

## Current Data Situation

### Year 2025 (Current Collected Data)
- **File**: `public/all_companies.json`
- **Contains**: Company prices you collected (GENERAL ASIGURARI, MOLDASIG, etc.)
- **Does NOT include**: BNM reference prices (those are for 2026)

### Year 2026 (BNM Reference + Future Collections)
- **BNM Reference**: `public/rca_bnm_cells.json` - These are the 2026 reference prices
- **Future Company Data**: `public/all_companies_2026.json` - You'll create this when companies publish their 2026 prices

## What You'll See

### When Viewing 2025
```
✅ GENERAL ASIGURARI S.A. (your collected data)
✅ MOLDASIG S.A. (your collected data)
✅ ASTERRA GRUP S.A. (your collected data)
✅ [other companies from all_companies.json]
❌ BNM Reference (not shown - it's for 2026)
```

### When Viewing 2026
```
✅ BNM - Prime de referință RCA internă (reference prices)
✅ Companies from all_companies_2026.json (when you collect them)
```

## Understanding the Comparison

When you compare 2025 vs 2026:

### Scenario 1: Before Collecting 2026 Company Data
```
2025: Shows your collected company prices (minimum across all companies)
2026: Shows BNM reference prices only
Comparison: Shows how BNM 2026 reference compares to actual 2025 market prices
```

### Scenario 2: After Collecting 2026 Company Data
```
2025: Shows your collected company prices (minimum across all companies)
2026: Shows minimum between BNM reference AND company prices
Comparison: True market comparison year-over-year
```

## Data Loading Strategy

### Now (Setup Phase)
1. Load your existing `all_companies.json` as **2025 data**
2. View 2026 to see BNM reference prices

### Tomorrow (When New Prices Available)
1. Collect new prices from companies
2. Save as `all_companies_2026.json`
3. Load 2026 data through the UI
4. Compare to see actual market changes

## File Structure

```
/public
  ├── all_companies.json          → Your 2025 collected data (already have)
  ├── all_companies_2026.json     → Future 2026 collected data (create later)
  ├── rca_bnm_cells.json          → BNM 2026 reference (already have)
  └── rca_cells.json              → Category definitions (already have)
```

## localStorage Structure

After loading data:

```javascript
// 2025 - Your collected company data
localStorage['rca_companies_by_year_2025'] = [
  { company_id: "general_asigurari_s_a", premiums: [...] },
  { company_id: "moldasig_s_a", premiums: [...] },
  // ... other companies from all_companies.json
]

// 2026 - BNM + (future) collected company data
localStorage['rca_companies_by_year_2026'] = [
  { company_id: "bnm_reference", is_reference: true, premiums: [...] },
  // ... (future) companies from all_companies_2026.json
]
```

## Key Points

1. **BNM Reference = 2026**: The BNM reference prices in `rca_bnm_cells.json` are for 2026
2. **Your Data = 2025**: The data you already collected in `all_companies.json` is for 2025
3. **Comparison is Valid**: You can compare 2025 actual market prices vs 2026 BNM reference
4. **Future Enhancement**: When you get 2026 company prices, comparison becomes even more valuable

## Example Use Case

### Today's Comparison
```
Question: "How much will prices increase in 2026 based on BNM reference?"
Answer: Compare 2025 minimum (your collected data) vs 2026 BNM reference
```

### Future Comparison (After Collecting 2026 Data)
```
Question: "How did the market actually change from 2025 to 2026?"
Answer: Compare 2025 minimum vs 2026 minimum (both actual market prices)
```

## Visual Example

### 2025 View
```
╔════════════════════════════════════════════╗
║  Prime de referință RCA internă - 2025    ║
╠════════════════════════════════════════════╣
║  Companie: [Valori minime ▼]             ║
╠════════════════════════════════════════════╣
║  Showing minimum across:                  ║
║  • GENERAL ASIGURARI S.A.                ║
║  • MOLDASIG S.A.                         ║
║  • ASTERRA GRUP S.A.                     ║
║  • [other collected companies]           ║
╚════════════════════════════════════════════╝
```

### 2026 View (Before New Collections)
```
╔════════════════════════════════════════════╗
║  Prime de referință RCA internă - 2026    ║
╠════════════════════════════════════════════╣
║  Companie: [Valori minime ▼]             ║
╠════════════════════════════════════════════╣
║  Showing:                                 ║
║  • BNM - Prime de referință RCA internă  ║
║    (Reference prices for 2026)           ║
╚════════════════════════════════════════════╝
```

### 2026 View (After New Collections)
```
╔════════════════════════════════════════════╗
║  Prime de referință RCA internă - 2026    ║
╠════════════════════════════════════════════╣
║  Companie: [Valori minime ▼]             ║
╠════════════════════════════════════════════╣
║  Showing minimum across:                  ║
║  • BNM - Prime de referință RCA internă  ║
║  • GENERAL ASIGURARI S.A. (2026 prices)  ║
║  • MOLDASIG S.A. (2026 prices)           ║
║  • [other companies 2026 prices]         ║
╚════════════════════════════════════════════╝
```

---

**Summary**: Your current setup correctly reflects that:
- ✅ `all_companies.json` = 2025 actual market prices
- ✅ `rca_bnm_cells.json` = 2026 BNM reference prices
- ✅ Comparison shows how BNM reference compares to 2025 market
- 📅 Future: Add `all_companies_2026.json` for full market comparison

