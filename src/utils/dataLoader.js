// Load data from public folder
let rcaCells = null
let bnmData = null

// Get base URL for assets (handles both dev and production)
const baseUrl = import.meta.env.BASE_URL

async function loadRcaCells() {
  if (!rcaCells) {
    const response = await fetch(`${baseUrl}rca_cells.json`)
    rcaCells = await response.json()
  }
  return rcaCells
}

async function loadBnmData() {
  if (!bnmData) {
    const response = await fetch(`${baseUrl}rca_bnm_cells.json`)
    bnmData = await response.json()
    // BNM data is for 2026
    if (bnmData && !bnmData.year) {
      bnmData.year = 2026
    }
  }
  return bnmData
}

const STORAGE_KEY = 'rca_companies'
const STORAGE_KEY_BY_YEAR = 'rca_companies_by_year'

// Legacy function for backwards compatibility
export async function loadCompanies() {
  const bnm = await loadBnmData()
  const stored = localStorage.getItem(STORAGE_KEY)
  const customCompanies = stored ? JSON.parse(stored) : []
  
  return [bnm, ...customCompanies]
}

// New function to load companies by year
export async function loadCompaniesByYear(year) {
  const yearKey = `${STORAGE_KEY_BY_YEAR}_${year}`
  const stored = localStorage.getItem(yearKey)
  const customCompanies = stored ? JSON.parse(stored) : []
  
  // BNM reference rates apply to all 2026 snapshots
  if (year === 2026 || String(year).startsWith('2026')) {
    const bnm = await loadBnmData()
    return [bnm, ...customCompanies]
  }
  
  return customCompanies
}

// Legacy save function
export function saveCompany(company) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const companies = stored ? JSON.parse(stored) : []
  
  // Check if company already exists
  const existingIndex = companies.findIndex(c => c.company_id === company.company_id)
  
  if (existingIndex >= 0) {
    companies[existingIndex] = company
  } else {
    companies.push(company)
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
}

// New function to save companies by year
export function saveCompaniesByYear(companies, year) {
  const yearKey = `${STORAGE_KEY_BY_YEAR}_${year}`
  localStorage.setItem(yearKey, JSON.stringify(companies))
}

export function saveCompanyByYear(company, year) {
  const yearKey = `${STORAGE_KEY_BY_YEAR}_${year}`
  const stored = localStorage.getItem(yearKey)
  const companies = stored ? JSON.parse(stored) : []
  
  // Check if company already exists
  const existingIndex = companies.findIndex(c => c.company_id === company.company_id)
  
  if (existingIndex >= 0) {
    companies[existingIndex] = company
  } else {
    companies.push(company)
  }
  
  localStorage.setItem(yearKey, JSON.stringify(companies))
}

export function deleteCompany(companyId) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const companies = stored ? JSON.parse(stored) : []
  
  const filtered = companies.filter(c => c.company_id !== companyId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function deleteCompanyByYear(companyId, year) {
  const yearKey = `${STORAGE_KEY_BY_YEAR}_${year}`
  const stored = localStorage.getItem(yearKey)
  const companies = stored ? JSON.parse(stored) : []
  
  const filtered = companies.filter(c => c.company_id !== companyId)
  localStorage.setItem(yearKey, JSON.stringify(filtered))
}

// Get all available years
export function getAvailableYears() {
  const years = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(STORAGE_KEY_BY_YEAR)) {
      const year = key.replace(`${STORAGE_KEY_BY_YEAR}_`, '')
      if (!isNaN(year)) {
        years.push(parseInt(year))
      }
    }
  }
  return years.sort()
}

export async function getRcaCells() {
  return await loadRcaCells()
}

export function getPremiumValue(company, cellId) {
  const premium = company.premiums?.find(p => p.cell_id === cellId)
  return premium?.value ?? null
}

/**
 * Încarcă companiile din fișierul all_companies.json
 */
