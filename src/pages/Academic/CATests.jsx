import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { caTestsService, commonService, dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { ClipboardList, Calendar, BookOpen, Plus, Clock } from 'lucide-react'

const CATests = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const pageSize = 20

  const isAdmin = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'admin'
  const { data: schoolsData } = useQuery('schools-dropdown', () => commonService.getSchoolsDropdown(), { enabled: isAdmin })
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isAdmin }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : null

  const isTeacher = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'teacher'
  const isStudent = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'student'
  const isPrincipal = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'principal'
  const queryEnabled = isTeacher || isStudent || isPrincipal || (isAdmin && (!!effectiveSchoolId || schoolsList?.length > 0))

  const { data, isLoading, error } = useQuery(
    ['catests', page, effectiveSchoolId],
    () => caTestsService.getCATests({ page, pageSize, schoolId: effectiveSchoolId }),
    { keepPreviousData: true, enabled: queryEnabled }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading CA Tests</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const catests = data?.data?.catests ?? data?.data?.CATests ?? data?.catests ?? data?.CATests ?? (Array.isArray(data?.data) ? data.data : []) ?? []
  const totalCount = data?.data?.totalCount ?? data?.totalCount ?? catests.length
  const totalPages = data?.data?.totalPages ?? data?.totalPages ?? Math.ceil(Math.max(1, totalCount) / pageSize)

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>CA Tests</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setPage(1) }}
              >
                {schoolsList.map((s) => (
                  <option key={s.id ?? s.Id} value={s.id ?? s.Id}>{s.name ?? s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {(user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'teacher' && (
            <button className="btn btn-primary" onClick={() => navigate('/catests/create')}>
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              Create CA Test
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {catests.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p className="empty-state-text">No CA Tests</p>
            <p className="empty-state-subtext">
              {(user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'teacher'
                ? 'Create a CA Test to assign to your class.'
                : 'No CA Tests have been created yet.'}
            </p>
            {(user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'teacher' && (
              <button className="btn btn-primary" onClick={() => navigate('/catests/create')} style={{ marginTop: '1rem' }}>
                Create CA Test
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Term</th>
                    <th>Status</th>
                    <th>Max Marks</th>
                    <th>Due Date</th>
                    <th>Graded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catests.map((ct) => {
                    const ctStatus = (ct.status ?? ct.Status ?? 'Draft').toString()
                    const ctStatusLower = ctStatus.toLowerCase()
                    const isDraft = ctStatusLower === 'draft'
                    const isAwaitingApproval = ctStatusLower === 'awaitingapproval'
                    const isRejected = ctStatusLower === 'rejected'
                    const statusBadge = isDraft
                      ? <span className="badge badge-warning"><Clock size={12} style={{ marginRight: '0.25rem' }} />Draft</span>
                      : isAwaitingApproval
                      ? <span className="badge badge-warning">Awaiting Approval</span>
                      : isRejected
                      ? <span className="badge badge-danger">Rejected</span>
                      : <span className="badge badge-success">Active</span>
                    return (
                    <tr key={ct.id ?? ct.Id}>
                      <td>
                        <strong>{ct.title ?? ct.Title}</strong>
                      </td>
                      <td>{ct.subjectName ?? ct.SubjectName}</td>
                      <td>{ct.className ?? ct.ClassName}</td>
                      <td>{ct.termName ?? ct.TermName}</td>
                      <td>{statusBadge}</td>
                      <td>{ct.maxMarks ?? ct.MaxMarks}</td>
                      <td>
                        <span style={{ display: 'block', fontSize: '0.875rem' }}>
                          {ct.dueDate ? new Date(ct.dueDate).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {ct.gradedCount ?? ct.GradedCount ?? 0} / {ct.submissionCount ?? ct.SubmissionCount ?? 0}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/catests/${ct.id ?? ct.Id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--text-secondary)', margin: '0 0.5rem', alignSelf: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CATests
