# Client Savings Report - RCA Insurance

## Executive Summary

This report analyzes how much money clients saved by purchasing RCA insurance before the price changes in 2026.

### Key Metrics

- **Total Purchases Analyzed**: 4,610
- **Total Amount Paid (Old Prices)**: 3,225,508.18 MDL
- **Total Amount if Purchased Now (New Prices)**: 2,938,481.62 MDL
- **Total Savings**: **287,026.56 MDL**
- **Average Savings per Purchase**: 62.26 MDL

### Methodology

For each insurance purchase:
1. Determined the insurance category based on:
   - Vehicle type (A1 = passenger car)
   - Territory (CH = Chisinau, AL = Other localities)
   - Person category (PF = Physical person with age/experience, PJ = Juridical person)
2. Found the minimum base price from all insurance companies for that category (BM_7, coefficient 1.0)
3. Applied the client's Bonus Malus coefficient to calculate the final new price
4. Calculated savings = Old Price - New Price

### Top 10 Individual Savings

| Rank | Client Name | Old Price | New Price | Savings |
|------|-------------|-----------|-----------|---------|
| 1 | Societatea cu Răspundere Limitată "ANDRONIX-DIN" | 4,048.10 MDL | 1,392.59 MDL | 2,655.51 MDL |
| 2 | Societatea cu Răspundere Limitată "DEMO - EDIL GRUP" | 4,798.99 MDL | 2,466.87 MDL | 2,332.12 MDL |
| 3 | Societatea cu Răspundere Limitată "ANDRONIX-DIN" | 3,340.22 MDL | 1,319.29 MDL | 2,020.93 MDL |
| 4 | Societatea cu Răspundere Limitată "APAACTIVE" | 5,381.47 MDL | 3,765.23 MDL | 1,616.24 MDL |
| 5 | IAȚCO SORIN | 2,578.56 MDL | 1,043.38 MDL | 1,535.18 MDL |
| 6 | LITVINOV OLEG | 2,053.24 MDL | 548.00 MDL | 1,505.24 MDL |
| 7 | Societatea cu Răspundere Limitată "DORSA GROUP" | 2,851.34 MDL | 1,392.59 MDL | 1,458.75 MDL |
| 8 | Societatea cu Răspundere Limitată "CEREALS-TRADE COMPANY" | 2,720.29 MDL | 1,319.29 MDL | 1,401.00 MDL |
| 9 | SOLOMON LUDMILA | 2,463.88 MDL | 1,104.75 MDL | 1,359.13 MDL |
| 10 | FIRMA ŞTIINŢIFICĂ DE PRODUCŢIE "EXTREMUM" S.R.L. | 3,933.38 MDL | 2,596.71 MDL | 1,336.67 MDL |

### Bonus Malus Coefficients Used

| Class | Coefficient |
|-------|-------------|
| 0 | 2.5 |
| 1 | 2.2 |
| 2 | 1.9 |
| 3 | 1.6 |
| 4 | 1.45 |
| 5 | 1.3 |
| 6 | 1.15 |
| 7 | 1.0 |
| 8 | 0.95 |
| 9 | 0.9 |
| 10 | 0.85 |
| 11 | 0.8 |
| 12 | 0.75 |
| 13 | 0.7 |
| 14 | 0.65 |
| 15 | 0.6 |
| 16 | 0.55 |
| 17 | 0.5 |

### Data Sources

- **Old Prices**: `data/omnis_public_app_rca.json` - Actual prices paid by clients
- **New Prices**: `data/rca_bnm_premiums_2026.json` - Base prices for 2026 (BM_7, before bonus malus)

### Report Files

- **JSON Report**: `data/savings_report.json` - Complete detailed report in JSON format
- **CSV Report**: `data/savings_report.csv` - Spreadsheet-friendly format with all purchases

### Notes

- All prices are in MDL (Moldovan Lei)
- New prices are calculated using the minimum base price from all insurance companies for each category
- Bonus Malus coefficients are applied to the base prices to get the final new price
- The report includes all successfully processed purchases (4,610 out of 4,611 total)

---

*Report generated on: 2025-01-27*

