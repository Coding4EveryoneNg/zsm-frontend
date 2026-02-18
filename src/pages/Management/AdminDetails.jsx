import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminsService, userManagementService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, XCircle, Power } from 'lucide-react'

const AdminDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['admin', id],
    () => adminsService.getAdmin(id),
    { enabled: !!id }
  )

  const toggleMutation = useMutation(
    (userId) => userManagementService.toggleUserStatus(userId),
    {
      onSuccess: (res) => {
        const success = res?.data?.success ?? res?.success
        if (success) {
          toast.success(res?.data?.message || 'Status updated successfully')
          queryClient.invalidateQueries(['admin', id])
          queryClient.invalidateQueries('admins')
          setToggleConfirm(null)
        } else {
          toast.error(res?.data?.errors?.[0] || res?.data?.message || 'Failed to update status')
        }
      },
      onError: (err) => {
        handleError(err, 'Failed to update status')
        setToggleConfirm(null)
      },
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admins')}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back to Admins
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading admin details</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const admin = data?.data?.admin || data?.data || {}

  if (!admin.id && !admin.Id) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admins')}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back to Admins
        </button>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Admin not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/admins')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} />
        Back to Admins
      </button>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} />
            Admin Details
          </h2>
          <button
            className="btn btn-warning"
            onClick={() => setToggleConfirm(admin)}
            disabled={toggleMutation.isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Power size={16} />
            {(admin.isActive !== false) ? 'Deactivate' : 'Activate'}
          </button>
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
        </div>
      </div>

      {toggleConfirm && (
        <ConfirmDialog
          isOpen={!!toggleConfirm}
          onClose={() => setToggleConfirm(null)}
          onConfirm={() => {
            const userId = toggleConfirm.id || toggleConfirm.Id
            if (userId) toggleMutation.mutate(userId)
          }}
          title={(toggleConfirm.isActive !== false) ? 'Deactivate Admin' : 'Activate Admin'}
          message={`Are you sure you want to ${(toggleConfirm.isActive !== false) ? 'deactivate' : 'activate'} ${toggleConfirm.firstName || toggleConfirm.FirstName} ${toggleConfirm.lastName || toggleConfirm.LastName}?`}
          confirmText={(toggleConfirm.isActive !== false) ? 'Deactivate' : 'Activate'}
          variant={(toggleConfirm.isActive !== false) ? 'warning' : 'info'}
        />
      )}
    </div>
  )
}

export default AdminDetails

