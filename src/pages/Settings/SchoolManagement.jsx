import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { schoolsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import { Search, Building2, Users, GraduationCap, School, Eye, Power, PowerOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const SchoolManagement = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const { data, isLoading, error } = useQuery(
    ['schools', page, pageSize],
    () => schoolsService.getSchools({ page, pageSize }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch schools:', err)
      }
    }
  )

  const toggleStatusMutation = useMutation(
    (schoolId) => schoolsService.toggleStatus(schoolId),
    {
      onSuccess: (res) => {
        const msg = res?.data?.message || (res?.data?.data?.isActive ? 'School activated.' : 'School deactivated.')
        handleSuccess(msg)
        queryClient.invalidateQueries('schools')
      },
      onError: handleError
    }
  )

  const schools = data?.data?.schools || []
  const pagination = data?.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  const filteredSchools = schools.filter(school => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      school.name?.toLowerCase().includes(search) ||
      school.address?.toLowerCase().includes(search) ||
      school.email?.toLowerCase().includes(search) ||
      school.phoneNumber?.toLowerCase().includes(search)
    )
  })

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          School Management
        </h1>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            Error loading schools: {error?.message || 'Please refresh the page'}
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
            placeholder="Search schools by name, address, email, or phone..."
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

      {/* Schools Table */}
      <div className="card">
        {filteredSchools.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Students</th>
                  <th>Teachers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} color="var(--primary-yellow)" />
                        <strong>{school.name}</strong>
                      </div>
                    </td>
                    <td>{school.address || 'N/A'}</td>
                    <td>{school.email || 'N/A'}</td>
                    <td>{school.phoneNumber || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} style={{ opacity: 0.6 }} />
                        {school.studentCount || school.totalStudents || 0}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <GraduationCap size={16} style={{ opacity: 0.6 }} />
                        {school.teacherCount || school.totalTeachers || 0}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${school.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                        {school.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isSuperAdmin && (
                          <button
                            className={`btn btn-sm ${school.isActive !== false ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => toggleStatusMutation.mutate(school.id)}
                            disabled={toggleStatusMutation.isLoading}
                            title={school.isActive !== false ? 'Deactivate school (users will not be able to log in)' : 'Activate school'}
                          >
                            {school.isActive !== false ? <PowerOff size={16} /> : <Power size={16} />}
                            {school.isActive !== false ? ' Deactivate' : ' Activate'}
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            if (school.id) {
                              navigate(`/settings/school/${school.id}`)
                            }
                          }}
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
            <School size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">
              {searchTerm ? 'No schools found matching your search' : 'No schools found'}
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
    </div>
  )
}

export default SchoolManagement
