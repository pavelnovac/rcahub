/**
 * Migration script pentru a muta datele existente la structura multi-year
 * 
 * Acest script:
 * 1. Citește datele existente din localStorage (rca_companies)
 * 2. Le salvează în formatul nou pentru anul 2025 (rca_companies_by_year_2025)
 * 3. Păstrează datele vechi pentru compatibilitate
 * 
 * Rulare în consola browserului:
 * - Copiază tot scriptul
 * - Deschide Developer Console (F12)
 * - Lipește și apasă Enter
 */

(function migrateToMultiYear() {
  console.log('🔄 Începe migrarea datelor la structura multi-year...')
  
  const STORAGE_KEY = 'rca_companies'
  const STORAGE_KEY_BY_YEAR = 'rca_companies_by_year'
  const DEFAULT_YEAR = 2025
  
  try {
    // Verifică dacă există date de migrat
    const existingData = localStorage.getItem(STORAGE_KEY)
    
    if (!existingData) {
      console.log('⚠️  Nu există date în localStorage pentru migrare.')
      console.log('💡 Încarcă mai întâi datele companiilor, apoi rulează acest script.')
      return
    }
    
    const companies = JSON.parse(existingData)
    
    if (!Array.isArray(companies) || companies.length === 0) {
      console.log('⚠️  Nu există companii de migrat.')
      return
    }
    
    // Salvează datele pentru anul implicit (2025)
    const yearKey = `${STORAGE_KEY_BY_YEAR}_${DEFAULT_YEAR}`
    
    // Verifică dacă datele pentru acest an există deja
    const existingYearData = localStorage.getItem(yearKey)
    if (existingYearData) {
      const overwrite = confirm(`Datele pentru anul ${DEFAULT_YEAR} există deja. Vrei să le suprascrii?`)
      if (!overwrite) {
        console.log('❌ Migrare anulată.')
        return
      }
    }
    
    localStorage.setItem(yearKey, JSON.stringify(companies))
    
    console.log(`✅ Migrare completă! ${companies.length} companii au fost salvate pentru anul ${DEFAULT_YEAR}.`)
    console.log(`📊 Companiile sunt acum disponibile în format multi-year.`)
    console.log(`🔑 Cheie localStorage: ${yearKey}`)
    console.log('')
    console.log('📝 Pași următori:')
    console.log('1. Reîncarcă pagina pentru a vedea noile opțiuni')
    console.log('2. Selectează anul 2025 din dropdown pentru a vizualiza datele')
    console.log('3. Pentru date 2026, încarcă fișierul all_companies_2026.json (dacă este disponibil)')
    console.log('4. Mergi la tab-ul "Comparație 2025 vs 2026" pentru a vedea diferențele')
    
  } catch (error) {
    console.error('❌ Eroare la migrarea datelor:', error)
    console.error('Detalii:', error.message)
  }
})()


