const PALETTE = {
  ACORD: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    header: 'bg-blue-100',
    short: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    rank: 'bg-blue-600',
    empty: 'text-blue-400'
  },
  ASTERRA: {
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-800',
    header: 'bg-violet-100',
    short: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    rank: 'bg-violet-600',
    empty: 'text-violet-400'
  },
  DONARIS: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-800',
    header: 'bg-orange-100',
    short: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    rank: 'bg-orange-500',
    empty: 'text-orange-400'
  },
  GENERAL: {
    bg: 'bg-pink-50',
    border: 'border-pink-300',
    text: 'text-pink-800',
    header: 'bg-pink-100',
    short: 'text-pink-700',
    badge: 'bg-pink-100 text-pink-700',
    rank: 'bg-pink-500',
    empty: 'text-pink-400'
  },
  GRAWE: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    header: 'bg-amber-100',
    short: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800',
    rank: 'bg-amber-500',
    empty: 'text-amber-400'
  },
  INTACT: {
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    text: 'text-teal-800',
    header: 'bg-teal-100',
    short: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    rank: 'bg-teal-600',
    empty: 'text-teal-400'
  },
  MOLDASIG: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    header: 'bg-emerald-100',
    short: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    rank: 'bg-emerald-600',
    empty: 'text-emerald-400'
  },
  MOLDCARGO: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    text: 'text-cyan-800',
    header: 'bg-cyan-100',
    short: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-700',
    rank: 'bg-cyan-600',
    empty: 'text-cyan-400'
  },
  TRANSELIT: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    text: 'text-indigo-800',
    header: 'bg-indigo-100',
    short: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
    rank: 'bg-indigo-600',
    empty: 'text-indigo-400'
  }
}

const FALLBACK = {
  bg: 'bg-gray-50',
  border: 'border-gray-300',
  text: 'text-gray-800',
  header: 'bg-gray-100',
  short: 'text-gray-700',
  badge: 'bg-gray-100 text-gray-700',
  rank: 'bg-gray-500',
  empty: 'text-gray-400'
}

const COLOR_KEYS = Object.keys(PALETTE)

export function getCompanyShortName(companyName) {
  if (!companyName) return ''
  const words = companyName.split(' ')
  if (words.length === 1) return companyName.substring(0, 8).toUpperCase()
  return words[0].toUpperCase()
}

function normalizeHaystack(value) {
  return String(value)
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lookupKey(value) {
  if (!value) return null
  const haystack = ` ${normalizeHaystack(value)} `
  // Whole-token match so GENERAL does not collide with GENERALE (INTACT).
  return COLOR_KEYS.find(key => haystack.includes(` ${key} `)) || null
}

function companyLookupKey(company) {
  if (!company) return null
  if (typeof company === 'string') return lookupKey(company)
  return lookupKey(`${company.company_name || ''} ${company.company_id || ''}`)
}

export function getCompanyColor(company) {
  const key = companyLookupKey(company)
  return key ? PALETTE[key] : FALLBACK
}

export function getCompanyLegendItems(companies) {
  const seen = new Set()
  return (companies || [])
    .filter(company => !company.is_reference && company.company_name)
    .sort((a, b) => a.company_name.localeCompare(b.company_name))
    .filter(company => {
      const key = companyLookupKey(company) || company.company_id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(company => ({
      id: company.company_id,
      label: getCompanyShortName(company.company_name),
      fullName: company.company_name,
      color: getCompanyColor(company)
    }))
}
