import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { examinationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  BookOpen, 
  User, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

const ExaminationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, error } = useQuery(
    ['examination', id],
    () => examinationsService.getExamination(id),
    { enabled: !!id }
  )

  const submitForApprovalMutation = useMutation(
    () => examinationsService.submitForApproval(id),
    {
      onSuccess: () => {
        handleSuccess('Examination submitted for approval.')
        queryClient.invalidateQueries(['examination', id])
      },
      onError: (err) => handleError(err, 'Failed to submit for approval')
    }
  )

  const approveMutation = useMutation(
    () => examinationsService.approveExamination(id),
    {
      onSuccess: () => {
        handleSuccess('Examination approved.')
        queryClient.invalidateQueries(['examination', id])
      },
      onError: (err) => handleError(err, 'Failed to approve examination')
    }
  )

  const rejectMutation = useMutation(
    (reason) => examinationsService.rejectExamination(id, reason),
    {
      onSuccess: () => {
        handleSuccess('Examination rejected.')
        setRejectModalOpen(false)
        setRejectReason('')
        queryClient.invalidateQueries(['examination', id])
      },
      onError: (err) => handleError(err, 'Failed to reject examination')
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">Error loading examination details</p>
            <p className="empty-state-subtext">
              {error?.response?.data?.message || 
               error?.response?.data?.errors?.[0] || 
               error?.message || 
               'Please try again later'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/examinations')}>
              Back to Examinations
            </button>
          </div>
        </div>
      </div>
    )
  }

  const exam = data?.data || data
  if (!exam) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Examination not found</p>
            <button className="btn btn-primary" onClick={() => navigate('/examinations')}>
              Back to Examinations
            </button>
          </div>
        </div>
      </div>
    )
  }

  const questions = exam.questions || exam.Questions || []
  const isStudent = (user?.role ?? '').toString() === 'Student'
  const isTeacher = (user?.role ?? '').toString().toLowerCase() === 'teacher'
  const isAdminOrPrincipal = ['Admin', 'Principal'].includes((user?.role ?? '').toString())
  const status = (exam.status || exam.Status || '').toString()
  const isDraft = status.toLowerCase() === 'draft'
  const isAwaitingApproval = status === 'AwaitingApproval' || status === 'Pending'

  const getStatusBadge = () => {
    switch (status) {
      case 'Approved':
        return (
          <span className="badge badge-success">
            <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
            Approved
          </span>
        )
      case 'Draft':
        return (
          <span className="badge badge-warning">
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Draft
          </span>
        )
      case 'AwaitingApproval':
      case 'Pending':
        return (
          <span className="badge badge-info">
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Pending Approval
          </span>
        )
      case 'Rejected':
        return (
          <span className="badge badge-danger">
            <XCircle size={14} style={{ marginRight: '0.25rem' }} />
            Rejected
          </span>
        )
      default:
        return (
          <span className="badge badge-outline">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/examinations')}
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Back to Examinations
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ClipboardList size={24} color="var(--primary)" />
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {exam.title || exam.Title || 'Examination'}
              </h1>
              {getStatusBadge()}
            </div>
            {exam.description || exam.Description ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {exam.description || exam.Description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Examination Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Subject
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {exam.subjectName || exam.SubjectName || 'N/A'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Class
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {exam.className || exam.ClassName || 'N/A'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Duration
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {exam.durationMinutes || exam.DurationMinutes || 0} minutes
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Total Marks
            </label>
            <span style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.125rem' }}>
              {exam.totalMarks || exam.TotalMarks || 0}
            </span>
          </div>

          {exam.startDate || exam.StartDate ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Start Date
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(exam.startDate || exam.StartDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : null}

          {exam.endDate || exam.EndDate ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                End Date
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(exam.endDate || exam.EndDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : null}

          {exam.createdByTeacherName || exam.CreatedByTeacherName ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Created By
              </label>
              <span style={{ color: 'var(--text-primary)' }}>
                {exam.createdByTeacherName || exam.CreatedByTeacherName}
              </span>
            </div>
          ) : null}

          {/* Audit: Approved by and date (when Approved) */}
          {status === 'Approved' && (exam.approvedBy || exam.ApprovedBy || exam.approvedAt || exam.ApprovedAt) ? (
            <>
              {exam.approvedBy || exam.ApprovedBy ? (
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                    Approved By (User ID)
                  </label>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {exam.approvedBy || exam.ApprovedBy}
                  </span>
                </div>
              ) : null}
              {exam.approvedAt || exam.ApprovedAt ? (
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                    Approved Date
                  </label>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {new Date(exam.approvedAt || exam.ApprovedAt).toLocaleString()}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* Questions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Questions ({questions.length})</h2>
        </div>
        {questions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {questions.map((question, index) => {
              const questionId = question.id || question.Id
              const questionType = question.questionType || question.QuestionType
              const options = question.options || question.Options
              let parsedOptions = []
              
              try {
                if (options) {
                  parsedOptions = typeof options === 'string' ? JSON.parse(options) : options
                }
              } catch (e) {
                console.error('Failed to parse options:', e)
              }

              return (
                <div key={questionId || index} style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      Question {index + 1}
                      {question.isRequired || question.IsRequired ? (
                        <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>*</span>
                      ) : null}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: 'var(--bg-primary)', 
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                      }}>
                        {question.marks || question.Marks || 0} marks
                      </span>
                      <span className="badge badge-outline">
                        {questionType || 'N/A'}
                      </span>
                      <span className="badge badge-outline">
                        {question.section || question.Section || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                    {question.questionText || question.QuestionText}
                  </p>

                  {question.instructions || question.Instructions ? (
                    <p style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.875rem', 
                      fontStyle: 'italic',
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '4px'
                    }}>
                      {question.instructions || question.Instructions}
                    </p>
                  ) : null}

                  {parsedOptions.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Options:</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {parsedOptions.map((option, optIndex) => (
                          <li key={optIndex} style={{ 
                            padding: '0.5rem', 
                            marginBottom: '0.25rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '4px'
                          }}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show correct answer only for non-students */}
                  {!isStudent && (question.correctAnswer || question.CorrectAnswer) && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem', 
                      backgroundColor: 'var(--success-light)', 
                      border: '1px solid var(--success)',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Correct Answer:
                      </p>
                      <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                        {question.correctAnswer || question.CorrectAnswer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-text">No questions found</p>
          </div>
        )}
      </div>

      {/* Action Buttons for Teacher: Submit for Approval (Draft only) */}
      {isTeacher && isDraft && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/examinations')}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => submitForApprovalMutation.mutate()}
              disabled={submitForApprovalMutation.isLoading}
            >
              <Send size={16} style={{ marginRight: '0.5rem' }} />
              {submitForApprovalMutation.isLoading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons for Admin/Principal: Approve or Reject (AwaitingApproval only) */}
      {isAdminOrPrincipal && isAwaitingApproval && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/examinations')}
            >
              Back
            </button>
            <button
              className="btn btn-outline btn-danger"
              onClick={() => setRejectModalOpen(true)}
              disabled={rejectMutation.isLoading}
            >
              <ThumbsDown size={16} style={{ marginRight: '0.5rem' }} />
              Reject
            </button>
            <button
              className="btn btn-primary"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isLoading}
            >
              <ThumbsUp size={16} style={{ marginRight: '0.5rem' }} />
              {approveMutation.isLoading ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !rejectMutation.isLoading && setRejectModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Reject Examination</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Please provide a reason for rejection (required for audit).
            </p>
            <textarea
              className="form-input"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              style={{ marginBottom: '1rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejectMutation.isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={!rejectReason.trim() || rejectMutation.isLoading}
              >
                {rejectMutation.isLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons for Students */}
      {isStudent && (() => {
        const canTakeExam = () => {
          // Check if exam is approved
          const status = exam.status || exam.Status
          if (status !== 'Approved') return false

          // Check submission status - should be Available or InProgress
          const submissionStatus = exam.submissionStatus || exam.SubmissionStatus
          if (submissionStatus === 'Submitted' || submissionStatus === 'AutoSubmitted') return false

          // Check date range
          const now = new Date()
          const startDate = exam.startDate || exam.StartDate ? new Date(exam.startDate || exam.StartDate) : null
          const endDate = exam.endDate || exam.EndDate ? new Date(exam.endDate || exam.EndDate) : null

          if (startDate && now < startDate) return false
          if (endDate && now > endDate) return false

          // Exam is available or in progress
          return submissionStatus === 'Available' || submissionStatus === 'InProgress' || submissionStatus === null
        }

        const submissionStatus = exam.submissionStatus || exam.SubmissionStatus
        const buttonText = submissionStatus === 'InProgress' ? 'Continue Examination' : 'Take Examination'

        return canTakeExam() ? (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/examinations')}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/examinations/${id}/take`)}
              >
                {buttonText}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/examinations')}
              >
                Back
              </button>
            </div>
          </div>
        )
      })()}

      {/* Back button for Teacher/Admin/Principal when no action buttons shown */}
      {!isStudent && ((isTeacher && !isDraft) || (isAdminOrPrincipal && !isAwaitingApproval)) && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/examinations')}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExaminationDetails
