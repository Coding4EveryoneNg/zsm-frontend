import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { feeStructuresService, commonService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FeeStructures = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ schoolId: '', name: '', description: '', amount: '', feeType: 'Yearly' })

  const { data: feeData, isLoading } = useQuery(
    ['fee-structures'],
    () => feeStructuresService.getFeeStructures()
  )
  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown()
  )

  const createMutation = useMutation(
    (data) => feeStructuresService.createFeeStructure(data),
    {
      onSuccess: () => {
        toast.success('Fee structure created successfully')
        queryClient.invalidateQueries(['fee-structures'])
        setShowForm(false)
        setFormData({ schoolId: '', name: '', description: '', amount: '', feeType: 'Yearly' })
      },
      onError: (err) => {
        toast.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to create')
      },
    }
  )

  const feeStructures = feeData?.data ?? []
  const schools = schoolsData?.data ?? []
  const defaultSchoolId = schools?.[0]?.id || schools?.[0]?.Id || ''

  const handleSubmit = (e) => {
    e.preventDefault()
    const schoolId = formData.schoolId || defaultSchoolId
    if (!schoolId) {
      toast.error('Please select a school')
      return
    }
    if (!formData.name?.trim()) {
      toast.error('Name is required')
      return
    }
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valid amount is required')
      return
    }
    createMutation.mutate({
      schoolId,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      amount,
      feeType: formData.feeType || 'Yearly',
    })
  }

  if (isLoading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/settings')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={18} />
          Back to Settings
        </button>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          Add Fee Structure
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Fee Structures</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Configure what students pay for: school fees (per class), books, and other charges. These appear in the payment dropdown when adding payments.
        </p>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Add New Fee</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">School</label>
                <select
                  className="form-input"
                  value={formData.schoolId || defaultSchoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                >
                  <option value="">Select school</option>
                  {Array.isArray(schools) && schools.map((s) => (
                    <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Fee Type (Period)</label>
                <select
                  className="form-input"
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                >
                  <option value="Yearly">Yearly</option>
                  <option value="Termly">Termly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="OneTime">One Time</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Name (e.g. School Fees - Primary 1A, Mathematics Book, Sports Levy)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tuition Fee, Library Fee, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Description (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Annual tuition for Primary 1"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>
                <Save size={16} /> {createMutation.isLoading ? 'Saving...' : 'Add Fee'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Fee Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(feeStructures) && feeStructures.length > 0 ? (
                feeStructures.map((fs) => (
                  <tr key={fs.id || fs.Id}>
                    <td>{fs.name || fs.Name}</td>
                    <td>{(fs.amount ?? fs.Amount)?.toLocaleString?.() ?? fs.amount ?? fs.Amount}</td>
                    <td>{fs.feeType || fs.FeeType || 'Yearly'}</td>
                    <td>
                      <span className={`badge ${(fs.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(fs.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No fee structures yet. Add school fees, book prices, and other charges above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FeeStructures
