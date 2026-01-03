import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { assignmentsService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { FileText, CheckCircle, Clock, User, BookOpen, Filter, X, Star } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'

const TeacherSubmissions = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // all, submitted, graded, pending
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [selectedSubmissions, setSelectedSubmissions] = useState([])
  const [bulkScore, setBulkScore] = useState('')
  const [bulkFeedback, setBulkFeedback] = useState('')
  const [showBulkGrade, setShowBulkGrade] = useState(false)
  const pageSize = 20

  // Fetch classes and students for filters
  const { data: classesData } = useQuery('classes-dropdown', () => commonService.getClassesDropdown())
  const { data: studentsData } = useQuery(
    ['students-dropdown', selectedClassId],
    () => commonService.getStudentsDropdown({ classId: selectedClassId || undefined }),
    { enabled: !!selectedClassId }
  )

  const { data, isLoading, error } = useQuery(
    ['teacherSubmissions', page, filter, selectedClassId, selectedStudentId],
    () => {
      const params = {
        page,
        pageSize,
        status: filter === 'all' ? undefined : filter,
        classId: selectedClassId || undefined,
        studentId: selectedStudentId || undefined
      }
      return assignmentsService.getTeacherSubmissions(params)
    },
    { keepPreviousData: true }
  )

  const gradeMutation = useMutation(
    ({ submissionId, data }) => assignmentsService.gradeAssignment(submissionId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacherSubmissions')
        setGradingSubmission(null)
        setScore('')
        setFeedback('')
        handleSuccess('Assignment graded successfully!')
      },
      onError: (err) => {
        handleError(err, 'Failed to grade assignment')
      }
    }
  )

  const bulkGradeMutation = useMutation(
    async ({ submissions, score, feedback }) => {
      const results = []
      for (const submission of submissions) {
        try {
          const submissionId = submission.submissionId || submission.SubmissionId
          const assignmentId = submission.assignmentId || submission.AssignmentId
          await assignmentsService.gradeAssignment(submissionId, {
            assignmentId,
            score: parseFloat(score),
            comments: feedback
          })
          results.push({ success: true, submissionId })
        } catch (err) {
          results.push({ success: false, submissionId: submission.submissionId || submission.SubmissionId, error: err })
        }
      }
      return results
    },
    {
      onSuccess: (results) => {
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length
        queryClient.invalidateQueries('teacherSubmissions')
        setSelectedSubmissions([])
        setShowBulkGrade(false)
        setBulkScore('')
        setBulkFeedback('')
        if (failCount > 0) {
          toast.warning(`Bulk grading completed: ${successCount} successful, ${failCount} failed`)
        } else {
          handleSuccess(`Bulk grading completed: ${successCount} assignments graded successfully`)
        }
      },
      onError: (err) => {
        handleError(err, 'Some assignments failed to grade. Please check individual submissions.')
      }
    }
  )

  const handleGrade = (submission) => {
    setGradingSubmission(submission)
    setScore(submission.score || submission.Score || '')
    setFeedback(submission.feedback || submission.Feedback || '')
  }

  const handleSubmitGrade = (e) => {
    e.preventDefault()
    if (!gradingSubmission) return

    const submissionId = gradingSubmission.submissionId || gradingSubmission.SubmissionId
    const assignmentId = gradingSubmission.assignmentId || gradingSubmission.AssignmentId

    if (!submissionId || !assignmentId) {
      toast.error('Invalid submission data')
      return
    }

    const scoreValue = parseFloat(score)
    if (isNaN(scoreValue) || scoreValue < 0) {
      toast.error('Please enter a valid score')
      return
    }

    gradeMutation.mutate({
      submissionId,
      data: {
        assignmentId,
        score: scoreValue,
        comments: feedback
      }
    })
  }

  if (isLoading) return <Loading />

  const submissions = data?.data?.items || data?.data?.Items || []
  const totalCount = data?.data?.totalCount || data?.data?.TotalCount || 0
  const totalPages = data?.data?.totalPages || data?.data?.TotalPages || 0
  const classes = classesData?.data || []
  const students = studentsData?.data || []

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower === 'graded') {
      return <span className="badge badge-success">Graded</span>
    } else if (statusLower === 'submitted') {
      return <span className="badge badge-warning">Submitted</span>
    } else {
      return <span className="badge badge-secondary">Pending</span>
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Assignment Submissions
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Review and grade student assignment submissions
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--info-light)', border: '1px solid var(--info)' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>
              {selectedSubmissions.length} submission{selectedSubmissions.length > 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowBulkGrade(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Star size={16} />
                Bulk Grade
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedSubmissions([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Grading Modal */}
      {showBulkGrade && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowBulkGrade(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Bulk Grade {selectedSubmissions.length} Submissions</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowBulkGrade(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => {
                e.preventDefault()
                const scoreValue = parseFloat(bulkScore)
                if (isNaN(scoreValue) || scoreValue < 0) {
                  toast.error('Please enter a valid score')
                  return
                }
                bulkGradeMutation.mutate({
                  submissions: selectedSubmissions,
                  score: scoreValue,
                  feedback: bulkFeedback
                })
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Score (Percentage) *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={bulkScore}
                    onChange={(e) => setBulkScore(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Feedback (will be applied to all selected submissions)
                  </label>
                  <textarea
                    className="form-control"
                    value={bulkFeedback}
                    onChange={(e) => setBulkFeedback(e.target.value)}
                    rows="4"
                    placeholder="Enter feedback for all submissions..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowBulkGrade(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={bulkGradeMutation.isLoading}>
                    {bulkGradeMutation.isLoading ? 'Grading...' : `Grade ${selectedSubmissions.length} Submissions`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Filter size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Filters
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                className="form-control"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Class
              </label>
              <select
                className="form-control"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setSelectedStudentId('')
                  setPage(1)
                }}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id || cls.Id} value={cls.id || cls.Id}>
                    {cls.name || cls.Name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                Student
              </label>
              <select
                className="form-control"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value)
                  setPage(1)
                }}
                disabled={!selectedClassId}
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id || student.Id} value={student.id || student.Id}>
                    {student.name || student.Name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSubmission && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setGradingSubmission(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Grade Assignment</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setGradingSubmission(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {gradingSubmission.assignmentTitle || gradingSubmission.AssignmentTitle}
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Student: {gradingSubmission.studentName || gradingSubmission.StudentName}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Submitted: {format(new Date(gradingSubmission.submittedAt || gradingSubmission.SubmittedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              {(gradingSubmission.submissionText || gradingSubmission.SubmissionText) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Submission:</h4>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                    {gradingSubmission.submissionText || gradingSubmission.SubmissionText}
                  </div>
                </div>
              )}

              {(gradingSubmission.filePaths || gradingSubmission.FilePaths) && (gradingSubmission.filePaths?.length > 0 || gradingSubmission.FilePaths?.length > 0) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Attached Files:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(gradingSubmission.filePaths || gradingSubmission.FilePaths || []).map((filePath, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} />
                        <span style={{ flex: 1 }}>{filePath.split('/').pop()}</span>
                        <a href={filePath} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitGrade}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Score (Percentage) *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Feedback
                  </label>
                  <textarea
                    className="form-control"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="4"
                    placeholder="Enter feedback for the student..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setGradingSubmission(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={gradeMutation.isLoading}>
                    {gradeMutation.isLoading ? 'Grading...' : 'Submit Grade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {error ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading submissions</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      ) : submissions.length > 0 ? (
        <>
          <div className="card">
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubmissions(submissions.filter(s => {
                              const status = s.status || s.Status || 'Pending'
                              return status.toLowerCase() !== 'graded'
                            }))
                          } else {
                            setSelectedSubmissions([])
                          }
                        }}
                      />
                    </th>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const submissionId = submission.submissionId || submission.SubmissionId
                    const assignmentId = submission.assignmentId || submission.AssignmentId
                    const studentName = submission.studentName || submission.StudentName || 'Unknown'
                    const assignmentTitle = submission.assignmentTitle || submission.AssignmentTitle || 'Untitled'
                    const submittedAt = submission.submittedAt || submission.SubmittedAt
                    const status = submission.status || submission.Status || 'Pending'
                    const score = submission.score || submission.Score
                    const isGraded = status.toLowerCase() === 'graded'
                    const isSelected = selectedSubmissions.some(s => 
                      (s.submissionId || s.SubmissionId) === submissionId
                    )

                    return (
                      <tr key={submissionId}>
                        <td>
                          {!isGraded && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubmissions([...selectedSubmissions, submission])
                                } else {
                                  setSelectedSubmissions(selectedSubmissions.filter(s => 
                                    (s.submissionId || s.SubmissionId) !== submissionId
                                  ))
                                }
                              }}
                            />
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} color="var(--text-muted)" />
                            {studentName}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ cursor: 'pointer', color: 'var(--primary)' }}
                            onClick={() => navigate(`/assignments/${assignmentId}`)}
                          >
                            {assignmentTitle}
                          </div>
                        </td>
                        <td>
                          {submittedAt ? format(new Date(submittedAt), 'MMM dd, yyyy HH:mm') : 'Not submitted'}
                        </td>
                        <td>{getStatusBadge(status)}</td>
                        <td>
                          {score !== null && score !== undefined ? (
                            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{score}%</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/assignments/${assignmentId}?submissionId=${submissionId}`)}
                            >
                              View
                            </button>
                            {!isGraded && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleGrade(submission)}
                              >
                                <Star size={14} style={{ marginRight: '0.25rem' }} />
                                Grade
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

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
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">No submissions found</p>
            <p className="empty-state-subtext">
              {filter !== 'all' ? `No ${filter} submissions available` : 'No assignment submissions available at this time'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherSubmissions

