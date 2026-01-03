import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { adminsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Plus, Search } from 'lucide-react'

const Admins = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery(
    ['admins', page, pageSize],
    () => adminsService.getAdmins({ page, pageSize })
  )

  if (isLoading) return <Loading />

  const admins = data?.data?.admins || data?.data || []
  const pagination = data?.data?.pagination || {}

  // Filter admins based on search term
  const filteredAdmins = admins.filter((admin) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (admin.firstName || '').toLowerCase().includes(search) ||
      (admin.lastName || '').toLowerCase().includes(search) ||
      (admin.email || '').toLowerCase().includes(search)
    )
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Admins</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admins/create')}>
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id || admin.Id}>
                    <td>{admin.firstName || admin.FirstName} {admin.lastName || admin.LastName}</td>
                    <td>{admin.email || admin.Email}</td>
                    <td>{admin.phoneNumber || admin.PhoneNumber || 'N/A'}</td>
                    <td>
                      <span className={`badge ${(admin.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(admin.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => navigate(`/admins/${admin.id || admin.Id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <p className="empty-state-text">No admins found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admins

