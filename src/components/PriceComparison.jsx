import React, { useState, useMemo, useEffect } from 'react'
import { loadCompaniesByYear, getRcaCells, getPremiumValue, loadCompaniesFromFileByYear } from '../utils/dataLoader'

function PriceComparison() {
  const [companies2025, setCompanies2025] = useState([])
  const [companies2026, setCompanies2026] = useState([])
  const [rcaCells, setRcaCells] = useState(null)
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('min')
  const [isLoading2025, setIsLoading2025] = useState(false)
  const [isLoading2026, setIsLoading2026] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [showPercentage, setShowPercentage] = useState(true)

  useEffect(() => {
    async function init() {
      const loadedCells = await getRcaCells()
      setRcaCells(loadedCells)
      
      let loaded2025 = await loadCompaniesByYear(2025)
      let loaded2026 = await loadCompaniesByYear(2026)
      
      const companies2025Only = loaded2025.filter(c => !c.is_reference)
      if (companies2025Only.length === 0) {
        try {
          await loadCompaniesFromFileByYear(2025, 'all_companies.json')
          loaded2025 = await loadCompaniesByYear(2025)
          console.log('✅ Auto-loaded 2025 data from file')
        } catch (e) {
          console.log('ℹ️ No 2025 data file found, waiting for manual load')
        }
      }
      
      const companies2026Only = loaded2026.filter(c => !c.is_reference)
      if (companies2026Only.length === 0) {
        try {
          await loadCompaniesFromFileByYear(2026, 'all_companies_2026.json')
          loaded2026 = await loadCompaniesByYear(2026)
          console.log('✅ Auto-loaded 2026 data from file')
        } catch (e) {
          console.log('ℹ️ No 2026 data file found, waiting for manual load')
        }
      }
      
      setCompanies2025(loaded2025)
      setCompanies2026(loaded2026)
    }
    init()
  }, [])
  
  const reloadData = async () => {
    const [loaded2025, loaded2026] = await Promise.all([
      loadCompaniesByYear(2025),
      loadCompaniesByYear(2026)
    ])
    setCompanies2025(loaded2025)
    setCompanies2026(loaded2026)
  }

  const handleLoadCompanies2025 = async () => {
    setIsLoading2025(true)
    setLoadError(null)
    try {
      const loadedCompanies = await loadCompaniesFromFileByYear(2025, 'all_companies.json')
      await reloadData()
      alert(`✅ ${loadedCompanies.length} companii pentru 2025 încărcate cu succes!`)
    } catch (error) {
      console.error('Error loading 2025 companies:', error)
      setLoadError('Eroare la încărcarea datelor 2025.')
      alert('❌ Eroare la încărcarea datelor 2025.')
    } finally {
      setIsLoading2025(false)
    }
  }

  const handleLoadCompanies2026 = async () => {
    setIsLoading2026(true)
    setLoadError(null)
    try {
      const loadedCompanies = await loadCompaniesFromFileByYear(2026, 'all_companies_2026.json')
      await reloadData()
      alert(`✅ ${loadedCompanies.length} companii pentru 2026 încărcate cu succes!`)
    } catch (error) {
      console.error('Error loading 2026 companies:', error)
      setLoadError('Eroare la încărcarea datelor 2026. Asigurați-vă că există fișierul all_companies_2026.json în folderul public.')
      alert('❌ Eroare la încărcarea datelor 2026.')
    } finally {
      setIsLoading2026(false)
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

  if (!rcaCells) {
    return <div className="px-4 py-6">Se încarcă...</div>
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('ro-MD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value) => {
    if (value === null || value === undefined || !isFinite(value)) return '-'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatChange = (value) => {
    if (value === null || value === undefined) return '-'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${new Intl.NumberFormat('ro-MD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)}`
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

  // Company priority for tie-breaking (lower index = higher priority)
  const companyPriority = {
    'MOLDASIG S.A.': 1,
    'ACORD GRUP S.A.': 2,
    'GRAWE CARAT ASIGURARI S.A.': 3,
    'DONARIS VIENNA INSURANCE GROUP S.A.': 4,
    'INTACT ASIGURARI GENERALE S.A.': 5
  }

  const getCompanyPriority = (company) => {
    return companyPriority[company?.company_name] || 999
  }

  const getMinValueAndCompany = (cellId, companies) => {
    let minValue = Infinity
    let minCompany = null

    companies.forEach(company => {
      if (company.is_reference) return
      
      const value = getPremiumValue(company, cellId)
      if (value !== null) {
        if (value < minValue) {
          minValue = value
          minCompany = company
        } else if (value === minValue) {
          // Tie-breaker: prefer company with higher priority (lower number)
          if (getCompanyPriority(company) < getCompanyPriority(minCompany)) {
            minCompany = company
          }
        }
      }
    })

    if (minValue === Infinity) {
      return { value: null, company: null }
    }

    return { value: minValue, company: minCompany }
  }

  const getComparison = (value2025, value2026) => {
    if (value2025 === null || value2026 === null) {
      return { change: null, percentage: null }
    }
    
    const absoluteChange = value2026 - value2025
    const percentageChange = (absoluteChange / value2025) * 100
    
    return {
      change: absoluteChange,
      percentage: percentageChange
    }
  }

  // Get cell background based on price change
  const getCellBgClass = (value2025, value2026) => {
    if (value2025 === null || value2026 === null) return 'bg-gray-50'
    const change = value2026 - value2025
    if (change === 0) return 'bg-gray-50'
    if (change < 0) return 'bg-blue-100 hover:bg-blue-200' // Price decreased - good (blue)
    return 'bg-red-100 hover:bg-red-200' // Price increased - bad (red)
  }

  const has2025Data = companies2025.filter(c => !c.is_reference && c.premiums && c.premiums.length > 0).length > 0
  const has2026Data = companies2026.filter(c => !c.is_reference && c.premiums && c.premiums.length > 0).length > 0

  if (!has2025Data || !has2026Data) {
    return (
      <div className="px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            Date lipsă pentru comparație
          </h3>
          <p className="text-yellow-700 mb-4">
            Pentru a compara prețurile, trebuie să încărcați datele pentru ambii ani (2025 și 2026).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold mb-2">Date 2025</h4>
              <p className="text-sm text-gray-600 mb-3">
                Status: {has2025Data ? '✅ Încărcate' : '❌ Lipsă'}
              </p>
              <button
                onClick={handleLoadCompanies2025}
                disabled={isLoading2025}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading2025 ? 'Se încarcă...' : 'Încarcă date 2025'}
              </button>
            </div>

            <div className="bg-white rounded p-4">
              <h4 className="font-semibold mb-2">Date 2026</h4>
              <p className="text-sm text-gray-600 mb-3">
                Status: {has2026Data ? '✅ Încărcate' : '❌ Lipsă'}
              </p>
              <button
                onClick={handleLoadCompanies2026}
                disabled={isLoading2026}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading2026 ? 'Se încarcă...' : 'Încarcă date 2026'}
              </button>
            </div>
          </div>
          
          {loadError && (
            <p className="mt-4 text-sm text-red-600">{loadError}</p>
          )}
        </div>
      </div>
    )
  }

  // Get value for a specific company by ID
  const getCompanyValue = (cellId, companies, companyId) => {
    const company = companies.find(c => c.company_id === companyId)
    if (!company) return null
    return getPremiumValue(company, cellId)
  }

  // Get value for a company by name (for cross-year matching)
  const getCompanyValueByName = (cellId, companies, companyName) => {
    const company = companies.find(c => c.company_name === companyName)
    if (!company) return null
    return getPremiumValue(company, cellId)
  }

  // Get selected company name
  const getSelectedCompanyName = () => {
    if (selectedCompany === 'min') return null
    const company = companies2025.find(c => c.company_id === selectedCompany)
    return company?.company_name || null
  }

  // Render comparison cell with all info in one cell
  const renderComparisonCell = (vehicle, territoryId, category) => {
    const cellId = getCellId(vehicle.vehicle_id, territoryId, category.person_category_id)
    
    let value2025, value2026
    
    if (selectedCompany === 'min') {
      // Show minimum values across all companies
      value2025 = getMinValueAndCompany(cellId, companies2025).value
      value2026 = getMinValueAndCompany(cellId, companies2026).value
    } else {
      // Show values for selected company - match by name since IDs differ between years
      const companyName = getSelectedCompanyName()
      value2025 = getCompanyValueByName(cellId, companies2025, companyName)
      value2026 = getCompanyValueByName(cellId, companies2026, companyName)
    }
    
    const comparison = getComparison(value2025, value2026)
    
    const bgClass = getCellBgClass(value2025, value2026)
    const changeTextClass = comparison.change === null ? 'text-gray-400' : 
                           comparison.change < 0 ? 'text-blue-700 font-semibold' : 
                           comparison.change > 0 ? 'text-red-700 font-semibold' : 'text-gray-600'
    
    return (
      <td 
        key={`${territoryId}-${category.person_category_id}`} 
        className={`px-2 py-2 text-center border-r border-gray-200 ${bgClass} transition-colors`}
      >
        {/* 2026 Price - Main, larger */}
        <div className="text-sm font-bold text-gray-900">
          {formatCurrency(value2026)}
        </div>
        {/* 2025 Price - Smaller, muted (no label) */}
        <div className="text-xs text-gray-400 mt-0.5">
          {formatCurrency(value2025)}
        </div>
        {/* Change */}
        <div className={`text-xs mt-0.5 ${changeTextClass}`}>
          {showPercentage ? formatPercentage(comparison.percentage) : formatChange(comparison.change)}
        </div>
      </td>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Comparație Prețuri: 2025 vs 2026
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPercentage(!showPercentage)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {showPercentage ? 'Arată MDL' : 'Arată %'}
            </button>
            <button
              onClick={handleLoadCompanies2025}
              disabled={isLoading2025}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              title="Reîncarcă datele 2025"
            >
              📅 2025
            </button>
            <button
              onClick={handleLoadCompanies2026}
              disabled={isLoading2026}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              title="Reîncarcă datele 2026"
            >
              📅 2026
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded border border-blue-300"></div>
            <span className="text-gray-700">Preț scăzut în 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 rounded border border-red-300"></div>
            <span className="text-gray-700">Preț crescut în 2026</span>
          </div>
        </div>
        
        {loadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              {companies2025.map(company => (
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
              {/* First header row - Territories */}
              <tr>
                <th 
                  rowSpan="2" 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-20 border-r border-gray-300"
                >
                  Vehicul
                </th>
                <th
                  colSpan="5"
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-200"
                >
                  Chișinău
                </th>
                <th
                  colSpan="5"
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-700 bg-gray-200"
                >
                  Alte localități
                </th>
              </tr>
              {/* Second header row - Person categories */}
              <tr>
                {/* CH territory columns */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF &lt;23<br/>&lt;2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF &lt;23<br/>≥2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF ≥23<br/>&lt;2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF ≥23<br/>≥2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50">
                  PJ
                </th>
                {/* AL territory columns */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF &lt;23<br/>&lt;2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF &lt;23<br/>≥2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF ≥23<br/>&lt;2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 bg-gray-50 whitespace-nowrap">
                  PF ≥23<br/>≥2 ani
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 bg-gray-50">
                  PJ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map(vehicle => (
                <tr key={vehicle.vehicle_id}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{vehicle.vehicle_id}</div>
                        <div className="text-xs text-gray-500">{getShortDescription(vehicle)}</div>
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
                  
                  {/* CH territory columns */}
                  {orderedPersonCategories.map(category => {
                    if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                      return (
                        <td key={`CH-${category.person_category_id}`} className="px-2 py-2 text-sm text-center text-gray-400 border-r border-gray-200 bg-gray-50">
                          -
                        </td>
                      )
                    }
                    return renderComparisonCell(vehicle, 'CH', category)
                  })}
                  
                  {/* AL territory columns */}
                  {orderedPersonCategories.map(category => {
                    if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                      return (
                        <td key={`AL-${category.person_category_id}`} className="px-2 py-2 text-sm text-center text-gray-400 border-r border-gray-200 bg-gray-50">
                          -
                        </td>
                      )
                    }
                    return renderComparisonCell(vehicle, 'AL', category)
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Legendă celulă:</strong> Prima linie = preț 2026, a doua linie (gri) = preț 2025, a treia linie = diferență ({showPercentage ? '%' : 'MDL'})
        </p>
      </div>
    </div>
  )
}

export default PriceComparison
