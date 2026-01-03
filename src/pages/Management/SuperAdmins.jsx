import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { superAdminsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import { Plus, Search, Users, Mail, Phone, CheckCircle, XCircle, Key, Power, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SuperAdmins = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(null)
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['superAdmins', page, pageSize],
    () => superAdminsService.getSuperAdmins({ page, pageSize }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch super admins:', err)
      }
    }
  )

  const inviteMutation = useMutation(
    (data) => superAdminsService.inviteSuperAdmin(data),
    {
      onSuccess: () => {
        handleSuccess('Super Admin invited successfully')
        queryClient.invalidateQueries('superAdmins')
        setShowInviteModal(false)
      },
      onError: handleError
    }
  )

  const toggleStatusMutation = useMutation(
    (id) => superAdminsService.toggleStatus(id),
    {
      onSuccess: () => {
        handleSuccess('Super Admin status updated successfully')
        queryClient.invalidateQueries('superAdmins')
        setToggleConfirm(null)
      },
      onError: handleError
    }
  )

  const resetPasswordMutation = useMutation(
    (id) => superAdminsService.resetPassword(id),
    {
      onSuccess: () => {
        handleSuccess('Password reset email sent successfully')
        queryClient.invalidateQueries('superAdmins')
        setResetPasswordConfirm(null)
      },
      onError: handleError
    }
  )

  const superAdmins = data?.data?.superAdmins || []
  const pagination = data?.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  const filteredSuperAdmins = superAdmins.filter(admin => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      admin.firstName?.toLowerCase().includes(search) ||
      admin.lastName?.toLowerCase().includes(search) ||
      admin.email?.toLowerCase().includes(search) ||
      admin.phoneNumber?.toLowerCase().includes(search)
    )
  })

  const handleInvite = (formData) => {
    inviteMutation.mutate(formData)
  }

  const handleToggleStatus = (admin) => {
    setToggleConfirm(admin)
  }

  const handleResetPassword = (admin) => {
    setResetPasswordConfirm(admin)
  }

  const confirmToggleStatus = () => {
    if (toggleConfirm) {
      toggleStatusMutation.mutate(toggleConfirm.id)
    }
  }

  const confirmResetPassword = () => {
    if (resetPasswordConfirm) {
      resetPasswordMutation.mutate(resetPasswordConfirm.id)
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Super Admins
        </h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowInviteModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          Invite Super Admin
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            Error loading super admins: {error?.message || 'Please refresh the page'}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} 
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.9375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Super Admins Table */}
      <div className="card">
        {filteredSuperAdmins.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuperAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="var(--primary-yellow)" />
                        <strong>{admin.firstName} {admin.lastName}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} style={{ opacity: 0.6 }} />
                        {admin.email}
                      </div>
                    </td>
                    <td>
                      {admin.phoneNumber ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={16} style={{ opacity: 0.6 }} />
                          {admin.phoneNumber}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {admin.isActive ? (
                          <>
                            <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle size={14} style={{ marginRight: '0.25rem' }} />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/superadmins/${admin.id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleToggleStatus(admin)}
                          title={admin.isActive ? 'Deactivate' : 'Activate'}
                          disabled={toggleStatusMutation.isLoading}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleResetPassword(admin)}
                          title="Reset Password"
                          disabled={resetPasswordMutation.isLoading}
                        >
                          <Key size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">
              {searchTerm ? 'No super admins found matching your search' : 'No super admins found'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>
              Page {pagination.currentPage || page} of {totalPages}
            </span>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Invite Super Admin Modal */}
      {showInviteModal && (
        <InviteSuperAdminModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
          isLoading={inviteMutation.isLoading}
        />
      )}

      {/* Toggle Status Confirmation */}
      {toggleConfirm && (
        <ConfirmDialog
          isOpen={!!toggleConfirm}
          onClose={() => setToggleConfirm(null)}
          onConfirm={confirmToggleStatus}
          title={toggleConfirm.isActive ? 'Deactivate Super Admin' : 'Activate Super Admin'}
          message={`Are you sure you want to ${toggleConfirm.isActive ? 'deactivate' : 'activate'} ${toggleConfirm.firstName} ${toggleConfirm.lastName}?`}
          confirmText={toggleConfirm.isActive ? 'Deactivate' : 'Activate'}
          variant={toggleConfirm.isActive ? 'warning' : 'info'}
        />
      )}

      {/* Reset Password Confirmation */}
      {resetPasswordConfirm && (
        <ConfirmDialog
          isOpen={!!resetPasswordConfirm}
          onClose={() => setResetPasswordConfirm(null)}
          onConfirm={confirmResetPassword}
          title="Reset Password"
          message={`Are you sure you want to reset the password for ${resetPasswordConfirm.firstName} ${resetPasswordConfirm.lastName}? A new password will be sent to their email.`}
          confirmText="Reset Password"
          variant="info"
        />
      )}
    </div>
  )
}

// Invite Super Admin Modal Component
const InviteSuperAdminModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    sendInvitationEmail: true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    // Reset form
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      sendInvitationEmail: true
    })
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: '500px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h2 className="card-title">Invite Super Admin</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1234567890"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.sendInvitationEmail}
                  onChange={(e) => setFormData({ ...formData, sendInvitationEmail: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>Send invitation email</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Inviting...' : 'Invite Super Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SuperAdmins
