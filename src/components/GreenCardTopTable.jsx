import React, { useEffect, useMemo, useState } from 'react'
import { getCompanyColor, getCompanyShortName } from '../utils/companyColors'
import CompanyColorLegend from './CompanyColorLegend'
import { getGreenCardPremium, greenCardCellId, loadGreenCardData } from '../utils/greenCardLoader'

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
    year: 'numeric'
  }).format(date)
}

function roundPrice(value) {
  return Math.round(value * 100) / 100
}

function priceRank(value, offers) {
  const rounded = roundPrice(value)
  const cheaperPrices = new Set(
    offers.map(offer => roundPrice(offer.value)).filter(price => price < rounded)
  )
  return cheaperPrices.size + 1
}

const RANK_TONE = {
  1: 'bg-slate-700',
  2: 'bg-slate-500',
  3: 'bg-slate-400'
}

function GreenCardTopTable() {
  const [cells, setCells] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('D15')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [expandedCell, setExpandedCell] = useState(null)

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

  const insurers = useMemo(
    () => companies
      .filter(company => !company.is_reference && company.premiums?.length)
      .sort((a, b) => a.company_name.localeCompare(b.company_name, 'ro')),
    [companies]
  )

  const zones = cells?.zones || []
  const periods = cells?.periods || []

  const rows = useMemo(() => {
    if (!cells) return []

    const categories = (cells.categories || [])
      .filter(category => category.id !== 'F')
      .map(category => ({
        key: category.id,
        code: category.id,
        label: category.label,
        cellId: (zoneId) => greenCardCellId(category.id, zoneId, selectedPeriod)
      }))

    const trailers = (cells.towing_categories || []).map(towing => ({
      key: `F_${towing.id}`,
      code: 'F',
      label: `Remorcă · ${towing.label}`,
      cellId: (zoneId) => greenCardCellId('F', zoneId, selectedPeriod, towing.id)
    }))

    return [...categories, ...trailers]
  }, [cells, selectedPeriod])

  const getTopOffers = (cellId) => {
    const offers = insurers
      .map(company => ({
        company,
        value: getGreenCardPremium(company, cellId),
        companyName: company.company_name,
        companyId: company.company_id
      }))
      .filter(offer => offer.value !== null && offer.value !== undefined)

    return offers
      .map(offer => ({ ...offer, rank: priceRank(offer.value, offers) }))
      .filter(offer => offer.rank <= 3)
      .sort((a, b) => a.rank - b.rank || a.companyName.localeCompare(b.companyName, 'ro'))
  }

  if (isLoading) {
    return <div className="px-4 py-6">Se încarcă comparația Carte Verde...</div>
  }

  if (loadError || !cells) {
    return (
      <div className="px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Prețurile Carte Verde nu sunt încărcate
          </h3>
          <p className="text-yellow-700">{loadError}</p>
        </div>
      </div>
    )
  }

  const periodLabel = periods.find(period => period.id === selectedPeriod)?.label || selectedPeriod
  const collectedLabel = formatCollectedAt(cells.collected_at)

  const renderTopCell = (row, zone) => {
    const cellId = row.cellId(zone.id)
    const topOffers = getTopOffers(cellId)
    const isExpanded = expandedCell === cellId

    if (topOffers.length === 0) {
      return (
        <td key={cellId} className="px-3 py-3 text-sm text-center text-slate-400 border-r border-slate-200 bg-slate-50">
          -
        </td>
      )
    }

    return (
      <td
        key={cellId}
        className="relative px-2 py-2 text-xs border-r border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer align-top"
        onClick={() => setExpandedCell(isExpanded ? null : cellId)}
      >
        <div className="space-y-1">
          {topOffers.map(item => {
            const colorScheme = getCompanyColor(item.company)
            return (
              <div
                key={item.companyId}
                className={`flex w-full items-center justify-between gap-2 px-2 py-1 rounded ${colorScheme.bg} ${colorScheme.border} border`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full ${RANK_TONE[item.rank] || 'bg-slate-400'} text-white text-[10px] font-bold flex items-center justify-center`}>
                    {item.rank}
                  </span>
                  <span className={`font-medium ${colorScheme.text} ${isExpanded ? 'text-xs' : 'truncate text-[11px]'}`}>
                    {isExpanded ? item.companyName : getCompanyShortName(item.companyName)}
                  </span>
                </div>
                <span className={`font-bold ${colorScheme.text} text-[11px] tabular-nums whitespace-nowrap`}>
                  {formatCurrency(item.value)}{isExpanded ? ` ${cells.currency || 'MDL'}` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </td>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              Top 3 Carte Verde — {periodLabel}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              Cele mai ieftine oferte pentru fiecare categorie, în {cells.currency || 'MDL'}
              {collectedLabel ? `, colectate la ${collectedLabel}` : ''}.
              Ordinea companiilor este aceeași pentru toate perioadele.
            </p>
          </div>
          <button
            onClick={loadData}
            className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center shadow-lg shadow-emerald-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reîncarcă
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Loc:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <span className="text-xs font-medium text-slate-600">Cel mai ieftin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <span className="text-xs font-medium text-slate-600">Al doilea</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              <span className="text-xs font-medium text-slate-600">Al treilea</span>
            </div>
            <span className="text-xs text-slate-500">Același număr înseamnă același preț.</span>
          </div>
          <CompanyColorLegend companies={insurers} className="" />
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Perioadă
          </label>
          <select
            value={selectedPeriod}
            onChange={(event) => {
              setSelectedPeriod(event.target.value)
              setExpandedCell(null)
            }}
            className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>{period.label}</option>
            ))}
          </select>
        </div>
      </div>

      {insurers.length === 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Catalogul este pregătit, dar încă nu există prețuri importate.
        </div>
      )}

      <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-100 z-20 border-r border-slate-300 min-w-[220px]">
                  Categoria
                </th>
                {zones.map((zone, index) => (
                  <th
                    key={zone.id}
                    className={`px-3 py-3 text-center text-xs font-bold text-slate-700 border-r border-slate-300 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50'
                    }`}
                  >
                    {zone.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {rows.map((row, rowIndex) => {
                const isTrailer = row.code === 'F'
                const showTrailerDivider = isTrailer && rows[rowIndex - 1]?.code !== 'F'
                return (
                  <React.Fragment key={row.key}>
                    {showTrailerDivider && (
                      <tr>
                        <td
                          colSpan={1 + zones.length}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 border-y border-slate-200"
                        >
                          Remorci — prima depinde de vehiculul care tractează
                        </td>
                      </tr>
                    )}
                    <tr className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td
                        className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 z-10 border-r border-slate-200"
                        style={{ background: rowIndex % 2 === 0 ? 'white' : 'rgb(248 250 252)' }}
                      >
                        <div className="font-bold text-slate-800">{row.code}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{row.label}</div>
                      </td>
                      {zones.map(zone => renderTopCell(row, zone))}
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400">
        Fă clic pe o celulă pentru numele complet al companiei. Dacă mai multe companii au același preț, apar toate la același loc.
      </div>
    </div>
  )
}

export default GreenCardTopTable
