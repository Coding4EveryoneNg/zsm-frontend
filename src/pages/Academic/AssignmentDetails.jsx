import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { assignmentsService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, FileText, Calendar, User, BookOpen, CheckCircle, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'

const AssignmentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState({})
  const [files, setFiles] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [checkResults, setCheckResults] = useState({}) // { [questionId]: { isCorrect, score, message } }
  const [checkingQuestionId, setCheckingQuestionId] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['assignment', id],
    () => assignmentsService.getAssignment(id),
    { enabled: !!id }
  )

  const submitMutation = useMutation(
    (formData) => assignmentsService.submitAssignment(id, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignment', id])
        queryClient.invalidateQueries('assignments')
        handleSuccess('Assignment submitted successfully!')
      },
      onError: (err) => {
        handleError(err, 'Failed to submit assignment')
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading assignment</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const assignment = data?.data || data
  if (!assignment) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Assignment not found</p>
          </div>
        </div>
      </div>
    )
  }

  const isSubmitted = assignment.submission || assignment.Submission
  const submission = assignment.submission || assignment.Submission
  const isStudent = String(user?.role ?? '').toLowerCase() === 'student'
  const canSubmit = isStudent && !isSubmitted
  const questions = Array.isArray(assignment.questions) ? assignment.questions : (Array.isArray(assignment.Questions) ? assignment.Questions : [])

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    const errors = []
    const validFiles = []

    selectedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only PDF and image files are allowed.`)
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`${file.name}: File size exceeds 10MB limit.`)
      } else {
        validFiles.push(file)
      }
    })

    setFileErrors(errors)
    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCheckAnswer = async (questionId, answerText) => {
    if (!questionId || (!answerText || !String(answerText).trim())) {
      toast.error('Enter an answer first.')
      return
    }
    setCheckingQuestionId(questionId)
    setCheckResults((prev) => ({ ...prev, [questionId]: undefined }))
    try {
      const res = await assignmentsService.checkAssignmentAnswer(id, questionId, { answerText: String(answerText).trim() })
      const payload = res?.data?.data || res?.data
      setCheckResults((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: payload?.isCorrect,
          score: payload?.score,
          message: payload?.message
        }
      }))
      if (payload?.message && !payload?.isCorrect && payload?.score === undefined) {
        toast(payload.message, { icon: 'ℹ️' })
      } else if (payload?.isCorrect !== undefined) {
        toast.success(payload.isCorrect ? `Correct! ${payload?.score != null ? `+${payload.score} marks` : ''}` : 'Incorrect. Try again.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || 'Could not check answer.'
      toast.error(msg)
      setCheckResults((prev) => ({ ...prev, [questionId]: { error: msg } }))
    } finally {
      setCheckingQuestionId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Build submission text from per-question answers (MC/TF and theory)
    const answerLines = []
    let hasAnyAnswer = false

    questions.forEach((q, index) => {
      const key = q.id || q.Id || index
      const questionType = (q.questionType || q.QuestionType || '').toString()
      const isRequired = q.isRequired || q.IsRequired
      const rawAnswer = (answers[key]?.text || '').toString().trim()

      if (isRequired && !rawAnswer) {
        hasAnyAnswer = false
      }

      if (rawAnswer) {
        hasAnyAnswer = true
      }

      const label = `Q${index + 1}${questionType ? ` (${questionType})` : ''}`
      const line = `${label}: ${rawAnswer || '[No answer]'}`.trim()
      answerLines.push(line)
    })

    if (!hasAnyAnswer && files.length === 0) {
      toast.error('Please answer at least one question or upload at least one file.')
      return
    }

    const submissionTextComputed = answerLines.join('\n\n')

    const formData = new FormData()
    if (submissionTextComputed.trim()) {
      formData.append('SubmissionText', submissionTextComputed)
    }
    files.forEach((file) => {
      formData.append('SubmissionFiles', file)
    })

    submitMutation.mutate(formData)
  }

  return (
    <div className="page-container">
      <button
        className="btn btn-secondary"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {assignment.title || assignment.Title}
          </h1>
          {isSubmitted && (
            <span className="badge badge-success">
              <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
              Submitted
            </span>
          )}
          {!isSubmitted && isStudent && (
            <span className="badge badge-warning">
              Pending Submission
            </span>
          )}
        </div>

        {assignment.description || assignment.Description ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Description
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {assignment.description || assignment.Description}
            </p>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {(assignment.subjectName || assignment.SubjectName) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {assignment.subjectName || assignment.SubjectName}
                </div>
              </div>
            </div>
          )}
          {(assignment.teacherName || assignment.TeacherName) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teacher</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {assignment.teacherName || assignment.TeacherName}
                </div>
              </div>
            </div>
          )}
          {(assignment.dueDate || assignment.DueDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {format(new Date(assignment.dueDate || assignment.DueDate), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
          )}
          {(assignment.maxMarks || assignment.MaxMarks) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Marks</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {assignment.maxMarks || assignment.MaxMarks}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        {questions && questions.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, index) => {
                const key = q?.id ?? q?.Id ?? index
                const questionType = (q?.questionType ?? q?.QuestionType ?? '').toString()
                const questionTypeLower = questionType.toLowerCase()
                const rawOptions = q?.options ?? q?.Options
                const options = Array.isArray(rawOptions) ? rawOptions : []
                const answerValue = (answers[key]?.text || '').toString()

                return (
                  <div key={key} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Question {index + 1} {q.isRequired || q.IsRequired ? '(Required)' : ''}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{q.marks || q.Marks} marks</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Type: {questionType || 'N/A'}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: (questionTypeLower === 'multiplechoice' || questionTypeLower === 'truefalse' || (Array.isArray(options) && options.length > 0)) ? '0.5rem' : 0 }}>
                      {q.questionText || q.QuestionText}
                    </p>

                    {/* Show options for MC/TF */}
                    {questionTypeLower === 'multiplechoice' && Array.isArray(options) && options.length > 0 && (
                      <div style={{ marginBottom: canSubmit ? '0.5rem' : 0 }}>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          {options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {questionTypeLower === 'truefalse' && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: canSubmit ? '0.5rem' : 0 }}>
                        Options: True / False
                      </div>
                    )}

                    {/* Answer input for student submission */}
                    {canSubmit && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {questionTypeLower === 'multiplechoice' && Array.isArray(options) && options.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {options.map((opt, i) => (
                              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                                <input
                                  type="radio"
                                  name={`q-${key}`}
                                  value={opt}
                                  checked={answerValue === opt}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [key]: { text: opt }
                                    }))
                                  }
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {questionTypeLower === 'truefalse' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {['True', 'False'].map((opt) => (
                              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                                <input
                                  type="radio"
                                  name={`q-${key}`}
                                  value={opt}
                                  checked={answerValue === opt}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [key]: { text: opt }
                                    }))
                                  }
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {(questionTypeLower !== 'multiplechoice' && questionTypeLower !== 'truefalse') && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              Your Answer
                            </label>
                            <textarea
                              rows={questionTypeLower === 'shortanswer' ? 3 : 6}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                              }}
                              value={answerValue}
                              onChange={(e) =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [key]: { text: e.target.value }
                                }))
                              }
                              placeholder="Type your answer here..."
                            />
                          </div>
                        )}

                        {/* Check answer (only when question has a UUID for API) */}
                        {(q.id || q.Id) && answerValue.trim() && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ fontSize: '0.875rem' }}
                              disabled={checkingQuestionId === (q.id || q.Id)}
                              onClick={() => handleCheckAnswer(q.id || q.Id, answerValue)}
                            >
                              {checkingQuestionId === (q.id || q.Id) ? 'Checking...' : 'Check answer'}
                            </button>
                            {checkResults[q.id || q.Id] && !checkResults[q.id || q.Id].error && (
                              <span style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: '500',
                                backgroundColor: checkResults[q.id || q.Id].isCorrect === true ? 'var(--success-light)' : checkResults[q.id || q.Id].isCorrect === false ? 'var(--danger-light)' : 'var(--bg-secondary)',
                                color: checkResults[q.id || q.Id].isCorrect === true ? 'var(--success)' : checkResults[q.id || q.Id].isCorrect === false ? 'var(--danger)' : 'var(--text-muted)'
                              }}>
                                {checkResults[q.id || q.Id].message || (checkResults[q.id || q.Id].isCorrect === true ? `Correct${checkResults[q.id || q.Id].score != null ? ` (+${checkResults[q.id || q.Id].score} marks)` : ''}` : 'Incorrect')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submission Section */}
      {isSubmitted ? (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Your Submission
          </h2>
          
          {(submission.submittedAt || submission.SubmittedAt) && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Submitted on: {format(new Date(submission.submittedAt || submission.SubmittedAt), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          )}

          {submission.submissionText || submission.SubmissionText ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Your Answer
              </h3>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                {submission.submissionText || submission.SubmissionText}
              </div>
            </div>
          ) : null}

          {Array.isArray(submission?.filePaths) && submission.filePaths.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Attached Files
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {submission.filePaths.map((filePath, index) => (
                  <div key={index} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary)" />
                    <span style={{ color: 'var(--text-secondary)' }}>{String(filePath ?? '').split('/').pop() || 'File'}</span>
                    <a
                      href={filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      style={{ marginLeft: 'auto' }}
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade Section */}
          {submission.status === 'Graded' || submission.Status === 'Graded' ? (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--success-light)', borderRadius: '8px', border: '1px solid var(--success)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Grade
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(submission.score !== null && submission.score !== undefined) || (submission.Score !== null && submission.Score !== undefined) ? (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Score: </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                      {submission.score || submission.Score}% / {assignment.maxMarks || assignment.MaxMarks}
                    </span>
                  </div>
                ) : null}
                {submission.feedback || submission.Feedback ? (
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Feedback:</div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {submission.feedback || submission.Feedback}
                    </div>
                  </div>
                ) : null}
                {submission.gradedAt || submission.GradedAt ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Graded on: {format(new Date(submission.gradedAt || submission.GradedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Your submission is pending grading.</span>
            </div>
          )}
        </div>
      ) : canSubmit ? (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Submit Assignment
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            You have not completed this assignment yet. Answer the questions above and/or attach files for theory questions, then submit.
          </p>
          <form onSubmit={handleSubmit}>
            {(() => {
              const hasTheoryQuestion =
                questions.length === 0 ||
                questions.some((q) => {
                  const qt = (q.questionType || q.QuestionType || '').toString().toLowerCase()
                  return qt === 'essay' || qt === 'shortanswer'
                })

              if (!hasTheoryQuestion) {
                return null
              }

              return (
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="files" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Attach Files (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label htmlFor="files" className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={18} />
                  Choose Files
                </label>
                <input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  PDF and image files only (max 10MB each)
                </span>
              </div>

              {fileErrors.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--danger-light)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                  {fileErrors.map((error, index) => (
                    <div key={index} style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {files.map((file, index) => (
                    <div key={index} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} color="var(--primary)" />
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{file.name}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="btn btn-sm btn-outline-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
              )
            })()}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(-1)}
                disabled={submitMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitMutation.isLoading || (!submissionText.trim() && files.length === 0)}
              >
                {submitMutation.isLoading ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default AssignmentDetails
