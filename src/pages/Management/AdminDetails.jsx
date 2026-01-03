import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { adminsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react'

const AdminDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery(
    ['admin', id],
    () => adminsService.getAdmin(id),
    { enabled: !!id }
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
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} />
            Admin Details
          </h2>
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
    </div>
  )
}

export default AdminDetails

