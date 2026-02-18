import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { schoolsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const SchoolSettings = () => {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    termFormat: 'Numeric',
    hasAttendanceModule: false
  })

  const { data: schoolData, isLoading, error } = useQuery(
    ['school', schoolId],
    () => schoolsService.getSchool(schoolId),
    {
      retry: 1,
      enabled: !!schoolId,
      onError: (err) => {
        logger.error('Failed to fetch school:', err)
        toast.error('Failed to load school details')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => schoolsService.updateSchool(schoolId, data),
    {
      onSuccess: () => {
        handleSuccess('School updated successfully')
        queryClient.invalidateQueries(['school', schoolId])
        queryClient.invalidateQueries('schools')
      },
      onError: handleError
    }
  )

  const school = schoolData?.data ?? {}

  useEffect(() => {
    if (school && Object.keys(school).length > 0) {
      setFormData({
        name: school.name ?? school.Name ?? '',
        address: school.address ?? school.Address ?? '',
        phoneNumber: school.phone ?? school.phoneNumber ?? school.PhoneNumber ?? '',
        email: school.email ?? school.Email ?? '',
        termFormat: school.termFormat ?? school.TermFormat ?? 'Numeric',
        hasAttendanceModule: school.hasAttendanceModule ?? school.HasAttendanceModule ?? false
      })
    }
  }, [school])

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      name: formData.name,
      address: formData.address || null,
      phoneNumber: formData.phoneNumber || null,
      email: formData.email || null,
      termFormat: formData.termFormat || null,
      hasAttendanceModule: formData.hasAttendanceModule
    })
  }

  if (isLoading) return <Loading />

  if (error || !school?.id) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            School not found or you don&apos;t have permission to access it.
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/school')}>
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
            Back to School Management
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/settings/school')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          School Settings
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">School Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Central High"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="school@example.com"
              />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, city, state"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Term Format</label>
            <select
              className="form-input"
              value={formData.termFormat}
              onChange={(e) => setFormData({ ...formData, termFormat: e.target.value })}
            >
              <option value="Numeric">Numeric (First Term, Second Term, Third Term)</option>
              <option value="Seasonal">Seasonal (Summer, Spring, Autumn)</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="hasAttendanceModule"
              checked={formData.hasAttendanceModule}
              onChange={(e) => setFormData({ ...formData, hasAttendanceModule: e.target.checked })}
              style={{ width: '1.125rem', height: '1.125rem' }}
            />
            <label htmlFor="hasAttendanceModule" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Enable attendance module (daily attendance for students)
            </label>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/settings/school')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SchoolSettings
