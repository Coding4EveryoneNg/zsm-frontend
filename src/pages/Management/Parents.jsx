import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { userManagementService, commonService, dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { Users, ChevronRight } from 'lucide-react'

const Parents = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  const isAdmin = user?.role === 'Admin'

  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: !isAdmin }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : (principalOrAdminSchoolId || user?.schoolId || user?.SchoolId)

  const { data, isLoading } = useQuery(
    ['parents-by-school', effectiveSchoolId],
    () => userManagementService.getParentsBySchool(effectiveSchoolId),
    { enabled: !!effectiveSchoolId }
  )

  if (isLoading) return <Loading />

  const parents = data?.data ?? data?.Data ?? data ?? []

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Parents</h1>
        {isAdmin && schoolsList?.length > 0 && (
          <div style={{ minWidth: '200px' }}>
            <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
            <select
              className="form-control"
              value={selectedSchoolId || effectiveSchoolId || ''}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              <option value="">Select school</option>
              {schoolsList.map((s) => (
                <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card">
        {parents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No parents found</p>
            <p className="empty-state-subtext">
              Parents are created when adding students. You can link a parent to a student from the Create Student page.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/students/create')}>
              Add Student (with Parent)
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Children</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id ?? parent.Id}>
                    <td>
                      {(parent.firstName ?? parent.FirstName) ?? ''} {(parent.lastName ?? parent.LastName) ?? ''}
                    </td>
                    <td>{parent.email ?? parent.Email ?? '—'}</td>
                    <td>{parent.phoneNumber ?? parent.PhoneNumber ?? '—'}</td>
                    <td>
                      {(parent.students ?? parent.Students ?? []).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {(parent.students ?? parent.Students).map((s) => (
                            <span key={s.id ?? s.Id} style={{ fontSize: '0.875rem' }}>
                              {(s.firstName ?? s.FirstName) ?? ''} {(s.lastName ?? s.LastName) ?? ''}
                              {(s.studentId ?? s.StudentId) ? ` (${s.studentId ?? s.StudentId})` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {(parent.students ?? parent.Students ?? []).length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            const first = (parent.students ?? parent.Students)[0]
                            const sid = first?.id ?? first?.Id
                            if (sid) navigate(`/students/${sid}`)
                          }}
                        >
                          View child <ChevronRight size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Parents
