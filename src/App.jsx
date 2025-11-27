import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PremiumsTable from './components/PremiumsTable'
import TopCheapestTable from './components/TopCheapestTable'
import Settings from './components/Settings'
import PriceComparison from './components/PriceComparison'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">RCA Hub</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Rate de Referință
                </Link>
                <Link
                  to="/top-cheapest"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/top-cheapest'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Top 3 Prețuri
                </Link>
                <Link
                  to="/comparison"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/comparison'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Comparație 2025 vs 2026
                </Link>
                <Link
                  to="/settings"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/settings'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Setări
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className={location.pathname === '/top-cheapest' ? 'py-6 px-4' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}>
        <Routes>
          <Route path="/" element={<PremiumsTable />} />
          <Route path="/top-cheapest" element={<TopCheapestTable />} />
          <Route path="/comparison" element={<PriceComparison />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App


