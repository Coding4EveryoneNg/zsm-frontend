import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { tenantsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import { Plus, Search, Building2, Edit, Eye, CheckCircle, XCircle, Power, PowerOff } from 'lucide-react'
import toast from 'react-hot-toast'

const TenantManagement = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['tenants', page, pageSize],
    () => tenantsService.getTenants({ page, pageSize }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch tenants:', err)
      }
    }
  )

  const createMutation = useMutation(
    (data) => tenantsService.createTenant(data),
    {
      onSuccess: () => {
        handleSuccess('Tenant created successfully')
        queryClient.invalidateQueries('tenants')
        setShowCreateModal(false)
      },
      onError: handleError
    }
  )

  const toggleStatusMutation = useMutation(
    (tenantId) => tenantsService.toggleStatus(tenantId),
    {
      onSuccess: (res) => {
        const msg = res?.data?.message || (res?.data?.data?.isActive ? 'Tenant activated.' : 'Tenant deactivated.')
        handleSuccess(msg)
        queryClient.invalidateQueries('tenants')
        if (selectedTenant && res?.data?.data?.isActive !== undefined) {
          setSelectedTenant(prev => prev ? { ...prev, isActive: res.data.data.isActive } : null)
        }
      },
      onError: handleError
    }
  )

  const tenants = data?.data?.tenants || []
  const pagination = data?.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  const filteredTenants = tenants.filter(tenant => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      tenant.name?.toLowerCase().includes(search) ||
      tenant.subdomain?.toLowerCase().includes(search) ||
      tenant.customDomain?.toLowerCase().includes(search)
    )
  })

  const handleCreate = (formData) => {
    createMutation.mutate(formData)
  }

  const handleViewDetails = async (tenantId) => {
    try {
      const response = await tenantsService.getTenant(tenantId)
      setSelectedTenant(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      handleError(error, 'Failed to load tenant details')
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Tenant Management
        </h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          Create Tenant
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            Error loading tenants: {error?.message || 'Please refresh the page'}
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
            placeholder="Search tenants by name, subdomain, or domain..."
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

      {/* Tenants Table */}
      <div className="card">
        {filteredTenants.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subdomain</th>
                  <th>Custom Domain</th>
                  <th>Schools</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} color="var(--primary-yellow)" />
                        <strong>{tenant.name}</strong>
                      </div>
                    </td>
                    <td>{tenant.subdomain}</td>
                    <td>{tenant.customDomain || 'N/A'}</td>
                    <td>{tenant.schoolCount || 0}</td>
                    <td>{tenant.userCount || 0}</td>
                    <td>
                      <span className={`badge ${tenant.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {tenant.isActive ? (
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
                    <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className={`btn btn-sm ${tenant.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => toggleStatusMutation.mutate(tenant.id)}
                          disabled={toggleStatusMutation.isLoading}
                          title={tenant.isActive ? 'Deactivate tenant (users will not be able to log in)' : 'Activate tenant'}
                        >
                          {tenant.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                          {tenant.isActive ? ' Deactivate' : ' Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(tenant.id)}
                          title="View Details"
                        >
                          <Eye size={16} />
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
            <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">
              {searchTerm ? 'No tenants found matching your search' : 'No tenants found'}
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

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isLoading}
        />
      )}

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <TenantDetailsModal
          tenant={selectedTenant}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedTenant(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            // Delete functionality can be added when API endpoint is available
            toast.error('Delete functionality not yet available')
            setDeleteConfirm(null)
          }}
          title="Delete Tenant"
          message={`Are you sure you want to delete tenant "${deleteConfirm.name}"? This action cannot be undone.`}
          variant="danger"
        />
      )}
    </div>
  )
}

// Create Tenant Modal Component
const CreateTenantModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    accentColor: '#FF6347',
    logoUrl: '',
    footerText: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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
        style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h2 className="card-title">Create New Tenant</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Tenant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Subdomain *
              </label>
              <input
                type="text"
                required
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="e.g., schoolname"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="e.g., school.example.com"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Accent Color
                </label>
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Logo URL (Optional)
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Footer Text (Optional)
              </label>
              <textarea
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Tenant Details Modal Component
const TenantDetailsModal = ({ tenant, onClose }) => {
  if (!tenant) return null

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
        style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h2 className="card-title">Tenant Details</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Basic Information</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <strong>Name:</strong> {tenant.name}
                </div>
                <div>
                  <strong>Subdomain:</strong> {tenant.subdomain}
                </div>
                {tenant.customDomain && (
                  <div>
                    <strong>Custom Domain:</strong> {tenant.customDomain}
                  </div>
                )}
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`badge ${tenant.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <strong>Created:</strong> {new Date(tenant.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {tenant.configuration && (
              <div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Configuration</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {tenant.configuration.primaryColor && (
                    <div>
                      <strong>Primary Color:</strong>{' '}
                      <span style={{ 
                        display: 'inline-block', 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: tenant.configuration.primaryColor,
                        borderRadius: '4px',
                        verticalAlign: 'middle',
                        marginLeft: '0.5rem'
                      }}></span>
                      {' '}{tenant.configuration.primaryColor}
                    </div>
                  )}
                  {tenant.configuration.secondaryColor && (
                    <div>
                      <strong>Secondary Color:</strong>{' '}
                      <span style={{ 
                        display: 'inline-block', 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: tenant.configuration.secondaryColor,
                        borderRadius: '4px',
                        verticalAlign: 'middle',
                        marginLeft: '0.5rem'
                      }}></span>
                      {' '}{tenant.configuration.secondaryColor}
                    </div>
                  )}
                  {tenant.configuration.accentColor && (
                    <div>
                      <strong>Accent Color:</strong>{' '}
                      <span style={{ 
                        display: 'inline-block', 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: tenant.configuration.accentColor,
                        borderRadius: '4px',
                        verticalAlign: 'middle',
                        marginLeft: '0.5rem'
                      }}></span>
                      {' '}{tenant.configuration.accentColor}
                    </div>
                  )}
                  {tenant.configuration.logoUrl && (
                    <div>
                      <strong>Logo URL:</strong>{' '}
                      <a href={tenant.configuration.logoUrl} target="_blank" rel="noopener noreferrer">
                        {tenant.configuration.logoUrl}
                      </a>
                    </div>
                  )}
                  {tenant.configuration.footerText && (
                    <div>
                      <strong>Footer Text:</strong> {tenant.configuration.footerText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantManagement
