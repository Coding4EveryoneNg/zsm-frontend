import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { assignmentsService, commonService, dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { FileText, Clock, CheckCircle, XCircle, Calendar, User, BookOpen, PlayCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const Assignments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // all, pending, submitted
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const pageSize = 20

  const isAdmin = user?.role === 'Admin'

  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
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

  // Get studentId from URL params for parent view
  const urlParams = new URLSearchParams(window.location.search)
  const studentId = urlParams.get('studentId')

  const isTeacher = user?.role === 'Teacher'
  const isAdminOrPrincipal = ['Admin', 'Principal'].includes(user?.role ?? '')
  const publishMutation = useMutation(
    (assignmentId) => assignmentsService.publishAssignment(assignmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assignments')
        toast.success('Assignment approved and published.')
      },
      onError: (err) => toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0] || 'Failed to approve assignment')
    }
  )
  const { data, isLoading, error } = useQuery(
    ['assignments', page, user?.role, studentId, effectiveSchoolId],
    () => {
      const params = { page, pageSize }
      if (user?.role === 'Parent') {
        if (studentId) params.studentId = studentId
        return assignmentsService.getParentAssignments(params)
      }
      if (isAdmin && effectiveSchoolId) params.schoolId = effectiveSchoolId
      return assignmentsService.getAssignments(params)
    },
    { keepPreviousData: true, enabled: user?.role === 'Parent' ? !!user : (isTeacher ? !!user : (!isAdmin || !!effectiveSchoolId)) }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading assignments</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  // API returns: { success: true, data: PaginatedResponse<AssignmentListItemResponse>, errors: [] }
  // PaginatedResponse has: { items: [], currentPage, pageSize, totalCount, totalPages }
  const paginatedData = data?.data ?? data
  const assignments = paginatedData?.items ?? paginatedData?.Items ?? paginatedData?.assignments ?? paginatedData?.Assignments ?? (Array.isArray(data?.data) ? data.data : [])
  const totalCount = paginatedData?.totalCount ?? paginatedData?.TotalCount ?? (Array.isArray(assignments) ? assignments.length : 0)
  const totalPages = paginatedData?.totalPages ?? paginatedData?.TotalPages ?? (Math.ceil(totalCount / pageSize) || 1)

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : filter === 'pending'
    ? assignments.filter(a => !(a.isSubmitted || a.IsSubmitted))
    : assignments.filter(a => a.isSubmitted || a.IsSubmitted)

  const getStatusBadge = (assignment) => {
    const status = (assignment.status ?? assignment.Status ?? '').toString().toLowerCase()
    if (status === 'draft') {
      return (
        <span className="badge badge-warning">
          <Clock size={14} style={{ marginRight: '0.25rem' }} />
          Draft
        </span>
      )
    }
    const isSubmitted = assignment.isSubmitted || assignment.IsSubmitted || false
    if (isSubmitted) {
      return (
        <span className="badge badge-success">
          <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
          Submitted
        </span>
      )
    }
    const dueDate = new Date(assignment.dueDate || assignment.DueDate)
    const now = new Date()
    if (dueDate < now) {
      return (
        <span className="badge badge-danger">
          <XCircle size={14} style={{ marginRight: '0.25rem' }} />
          Overdue
        </span>
      )
    }
    return (
      <span className="badge badge-warning">
        <Clock size={14} style={{ marginRight: '0.25rem' }} />
        Pending
      </span>
    )
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Assignments
          </h1>
          {user?.role === 'Parent' && studentId && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Viewing assignments for selected child
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setPage(1) }}
              >
                <option value="">Select school</option>
                {schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {user?.role === 'Teacher' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/assignments/create')}
          >
            Create Assignment
          </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {user?.role === 'Student' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All Assignments
          </button>
          <button
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`btn ${filter === 'submitted' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('submitted')}
          >
            Submitted
          </button>
        </div>
      )}

      {/* Assignments List */}
      {filteredAssignments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAssignments.map((assignment) => {
            const isSubmitted = assignment.isSubmitted || assignment.IsSubmitted || false
            const dueDate = assignment.dueDate || assignment.DueDate
            const assignmentId = assignment.id || assignment.Id
            return (
            <div
              key={assignmentId}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: `4px solid ${isSubmitted ? 'var(--success)' : (dueDate && new Date(dueDate) < new Date() ? 'var(--danger)' : 'var(--warning)')}`
              }}
              onClick={() => navigate(`/assignments/${assignmentId}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileText size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                      {assignment.title || assignment.Title || 'Untitled Assignment'}
                    </h3>
                    {getStatusBadge(assignment)}
                  </div>
                  
                  {(assignment.description || assignment.Description) && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {(() => {
                        const desc = assignment.description || assignment.Description || ''
                        return desc.length > 150 ? `${desc.substring(0, 150)}...` : desc
                      })()}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {(assignment.subjectName || assignment.SubjectName) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BookOpen size={14} />
                        <span>{assignment.subjectName || assignment.SubjectName}</span>
                      </div>
                    )}
                    {(assignment.teacherName || assignment.TeacherName) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={14} />
                        <span>{assignment.teacherName || assignment.TeacherName}</span>
                      </div>
                    )}
                    {(assignment.className || assignment.ClassName) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>Class: {assignment.className || assignment.ClassName}</span>
                      </div>
                    )}
                    {(assignment.dueDate || assignment.DueDate) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>Due: {new Date(assignment.dueDate || assignment.DueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {(assignment.maxMarks || assignment.MaxMarks) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>Max Marks: {assignment.maxMarks || assignment.MaxMarks}</span>
                      </div>
                    )}
                    {(assignment.submittedAt || assignment.SubmittedAt) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={14} />
                        <span>Submitted: {new Date(assignment.submittedAt || assignment.SubmittedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                {user?.role === 'Student' && !isSubmitted && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/assignments/${assignmentId}`)
                    }}
                  >
                    <PlayCircle size={18} style={{ marginRight: '0.5rem' }} />
                    Start assignment
                  </button>
                )}
                {isAdminOrPrincipal && (assignment.status ?? assignment.Status ?? '').toString().toLowerCase() === 'draft' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      publishMutation.mutate(assignmentId)
                    }}
                    disabled={publishMutation.isLoading}
                  >
                    <Check size={18} style={{ marginRight: '0.5rem' }} />
                    {publishMutation.isLoading ? 'Approving...' : 'Approve'}
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No assignments found</p>
            <p className="empty-state-subtext">
              {filter === 'pending' 
                ? 'You have no pending assignments' 
                : filter === 'submitted'
                ? 'You have no submitted assignments'
                : 'No assignments available at this time'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Assignments
