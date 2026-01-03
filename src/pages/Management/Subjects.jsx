import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { subjectsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Plus, Search, BookOpen } from 'lucide-react'

const Subjects = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery(
    ['subjects', page, pageSize],
    () => subjectsService.getSubjects({ page, pageSize })
  )

  if (isLoading) return <Loading />

  const subjects = data?.data?.subjects || data?.data || []
  const pagination = data?.data?.pagination || {}

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter((subject) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (subject.name || subject.Name || '').toLowerCase().includes(search) ||
      (subject.code || subject.Code || '').toLowerCase().includes(search)
    )
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Subjects</h1>
        <button className="btn btn-primary" onClick={() => navigate('/subjects/create')}>
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search subjects..."
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
                <th>Subject Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id || subject.Id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={16} color="var(--primary)" />
                        <span>{subject.name || subject.Name}</span>
                      </div>
                    </td>
                    <td>{subject.code || subject.Code || 'N/A'}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subject.description || subject.Description || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${(subject.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(subject.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => navigate(`/subjects/${subject.id || subject.Id}`)}
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
                      <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <p className="empty-state-text">No subjects found</p>
                      <p className="empty-state-subtext">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first subject'}
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

export default Subjects
