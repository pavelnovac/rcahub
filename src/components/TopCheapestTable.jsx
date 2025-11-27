import React, { useState, useMemo, useEffect } from 'react'
import { loadCompaniesByYear, getRcaCells, getPremiumValue, loadCompaniesFromFileByYear, getAvailableYears } from '../utils/dataLoader'

function TopCheapestTable() {
  const [companies, setCompanies] = useState([])
  const [rcaCells, setRcaCells] = useState(null)
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState('all')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [availableYears, setAvailableYears] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [expandedCell, setExpandedCell] = useState(null)

  useEffect(() => {
    async function init() {
      const loadedCells = await getRcaCells()
      setRcaCells(loadedCells)
      
      let loadedCompanies = await loadCompaniesByYear(selectedYear)
      
      const companiesOnly = loadedCompanies.filter(c => !c.is_reference)
      if (companiesOnly.length === 0) {
        try {
          const fileName = selectedYear === 2025 ? 'all_companies.json' : `all_companies_${selectedYear}.json`
          await loadCompaniesFromFileByYear(selectedYear, fileName)
          loadedCompanies = await loadCompaniesByYear(selectedYear)
        } catch (e) {
          console.log(`ℹ️ No ${selectedYear} data file found`)
        }
      }
      
      setCompanies(loadedCompanies)
      
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
      await loadCompaniesFromFileByYear(selectedYear, fileName)
      const allCompanies = await loadCompaniesByYear(selectedYear)
      setCompanies(allCompanies)
      
      const years = getAvailableYears()
      setAvailableYears(years)
      
      alert(`✅ Datele pentru ${selectedYear} încărcate cu succes!`)
    } catch (error) {
      console.error('Error loading companies:', error)
      setLoadError(`Eroare la încărcarea datelor pentru ${selectedYear}.`)
    } finally {
      setIsLoadingData(false)
    }
  }

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

  // Company colors for visual distinction
  const companyColors = useMemo(() => {
    const colors = [
      { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', rank: 'bg-emerald-500' },
      { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', rank: 'bg-amber-500' },
      { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', rank: 'bg-rose-400' },
    ]
    return colors
  }, [])

  // Get top 3 cheapest companies for a given cell
  const getTop3Cheapest = (cellId) => {
    const pricesWithCompanies = []
    
    companies.forEach(company => {
      if (company.is_reference) return
      
      const value = getPremiumValue(company, cellId)
      if (value !== null && value !== undefined) {
        pricesWithCompanies.push({
          company,
          value,
          companyName: company.company_name,
          companyId: company.company_id
        })
      }
    })
    
    // Sort by price ascending and take top 3
    pricesWithCompanies.sort((a, b) => a.value - b.value)
    return pricesWithCompanies.slice(0, 3)
  }

  // Early return after all hooks
  if (!rcaCells) {
    return <div className="px-4 py-6">Se încarcă...</div>
  }

  const companiesWithData = companies.filter(c => !c.is_reference && c.premiums && c.premiums.length > 0)
  if (companiesWithData.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            Datele nu sunt încărcate
          </h3>
          <p className="text-slate-600 mb-6">
            Încarcă datele companiilor pentru a vedea top 3 cele mai ieftine oferte.
          </p>
          <button
            onClick={handleLoadCompaniesFromFile}
            disabled={isLoadingData}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center shadow-lg shadow-indigo-200"
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
            <p className="mt-4 text-sm text-rose-600">{loadError}</p>
          )}
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

  const getShortDescription = (vehicle) => {
    if (vehicle.vehicle_id === 'A7') return 'Taxi'
    if (vehicle.vehicle_id === 'A8') return 'Electric'
    if (vehicle.vehicle_id === 'B4') return 'Troleibuze'
    
    if (vehicle.engine_cc_min !== undefined && vehicle.engine_cc_min !== null && 
        vehicle.engine_cc_max !== undefined && vehicle.engine_cc_max !== null) {
      if (vehicle.engine_cc_max === 1200) return '≤ 1200 cm³'
      return `${vehicle.engine_cc_min}-${vehicle.engine_cc_max} cm³`
    }
    if (vehicle.engine_cc_min === 3001 && vehicle.engine_cc_max === null) return '> 3000 cm³'
    if (vehicle.engine_cc_min === 301 && vehicle.engine_cc_max === null) return '> 300 cm³'
    
    if (vehicle.seats_min !== undefined && vehicle.seats_min !== null && 
        vehicle.seats_max !== undefined && vehicle.seats_max !== null) {
      if (vehicle.seats_max === 17) return '≤ 17 locuri'
      return `${vehicle.seats_min}-${vehicle.seats_max} locuri`
    }
    if (vehicle.seats_min === 31 && vehicle.seats_max === null) return '> 30 locuri'
    
    if (vehicle.power_cp_min !== undefined && vehicle.power_cp_min !== null && 
        vehicle.power_cp_max !== undefined && vehicle.power_cp_max !== null) {
      if (vehicle.power_cp_max === 45) return '≤ 45 CP'
      return `${vehicle.power_cp_min}-${vehicle.power_cp_max} CP`
    }
    if (vehicle.power_cp_min === 101 && vehicle.power_cp_max === null) return '> 100 CP'
    
    if (vehicle.mass_kg_min !== undefined && vehicle.mass_kg_min !== null && 
        vehicle.mass_kg_max !== undefined && vehicle.mass_kg_max !== null) {
      if (vehicle.mass_kg_max === 3500) return '≤ 3500 kg'
      return `${vehicle.mass_kg_min}-${vehicle.mass_kg_max} kg`
    }
    if (vehicle.mass_kg_min === 12001 && vehicle.mass_kg_max === null) return '> 12000 kg'
    
    return vehicle.description || vehicle.vehicle_id
  }

  const getCompanyShortName = (companyName) => {
    const words = companyName.split(' ')
    if (words.length === 1) return companyName.substring(0, 8).toUpperCase()
    return words[0].toUpperCase()
  }

  const renderTop3Cell = (cellId, vehicleId, territoryId, personCategoryId) => {
    const top3 = getTop3Cheapest(cellId)
    const isExpanded = expandedCell === cellId
    
    if (top3.length === 0) {
      return (
        <td className="px-2 py-2 text-sm text-center text-slate-400 border-r border-slate-200 bg-slate-50">
          -
        </td>
      )
    }
    
    return (
      <td 
        className="px-1 py-1 text-xs border-r border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer relative group"
        onClick={() => setExpandedCell(isExpanded ? null : cellId)}
      >
        <div className="space-y-0.5">
          {top3.map((item, index) => {
            const colorScheme = companyColors[index]
            return (
              <div 
                key={item.companyId}
                className={`flex items-center justify-between gap-1 px-1.5 py-0.5 rounded ${colorScheme.bg} ${colorScheme.border} border`}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full ${colorScheme.rank} text-white text-[10px] font-bold flex items-center justify-center`}>
                    {index + 1}
                  </span>
                  <span className={`font-medium ${colorScheme.text} truncate text-[11px]`}>
                    {getCompanyShortName(item.companyName)}
                  </span>
                </div>
                <span className={`font-bold ${colorScheme.text} text-[11px] tabular-nums`}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Expanded tooltip on click */}
        {isExpanded && (
          <div className="absolute z-50 left-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Top 3 Prețuri</span>
              <button 
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setExpandedCell(null)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {top3.map((item, index) => {
                const colorScheme = companyColors[index]
                return (
                  <div 
                    key={item.companyId}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg ${colorScheme.bg} ${colorScheme.border} border`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full ${colorScheme.rank} text-white text-xs font-bold flex items-center justify-center`}>
                        {index + 1}
                      </span>
                      <span className={`font-semibold ${colorScheme.text} text-sm`}>
                        {item.companyName}
                      </span>
                    </div>
                    <span className={`font-bold ${colorScheme.text} text-sm tabular-nums`}>
                      {formatCurrency(item.value)} MDL
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </td>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              Top 3 Cele Mai Ieftine - {selectedYear}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Comparație rapidă a celor mai bune prețuri pentru fiecare categorie
            </p>
          </div>
          <button
            onClick={handleLoadCompaniesFromFile}
            disabled={isLoadingData}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center shadow-lg shadow-indigo-100"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reîncarcă
              </>
            )}
          </button>
        </div>
        
        {loadError && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <p className="text-sm text-rose-600">{loadError}</p>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legendă:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <span className="text-xs font-medium text-slate-600">Cel mai ieftin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-medium text-slate-600">Al doilea</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-400 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            <span className="text-xs font-medium text-slate-600">Al treilea</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              An
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full max-w-xs rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              {availableYears.filter(y => y !== 2025 && y !== 2026).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Categorie vehicul
            </label>
            <select
              value={selectedVehicleGroup}
              onChange={(e) => setSelectedVehicleGroup(e.target.value)}
              className="block w-full max-w-xs rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Toate categoriile</option>
              {Object.entries(vehicleGroups).map(([group, label]) => (
                <option key={group} value={group}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
              {/* First header row - Territories */}
              <tr>
                <th 
                  rowSpan="2" 
                  className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-gradient-to-r from-slate-100 to-slate-50 z-20 border-r border-slate-300"
                >
                  Categoria vehiculului
                </th>
                <th
                  colSpan="5"
                  className="px-2 py-2 text-center text-xs font-bold text-slate-700 border-r border-slate-300 bg-gradient-to-r from-violet-50 to-indigo-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Chișinău, Bălți...
                  </div>
                </th>
                <th
                  colSpan="5"
                  className="px-2 py-2 text-center text-xs font-bold text-slate-700 border-r border-slate-300 bg-gradient-to-r from-indigo-50 to-purple-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    Alte localități
                  </div>
                </th>
              </tr>
              {/* Second header row - Person categories */}
              <tr>
                {/* CH territory columns */}
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-violet-50/50">
                  PF<br/>V&lt;23 V&lt;2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-violet-50/50">
                  PF<br/>V&lt;23 V≥2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-violet-50/50">
                  PF<br/>V≥23 V&lt;2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-violet-50/50">
                  PF<br/>V≥23 V≥2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-300 bg-violet-50/50">
                  PJ
                </th>
                {/* AL territory columns */}
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-indigo-50/50">
                  PF<br/>V&lt;23 V&lt;2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-indigo-50/50">
                  PF<br/>V&lt;23 V≥2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-indigo-50/50">
                  PF<br/>V≥23 V&lt;2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 bg-indigo-50/50">
                  PF<br/>V≥23 V≥2
                </th>
                <th className="px-1 py-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-300 bg-indigo-50/50">
                  PJ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredVehicles.map((vehicle, vehicleIndex) => {
                const isJuridicaOnly = vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4'
                
                return (
                  <tr key={vehicle.vehicle_id} className={vehicleIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2 text-sm font-medium text-slate-900 sticky left-0 z-10 border-r border-slate-200" style={{ background: vehicleIndex % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.5)' }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{vehicle.vehicle_id}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{getShortDescription(vehicle)}</div>
                        </div>
                        <div className="group relative">
                          <svg 
                            className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-help transition-colors" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl">
                            <div className="font-semibold mb-1">{vehicle.vehicle_id}</div>
                            <div className="text-slate-300">{vehicle.description}</div>
                            <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* CH territory columns */}
                    {orderedPersonCategories.map(category => {
                      if (isJuridicaOnly && category.person_type !== 'juridica') {
                        return (
                          <td
                            key={`CH-${category.person_category_id}`}
                            className="px-2 py-2 text-sm text-center text-slate-300 border-r border-slate-200 bg-slate-50"
                          >
                            -
                          </td>
                        )
                      }
                      const cellId = getCellId(vehicle.vehicle_id, 'CH', category.person_category_id)
                      return renderTop3Cell(cellId, vehicle.vehicle_id, 'CH', category.person_category_id)
                    })}
                    
                    {/* AL territory columns */}
                    {orderedPersonCategories.map(category => {
                      if (isJuridicaOnly && category.person_type !== 'juridica') {
                        return (
                          <td
                            key={`AL-${category.person_category_id}`}
                            className="px-2 py-2 text-sm text-center text-slate-300 border-r border-slate-200 bg-slate-50"
                          >
                            -
                          </td>
                        )
                      }
                      const cellId = getCellId(vehicle.vehicle_id, 'AL', category.person_category_id)
                      return renderTop3Cell(cellId, vehicle.vehicle_id, 'AL', category.person_category_id)
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="mt-4 text-center text-xs text-slate-400">
        Fă clic pe orice celulă pentru a vedea detalii complete despre prețuri
      </div>
    </div>
  )
}

export default TopCheapestTable

