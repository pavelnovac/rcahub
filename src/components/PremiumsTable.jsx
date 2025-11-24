import React, { useState, useMemo, useEffect } from 'react'
import { loadCompanies, getRcaCells, getPremiumValue, loadCompaniesFromFile, loadCompaniesByYear, loadCompaniesFromFileByYear, getAvailableYears } from '../utils/dataLoader'

function PremiumsTable() {
  const [companies, setCompanies] = useState([])
  const [rcaCells, setRcaCells] = useState(null)
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('min') // 'min' pentru valori minime, sau company_id
  const [selectedYear, setSelectedYear] = useState(2025) // Default year
  const [availableYears, setAvailableYears] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    async function init() {
      const loadedCells = await getRcaCells()
      setRcaCells(loadedCells)
      
      // Try to load from localStorage first
      let loadedCompanies = await loadCompaniesByYear(selectedYear)
      
      // If empty (only has BNM or nothing), try to auto-load from file
      const companiesOnly = loadedCompanies.filter(c => !c.is_reference)
      if (companiesOnly.length === 0) {
        try {
          const fileName = selectedYear === 2025 ? 'all_companies.json' : `all_companies_${selectedYear}.json`
          await loadCompaniesFromFileByYear(selectedYear, fileName)
          loadedCompanies = await loadCompaniesByYear(selectedYear)
          console.log(`✅ Auto-loaded ${selectedYear} data from file`)
        } catch (e) {
          console.log(`ℹ️ No ${selectedYear} data file found, waiting for manual load`)
        }
      }
      
      setCompanies(loadedCompanies)
      
      // Update available years
      const years = getAvailableYears()
      setAvailableYears(years)
    }
    init()
  }, [selectedYear])

  const handleLoadCompaniesFromFile = async () => {
    setIsLoadingData(true)
    setLoadError(null)
    try {
      const fileName = selectedYear === 2025 ? 'all_companies.json' : `all_companies_${selectedYear}.json`
      const loadedCompanies = await loadCompaniesFromFileByYear(selectedYear, fileName)
      // Reîncarcă companiile pentru a include și BNM
      const allCompanies = await loadCompaniesByYear(selectedYear)
      setCompanies(allCompanies)
      
      // Update available years
      const years = getAvailableYears()
      setAvailableYears(years)
      
      alert(`✅ ${loadedCompanies.length} companii pentru ${selectedYear} încărcate cu succes!`)
    } catch (error) {
      console.error('Error loading companies:', error)
      setLoadError(`Eroare la încărcarea datelor pentru ${selectedYear}. Verifică dacă fișierul există în folderul public.`)
      alert(`❌ Eroare la încărcarea datelor pentru ${selectedYear}. Verifică consola pentru detalii.`)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Extract data with defaults to ensure hooks are always called
  const territories = rcaCells?.territories || []
  const vehicles = rcaCells?.vehicles || []
  const personCategories = rcaCells?.person_categories || []

  const filteredVehicles = useMemo(() => {
    if (!vehicles.length) return []
    if (selectedVehicleGroup === 'all') {
      return vehicles
    }
    return vehicles.filter(v => v.group === selectedVehicleGroup)
  }, [vehicles, selectedVehicleGroup])

  const vehicleGroups = useMemo(() => {
    const groups = {}
    vehicles.forEach(v => {
      if (!groups[v.group]) {
        groups[v.group] = v.group_label
      }
    })
    return groups
  }, [vehicles])

  // Order person categories as in the image
  const orderedPersonCategories = useMemo(() => {
    const order = [
      'PF_AGE_LT23_EXP_LT2',
      'PF_AGE_LT23_EXP_GE2',
      'PF_AGE_GE23_EXP_LT2',
      'PF_AGE_GE23_EXP_GE2',
      'PJ'
    ]
    return order.map(id => personCategories.find(cat => cat.person_category_id === id)).filter(Boolean)
  }, [personCategories])

  // Filtrează companiile în funcție de selecție (trebuie să fie înainte de early return)
  const displayedCompanies = useMemo(() => {
    if (selectedCompany === 'min') {
      return [] // Nu afișăm companiile individuale când afișăm minimele
    }
    const company = companies.find(c => c.company_id === selectedCompany)
    return company ? [company] : []
  }, [companies, selectedCompany])

  // Verifică dacă afișăm valorile minime
  const showMinValues = selectedCompany === 'min'

  // Generează culori consistente pentru fiecare companie
  const getCompanyColor = (companyId) => {
    // Paletă de culori pastelate pentru o bună vizibilitate
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', header: 'bg-blue-100', short: 'text-blue-700' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', header: 'bg-green-100', short: 'text-green-700' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', header: 'bg-purple-100', short: 'text-purple-700' },
      { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', header: 'bg-pink-100', short: 'text-pink-700' },
      { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', header: 'bg-yellow-100', short: 'text-yellow-700' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', header: 'bg-indigo-100', short: 'text-indigo-700' },
      { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', header: 'bg-teal-100', short: 'text-teal-700' },
      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', header: 'bg-orange-100', short: 'text-orange-700' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', header: 'bg-cyan-100', short: 'text-cyan-700' },
      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', header: 'bg-rose-100', short: 'text-rose-700' },
    ]
    
    // Generează un index bazat pe ID-ul companiei pentru consistență
    let hash = 0
    for (let i = 0; i < companyId.length; i++) {
      hash = companyId.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // Memoizează culorile pentru fiecare companie
  const companyColors = useMemo(() => {
    const colorMap = {}
    companies.forEach(company => {
      if (!company.is_reference) {
        colorMap[company.company_id] = getCompanyColor(company.company_id)
      }
    })
    return colorMap
  }, [companies])

  // Early return after all hooks
  if (!rcaCells) {
    return <div className="px-4 py-6">Se încarcă...</div>
  }

  // Verifică dacă există companii cu date (excluzând BNM)
  const companiesWithData = companies.filter(c => !c.is_reference && c.premiums && c.premiums.length > 0)
  if (companiesWithData.length === 0 && companies.filter(c => !c.is_reference).length > 0) {
    return (
      <div className="px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Datele companiilor nu sunt încărcate
          </h3>
          <p className="text-yellow-700 mb-4">
            Pentru a afișa datele, trebuie să încărcați companiile în localStorage.
          </p>
          <div className="bg-white rounded p-4 mb-4">
            <button
              onClick={handleLoadCompaniesFromFile}
              disabled={isLoadingData}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoadingData ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se încarcă...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Încarcă datele din fișier
                </>
              )}
            </button>
            {loadError && (
              <p className="mt-2 text-sm text-red-600">{loadError}</p>
            )}
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-sm font-medium mb-2">Sau încarcă manual:</p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                <li>Deschide Console (F12)</li>
                <li>Copiază conținutul din <code className="bg-gray-100 px-1 rounded">data/load-companies-browser.js</code></li>
                <li>Lipește-l în consolă și apasă Enter</li>
                <li>Reîncarcă pagina</li>
              </ol>
            </div>
          </div>
          <p className="text-xs text-yellow-600">
            Companiile găsite: {companies.length} total ({companies.filter(c => c.is_reference).length} BNM, {companies.filter(c => !c.is_reference).length} altele)
          </p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('ro-MD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getCellId = (vehicleId, territoryId, personCategoryId) => {
    return `${vehicleId}_${territoryId}_${personCategoryId}`
  }

  // Simplifică descrierea vehiculului pentru afișare compactă
  const getShortDescription = (vehicle) => {
    // Verifică mai întâi vehiculele speciale (A7, A8, B4) care nu au valori numerice
    if (vehicle.vehicle_id === 'A7') return 'Taxi'
    if (vehicle.vehicle_id === 'A8') return 'Electric'
    if (vehicle.vehicle_id === 'B4') return 'Troleibuze'
    
    // Verifică volum motor (engine_cc) - doar dacă ambele valori sunt definite și nu null
    if (vehicle.engine_cc_min !== undefined && vehicle.engine_cc_min !== null && 
        vehicle.engine_cc_max !== undefined && vehicle.engine_cc_max !== null) {
      if (vehicle.engine_cc_max === 1200) {
        return '≤ 1200 cm³'
      }
      return `${vehicle.engine_cc_min}-${vehicle.engine_cc_max} cm³`
    }
    if (vehicle.engine_cc_min === 3001 && vehicle.engine_cc_max === null) {
      return '> 3000 cm³'
    }
    if (vehicle.engine_cc_min === 301 && vehicle.engine_cc_max === null) {
      return '> 300 cm³'
    }
    
    // Verifică locuri (seats) - doar dacă ambele valori sunt definite și nu null
    if (vehicle.seats_min !== undefined && vehicle.seats_min !== null && 
        vehicle.seats_max !== undefined && vehicle.seats_max !== null) {
      if (vehicle.seats_max === 17) {
        return '≤ 17 locuri'
      }
      return `${vehicle.seats_min}-${vehicle.seats_max} locuri`
    }
    if (vehicle.seats_min === 31 && vehicle.seats_max === null) {
      return '> 30 locuri'
    }
    
    // Verifică putere CP (power_cp) - doar dacă ambele valori sunt definite și nu null
    if (vehicle.power_cp_min !== undefined && vehicle.power_cp_min !== null && 
        vehicle.power_cp_max !== undefined && vehicle.power_cp_max !== null) {
      if (vehicle.power_cp_max === 45) {
        return '≤ 45 CP'
      }
      return `${vehicle.power_cp_min}-${vehicle.power_cp_max} CP`
    }
    if (vehicle.power_cp_min === 101 && vehicle.power_cp_max === null) {
      return '> 100 CP'
    }
    
    // Verifică masă kg (mass_kg) - doar dacă ambele valori sunt definite și nu null
    if (vehicle.mass_kg_min !== undefined && vehicle.mass_kg_min !== null && 
        vehicle.mass_kg_max !== undefined && vehicle.mass_kg_max !== null) {
      if (vehicle.mass_kg_max === 3500) {
        return '≤ 3500 kg'
      }
      return `${vehicle.mass_kg_min}-${vehicle.mass_kg_max} kg`
    }
    if (vehicle.mass_kg_min === 12001 && vehicle.mass_kg_max === null) {
      return '> 12000 kg'
    }
    
    // Fallback la descrierea completă dacă nu găsește nimic
    return vehicle.description || vehicle.vehicle_id
  }

  // Funcție pentru a obține denumirea prescurtată a unei companii
  const getCompanyShortName = (companyName) => {
    // Extrage primele cuvinte majuscule sau primele litere
    const words = companyName.split(' ')
    if (words.length === 1) {
      return companyName.substring(0, 8).toUpperCase()
    }
    // Pentru "ACORD GRUP S.A." -> "ACORD"
    // Pentru "ASTERRA GRUP S.A." -> "ASTERRA"
    // Pentru "DONARIS VIENNA INSURANCE GROUP S.A." -> "DONARIS"
    return words[0].toUpperCase()
  }

  // Funcție pentru a găsi valoarea minimă și compania corespunzătoare pentru o celulă
  // Exclude compania BNM (is_reference: true) din calcul
  const getMinValueAndCompany = (cellId) => {
    let minValue = Infinity
    let minCompany = null

    companies.forEach(company => {
      // Exclude compania de referință BNM
      if (company.is_reference) {
        return
      }
      
      const value = getPremiumValue(company, cellId)
      if (value !== null && value < minValue) {
        minValue = value
        minCompany = company
      }
    })

    if (minValue === Infinity) {
      return { value: null, company: null }
    }

    return { value: minValue, company: minCompany }
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Prime de referință RCA internă - {selectedYear}
          </h2>
          <button
            onClick={handleLoadCompaniesFromFile}
            disabled={isLoadingData}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            title="Încarcă datele companiilor din fișier"
          >
            {isLoadingData ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Se încarcă...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Încarcă datele
              </>
            )}
          </button>
        </div>
        
        {loadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              An
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              {availableYears.filter(y => y !== 2025 && y !== 2026).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Companie
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="min">Valori minime (implicit)</option>
              {companies.map(company => (
                <option key={company.company_id} value={company.company_id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie vehicul
            </label>
            <select
              value={selectedVehicleGroup}
              onChange={(e) => setSelectedVehicleGroup(e.target.value)}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Toate categoriile</option>
              {Object.entries(vehicleGroups).map(([group, label]) => (
                <option key={group} value={group}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              {/* First header row - Company names */}
              <tr>
                <th 
                  rowSpan="3" 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-20 border-r border-gray-300"
                >
                  Categoria vehiculului
                </th>
                {showMinValues ? (
                  <th
                    colSpan="10"
                    className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-green-50"
                  >
                    <div className="font-bold">Valori Minime</div>
                    <div className="text-xs text-green-700 mt-1 font-normal">(Compania cu cel mai mic preț)</div>
                  </th>
                ) : (
                  displayedCompanies.map(company => {
                    const colors = company.is_reference 
                      ? { header: 'bg-blue-100', text: 'text-blue-800' }
                      : companyColors[company.company_id] || { header: 'bg-gray-50', text: 'text-gray-700' }
                    return (
                      <th
                        key={company.company_id}
                        colSpan="10"
                        className={`px-2 py-2 text-center text-xs font-semibold border-r border-gray-300 ${colors.header} ${colors.text}`}
                      >
                        <div className="font-bold">{company.company_name}</div>
                        {company.is_reference && (
                          <div className="text-xs text-blue-700 mt-1 font-normal">(Referință)</div>
                        )}
                      </th>
                    )
                  })
                )}
              </tr>
              {/* Second header row - Territories */}
              <tr>
                {showMinValues ? (
                  <>
                    <th
                      colSpan="5"
                      className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r border-gray-300 bg-green-50"
                    >
                      {territories.find(t => t.territory_id === 'CH')?.label.split(',')[0]}...
                    </th>
                    <th
                      colSpan="5"
                      className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r border-gray-300 bg-green-50"
                    >
                      Alte localități
                    </th>
                  </>
                ) : (
                  displayedCompanies.map(company => {
                    const colors = company.is_reference 
                      ? { bg: 'bg-blue-50', text: 'text-blue-800' }
                      : companyColors[company.company_id] || { bg: 'bg-gray-50', text: 'text-gray-700' }
                    return (
                      <React.Fragment key={`${company.company_id}-territories`}>
                        <th
                          colSpan="5"
                          className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}
                        >
                          {territories.find(t => t.territory_id === 'CH')?.label.split(',')[0]}...
                        </th>
                        <th
                          colSpan="5"
                          className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}
                        >
                          Alte localități
                        </th>
                      </React.Fragment>
                    )
                  })
                )}
              </tr>
              {/* Third header row - Person categories */}
              <tr>
                {showMinValues ? (
                  <>
                    {/* CH territory columns */}
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V&lt;23 V&lt;2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V&lt;23 V≥2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V≥23 V&lt;2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V≥23 V≥2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PJ
                    </th>
                    {/* AL territory columns */}
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V&lt;23 V&lt;2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V&lt;23 V≥2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V≥23 V&lt;2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PF<br/>V≥23 V≥2
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-green-50">
                      PJ
                    </th>
                  </>
                ) : (
                  displayedCompanies.map(company => {
                    const colors = company.is_reference 
                      ? { bg: 'bg-blue-50', text: 'text-blue-700' }
                      : companyColors[company.company_id] || { bg: 'bg-gray-50', text: 'text-gray-600' }
                    return (
                      <React.Fragment key={`${company.company_id}-categories`}>
                        {/* CH territory columns */}
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V&lt;23 V&lt;2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V&lt;23 V≥2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V≥23 V&lt;2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V≥23 V≥2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PJ
                        </th>
                        {/* AL territory columns */}
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V&lt;23 V&lt;2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V&lt;23 V≥2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V≥23 V&lt;2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PF<br/>V≥23 V≥2
                        </th>
                        <th className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-300 ${colors.bg} ${colors.text}`}>
                          PJ
                        </th>
                      </React.Fragment>
                    )
                  })
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map(vehicle => {
                const applicableCategories = orderedPersonCategories.filter(cat => {
                  // A7 (Taxi) și B4 (Troleibuze) sunt doar pentru persoane juridice
                  if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && cat.person_type !== 'juridica') {
                    return false
                  }
                  return true
                })

                return (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="font-semibold">{vehicle.vehicle_id}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{getShortDescription(vehicle)}</div>
                        </div>
                        <div className="group relative">
                          <svg 
                            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                            <div className="font-semibold mb-1">{vehicle.vehicle_id}</div>
                            <div>{vehicle.description}</div>
                            <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    {showMinValues ? (
                      <>
                        {/* CH territory columns */}
                        {orderedPersonCategories.map(category => {
                          // Skip PF categories for A7 and B4
                          if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                            return (
                              <td
                                key={`min-CH-${category.person_category_id}`}
                                className="px-3 py-2 text-sm text-center text-gray-500 border-r border-gray-200 bg-gray-50"
                              >
                                -
                              </td>
                            )
                          }
                          const cellId = getCellId(vehicle.vehicle_id, 'CH', category.person_category_id)
                          const { value, company: minCompany } = getMinValueAndCompany(cellId)
                          // Obține culoarea companiei cu valoarea minimă
                          const minColors = minCompany 
                            ? companyColors[minCompany.company_id] || { bg: 'bg-white', text: 'text-gray-900', short: 'text-gray-700' }
                            : { bg: 'bg-gray-50', text: 'text-gray-900', short: 'text-gray-700' }
                          return (
                            <td
                              key={`min-CH-${category.person_category_id}`}
                              className={`px-3 py-2 text-sm text-center border-r border-gray-200 ${minColors.bg}`}
                            >
                              <div className={`font-semibold ${minColors.text}`}>{formatCurrency(value)}</div>
                              {minCompany && (
                                <div className={`text-xs font-medium mt-1 ${minColors.short || minColors.text}`}>
                                  {getCompanyShortName(minCompany.company_name)}
                                </div>
                              )}
                            </td>
                          )
                        })}
                        {/* AL territory columns */}
                        {orderedPersonCategories.map(category => {
                          // Skip PF categories for A7 and B4
                          if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                            return (
                              <td
                                key={`min-AL-${category.person_category_id}`}
                                className="px-3 py-2 text-sm text-center text-gray-500 border-r border-gray-200 bg-gray-50"
                              >
                                -
                              </td>
                            )
                          }
                          const cellId = getCellId(vehicle.vehicle_id, 'AL', category.person_category_id)
                          const { value, company: minCompany } = getMinValueAndCompany(cellId)
                          // Obține culoarea companiei cu valoarea minimă
                          const minColors = minCompany 
                            ? companyColors[minCompany.company_id] || { bg: 'bg-white', text: 'text-gray-900', short: 'text-gray-700' }
                            : { bg: 'bg-gray-50', text: 'text-gray-900', short: 'text-gray-700' }
                          return (
                            <td
                              key={`min-AL-${category.person_category_id}`}
                              className={`px-3 py-2 text-center border-r border-gray-200 ${minColors.bg}`}
                            >
                              <div className={`text-sm font-semibold ${minColors.text}`}>{formatCurrency(value)}</div>
                              {minCompany && (
                                <div className={`text-xs font-medium mt-1 ${minColors.short || minColors.text}`}>
                                  {getCompanyShortName(minCompany.company_name)}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </>
                    ) : (
                      displayedCompanies.map(company => (
                        <React.Fragment key={company.company_id}>
                          {/* CH territory columns */}
                          {orderedPersonCategories.map(category => {
                            // Skip PF categories for A7 and B4
                            if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                              const colors = company.is_reference 
                                ? { bg: 'bg-blue-50', empty: 'text-gray-500' }
                                : companyColors[company.company_id] || { bg: 'bg-white', empty: 'text-gray-500' }
                              return (
                                <td
                                  key={`${company.company_id}-CH-${category.person_category_id}`}
                                  className={`px-3 py-2 text-sm text-center border-r border-gray-200 ${colors.bg} ${colors.empty}`}
                                >
                                  -
                                </td>
                              )
                            }
                            const cellId = getCellId(vehicle.vehicle_id, 'CH', category.person_category_id)
                            const value = getPremiumValue(company, cellId)
                            const cellColors = company.is_reference 
                              ? { bg: 'bg-blue-50', text: 'text-gray-900' }
                              : companyColors[company.company_id] || { bg: 'bg-white', text: 'text-gray-900' }
                            return (
                              <td
                                key={`${company.company_id}-CH-${category.person_category_id}`}
                                className={`px-3 py-2 text-sm text-center border-r border-gray-200 ${cellColors.bg} ${cellColors.text}`}
                              >
                                {formatCurrency(value)}
                              </td>
                            )
                          })}
                          {/* AL territory columns */}
                          {orderedPersonCategories.map(category => {
                            // Skip PF categories for A7 and B4
                            if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                              const colors = company.is_reference 
                                ? { bg: 'bg-blue-50', empty: 'text-gray-500' }
                                : companyColors[company.company_id] || { bg: 'bg-white', empty: 'text-gray-500' }
                              return (
                                <td
                                  key={`${company.company_id}-AL-${category.person_category_id}`}
                                  className={`px-3 py-2 text-sm text-center border-r border-gray-200 ${colors.bg} ${colors.empty}`}
                                >
                                  -
                                </td>
                              )
                            }
                            const cellId = getCellId(vehicle.vehicle_id, 'AL', category.person_category_id)
                            const value = getPremiumValue(company, cellId)
                            const cellColors = company.is_reference 
                              ? { bg: 'bg-blue-50', text: 'text-gray-900' }
                              : companyColors[company.company_id] || { bg: 'bg-white', text: 'text-gray-900' }
                            return (
                              <td
                                key={`${company.company_id}-AL-${category.person_category_id}`}
                                className={`px-3 py-2 text-sm text-center border-r border-gray-200 ${cellColors.bg} ${cellColors.text}`}
                              >
                                {formatCurrency(value)}
                              </td>
                            )
                          })}
                        </React.Fragment>
                      ))
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PremiumsTable

