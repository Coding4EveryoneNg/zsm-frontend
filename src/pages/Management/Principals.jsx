import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { principalsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Plus, Search } from 'lucide-react'

const Principals = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery(
    ['principals', page, pageSize],
    () => principalsService.getPrincipals({ page, pageSize })
  )

  if (isLoading) return <Loading />

  const res = data?.data
  const principals = res?.principals ?? res?.data ?? []
  const totalPages = res?.totalPages ?? 1

  const filteredPrincipals = Array.isArray(principals) ? principals.filter((p) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (p.firstName || p.FirstName || '').toLowerCase().includes(search) ||
      (p.lastName || p.LastName || '').toLowerCase().includes(search) ||
      (p.email || p.Email || '').toLowerCase().includes(search) ||
      (p.schoolName || p.SchoolName || '').toLowerCase().includes(search)
    )
  }) : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Manage Principals</h1>
        <button className="btn btn-primary" onClick={() => navigate('/principals/create')}>
          <Plus size={18} />
          Add Principal
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search principals by name, email, or school..."
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
                <th>School</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrincipals.length > 0 ? (
                filteredPrincipals.map((principal) => (
                  <tr key={principal.id || principal.Id}>
                    <td>{principal.firstName || principal.FirstName} {principal.lastName || principal.LastName}</td>
                    <td>{principal.email || principal.Email}</td>
                    <td>{principal.schoolName || principal.SchoolName || 'N/A'}</td>
                    <td>{principal.phoneNumber || principal.PhoneNumber || 'N/A'}</td>
                    <td>
                      <span className={`badge ${(principal.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(principal.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => navigate(`/principals/${principal.id || principal.Id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <p className="empty-state-text">No principals found</p>
                      <p className="empty-state-subtext">Add a principal to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
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

export default Principals
