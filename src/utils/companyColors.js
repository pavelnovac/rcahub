// Nuanțe la distanță mare pe cerc, cu fundaluri saturate.
// Verzi, albastre și violeturi vecine se confundau pe treptele pale *-50.
const PALETTE = {
  ACORD: {
    bg: 'bg-[#96a6f8]',
    border: 'border-[#4158c8]',
    text: 'text-[#111e5f]',
    header: 'bg-[#748bfb]',
    short: 'text-[#111e5f]',
    badge: 'bg-[#748bfb] text-[#111e5f]',
    rank: 'bg-[#1933b3]',
    empty: 'text-[#4656a4]'
  },
  ASTERRA: {
    bg: 'bg-[#e0abf7]',
    border: 'border-[#a041c8]',
    text: 'text-[#48115f]',
    header: 'bg-[#d78cf8]',
    short: 'text-[#48115f]',
    badge: 'bg-[#d78cf8] text-[#48115f]',
    rank: 'bg-[#8519b3]',
    empty: 'text-[#8846a4]'
  },
  DONARIS: {
    bg: 'bg-[#facca8]',
    border: 'border-[#c87c41]',
    text: 'text-[#5f3311]',
    header: 'bg-[#fcba88]',
    short: 'text-[#5f3311]',
    badge: 'bg-[#fcba88] text-[#5f3311]',
    rank: 'bg-[#b35c19]',
    empty: 'text-[#a46f46]'
  },
  GENERAL: {
    bg: 'bg-[#f5addb]',
    border: 'border-[#c84197]',
    text: 'text-[#5f1143]',
    header: 'bg-[#f58ed0]',
    short: 'text-[#5f1143]',
    badge: 'bg-[#f58ed0] text-[#5f1143]',
    rank: 'bg-[#b3197a]',
    empty: 'text-[#a44682]'
  },
  GRAWE: {
    bg: 'bg-[#fbeb9d]',
    border: 'border-[#c8b141]',
    text: 'text-[#5f5211]',
    header: 'bg-[#fce77e]',
    short: 'text-[#5f5211]',
    badge: 'bg-[#fce77e] text-[#5f5211]',
    rank: 'bg-[#b39919]',
    empty: 'text-[#a49546]'
  },
  INTACT: {
    bg: 'bg-[#7ddea0]',
    border: 'border-[#1f9a4a]',
    text: 'text-[#0c4a22]',
    header: 'bg-[#5ed488]',
    short: 'text-[#0c4a22]',
    badge: 'bg-[#5ed488] text-[#0c4a22]',
    rank: 'bg-[#148a3a]',
    empty: 'text-[#3d8a58]'
  },
  MOLDASIG: {
    bg: 'bg-[#f599a1]',
    border: 'border-[#c8414c]',
    text: 'text-[#5f1117]',
    header: 'bg-[#f67983]',
    short: 'text-[#5f1117]',
    badge: 'bg-[#f67983] text-[#5f1117]',
    rank: 'bg-[#b31926]',
    empty: 'text-[#a4464e]'
  },
  MOLDCARGO: {
    bg: 'bg-[#7ee8e4]',
    border: 'border-[#1a9e96]',
    text: 'text-[#0d4f4c]',
    header: 'bg-[#5adfd9]',
    short: 'text-[#0d4f4c]',
    badge: 'bg-[#5adfd9] text-[#0d4f4c]',
    rank: 'bg-[#0e8f88]',
    empty: 'text-[#3d8a86]'
  },
  TRANSELIT: {
    bg: 'bg-[#d4f07a]',
    border: 'border-[#8aaa1e]',
    text: 'text-[#3d520c]',
    header: 'bg-[#c6ea55]',
    short: 'text-[#3d520c]',
    badge: 'bg-[#c6ea55] text-[#3d520c]',
    rank: 'bg-[#6f9412]',
    empty: 'text-[#6a8430]'
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
