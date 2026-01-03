import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { classesService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Plus, Search, School, Users } from 'lucide-react'

const Classes = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery(
    ['classes', page, pageSize],
    () => classesService.getClasses({ page, pageSize })
  )

  if (isLoading) return <Loading />

  const classes = data?.data?.classes || data?.data || []
  const pagination = data?.data?.pagination || {}

  // Filter classes based on search term
  const filteredClasses = classes.filter((cls) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (cls.name || cls.Name || '').toLowerCase().includes(search) ||
      (cls.section || cls.Section || '').toLowerCase().includes(search)
    )
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Classes</h1>
        <button className="btn btn-primary" onClick={() => navigate('/classes/create')}>
          <Plus size={18} />
          Add Class
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search classes..."
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
                <th>Class Name</th>
                <th>Section</th>
                <th>Capacity</th>
                <th>Current Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <tr key={cls.id || cls.Id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <School size={16} color="var(--primary)" />
                        <span>{cls.name || cls.Name}</span>
                      </div>
                    </td>
                    <td>{cls.section || cls.Section || 'N/A'}</td>
                    <td>{cls.capacity || cls.Capacity || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={14} />
                        <span>{cls.currentStudentCount || cls.CurrentStudentCount || 0}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${(cls.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(cls.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => navigate(`/classes/${cls.id || cls.Id}`)}
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
                      <School size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p className="empty-state-text">No classes found</p>
                      <p className="empty-state-subtext">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first class'}
                      </p>
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

export default Classes

