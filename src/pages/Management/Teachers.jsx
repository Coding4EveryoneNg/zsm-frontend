import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { teachersService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import { Plus, Search, Download } from 'lucide-react'

const Teachers = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const isAdmin = user?.role === 'Admin'
  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    setPage(1)
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

  const { data, isLoading } = useQuery(
    ['teachers', page, pageSize, effectiveSchoolId],
    () => {
      const params = { page, pageSize }
      if (isAdmin && effectiveSchoolId) params.schoolId = effectiveSchoolId
      return teachersService.getTeachers(params)
    },
    { enabled: !isAdmin || !!effectiveSchoolId }
  )

  if (isLoading) return <Loading />

  const teachers = data?.data?.teachers ?? data?.data?.Teachers ?? []
  const totalPages = data?.data?.totalPages ?? data?.data?.TotalPages ?? 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Teachers</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => handleSchoolChange(e.target.value)}
                disabled={switchSchoolMutation.isLoading}
              >
                <option value="">Select school</option>
                {schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/teachers/create')}>
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.employeeId ?? teacher.EmployeeId}</td>
                  <td>{teacher.firstName ?? teacher.FirstName} {teacher.lastName ?? teacher.LastName}</td>
                  <td>{teacher.email ?? teacher.Email}</td>
                  <td>{teacher.department ?? teacher.Department ?? 'N/A'}</td>
                  <td>
                    <span className={`badge ${(teacher.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                      {(teacher.isActive !== false) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Teachers
