import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { feeStructuresService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Plus, Save, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FeeStructures = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', amount: '', feeType: 'Yearly' })
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

  const updateMutation = useMutation(
    ({ id, data }) => feeStructuresService.updateFeeStructure(id, data),
    {
      onSuccess: () => {
        toast.success('Fee structure updated successfully')
        queryClient.invalidateQueries(['fee-structures'])
        setEditingId(null)
      },
      onError: (err) => {
        toast.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to update')
      },
    }
  )

  const feeStructures = feeData?.data ?? []
  const schools = schoolsData?.data ?? []
  const defaultSchoolId = schools?.[0]?.id || schools?.[0]?.Id || ''
  const isPrincipal = user?.role?.toLowerCase() === 'principal'

  const handleSubmit = (e) => {
    e.preventDefault()
    const schoolId = isPrincipal ? '' : (formData.schoolId || defaultSchoolId)
    if (!isPrincipal && !schoolId) {
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
      schoolId: isPrincipal ? undefined : (schoolId || defaultSchoolId),
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      amount,
      feeType: formData.feeType || 'Yearly',
    })
  }

  const handleEdit = (fs) => {
    setEditingId(fs.id || fs.Id)
    setEditForm({
      name: fs.name || fs.Name || '',
      description: fs.description || fs.Description || '',
      amount: String(fs.amount ?? fs.Amount ?? 0),
      feeType: fs.feeType || fs.FeeType || 'Yearly',
    })
  }

  const handleUpdateSubmit = (e) => {
    e.preventDefault()
    const amount = parseFloat(editForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valid amount is required')
      return
    }
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editForm.name.trim(),
        description: editForm.description?.trim() || null,
        amount,
        feeType: editForm.feeType || 'Yearly',
        isActive: true,
      },
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
          Set School Fees / Add Fee
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>School Fees &amp; Charges</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Set school fees per class, book prices, and other charges. These appear when adding payments. All students in a class pay the school fee you set.
        </p>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Set School Fees / Add Fee</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {!isPrincipal && (
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
              )}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(feeStructures) && feeStructures.length > 0 ? (
                feeStructures.map((fs) => (
                  <tr key={fs.id || fs.Id}>
                    {editingId === (fs.id || fs.Id) ? (
                      <>
                        <td colSpan="5">
                          <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                              <label className="form-label">Name</label>
                              <input
                                type="text"
                                className="form-input"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="form-label">Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="form-label">Fee Type</label>
                              <select
                                className="form-input"
                                value={editForm.feeType}
                                onChange={(e) => setEditForm({ ...editForm, feeType: e.target.value })}
                              >
                                <option value="Yearly">Yearly</option>
                                <option value="Termly">Termly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="OneTime">One Time</option>
                              </select>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={updateMutation.isLoading}>
                              <Save size={14} /> Save
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </form>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{fs.name || fs.Name}</td>
                        <td>{(fs.amount ?? fs.Amount)?.toLocaleString?.() ?? fs.amount ?? fs.Amount}</td>
                        <td>{fs.feeType || fs.FeeType || 'Yearly'}</td>
                        <td>
                          <span className={`badge ${(fs.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                            {(fs.isActive !== false) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {(fs.isActive !== false) && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                              onClick={() => handleEdit(fs)}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No fee structures yet. Click &quot;Add Fee Structure&quot; to set school fees, book prices, and other charges.
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
