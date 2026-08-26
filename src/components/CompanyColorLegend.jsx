import { getCompanyLegendItems } from '../utils/companyColors'

function CompanyColorLegend({ companies, className = 'mb-4' }) {
  const items = getCompanyLegendItems(companies)
  if (!items.length) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
        Companii:
      </span>
      {items.map(item => (
        <span
          key={item.id}
          title={item.fullName}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${item.color.bg} ${item.color.border} ${item.color.text}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${item.color.rank}`}></span>
          {item.label}
        </span>
      ))}
    </div>
  )
}

export default CompanyColorLegend
