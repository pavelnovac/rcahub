# Savings Report Dashboard

## Overview

The Savings Report Dashboard is a web-based interface to view and analyze how much money clients saved by purchasing RCA insurance before the 2026 price changes.

## Features

- **Dashboard Statistics**: Overview of total purchases, prices, and savings
- **Sortable Table**: View all purchases with sorting by any column
- **Search Functionality**: Search by name, contract number, car number, or model
- **Pagination**: Navigate through large datasets (50 items per page)
- **Vehicle Details**: Shows car mark, model, registration number, and certificate number
- **Person Information**: Shows person name and ID

## Accessing the Dashboard

### Option 1: Using Vite Dev Server (Recommended)

1. Start the Vite development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173/savings-report.html
   ```

### Option 2: Using Python HTTP Server

1. Navigate to the project root directory:
   ```bash
   cd /path/to/RCAhub
   ```

2. Start a simple HTTP server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Or Python 2
   python -m SimpleHTTPServer 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000/public/savings-report.html
   ```

### Option 3: Using Node.js http-server

1. Install http-server globally (if not already installed):
   ```bash
   npm install -g http-server
   ```

2. Navigate to the project root and start the server:
   ```bash
   http-server -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000/public/savings-report.html
   ```

## Table Columns

- **Contract #**: Insurance contract number
- **Name**: Client/person name
- **Person ID**: Unique identifier for the contracting person
- **Car Mark**: Vehicle brand (e.g., TOYOTA, BMW)
- **Car Model**: Vehicle model (e.g., COROLLA, X5)
- **Car Number**: Vehicle registration number (license plate)
- **Reg. Cert. #**: Registration certificate number
- **Old Price**: Price paid by the client
- **New Price**: Price if purchased now (with new 2026 prices)
- **Savings**: Difference between old and new price (positive = saved money)

## Usage Tips

1. **Sorting**: Click on any column header to sort by that column. Click again to reverse the sort order.

2. **Search**: Use the search box to filter results by:
   - Contract number
   - Person name
   - Car mark/brand
   - Car model
   - Registration number
   - Registration certificate number

3. **Pagination**: Use the Previous/Next buttons to navigate through pages.

4. **Dashboard Cards**: The top cards show aggregate statistics:
   - Total Purchases: Number of insurance contracts analyzed
   - Total Old Price: Sum of all prices paid
   - Total New Price: Sum of all new prices
   - Total Savings: Total amount saved
   - Average Savings: Average savings per purchase

## Data Files

The dashboard loads data from:
- `data/savings_report.json` - Calculated savings data
- `data/omnis_public_app_rca.json` - Original RCA insurance purchase data

## Regenerating the Report

To regenerate the savings report with updated data:

```bash
node scripts/generate-savings-report.js
```

This will update:
- `data/savings_report.json`
- `data/savings_report.csv`
- `data/SAVINGS_REPORT_SUMMARY.md`

## Browser Compatibility

The dashboard works best in modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### CORS Errors

If you see CORS errors when opening the HTML file directly:
- Use one of the server options above (Vite, Python, or http-server)
- Do not open the HTML file directly with `file://` protocol

### Data Not Loading

- Ensure both JSON files exist in the `data/` directory
- Check browser console for specific error messages
- Verify the file paths in the HTML match your directory structure

### Styling Issues

- Clear browser cache and reload
- Ensure all CSS is loading correctly
- Check browser console for any CSS errors






