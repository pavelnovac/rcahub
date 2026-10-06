const baseUrl = import.meta.env.BASE_URL

export async function loadGreenCardData() {
  const cacheBuster = `?t=${Date.now()}`
  const [cellsResponse, companiesResponse] = await Promise.all([
    fetch(`${baseUrl}green_card_cells.json${cacheBuster}`),
    fetch(`${baseUrl}green_card_companies.json${cacheBuster}`)
  ])

  if (!cellsResponse.ok || !companiesResponse.ok) {
    throw new Error('Fișierele Carte Verde nu sunt în folderul public.')
  }

  const cells = await cellsResponse.json()
  const companies = await companiesResponse.json()
  return { cells, companies: Array.isArray(companies) ? companies : [] }
}

export function getGreenCardPremium(company, cellId) {
  const premium = company.premiums?.find(item => item.cell_id === cellId)
  return premium?.value ?? null
}

export function greenCardCellId(categoryId, zoneId, periodId, towingId) {
  if (categoryId === 'F') {
    return `F_${towingId}_${zoneId}_${periodId}`
  }
  return `${categoryId}_${zoneId}_${periodId}`
}
