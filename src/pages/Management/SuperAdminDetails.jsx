import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { superAdminsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, XCircle, Key, Power } from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import { useState } from 'react'
import toast from 'react-hot-toast'

const SuperAdminDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [toggleConfirm, setToggleConfirm] = useState(null)
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['superAdmin', id],
    () => superAdminsService.getSuperAdmin(id),
    { enabled: !!id }
  )

  const toggleStatusMutation = useMutation(
    (id) => superAdminsService.toggleStatus(id),
    {
      onSuccess: () => {
        toast.success('Super Admin status updated successfully')
        queryClient.invalidateQueries(['superAdmin', id])
        queryClient.invalidateQueries('superAdmins')
        setToggleConfirm(null)
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Failed to update status')
        setToggleConfirm(null)
      }
    }
  )

  const resetPasswordMutation = useMutation(
    (id) => superAdminsService.resetPassword(id),
    {
      onSuccess: () => {
        toast.success('Password reset email sent successfully')
        queryClient.invalidateQueries(['superAdmin', id])
        setResetPasswordConfirm(null)
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Failed to reset password')
        setResetPasswordConfirm(null)
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/superadmins')}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back to Super Admins
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading super admin details</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const admin = data?.data || {}

  if (!admin.id && !admin.Id) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/superadmins')}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back to Super Admins
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Super Admin not found</p>
          </div>
        </div>
      </div>
    )
  }

  const handleToggleStatus = () => {
    if (toggleConfirm) {
      toggleStatusMutation.mutate(toggleConfirm.id || toggleConfirm.Id)
    }
  }

  const handleResetPassword = () => {
    if (resetPasswordConfirm) {
      resetPasswordMutation.mutate(resetPasswordConfirm.id || resetPasswordConfirm.Id)
    }
  }

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/superadmins')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} />
        Back to Super Admins
      </button>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} />
            Super Admin Details
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-warning"
              onClick={() => setToggleConfirm(admin)}
              disabled={toggleStatusMutation.isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Power size={16} />
              {admin.isActive !== false ? 'Deactivate' : 'Activate'}
            </button>
            <button
              className="btn btn-info"
              onClick={() => setResetPasswordConfirm(admin)}
              disabled={resetPasswordMutation.isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Key size={16} />
              Reset Password
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 'bold' }}>
              {admin.firstName || admin.FirstName} {admin.lastName || admin.LastName}
            </p>
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} />
              Email
            </label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {admin.email || admin.Email || 'N/A'}
            </p>
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} />
              Phone Number
            </label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {admin.phoneNumber || admin.PhoneNumber || 'N/A'}
            </p>
          </div>

          <div>
            <label className="form-label">Status</label>
            <div>
              {(admin.isActive !== false) ? (
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

          {(admin.createdAt || admin.CreatedAt) && (
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                Created At
              </label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                {new Date(admin.createdAt || admin.CreatedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {(admin.lastLoginAt || admin.LastLoginAt) && (
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                Last Login
              </label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                {new Date(admin.lastLoginAt || admin.LastLoginAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {admin.createdBy && (
            <div>
              <label className="form-label">Created By</label>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                {admin.createdBy || 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Status Confirmation */}
      {toggleConfirm && (
        <ConfirmDialog
          isOpen={!!toggleConfirm}
          onClose={() => setToggleConfirm(null)}
          onConfirm={handleToggleStatus}
          title={toggleConfirm.isActive !== false ? 'Deactivate Super Admin' : 'Activate Super Admin'}
          message={`Are you sure you want to ${toggleConfirm.isActive !== false ? 'deactivate' : 'activate'} ${toggleConfirm.firstName || toggleConfirm.FirstName} ${toggleConfirm.lastName || toggleConfirm.LastName}?`}
          confirmText={toggleConfirm.isActive !== false ? 'Deactivate' : 'Activate'}
          variant={toggleConfirm.isActive !== false ? 'warning' : 'info'}
        />
      )}

      {/* Reset Password Confirmation */}
      {resetPasswordConfirm && (
        <ConfirmDialog
          isOpen={!!resetPasswordConfirm}
          onClose={() => setResetPasswordConfirm(null)}
          onConfirm={handleResetPassword}
          title="Reset Password"
          message={`Are you sure you want to reset the password for ${resetPasswordConfirm.firstName || resetPasswordConfirm.FirstName} ${resetPasswordConfirm.lastName || resetPasswordConfirm.LastName}? A new password will be sent to their email.`}
          confirmText="Reset Password"
          variant="info"
        />
      )}
    </div>
  )
}

export default SuperAdminDetails