export async function loadCompaniesFromFile() {
  try {
    // Add cache-busting to force fresh data fetch
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`${baseUrl}all_companies.json${cacheBuster}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const companies = await response.json()
    
    // Elimină câmpul bonus_malus dacă există
    companies.forEach(company => {
      if (company.premiums) {
        company.premiums = company.premiums.map(premium => ({
          cell_id: premium.cell_id,
          value: premium.value
        }))
      }
    })
    
    // Salvează în localStorage
    const STORAGE_KEY = 'rca_companies'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
    
    return companies
  } catch (error) {
    console.error('Error loading companies from file:', error)
    throw error
  }
}

export const PRICE_DATASETS = [
  {
    id: '2025',
    label: '2025',
    shortLabel: '2025',
    description: 'Prețuri 2025',
    fileName: 'all_companies.json',
    storageKey: 2025
  },
  {
    id: '2026',
    label: '2026 — început de an',
    shortLabel: '2026',
    description: 'Prețuri publicate la începutul anului 2026',
    fileName: 'all_companies_2026.json',
    storageKey: 2026
  },
  {
    id: '2026-aug',
    label: '2026 — august',
    shortLabel: 'august',
    description: 'Prețuri august 2026',
    fileName: 'all_companies_2026-08-26.json',
    storageKey: '2026-aug'
  }
]

export function getPriceDataset(datasetId) {
  return PRICE_DATASETS.find(dataset => dataset.id === datasetId) || null
}

/**
 * Setul de date folosit pe paginile operaționale (rate, top 3, setări)
 * când utilizatorul alege un an. Pentru 2026 folosim cel mai recent snapshot.
 */
export function getOperationalDatasetForYear(year) {
  if (year === 2025) return getPriceDataset('2025')
  if (year === 2026) return getPriceDataset('2026-aug')
  return {
    id: String(year),
    label: String(year),
    shortLabel: String(year),
    description: `Prețuri ${year}`,
    fileName: `all_companies_${year}.json`,
    storageKey: year
  }
}

export function getYearDisplayLabel(year) {
  if (year === 2026) {
    const dataset = getOperationalDatasetForYear(2026)
    return `2026 (${dataset.shortLabel})`
  }
  return String(year)
}

export function getYearStorageKey(year) {
  return getOperationalDatasetForYear(year).storageKey
}

export async function loadCompaniesForYear(year) {
  return loadDatasetCompanies(getOperationalDatasetForYear(year))
}

export async function reloadCompaniesForYear(year) {
  return reloadDatasetFromFile(getOperationalDatasetForYear(year))
}

export function hasCompanyPremiums(companies) {
  return (companies || []).some(c => !c.is_reference && c.premiums && c.premiums.length > 0)
}

/**
 * Încarcă companiile pentru un set de date (an sau snapshot).
 * Fișierul din public/ este sursa de adevăr, ca actualizările de export
 * să apară fără cache vechi din localStorage.
 */
export async function loadDatasetCompanies(dataset) {
  try {
    await loadCompaniesFromFileByYear(dataset.storageKey, dataset.fileName)
    return await loadCompaniesByYear(dataset.storageKey)
  } catch (error) {
    console.log(`ℹ️ No ${dataset.id} data file found, using localStorage if available`)
    return loadCompaniesByYear(dataset.storageKey)
  }
}

export async function reloadDatasetFromFile(dataset) {
  const loadedCompanies = await loadCompaniesFromFileByYear(dataset.storageKey, dataset.fileName)
  const allCompanies = await loadCompaniesByYear(dataset.storageKey)
  return { loadedCompanies, allCompanies }
}

/**
 * Încarcă companiile din fișierul JSON pentru un an sau snapshot specific
 */
export async function loadCompaniesFromFileByYear(year, fileName = 'all_companies.json') {
  try {
    // Add cache-busting to force fresh data fetch
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`${baseUrl}${fileName}${cacheBuster}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const companies = await response.json()
    
    // Elimină câmpul bonus_malus dacă există
    companies.forEach(company => {
      if (company.premiums) {
        company.premiums = company.premiums.map(premium => ({
          cell_id: premium.cell_id,
          value: premium.value
        }))
      }
    })
    
    // Salvează în localStorage pentru anul specific
    saveCompaniesByYear(companies, year)
    
    return companies
  } catch (error) {
    console.error('Error loading companies from file:', error)
    throw error
  }
}

