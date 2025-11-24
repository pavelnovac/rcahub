import { useState, useEffect } from 'react'
import { loadCompaniesByYear, saveCompanyByYear, deleteCompanyByYear, getRcaCells } from '../utils/dataLoader'

function Settings() {
  const [companies, setCompanies] = useState([])
  const [rcaCells, setRcaCells] = useState(null)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [editingCompany, setEditingCompany] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    company_id: '',
    company_name: '',
    is_reference: false,
    premiums: []
  })

  useEffect(() => {
    async function init() {
      const [loaded, cells] = await Promise.all([
        loadCompaniesByYear(selectedYear),
        getRcaCells()
      ])
      // Filter out BNM reference company
      setCompanies(loaded.filter(c => !c.is_reference))
      setRcaCells(cells)
    }
    init()
  }, [selectedYear])

  if (!rcaCells) {
    return <div className="px-4 py-6">Se încarcă...</div>
  }

  const vehicles = rcaCells.vehicles
  const territories = rcaCells.territories
  const personCategories = rcaCells.person_categories

  const handleAddCompany = () => {
    setFormData({
      company_id: '',
      company_name: '',
      is_reference: false,
      premiums: []
    })
    setEditingCompany(null)
    setShowAddForm(true)
  }

  const handleEditCompany = (company) => {
    setFormData({
      company_id: company.company_id,
      company_name: company.company_name,
      is_reference: company.is_reference || false,
      premiums: company.premiums || []
    })
    setEditingCompany(company.company_id)
    setShowAddForm(true)
  }

  const handleDeleteCompany = (companyId) => {
    if (window.confirm(`Sunteți sigur că doriți să ștergeți această companie pentru anul ${selectedYear}?`)) {
      deleteCompanyByYear(companyId, selectedYear)
      setCompanies(companies.filter(c => c.company_id !== companyId))
    }
  }

  const handleSaveCompany = async () => {
    if (!formData.company_id || !formData.company_name) {
      alert('Vă rugăm să completați ID-ul și numele companiei')
      return
    }

    saveCompanyByYear(formData, selectedYear)
    
    const updated = (await loadCompaniesByYear(selectedYear)).filter(c => !c.is_reference)
    setCompanies(updated)
    setShowAddForm(false)
    setEditingCompany(null)
    setFormData({
      company_id: '',
      company_name: '',
      is_reference: false,
      premiums: []
    })
  }

  const handlePremiumChange = (cellId, value) => {
    const numValue = parseFloat(value) || 0
    const updatedPremiums = [...formData.premiums]
    const existingIndex = updatedPremiums.findIndex(p => p.cell_id === cellId)
    
    if (existingIndex >= 0) {
      updatedPremiums[existingIndex].value = numValue
    } else {
      updatedPremiums.push({ cell_id: cellId, value: numValue })
    }
    
    setFormData({ ...formData, premiums: updatedPremiums })
  }

  const getPremiumValue = (cellId) => {
    const premium = formData.premiums.find(p => p.cell_id === cellId)
    return premium?.value || ''
  }

  const generateAllCellIds = () => {
    const cellIds = []
    vehicles.forEach(vehicle => {
      territories.forEach(territory => {
        personCategories.forEach(category => {
          // Skip invalid combinations
          if ((vehicle.vehicle_id === 'A7' || vehicle.vehicle_id === 'B4') && category.person_type !== 'juridica') {
            return
          }
          cellIds.push(`${vehicle.vehicle_id}_${territory.territory_id}_${category.person_category_id}`)
        })
      })
    })
    return cellIds
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Setări - Gestionare Companii</h2>
          <button
            onClick={handleAddCompany}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Adaugă companie nouă
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                An pentru gestionare
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={2025}>2025 (Date curente)</option>
                <option value={2026}>2026 (Date noi)</option>
              </select>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Gestionezi datele pentru:</div>
              <div className="text-xl font-bold text-blue-700">{selectedYear}</div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedYear === 2025 ? 'Date curente colectate' : 'Date noi (de mâine)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {editingCompany ? 'Editează companie' : 'Adaugă companie nouă'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Aceste date vor fi salvate pentru anul <span className="font-bold text-blue-600">{selectedYear}</span>
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Companie *
              </label>
              <input
                type="text"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                disabled={!!editingCompany}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="ex: company_1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume Companie *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="ex: Compania de Asigurări XYZ"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_reference"
                checked={formData.is_reference}
                onChange={(e) => setFormData({ ...formData, is_reference: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_reference" className="ml-2 block text-sm text-gray-700">
                Companie de referință
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Prime (opțional - puteți completa mai târziu)</h4>
            <p className="text-sm text-gray-600 mb-4">
              Puteți importa datele dintr-un fișier JSON sau le puteți completa manual. 
              Formatul este: <code className="bg-gray-100 px-1 rounded">{"{cell_id: 'A1_CH_PF_AGE_LT23_EXP_LT2', value: 3901.23}"}</code>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Import JSON
              </label>
              <textarea
                rows="4"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-xs"
                placeholder='[{"cell_id": "A1_CH_PF_AGE_LT23_EXP_LT2", "value": 3901.23}, ...]'
                onBlur={(e) => {
                  try {
                    const imported = JSON.parse(e.target.value)
                    if (Array.isArray(imported)) {
                      setFormData({ ...formData, premiums: imported })
                      e.target.value = ''
                    }
                  } catch (err) {
                    // Ignore invalid JSON
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveCompany}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Salvează
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingCompany(null)
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Companii pentru {selectedYear}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length} {companies.length === 1 ? 'companie' : 'companii'} {companies.length === 1 ? 'înregistrată' : 'înregistrate'}
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nume Companie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Număr Prime
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  Nu există companii pentru {selectedYear}. Adăugați una nouă sau încărcați datele din fișier pe pagina principală.
                </td>
              </tr>
            ) : (
              companies.map(company => (
                <tr key={company.company_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {company.company_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.premiums?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.company_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Settings

