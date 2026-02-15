import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { caTestsService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'

const CATestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [editingScores, setEditingScores] = useState({})

  const { data, isLoading, isError, error } = useQuery(
    ['catest', id],
    () => caTestsService.getCATest(id),
    { enabled: !!id }
  )

  const submitMutation = useMutation(
    () => caTestsService.submitCATest(id),
    {
      onSuccess: () => {
        handleSuccess('CA Test submitted and assigned to students.')
        queryClient.invalidateQueries(['catest', id])
      },
      onError: (err) => handleError(err, 'Failed to submit CA Test')
    }
  )

  const gradeMutation = useMutation(
    ({ submissionId, score, gradeLetter }) => caTestsService.gradeSubmission(submissionId, { score, gradeLetter }),
    {
      onSuccess: () => {
        handleSuccess('Submission graded.')
        queryClient.invalidateQueries(['catest', id])
        setEditingScores({})
      },
      onError: (err) => handleError(err, 'Failed to grade')
    }
  )

  if (isLoading) return <Loading />

  const raw = data?.data ?? data
  const catest = raw?.id ?? raw?.Id ? raw : null

  if (isError || !catest) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/catests')} style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="card-title">CA Test</h1>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)' }}>{error?.message || 'CA Test not found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const title = catest.title ?? catest.Title
  const description = catest.description ?? catest.Description
  const maxMarks = catest.maxMarks ?? catest.MaxMarks ?? 100
  const dueDate = catest.dueDate ?? catest.DueDate
  const subjectName = catest.subjectName ?? catest.SubjectName
  const className = catest.className ?? catest.ClassName
  const termName = catest.termName ?? catest.TermName
  const createdBy = catest.createdByTeacherName ?? catest.CreatedByTeacherName
  const status = (catest.status ?? catest.Status ?? 'Active').toString()
  const isDraft = status.toLowerCase() === 'draft'
  const isTeacher = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'teacher'
  const submissions = catest.submissions ?? catest.Submissions ?? []

  const handleGrade = (sub) => {
    const score = parseFloat(editingScores[sub.id ?? sub.Id])
    if (isNaN(score) || score < 0) {
      toast.error('Enter a valid score')
      return
    }
    if (score > maxMarks) {
      toast.error(`Score cannot exceed ${maxMarks}`)
      return
    }
    gradeMutation.mutate({
      submissionId: sub.id ?? sub.Id,
      score,
      gradeLetter: null
    })
  }

  const getGradeLetter = (pct) => {
    if (pct == null) return ''
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    if (pct >= 40) return 'D'
    return 'F'
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/catests')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="card-title">{title}</h1>
        </div>
        <div className="card-body">
          <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Subject</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{subjectName}</p>
              </div>
              <div>
                <label className="form-label">Class</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{className}</p>
              </div>
              <div>
                <label className="form-label">Term</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{termName}</p>
              </div>
              <div>
                <label className="form-label">Max Marks</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{maxMarks}</p>
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <label className="form-label">Created by</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{createdBy}</p>
              </div>
              <div>
                <label className="form-label">Status</label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                  <span className={`badge ${isDraft ? 'badge-outline' : 'badge-success'}`}>{status}</span>
                </p>
              </div>
            </div>
            {isDraft && isTeacher && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isLoading}
                >
                  <Send size={18} style={{ marginRight: '0.5rem' }} />
                  {submitMutation.isLoading ? 'Submitting...' : 'Submit & Assign to Students'}
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Submitting will assign this CA Test to all students in the class.
                </p>
              </div>
            )}
            {description && (
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">Description</label>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Submissions</h3>
          {submissions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              {isDraft ? 'Submit the CA Test to assign it to all students in the class.' : 'No submissions yet.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const sid = sub.id ?? sub.Id
                    const isGraded = sub.isGraded ?? sub.IsGraded
                    const isEditing = editingScores[sid] !== undefined
                    const currentScore = isEditing ? editingScores[sid] : (sub.score ?? sub.Score ?? '')
                    return (
                      <tr key={sid}>
                        <td>{sub.studentName ?? sub.StudentName}</td>
                        <td>
                          <span className={`badge ${isGraded ? 'badge-success' : 'badge-outline'}`}>
                            {isGraded ? 'Graded' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={maxMarks}
                              className="form-input"
                              style={{ width: '80px' }}
                              value={currentScore}
                              onChange={(e) => setEditingScores((s) => ({ ...s, [sid]: e.target.value }))}
                            />
                          ) : (
                            sub.score ?? sub.Score ?? '—'
                          )}
                        </td>
                        <td>{sub.percentage ?? sub.Percentage != null ? `${sub.percentage ?? sub.Percentage}%` : '—'}</td>
                        <td>{sub.gradeLetter ?? sub.GradeLetter ?? (sub.percentage != null ? getGradeLetter(sub.percentage) : '—')}</td>
                        <td>
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleGrade(sub)}
                                disabled={gradeMutation.isLoading}
                              >
                                <Save size={14} /> Save
                              </button>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setEditingScores((s) => { const n = { ...s }; delete n[sid]; return n })}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => setEditingScores((s) => ({ ...s, [sid]: sub.score ?? sub.Score ?? '' }))}
                            >
                              {isGraded ? 'Edit' : 'Grade'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CATestDetails
