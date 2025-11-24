# Test Checklist: Multi-Year Functionality

## ✅ Pre-Test Setup

- [x] Code compiles without errors
- [x] No linter errors in modified files
- [x] Dev server running on http://localhost:5173
- [x] All new files created successfully
- [x] Documentation completed

## 📋 Functional Testing

### 1. Year Selection (PremiumsTable)

**Test Steps:**
- [ ] Open application at http://localhost:5173
- [ ] Check if "An" dropdown is visible with options 2025 and 2026
- [ ] Select 2025 from dropdown
- [ ] Verify title shows "Prime de referință RCA internă - 2025"
- [ ] Select 2026 from dropdown
- [ ] Verify title updates to "Prime de referință RCA internă - 2026"

**Expected Results:**
- Year selector appears in the filter section
- Title updates dynamically with selected year
- No console errors

### 2. Data Migration

**Test Steps:**
- [ ] Open browser console (F12)
- [ ] Check if existing data exists: `localStorage.getItem('rca_companies')`
- [ ] If yes, copy and run migration script from `scripts/migrate-to-multi-year.js`
- [ ] Verify success message appears
- [ ] Check new key: `localStorage.getItem('rca_companies_by_year_2025')`
- [ ] Reload page

**Expected Results:**
- Migration script runs without errors
- Success message with count of companies
- Data appears in new format
- Page works normally after reload

### 3. Load 2025 Data

**Test Steps:**
- [ ] Ensure `public/all_companies.json` exists
- [ ] Select year "2025" from dropdown
- [ ] Click "Încarcă datele" button
- [ ] Wait for loading to complete
- [ ] Verify success alert appears
- [ ] Check if table displays data

**Expected Results:**
- Loading indicator appears
- Success message: "X companii pentru 2025 încărcate cu succes!"
- Table populates with pricing data
- No console errors

### 4. Load 2026 Data

**Test Steps:**
- [ ] Create `public/all_companies_2026.json` (copy from 2025 and modify some prices)
- [ ] Select year "2026" from dropdown
- [ ] Click "Încarcă datele" button
- [ ] Wait for loading to complete
- [ ] Verify success alert appears
- [ ] Check if table displays data

**Expected Results:**
- Loading indicator appears
- Success message: "X companii pentru 2026 încărcate cu succes!"
- Table populates with different pricing data than 2025
- No console errors

### 5. Navigation to Comparison

**Test Steps:**
- [ ] Look for navigation menu at top
- [ ] Verify "Comparație 2025 vs 2026" tab exists
- [ ] Click on "Comparație 2025 vs 2026" tab
- [ ] Verify URL changes to `/comparison`
- [ ] Check if page loads

**Expected Results:**
- Tab is visible and clickable
- Navigation highlights correct tab
- URL updates to /comparison
- Comparison page loads

### 6. Comparison View - No Data

**Test Steps:**
- [ ] Navigate to comparison page with no data loaded
- [ ] Check if warning message appears
- [ ] Verify two load buttons are present (2025 and 2026)
- [ ] Read warning message content

**Expected Results:**
- Yellow warning box appears
- Message: "Date lipsă pentru comparație"
- Two separate load buttons visible
- Clear instructions provided

### 7. Comparison View - Load Data

**Test Steps:**
- [ ] On comparison page, click "📅 2025" button
- [ ] Wait for loading
- [ ] Click "📅 2026" button
- [ ] Wait for loading
- [ ] Verify comparison table appears

**Expected Results:**
- Each button loads respective year data
- Loading indicators work
- Success alerts for each year
- Full comparison table displays after both loaded

### 8. Comparison View - Data Display

**Test Steps:**
- [ ] Verify table has three main sections (columns)
- [ ] Check 2025 section has blue background
- [ ] Check 2026 section has purple background
- [ ] Check comparison section has yellow background
- [ ] Verify row data matches expected format

**Expected Results:**
- Table displays with correct color coding
- 2025 prices in blue columns
- 2026 prices in purple columns
- Differences in yellow columns
- All vehicle categories visible

### 9. Comparison View - Percentage Toggle

**Test Steps:**
- [ ] Look for toggle button at top right
- [ ] Verify button shows "Arată valori absolute"
- [ ] Click the toggle button
- [ ] Check if comparison columns update to show MDL values
- [ ] Click toggle again
- [ ] Check if comparison columns show percentages

**Expected Results:**
- Toggle button is visible and functional
- Button text changes based on current mode
- Comparison columns update immediately
- Percentages show with + or - sign (e.g., +15.5%)
- Absolute values show as currency (e.g., +500.00)

### 10. Comparison View - Color Coding

**Test Steps:**
- [ ] Identify cells with price increases (2026 > 2025)
- [ ] Verify they have red text and red background
- [ ] Identify cells with price decreases (2026 < 2025)
- [ ] Verify they have green text and green background
- [ ] Check cells with no change or missing data
- [ ] Verify they have gray styling

**Expected Results:**
- Increases: Red text on red background
- Decreases: Green text on green background
- No change/missing: Gray text on gray background
- Color coding is consistent across all cells

### 11. Comparison View - Filtering

**Test Steps:**
- [ ] Use vehicle category filter
- [ ] Select "Autoturisme A"
- [ ] Verify only A vehicles display
- [ ] Select "Toate categoriile"
- [ ] Verify all vehicles return

