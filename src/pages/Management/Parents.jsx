import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { userManagementService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import { Users, ChevronRight, Power } from 'lucide-react'

const Parents = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const roleLower = String(user?.role ?? user?.Role ?? '').toLowerCase()
  const isAdmin = roleLower === 'admin'
  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

  const { data, isLoading } = useQuery(
    ['parents-by-school', effectiveSchoolId],
    () => userManagementService.getParentsBySchool(effectiveSchoolId),
    { enabled: !!effectiveSchoolId }
  )

  const toggleMutation = useMutation(
    (userId) => userManagementService.toggleUserStatus(userId),
    {
      onSuccess: (res) => {
        const success = res?.data?.success ?? res?.success
        if (success) {
          toast.success(res?.data?.message || 'Status updated successfully')
          queryClient.invalidateQueries(['parents-by-school', effectiveSchoolId])
          setToggleConfirm(null)
        } else {
          toast.error(res?.data?.errors?.[0] || res?.data?.message || 'Failed to update status')
        }
      },
      onError: (err) => {
        handleError(err, 'Failed to update status')
        setToggleConfirm(null)
      },
    }
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
                  <th>Status</th>
                  <th>Children</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => {
                  const isActive = parent.isActive !== false
                  const userId = parent.userId ?? parent.UserId
                  return (
                  <tr key={parent.id ?? parent.Id}>
                    <td>
                      {(parent.firstName ?? parent.FirstName) ?? ''} {(parent.lastName ?? parent.LastName) ?? ''}
                    </td>
                    <td>{parent.email ?? parent.Email ?? '—'}</td>
                    <td>{parent.phoneNumber ?? parent.PhoneNumber ?? '—'}</td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {userId && (
                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? 'btn-warning' : 'btn-info'}`}
                            onClick={() => setToggleConfirm({ ...parent, userId, isActive })}
                            disabled={toggleMutation.isLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Power size={14} />
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toggleConfirm && (
        <ConfirmDialog
          isOpen={!!toggleConfirm}
          onClose={() => setToggleConfirm(null)}
          onConfirm={() => toggleMutation.mutate(toggleConfirm.userId)}
          title={toggleConfirm.isActive ? 'Deactivate Parent' : 'Activate Parent'}
          message={`Are you sure you want to ${toggleConfirm.isActive ? 'deactivate' : 'activate'} ${(toggleConfirm.firstName ?? toggleConfirm.FirstName) ?? ''} ${(toggleConfirm.lastName ?? toggleConfirm.LastName) ?? ''}?`}
          confirmText={toggleConfirm.isActive ? 'Deactivate' : 'Activate'}
          variant={toggleConfirm.isActive ? 'warning' : 'info'}
        />
      )}
    </div>
  )
}

export default Parents
