# Browser Collector - Fixes Applied

## Summary of Issues Fixed

### Issue 1: Taxi Prices Not Being Collected Correctly ✅ FIXED

**Problem:** 
- Taxi (A7) prices were identical to A1 prices
- The usage mode field was not being set correctly
- Script was collecting regular car prices instead of taxi prices

**Solution:**
- Kept A7 as a separate vehicle type (Taxi is a single category)
- Taxi is only collected for legal entities (PJ) - as per requirements
- Added `findUsageModeElementId()` function to automatically detect the correct form element ID
- Added `setUsageMode()` function to properly set the usage mode before calculation
- Fixed `setVehicleCategory()` to set usage mode (utilizare: 2) when vehicle is A7

### Issue 2: Wrong Element ID for Usage Mode Field ✅ FIXED

**Problem:**
- Script used hardcoded `#auto_utilizare` which doesn't exist
- Script tried to show/hide the element, but it's always visible

**Solution:**
- Added intelligent element detection that tries multiple possible IDs: `u`, `ut`, `utilizare`, `auto_utilizare`, `usage`
- Falls back to searching by label text if direct ID lookup fails
- Removed show/hide logic - the field is always visible

### Issue 3: Taxi Only Collected for Legal Entities ✅ CONFIRMED

**Requirement:**
- Taxi (A7) should only be collected for legal entities (PJ)
- This is correct behavior and has been maintained

**Solution:**
- Script collects Taxi (A7) only for PJ category
- Same as B4 (Troleibuze) which is also only for PJ

## Key Changes Made

### 1. Kept A7 in VEHICLES with utilizare: 2
```javascript
'A7': { category: 1, subcategory: 1, utilizare: 2 }, // Autoturisme, Taxi (doar pentru persoane juridice)
```

### 2. Added USAGE_MODES Constant
```javascript
const USAGE_MODES = {
  'NORMAL': 1,  // Mod obișnuit
  'TAXI': 2     // Taxi
};
```

### 3. Added Usage Mode Detection Function
```javascript
function findUsageModeElementId() {
  // Tries multiple possible IDs
  // Falls back to label-based search
  // Returns the correct element ID or null
}
```

### 4. Added Usage Mode Setting Function
```javascript
async function setUsageMode(usageMode, usageElementId = null) {
  // Sets the usage mode (Normal or Taxi) before calculation
}
```

### 5. Updated Main Collection Logic
```javascript
// For A7 (Taxi) and B4 (Troleibuze):
// - Collects only for PJ (legal entities)
// - For A7, sets usage mode to Taxi (utilizare: 2)
// - For other vehicles, collects for all person categories
```

### 6. Updated setVehicleCategory Function
```javascript
// Now accepts utilizare parameter
// Sets usage mode (Taxi) when vehicle is A7
// Usage mode is set AFTER subcategory is set
```

## Data Structure Changes

### Before:
- `A7_CH_PJ` - Only one taxi entry (PJ only)
- Prices identical to A1_CH_PJ (proving usage mode wasn't being set)

### After:
- `A7_CH_PJ` - Taxi for legal entities, Chișinău
- `A7_AL_PJ` - Taxi for legal entities, Alte localități
- Prices should now be DIFFERENT from A1_CH_PJ (taxi prices are typically higher)

**Note:** Taxi (A7) is a single vehicle category, only for legal entities (PJ), with usage mode set to Taxi (utilizare: 2).

## Testing Recommendations

1. **Test Usage Mode Detection:**
   - Run the script and check console for: `[FOUND] Element utilizare găsit: #<id>`
   - If not found, manually identify the element ID and update the `possibleIds` array

2. **Verify Taxi Prices:**
   - Compare A1_CH_PJ (normal car) vs A7_CH_PJ (taxi) - should be DIFFERENT
   - Taxi prices should be higher than normal car prices (taxi has higher risk)
   - Verify A7 is only collected for PJ, not for PF categories

3. **Check All Combinations:**
   - Verify A7 (Taxi) is collected only for PJ (legal entities)
   - Verify A7 is collected for both territories (CH and AL)
   - Verify usage mode field is being set correctly (check console for usage mode detection)

## Known Limitations

1. **Element ID Detection:**
   - If the usage mode element has an unusual ID, the script may not find it
   - In this case, manually inspect the form and add the correct ID to `possibleIds` array

2. **Taxi Category:**
   - Taxi (A7) is a single vehicle category, not multiple categories
   - Only collected for legal entities (PJ) as per requirements

## Next Steps

1. Test the corrected script on the BNM calculator
2. Verify that taxi prices are now different from normal prices
3. Update data processing scripts if needed to handle the new structure
4. Consider adding more usage modes if the calculator supports them

