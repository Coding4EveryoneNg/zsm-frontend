import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { principalsService, userManagementService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, XCircle, Edit2, Power } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'
import ConfirmDialog from '../../components/Common/ConfirmDialog'

const PrincipalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['principal', id],
    () => principalsService.getPrincipal(id),
    { enabled: !!id }
  )

  const updateMutation = useMutation(
    (formData) => principalsService.updatePrincipal(id, formData),
    {
      onSuccess: (response) => {
        const body = response?.data
        const success = body?.success ?? response?.success
        if (success) {
          toast.success(body?.message || 'Principal updated successfully')
          setIsEditing(false)
          queryClient.invalidateQueries(['principal', id])
        } else {
          toast.error(body?.errors?.[0] || body?.message || 'Failed to update principal')
        }
      },
      onError: (err) => handleError(err, 'Failed to update principal'),
    }
  )

  const toggleMutation = useMutation(
    (userId) => userManagementService.toggleUserStatus(userId),
    {
      onSuccess: (response) => {
        const body = response?.data
        const success = body?.success ?? response?.success
        if (success) {
          toast.success(body?.message || 'Status updated successfully')
          setToggleConfirm(null)
          queryClient.invalidateQueries(['principal', id])
          queryClient.invalidateQueries('principals')
        } else {
          toast.error(body?.errors?.[0] || body?.message || 'Failed to update status')
        }
      },
      onError: (err) => {
        handleError(err, 'Failed to update status')
        setToggleConfirm(null)
      },
    }
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate('/principals')} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={18} />
          Back to Principals
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading principal details</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const res = data?.data
  const principal = res?.data ?? res ?? {}

  if (!principal.id && !principal.Id) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate('/principals')} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={18} />
          Back to Principals
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Principal not found</p>
          </div>
        </div>
      </div>
    )
  }

  const startEdit = () => {
    reset({
      firstName: principal.firstName ?? principal.FirstName ?? '',
      lastName: principal.lastName ?? principal.LastName ?? '',
      phoneNumber: principal.phoneNumber ?? principal.PhoneNumber ?? '',
      isActive: principal.isActive !== false,
    })
    setIsEditing(true)
  }

  const onSubmit = (formData) => {
    updateMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber || null,
      isActive: formData.isActive,
    })
  }

  const handleToggle = () => {
    const userId = principal.userId ?? principal.UserId
    if (userId) toggleMutation.mutate(userId)
  }

  const firstName = principal.firstName ?? principal.FirstName ?? ''
  const lastName = principal.lastName ?? principal.LastName ?? ''
  const email = principal.email ?? principal.Email ?? ''
  const phoneNumber = principal.phoneNumber ?? principal.PhoneNumber ?? ''
  const schoolName = principal.schoolName ?? principal.SchoolName ?? ''
  const isActive = principal.isActive !== false
  const employeeId = principal.employeeId ?? principal.EmployeeId ?? ''

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/principals')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={18} />
          Back to Principals
        </button>
        {!isEditing && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={16} />
              Edit
            </button>
            <button
              className={isActive ? 'btn btn-warning' : 'btn btn-info'}
              onClick={() => setToggleConfirm(principal)}
              disabled={toggleMutation.isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Power size={16} />
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} />
            Principal Details
          </h2>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label className="form-label">First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className="form-input"
                  placeholder="First name"
                />
                {errors.firstName && (
                  <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="form-label">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  className="form-input"
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input {...register('phoneNumber')} className="form-input" placeholder="+1234567890" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  {...register('isActive')}
                  id="isActive"
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={updateMutation.isLoading}>
                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Name</label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 'bold' }}>
                {firstName} {lastName}
              </p>
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} />
                Email
              </label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{email || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label">School</label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{schoolName || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label">Employee ID</label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{employeeId || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} />
                Phone Number
              </label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label">Status</label>
              <div>
                {isActive ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={14} />
                    Active
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <XCircle size={14} />
                    Inactive
                  </span>
                )}
              </div>
            </div>
            {(principal.createdAt || principal.CreatedAt) && (
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} />
                  Created At
                </label>
                <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                  {new Date(principal.createdAt || principal.CreatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {(principal.lastLoginAt || principal.LastLoginAt) && (
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} />
                  Last Login
                </label>
                <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                  {new Date(principal.lastLoginAt || principal.LastLoginAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={handleToggle}
        title={toggleConfirm && (toggleConfirm.isActive !== false) ? 'Deactivate Principal' : 'Activate Principal'}
        message={toggleConfirm ? `Are you sure you want to ${(toggleConfirm.isActive !== false) ? 'deactivate' : 'activate'} ${toggleConfirm.firstName ?? toggleConfirm.FirstName} ${toggleConfirm.lastName ?? toggleConfirm.LastName}?` : ''}
        confirmText={toggleConfirm && (toggleConfirm.isActive !== false) ? 'Deactivate' : 'Activate'}
        variant={toggleConfirm && (toggleConfirm.isActive !== false) ? 'warning' : 'info'}
      />
    </div>
  )
}

export default PrincipalDetails
