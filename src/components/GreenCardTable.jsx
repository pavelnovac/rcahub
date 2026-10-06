import React, { useEffect, useMemo, useState } from 'react'
import { getCompanyColor, getCompanyShortName } from '../utils/companyColors'
import CompanyColorLegend from './CompanyColorLegend'
import { getGreenCardPremium, greenCardCellId, loadGreenCardData } from '../utils/greenCardLoader'

const PERIOD_15_DAYS = 'D15'

function formatCurrency(value) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('ro-MD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatCollectedAt(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('ro-MD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function roundPrice(value) {
  return Math.round(value * 100) / 100
}

function GreenCardTable() {
  const [cells, setCells] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedZone, setSelectedZone] = useState('Z3')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await loadGreenCardData()
      setCells(data.cells)
      setCompanies(data.companies)
    } catch (error) {
      console.error(error)
      setLoadError('Nu am găsit prețurile Carte Verde. Rulează scriptul de import și conversia, apoi reîncarcă.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const categories = (cells?.categories || []).filter(category => category.id !== 'F')
  const zones = cells?.zones || []

  const insurers = useMemo(
    () => companies
      .filter(company => !company.is_reference && company.premiums?.length)
      .sort((a, b) => a.company_name.localeCompare(b.company_name, 'ro')),
    [companies]
  )

  if (isLoading) {
    return <div className="px-4 py-6">Se încarcă prețurile Carte Verde...</div>
  }

  if (loadError || !cells) {
    return (
      <div className="px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Prețurile Carte Verde nu sunt încărcate
          </h3>
          <p className="text-yellow-700 mb-4">{loadError}</p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
            <li>Deschide calculatorul Carte Verde pe rca.bnm.md/online</li>
            <li>Lipește <code className="bg-gray-100 px-1 rounded">scripts/browser-collector-green-card.js</code> în consolă</li>
            <li>Rulează <code className="bg-gray-100 px-1 rounded">collectGreenCardData()</code>, apoi <code className="bg-gray-100 px-1 rounded">exportGreenCardData()</code></li>
            <li>Convertește fișierul cu <code className="bg-gray-100 px-1 rounded">node scripts/convert-green-card-data.js &lt;fișier.json&gt;</code></li>
          </ol>
        </div>
      </div>
    )
  }

  const zoneLabel = zones.find(zone => zone.id === selectedZone)?.label || selectedZone
  const collectedLabel = formatCollectedAt(cells.collected_at)

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Prețuri Carte Verde, 15 zile — {zoneLabel}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Prime în {cells.currency || 'MDL'} pentru 15 zile
              {collectedLabel ? `, colectate la ${collectedLabel}` : ''}.
              Perioadele mai lungi folosesc aceiași coeficienți pentru toate companiile.
            </p>
          </div>
          <button
            onClick={loadData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Reîncarcă datele
          </button>
        </div>

        <div className="mb-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Zonă</label>
          <select
            value={selectedZone}
            onChange={(event) => setSelectedZone(event.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.label}</option>
            ))}
          </select>
        </div>
      </div>

      {insurers.length === 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Catalogul este pregătit, dar încă nu există prețuri importate.
        </div>
      )}

      <CompanyColorLegend companies={insurers} />

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-20 border-r border-gray-300">
                  Categoria
                </th>
                {insurers.map(company => {
                  const colors = getCompanyColor(company)
                  return (
                    <th
                      key={company.company_id}
                      title={company.company_name}
                      className={`px-3 py-3 text-center text-xs font-semibold border-r border-gray-300 ${colors.header} ${colors.text}`}
                    >
                      {getCompanyShortName(company.company_name)}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map(category => {
                const cellId = greenCardCellId(category.id, selectedZone, PERIOD_15_DAYS)
                const offers = insurers
                  .map(company => ({ company, value: getGreenCardPremium(company, cellId) }))
                  .filter(offer => offer.value !== null && offer.value !== undefined)
                const minValue = offers.length ? Math.min(...offers.map(offer => offer.value)) : null

                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-300">
                      <div className="font-semibold">{category.id}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{category.label}</div>
                    </td>
                    {insurers.map(company => {
                      const value = getGreenCardPremium(company, cellId)
                      const colors = getCompanyColor(company)
                      const isMin = value !== null && minValue !== null && roundPrice(value) === roundPrice(minValue)
                      return (
                        <td
                          key={company.company_id}
                          className={`px-3 py-3 text-center border-r border-gray-200 ${colors.bg} ${colors.text} ${isMin ? 'ring-2 ring-inset ring-gray-900' : ''}`}
                        >
                          <div className="text-sm font-semibold">{formatCurrency(value)}</div>
                          {isMin && (
                            <div className="text-xs font-medium mt-1">minim</div>
                          )}
                        </td>
                      )
                    })}
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

export default GreenCardTable
