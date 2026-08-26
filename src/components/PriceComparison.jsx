import React, { useState, useMemo, useEffect } from 'react'
import {
  getRcaCells,
  getPremiumValue,
  PRICE_DATASETS,
  getPriceDataset,
  hasCompanyPremiums,
  loadDatasetCompanies,
  reloadDatasetFromFile
} from '../utils/dataLoader'

const COMPARISON_PRESETS = [
  { id: '2026-current', baseId: '2026', compareId: '2026-aug', label: '2026 → august 2026' },
  { id: '2025-2026', baseId: '2025', compareId: '2026', label: '2025 → 2026' },
  { id: '2025-current', baseId: '2025', compareId: '2026-aug', label: '2025 → august 2026' }
]

function PriceComparison() {
  const [companiesByDataset, setCompaniesByDataset] = useState({})
  const [rcaCells, setRcaCells] = useState(null)
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('min')
  const [comparisonMode, setComparisonMode] = useState('year') // 'year' or 'company'
  const [selectedCompany1, setSelectedCompany1] = useState('')
  const [selectedCompany2, setSelectedCompany2] = useState('')
  const [selectedCompanyDatasetId, setSelectedCompanyDatasetId] = useState('2026-aug')
  const [baseDatasetId, setBaseDatasetId] = useState('2026')
  const [compareDatasetId, setCompareDatasetId] = useState('2026-aug')
  const [loadingDatasetId, setLoadingDatasetId] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [showPercentage, setShowPercentage] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      const loadedCells = await getRcaCells()
      setRcaCells(loadedCells)

      const loadedEntries = await Promise.all(
        PRICE_DATASETS.map(async (dataset) => {
          const companies = await loadDatasetCompanies(dataset)
          return [dataset.id, companies]
        })
      )
      setCompaniesByDataset(Object.fromEntries(loadedEntries))
      setIsInitializing(false)
    }
    init()
  }, [])

  const reloadAllDatasets = async () => {
    const loadedEntries = await Promise.all(
      PRICE_DATASETS.map(async (dataset) => {
        const companies = await loadDatasetCompanies(dataset)
        return [dataset.id, companies]
      })
    )
    setCompaniesByDataset(Object.fromEntries(loadedEntries))
  }

  const handleLoadDataset = async (datasetId) => {
    const dataset = getPriceDataset(datasetId)
    if (!dataset) return

    setLoadingDatasetId(datasetId)
    setLoadError(null)
    try {
      const { loadedCompanies } = await reloadDatasetFromFile(dataset)
      await reloadAllDatasets()
      alert(`✅ ${loadedCompanies.length} companii pentru ${dataset.label} încărcate cu succes!`)
    } catch (error) {
      console.error(`Error loading ${datasetId} companies:`, error)
      setLoadError(`Eroare la încărcarea datelor ${dataset.label}.`)
      alert(`❌ Eroare la încărcarea datelor ${dataset.label}.`)
    } finally {
      setLoadingDatasetId(null)
    }
  }

  const applyPreset = (preset) => {
    setBaseDatasetId(preset.baseId)
    setCompareDatasetId(preset.compareId)
    setSelectedCompany('min')
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

  const baseDataset = getPriceDataset(baseDatasetId)
  const compareDataset = getPriceDataset(compareDatasetId)
  const baseCompanies = companiesByDataset[baseDatasetId] || []
  const compareCompanies = companiesByDataset[compareDatasetId] || []
  const hasBaseData = hasCompanyPremiums(baseCompanies)
  const hasCompareData = hasCompanyPremiums(compareCompanies)

  const activePresetId = COMPARISON_PRESETS.find(
    preset => preset.baseId === baseDatasetId && preset.compareId === compareDatasetId
  )?.id || null

  const companiesForFilter = useMemo(() => {
    const byName = new Map()
    ;[...baseCompanies, ...compareCompanies].forEach(company => {
      if (!company.is_reference && company.company_name && !byName.has(company.company_name)) {
        byName.set(company.company_name, company)
      }
    })
    return Array.from(byName.values()).sort((a, b) => a.company_name.localeCompare(b.company_name))
  }, [baseCompanies, compareCompanies])

  // Get available companies for selected dataset (for company comparison)
  const getAvailableCompanies = (datasetId) => {
    const companies = companiesByDataset[datasetId] || []
    return companies.filter(c => !c.is_reference && c.premiums && c.premiums.length > 0)
  }

  // Calculate differences between two companies by category
  // This must be defined before any early returns to follow Rules of Hooks
  const calculateCompanyDifferences = useMemo(() => {
    if (comparisonMode !== 'company' || !selectedCompany1 || !selectedCompany2 || !rcaCells || !vehicles.length || !territories.length || !personCategories.length) {
      return null
    }

    const companies = companiesByDataset[selectedCompanyDatasetId] || []
    const company1 = companies.find(c => c.company_id === selectedCompany1)
    const company2 = companies.find(c => c.company_id === selectedCompany2)

    if (!company1 || !company2) return null

    const differences = {
      byVehicleGroup: {},
      byPersonCategory: {},
      byTerritory: {},
      byVehicleGroupAndPersonCategory: {},
      byVehicleGroupAndTerritory: {}
    }

    // Helper function to get cell ID
    const getCellId = (vehicleId, territoryId, personCategoryId) => {
      return `${vehicleId}_${territoryId}_${personCategoryId}`
    }

    // Iterate through all vehicles
    vehicles.forEach(vehicle => {
      territories.forEach(territory => {
        personCategories.forEach(personCategory => {
          // Skip invalid combinations (e.g., A7/B4 with non-PJ)
          if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && personCategory.person_type !== 'juridica') {
            return
          }

          const cellId = getCellId(vehicle.vehicle_id, territory.territory_id, personCategory.person_category_id)
          const value1 = getPremiumValue(company1, cellId)
          const value2 = getPremiumValue(company2, cellId)

          if (value1 === null || value2 === null) return

          const absoluteDiff = value2 - value1
          const percentageDiff = value1 !== 0 ? ((absoluteDiff / value1) * 100) : null

          const diffData = {
            vehicle,
            territory,
            personCategory,
            cellId,
            company1Value: value1,
            company2Value: value2,
            absoluteDiff,
            percentageDiff
          }

          // Group by vehicle group
          const vehicleGroup = vehicle.group || 'other'
          if (!differences.byVehicleGroup[vehicleGroup]) {
            differences.byVehicleGroup[vehicleGroup] = {
              label: vehicle.group_label || vehicleGroup,
              items: [],
              totalDiff: 0,
              count: 0
            }
          }
          differences.byVehicleGroup[vehicleGroup].items.push(diffData)
          differences.byVehicleGroup[vehicleGroup].totalDiff += absoluteDiff
          differences.byVehicleGroup[vehicleGroup].count++

          // Group by person category
          const personCatId = personCategory.person_category_id
          if (!differences.byPersonCategory[personCatId]) {
            differences.byPersonCategory[personCatId] = {
              label: personCategory.description || personCatId,
              items: [],
              totalDiff: 0,
              count: 0
            }
          }
          differences.byPersonCategory[personCatId].items.push(diffData)
          differences.byPersonCategory[personCatId].totalDiff += absoluteDiff
          differences.byPersonCategory[personCatId].count++

          // Group by territory
          const territoryId = territory.territory_id
          if (!differences.byTerritory[territoryId]) {
            differences.byTerritory[territoryId] = {
              label: territory.label || territoryId,
              items: [],
              totalDiff: 0,
              count: 0
            }
          }
          differences.byTerritory[territoryId].items.push(diffData)
          differences.byTerritory[territoryId].totalDiff += absoluteDiff
          differences.byTerritory[territoryId].count++

          // Group by vehicle group + person category
          const vgPcKey = `${vehicleGroup}_${personCatId}`
          if (!differences.byVehicleGroupAndPersonCategory[vgPcKey]) {
            differences.byVehicleGroupAndPersonCategory[vgPcKey] = {
              vehicleGroupLabel: vehicle.group_label || vehicleGroup,
              personCategoryLabel: personCategory.description || personCatId,
              items: [],
              totalDiff: 0,
              count: 0
            }
          }
          differences.byVehicleGroupAndPersonCategory[vgPcKey].items.push(diffData)
          differences.byVehicleGroupAndPersonCategory[vgPcKey].totalDiff += absoluteDiff
          differences.byVehicleGroupAndPersonCategory[vgPcKey].count++

          // Group by vehicle group + territory
          const vgTKey = `${vehicleGroup}_${territoryId}`
          if (!differences.byVehicleGroupAndTerritory[vgTKey]) {
            differences.byVehicleGroupAndTerritory[vgTKey] = {
              vehicleGroupLabel: vehicle.group_label || vehicleGroup,
              territoryLabel: territory.label || territoryId,
              items: [],
              totalDiff: 0,
              count: 0
            }
          }
          differences.byVehicleGroupAndTerritory[vgTKey].items.push(diffData)
          differences.byVehicleGroupAndTerritory[vgTKey].totalDiff += absoluteDiff
          differences.byVehicleGroupAndTerritory[vgTKey].count++
        })
      })
    })

    return {
      company1: { name: company1.company_name, id: company1.company_id },
      company2: { name: company2.company_name, id: company2.company_id },
      differences
    }
  }, [comparisonMode, selectedCompany1, selectedCompany2, selectedCompanyDatasetId, companiesByDataset, vehicles, territories, personCategories, rcaCells])

  const changeSummary = useMemo(() => {
    if (!hasBaseData || !hasCompareData || !vehicles.length || !territories.length || !orderedPersonCategories.length) {
      return null
    }

    const getMinValue = (cellId, companies) => {
      let minValue = Infinity
      companies.forEach(company => {
        if (company.is_reference) return
        const value = getPremiumValue(company, cellId)
        if (value !== null && value < minValue) {
          minValue = value
        }
      })
      return minValue === Infinity ? null : minValue
    }

    const getValue = (cellId, companies) => {
      if (selectedCompany === 'min') {
        return getMinValue(cellId, companies)
      }
      const selected = companiesForFilter.find(c => c.company_id === selectedCompany)
      const companyName = selected?.company_name
      if (!companyName) return null
      const company = companies.find(c => c.company_name === companyName)
      return company ? getPremiumValue(company, cellId) : null
    }

    let increased = 0
    let decreased = 0
    let unchanged = 0
    let missing = 0
    let totalPct = 0
    let pctCount = 0
    let biggestIncrease = null
    let biggestDecrease = null
    const companyChanges = {}

    filteredVehicles.forEach(vehicle => {
      territories.forEach(territory => {
        orderedPersonCategories.forEach(category => {
          if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
            return
          }

          const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_${category.person_category_id}`
          const valueBase = getValue(cellId, baseCompanies)
          const valueCompare = getValue(cellId, compareCompanies)

          if (valueBase === null || valueCompare === null) {
            missing++
            return
          }

          const change = valueCompare - valueBase
          const percentage = valueBase !== 0 ? (change / valueBase) * 100 : null

          if (change > 0) increased++
          else if (change < 0) decreased++
          else unchanged++

          if (percentage !== null && isFinite(percentage)) {
            totalPct += percentage
            pctCount++
          }

          const point = { cellId, vehicle: vehicle.vehicle_id, change, percentage, valueBase, valueCompare }
          if (!biggestIncrease || change > biggestIncrease.change) biggestIncrease = point
          if (!biggestDecrease || change < biggestDecrease.change) biggestDecrease = point
        })
      })
    })

    if (selectedCompany === 'min') {
      companiesForFilter.forEach(company => {
        let up = 0
        let down = 0
        let same = 0
        filteredVehicles.forEach(vehicle => {
          territories.forEach(territory => {
            orderedPersonCategories.forEach(category => {
              if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
                return
              }
              const cellId = `${vehicle.vehicle_id}_${territory.territory_id}_${category.person_category_id}`
              const baseCompany = baseCompanies.find(c => c.company_name === company.company_name)
              const compareCompany = compareCompanies.find(c => c.company_name === company.company_name)
              const v1 = baseCompany ? getPremiumValue(baseCompany, cellId) : null
              const v2 = compareCompany ? getPremiumValue(compareCompany, cellId) : null
              if (v1 === null || v2 === null) return
              if (v2 > v1) up++
              else if (v2 < v1) down++
              else same++
            })
          })
        })
        if (up + down > 0) {
          companyChanges[company.company_name] = { up, down, same }
        }
      })
    }

    return {
      increased,
      decreased,
      unchanged,
      missing,
      compared: increased + decreased + unchanged,
      avgPercentage: pctCount > 0 ? totalPct / pctCount : null,
      biggestIncrease: biggestIncrease && biggestIncrease.change > 0 ? biggestIncrease : null,
      biggestDecrease: biggestDecrease && biggestDecrease.change < 0 ? biggestDecrease : null,
      companyChanges
    }
  }, [
    hasBaseData,
    hasCompareData,
    vehicles,
    territories,
    orderedPersonCategories,
    filteredVehicles,
    selectedCompany,
    companiesForFilter,
    baseCompanies,
    compareCompanies
  ])

  if (!rcaCells || isInitializing) {
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


  if (comparisonMode === 'year' && (!hasBaseData || !hasCompareData)) {
    return (
      <div className="px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            Date lipsă pentru comparație
          </h3>
          <p className="text-yellow-700 mb-4">
            Pentru a compara prețurile, trebuie să încărcați datele pentru ambele seturi selectate.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICE_DATASETS.map(dataset => {
              const loaded = hasCompanyPremiums(companiesByDataset[dataset.id] || [])
              return (
                <div key={dataset.id} className="bg-white rounded p-4">
                  <h4 className="font-semibold mb-1">{dataset.label}</h4>
                  <p className="text-xs text-gray-500 mb-2">{dataset.description}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Status: {loaded ? 'Încărcate' : 'Lipsă'}
                  </p>
                  <button
                    onClick={() => handleLoadDataset(dataset.id)}
                    disabled={loadingDatasetId === dataset.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {loadingDatasetId === dataset.id ? 'Se încarcă...' : `Încarcă ${dataset.shortLabel}`}
                  </button>
                </div>
              )
            })}
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
    const company = companiesForFilter.find(c => c.company_id === selectedCompany)
      || baseCompanies.find(c => c.company_id === selectedCompany)
      || compareCompanies.find(c => c.company_id === selectedCompany)
    return company?.company_name || null
  }

  // Render comparison cell with all info in one cell
  const renderComparisonCell = (vehicle, territoryId, category) => {
    const cellId = getCellId(vehicle.vehicle_id, territoryId, category.person_category_id)
    
    let valueBase, valueCompare
    
    if (selectedCompany === 'min') {
      valueBase = getMinValueAndCompany(cellId, baseCompanies).value
      valueCompare = getMinValueAndCompany(cellId, compareCompanies).value
    } else {
      const companyName = getSelectedCompanyName()
      valueBase = getCompanyValueByName(cellId, baseCompanies, companyName)
      valueCompare = getCompanyValueByName(cellId, compareCompanies, companyName)
    }
    
    const comparison = getComparison(valueBase, valueCompare)
    
    const bgClass = getCellBgClass(valueBase, valueCompare)
    const changeTextClass = comparison.change === null ? 'text-gray-400' : 
                           comparison.change < 0 ? 'text-blue-700 font-semibold' : 
                           comparison.change > 0 ? 'text-red-700 font-semibold' : 'text-gray-600'
    
    return (
      <td 
        key={`${territoryId}-${category.person_category_id}`} 
        className={`px-2 py-2 text-center border-r border-gray-200 ${bgClass} transition-colors`}
      >
        <div className="text-sm font-bold text-gray-900">
          {formatCurrency(valueCompare)}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {formatCurrency(valueBase)}
        </div>
        <div className={`text-xs mt-0.5 ${changeTextClass}`}>
          {showPercentage ? formatPercentage(comparison.percentage) : formatChange(comparison.change)}
        </div>
      </td>
    )
  }

  // Render company comparison cell
  const renderCompanyComparisonCell = (vehicle, territoryId, category) => {
    if (!calculateCompanyDifferences) return null
    
    const { company1, company2 } = calculateCompanyDifferences
    const companies = companiesByDataset[selectedCompanyDatasetId] || []
    const comp1 = companies.find(c => c.company_id === company1.id)
    const comp2 = companies.find(c => c.company_id === company2.id)
    
    if (!comp1 || !comp2) return null
    
    const cellId = getCellId(vehicle.vehicle_id, territoryId, category.person_category_id)
    const value1 = getPremiumValue(comp1, cellId)
    const value2 = getPremiumValue(comp2, cellId)
    
    if (value1 === null && value2 === null) {
      return (
        <td 
          key={`${territoryId}-${category.person_category_id}`} 
          className="px-2 py-2 text-center border-r border-gray-200 bg-gray-50"
        >
          <div className="text-sm text-gray-400">-</div>
        </td>
      )
    }
    
    const absoluteDiff = value1 !== null && value2 !== null ? value2 - value1 : null
    const percentageDiff = value1 !== null && value2 !== null && value1 !== 0 ? ((absoluteDiff / value1) * 100) : null
    
    const bgClass = absoluteDiff === null ? 'bg-gray-50' : 
                   absoluteDiff < 0 ? 'bg-green-100 hover:bg-green-200' : 
                   absoluteDiff > 0 ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-50'
    
    const diffTextClass = absoluteDiff === null ? 'text-gray-400' : 
                         absoluteDiff < 0 ? 'text-green-700 font-semibold' : 
                         absoluteDiff > 0 ? 'text-red-700 font-semibold' : 'text-gray-600'
    
    return (
      <td 
        key={`${territoryId}-${category.person_category_id}`} 
        className={`px-2 py-2 text-center border-r border-gray-200 ${bgClass} transition-colors`}
      >
        {/* Company 1 Price - Main, larger */}
        <div className="text-sm font-bold text-gray-900">
          {formatCurrency(value1)}
        </div>
        {/* Company 2 Price - Smaller, muted */}
        <div className="text-xs text-gray-600 mt-0.5">
          {formatCurrency(value2)}
        </div>
        {/* Difference */}
        {absoluteDiff !== null && (
          <div className={`text-xs mt-0.5 ${diffTextClass}`}>
            {showPercentage ? formatPercentage(percentageDiff) : formatChange(absoluteDiff)}
          </div>
        )}
      </td>
    )
  }

  // Render company comparison view
  const renderCompanyComparison = () => {
    const availableCompanies = getAvailableCompanies(selectedCompanyDatasetId)
    const companyDataset = getPriceDataset(selectedCompanyDatasetId)

    return (
      <div className="space-y-6">
        {/* Company selectors - always visible */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set de date
              </label>
              <select
                value={selectedCompanyDatasetId}
                onChange={(e) => {
                  setSelectedCompanyDatasetId(e.target.value)
                  setSelectedCompany1('')
                  setSelectedCompany2('')
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {PRICE_DATASETS.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Companie 1
              </label>
              <select
                value={selectedCompany1}
                onChange={(e) => setSelectedCompany1(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selectați companie...</option>
                {availableCompanies.map(company => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Companie 2
              </label>
              <select
                value={selectedCompany2}
                onChange={(e) => setSelectedCompany2(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selectați companie...</option>
                {availableCompanies
                  .filter(c => c.company_id !== selectedCompany1)
                  .map(company => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {!calculateCompanyDifferences ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-700">
              Selectați două companii pentru a compara prețurile.
            </p>
          </div>
        ) : (
          (() => {
            const { company1, company2, differences } = calculateCompanyDifferences
            return (
              <>
                {/* Comparison summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Comparație: {company1.name} vs {company2.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Set: {companyDataset?.label || selectedCompanyDatasetId} | {Object.keys(differences.byVehicleGroup).length} categorii vehicule | {Object.keys(differences.byPersonCategory).length} categorii persoane
                  </p>
                </div>

                {/* Full price table - similar to year comparison */}
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
                              return renderCompanyComparisonCell(vehicle, 'CH', category)
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
                              return renderCompanyComparisonCell(vehicle, 'AL', category)
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Summary info */}
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Legendă celulă:</strong> Prima linie = {company1.name}, a doua linie (gri) = {company2.name}, a treia linie = diferență ({showPercentage ? '%' : 'MDL'})
                  </p>
                </div>

                {/* Category differences summary */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="border-b border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezumat Diferențe pe Categorii</h3>
                  </div>

                  <div className="p-4">
                    {/* By Vehicle Group */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Diferențe pe Categorii de Vehicule</h4>
              <div className="space-y-3">
                {Object.entries(differences.byVehicleGroup)
                  .sort(([, a], [, b]) => Math.abs(b.totalDiff) - Math.abs(a.totalDiff))
                  .map(([group, data]) => {
                    const avgDiff = data.count > 0 ? data.totalDiff / data.count : 0
                    const bgClass = avgDiff < 0 ? 'bg-green-50 border-green-200' : avgDiff > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    return (
                      <div key={group} className={`border rounded-lg p-3 ${bgClass}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{data.label}</div>
                            <div className="text-xs text-gray-600">{data.count} combinații</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${avgDiff < 0 ? 'text-green-700' : avgDiff > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                              {avgDiff < 0 ? '-' : '+'}{formatCurrency(Math.abs(avgDiff))} MDL
                            </div>
                            {showPercentage && avgDiff !== 0 && (
                              <div className="text-xs text-gray-600">
                                {formatPercentage((avgDiff / (data.items[0]?.company1Value || 1)) * 100)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                      </div>
                    </div>

                    {/* By Person Category */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Diferențe pe Categorii de Persoane</h4>
              <div className="space-y-3">
                {Object.entries(differences.byPersonCategory)
                  .sort(([, a], [, b]) => Math.abs(b.totalDiff) - Math.abs(a.totalDiff))
                  .map(([catId, data]) => {
                    const avgDiff = data.count > 0 ? data.totalDiff / data.count : 0
                    const bgClass = avgDiff < 0 ? 'bg-green-50 border-green-200' : avgDiff > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    return (
                      <div key={catId} className={`border rounded-lg p-3 ${bgClass}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{data.label}</div>
                            <div className="text-xs text-gray-600">{data.count} combinații</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${avgDiff < 0 ? 'text-green-700' : avgDiff > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                              {avgDiff < 0 ? '-' : '+'}{formatCurrency(Math.abs(avgDiff))} MDL
                            </div>
                            {showPercentage && avgDiff !== 0 && (
                              <div className="text-xs text-gray-600">
                                {formatPercentage((avgDiff / (data.items[0]?.company1Value || 1)) * 100)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                      </div>
                    </div>

                    {/* By Territory */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Diferențe pe Teritorii</h4>
              <div className="space-y-3">
                {Object.entries(differences.byTerritory)
                  .sort(([, a], [, b]) => Math.abs(b.totalDiff) - Math.abs(a.totalDiff))
                  .map(([territoryId, data]) => {
                    const avgDiff = data.count > 0 ? data.totalDiff / data.count : 0
                    const bgClass = avgDiff < 0 ? 'bg-green-50 border-green-200' : avgDiff > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    return (
                      <div key={territoryId} className={`border rounded-lg p-3 ${bgClass}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{data.label}</div>
                            <div className="text-xs text-gray-600">{data.count} combinații</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${avgDiff < 0 ? 'text-green-700' : avgDiff > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                              {avgDiff < 0 ? '-' : '+'}{formatCurrency(Math.abs(avgDiff))} MDL
                            </div>
                            {showPercentage && avgDiff !== 0 && (
                              <div className="text-xs text-gray-600">
                                {formatPercentage((avgDiff / (data.items[0]?.company1Value || 1)) * 100)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                      </div>
                    </div>

                    {/* Detailed table */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Detalii Complete</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Vehicul</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Teritoriu</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Categorie Persoană</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">{company1.name}</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">{company2.name}</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Diferență</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">%</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.values(differences.byVehicleGroup)
                              .flatMap(group => group.items)
                              .sort((a, b) => Math.abs(b.absoluteDiff) - Math.abs(a.absoluteDiff))
                              .map((item, idx) => {
                                const bgClass = item.absoluteDiff < 0 ? 'bg-green-50' : item.absoluteDiff > 0 ? 'bg-red-50' : 'bg-gray-50'
                                return (
                                  <tr key={`${item.cellId}-${idx}`} className={bgClass}>
                                    <td className="px-3 py-2 text-sm text-gray-900">{item.vehicle.vehicle_id}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700">{item.territory.territory_id}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700">{item.personCategory.person_category_id}</td>
                                    <td className="px-3 py-2 text-sm text-center font-medium">{formatCurrency(item.company1Value)}</td>
                                    <td className="px-3 py-2 text-sm text-center font-medium">{formatCurrency(item.company2Value)}</td>
                                    <td className={`px-3 py-2 text-sm text-center font-semibold ${item.absoluteDiff < 0 ? 'text-green-700' : item.absoluteDiff > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                                      {item.absoluteDiff < 0 ? '-' : '+'}{formatCurrency(Math.abs(item.absoluteDiff))}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-600">
                                      {formatPercentage(item.percentageDiff)}
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()
        )}
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {comparisonMode === 'year'
              ? `Comparație prețuri: ${baseDataset?.shortLabel || baseDatasetId} → ${compareDataset?.shortLabel || compareDatasetId}`
              : 'Comparație Companie: Prețuri pe Categorii'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPercentage(!showPercentage)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {showPercentage ? 'Arată MDL' : 'Arată %'}
            </button>
            <button
              onClick={() => setComparisonMode(comparisonMode === 'year' ? 'company' : 'year')}
              className={`font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ${
                comparisonMode === 'year' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {comparisonMode === 'year' ? 'Comparație Companie' : 'Comparație perioade'}
            </button>
          </div>
        </div>
        
        {comparisonMode === 'year' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-end gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compară
                  </label>
                  <select
                    value={baseDatasetId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setBaseDatasetId(nextId)
                      if (nextId === compareDatasetId) {
                        const fallback = PRICE_DATASETS.find(d => d.id !== nextId)
                        if (fallback) setCompareDatasetId(fallback.id)
                      }
                      setSelectedCompany('min')
                    }}
                    className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {PRICE_DATASETS.map(dataset => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    cu
                  </label>
                  <select
                    value={compareDatasetId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setCompareDatasetId(nextId)
                      if (nextId === baseDatasetId) {
                        const fallback = PRICE_DATASETS.find(d => d.id !== nextId)
                        if (fallback) setBaseDatasetId(fallback.id)
                      }
                      setSelectedCompany('min')
                    }}
                    className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {PRICE_DATASETS.map(dataset => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 pb-0.5">
                  {COMPARISON_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`text-sm font-medium py-2 px-3 rounded-lg border transition-colors duration-200 ${
                        activePresetId === preset.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {baseDataset?.description} → {compareDataset?.description}
              </p>
            </div>

            {changeSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Celule comparate</div>
                  <div className="text-xl font-bold text-gray-900">{changeSummary.compared}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {changeSummary.unchanged} neschimbate
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-700">Creșteri</div>
                  <div className="text-xl font-bold text-red-700">{changeSummary.increased}</div>
                  <div className="text-xs text-red-600 mt-1">
                    {changeSummary.biggestIncrease
                      ? `max +${formatCurrency(changeSummary.biggestIncrease.change)} (${changeSummary.biggestIncrease.vehicle})`
                      : 'fără creșteri'}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Scăderi</div>
                  <div className="text-xl font-bold text-blue-700">{changeSummary.decreased}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {changeSummary.biggestDecrease
                      ? `max ${formatCurrency(changeSummary.biggestDecrease.change)} (${changeSummary.biggestDecrease.vehicle})`
                      : 'fără scăderi'}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Modificare medie</div>
                  <div className={`text-xl font-bold ${
                    changeSummary.avgPercentage === null || Math.abs(changeSummary.avgPercentage) < 0.05
                      ? 'text-gray-900'
                      : changeSummary.avgPercentage > 0 ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {formatPercentage(changeSummary.avgPercentage)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">pe celulele din tabel</div>
                </div>
              </div>
            )}

            {selectedCompany === 'min' && changeSummary && Object.keys(changeSummary.companyChanges).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Companii care au modificat prețurile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.entries(changeSummary.companyChanges)
                    .sort(([, a], [, b]) => (b.up + b.down) - (a.up + a.down))
                    .map(([name, stats]) => (
                      <div key={name} className="flex items-center justify-between text-sm border border-gray-100 rounded px-3 py-2">
                        <span className="font-medium text-gray-800">{name.replace(' S.A.', '')}</span>
                        <span className="text-gray-600">
                          {stats.up > 0 && <span className="text-red-700">+{stats.up}</span>}
                          {stats.up > 0 && stats.down > 0 && ' / '}
                          {stats.down > 0 && <span className="text-blue-700">-{stats.down}</span>}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded border border-blue-300"></div>
                <span className="text-gray-700">Preț scăzut în {compareDataset?.shortLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded border border-red-300"></div>
                <span className="text-gray-700">Preț crescut în {compareDataset?.shortLabel}</span>
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
                  {companiesForFilter.map(company => (
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
          </>
        )}
      </div>

      {comparisonMode === 'company' ? renderCompanyComparison() : (
        <>
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
              <strong>Legendă celulă:</strong> Prima linie = {compareDataset?.label}, a doua linie (gri) = {baseDataset?.label}, a treia linie = diferență ({showPercentage ? '%' : 'MDL'})
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default PriceComparison