**Expected Results:**
- Filter works correctly
- Only selected categories display
- Comparison data remains accurate
- "All categories" shows everything

### 12. Year Switching

**Test Steps:**
- [ ] Go to main "Rate de Referință" page
- [ ] Load data for 2025
- [ ] Switch to year 2026 in dropdown
- [ ] Verify data changes
- [ ] Switch back to 2025
- [ ] Verify data changes back

**Expected Results:**
- Data updates when year changes
- No need to reload page
- Each year maintains separate data
- No data mixing between years

### 13. Company Selection with Years

**Test Steps:**
- [ ] Select year 2025
- [ ] Select a specific company from dropdown
- [ ] Note the prices
- [ ] Switch to year 2026
- [ ] Verify company dropdown still shows same selection
- [ ] Note if prices are different

**Expected Results:**
- Company selection persists across year changes
- Prices update based on year
- No reset of company selection
- Data is year-specific

### 14. Minimum Values Display

**Test Steps:**
- [ ] Select "Valori minime (implicit)"
- [ ] Select year 2025
- [ ] Note minimum prices and company names shown
- [ ] Switch to year 2026
- [ ] Verify minimum prices recalculated for 2026
- [ ] Check if minimum company might be different

**Expected Results:**
- Minimum values calculated correctly for each year
- Company name shown under each minimum value
- Minimums can differ between years
- Color coding per company maintained

### 15. Browser Console Check

**Test Steps:**
- [ ] Open browser console (F12)
- [ ] Navigate through all pages
- [ ] Perform various actions
- [ ] Check for any errors or warnings

**Expected Results:**
- No JavaScript errors
- No React warnings
- No 404 errors for missing files
- Clean console output

### 16. Local Storage Verification

**Test Steps:**
- [ ] Open browser console (F12)
- [ ] Run: `Object.keys(localStorage).filter(k => k.includes('rca'))`
- [ ] Verify keys include:
  - `rca_companies_by_year_2025`
  - `rca_companies_by_year_2026`
- [ ] Check data structure of each

**Expected Results:**
- Both year keys present in localStorage
- Data structure matches expected format
- No data corruption
- Legacy key may still exist (ok)

### 17. Mobile Responsiveness

**Test Steps:**
- [ ] Open browser dev tools
- [ ] Switch to mobile view (responsive mode)
- [ ] Navigate through pages
- [ ] Check table horizontal scrolling
- [ ] Verify buttons are accessible

**Expected Results:**
- Tables scroll horizontally on mobile
- Buttons remain accessible
- Navigation menu works
- No layout breaking

### 18. Performance Check

**Test Steps:**
- [ ] Load large dataset (all companies)
- [ ] Switch between years
- [ ] Navigate between pages
- [ ] Note loading times and responsiveness

**Expected Results:**
- Year switching is instant (< 1s)
- Page navigation is smooth
- Table rendering is acceptable
- No significant lag

## 🐛 Edge Cases

### E1. Missing 2026 Data File

**Test Steps:**
- [ ] Remove `all_companies_2026.json` from public folder
- [ ] Try to load 2026 data
- [ ] Verify error message appears
- [ ] Check error is user-friendly

**Expected Results:**
- Clear error message
- Mentions missing file
- Application doesn't crash
- User can still use 2025 data

### E2. Empty Dataset

**Test Steps:**
- [ ] Clear all localStorage data
- [ ] Reload application
- [ ] Try to view comparison

**Expected Results:**
- Helpful message about loading data
- Load buttons work to populate data
- No crashes or undefined errors
- BNM reference data still loads

### E3. Corrupted Data

**Test Steps:**
- [ ] Set invalid JSON in localStorage: `localStorage.setItem('rca_companies_by_year_2025', 'invalid')`
- [ ] Reload page
- [ ] Check error handling

**Expected Results:**
- Application handles gracefully
- Error message or fallback
- Ability to reload data
- No complete application crash

### E4. Mixed Data Structures

**Test Steps:**
- [ ] Load old format data
- [ ] Load new format data for 2026
- [ ] Switch between years
- [ ] Check comparison view

**Expected Results:**
- Both formats work
- No conflicts
- Comparison might show missing data warning
- No crashes

## 📊 Test Results Summary

### Passed: ___ / ___
### Failed: ___ / ___
### Blocked: ___ / ___
### Not Tested: ___ / ___

## 🔍 Issues Found

| # | Test | Severity | Description | Status |
|---|------|----------|-------------|--------|
| 1 |      |          |             |        |
| 2 |      |          |             |        |

## ✅ Sign-off

- [ ] All critical tests passed
- [ ] No blocker issues
- [ ] Documentation reviewed
- [ ] Ready for user acceptance testing

**Tested By:** _________________  
**Date:** _________________  
**Environment:** Development (localhost:5173)  
**Browser:** _________________  
**Version:** 2.0

---

## 📝 Notes

Add any additional observations or comments here:

```
[Testing notes]
```

## 🎯 Recommended User Testing Scenarios

1. **New User**: Test complete flow from scratch
2. **Existing User**: Test migration from old format
3. **Power User**: Test with large datasets and multiple companies
4. **Mobile User**: Test on actual mobile device
5. **Comparison Focus**: Focus on accuracy of comparison calculations



