import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { examinationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import logger from '../../utils/logger'

const TakeExamination = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState({})
  const [fileUploads, setFileUploads] = useState({}) // { [questionId]: File[] }
  const [remainingTime, setRemainingTime] = useState(0)
  const [timeWarning, setTimeWarning] = useState(false)
  const [checkResults, setCheckResults] = useState({}) // { [questionId]: { isCorrect, score, message } }
  const [checkingQuestionId, setCheckingQuestionId] = useState(null)

  // Start examination if not started
  const startMutation = useMutation(
    () => examinationsService.startExamination(id),
    {
      onSuccess: () => {
        // Refetch the examination after starting
        queryClient.invalidateQueries(['examination', id, 'student'])
        refetch()
      },
      onError: (error) => {
        const msg = error?.response?.data?.message ?? error?.response?.data?.errors?.[0] ?? 'Failed to start examination'
        toast.error(typeof msg === 'string' ? msg : 'Failed to start examination')
      }
    }
  )

  // Fetch examination
  const { data, isLoading, error, refetch } = useQuery(
    ['examination', id, 'student'],
    () => examinationsService.getExaminationForStudent(id),
    {
      enabled: !!id,
      retry: false,
      onSuccess: (data) => {
        const exam = data?.data || data
        const qList = Array.isArray(exam?.questions) ? exam.questions : []
        if (qList.length > 0) {
          // Initialize answers from existing student answers
          const initialAnswers = {}
          qList.forEach(q => {
            const qId = q.id || q.Id
            if (q.studentAnswer || q.studentAnswerData) {
              initialAnswers[qId] = {
                text: q.studentAnswer || '',
                data: q.studentAnswerData || ''
              }
            }
          })
          setAnswers(initialAnswers)
        }
        if (exam?.remainingMinutes !== undefined) {
          setRemainingTime(exam.remainingMinutes * 60) // Convert to seconds
        }
      },
      onError: (error) => {
        // Check if error is about needing to start the exam
        const errMsg = String(error?.response?.data?.message ?? error?.response?.data?.errors?.[0] ?? error?.message ?? '')
        const needsStart = errMsg.toLowerCase().includes('start') || errMsg.toLowerCase().includes('must start')
        
        if (error?.response?.status === 400 && needsStart) {
          // Auto-start the examination
          if (!startMutation.isLoading) {
            startMutation.mutate()
          }
        }
      }
    }
  )

  // Auto-start when component mounts if exam hasn't been started
  useEffect(() => {
    if (id && error && error?.response?.status === 400) {
      const errMsg = String(error?.response?.data?.message ?? error?.response?.data?.errors?.[0] ?? error?.message ?? '')
      const needsStart = errMsg.toLowerCase().includes('start') || errMsg.toLowerCase().includes('must start')
      
      if (needsStart && !startMutation.isLoading && !startMutation.isSuccess) {
        startMutation.mutate()
      }
    }
  }, [id, error, startMutation])

  // Submit examination
  const submitMutation = useMutation(
    (submitData) => examinationsService.submitExamination(id, submitData),
    {
      onSuccess: () => {
        toast.success('Examination submitted successfully!')
        navigate('/examinations')
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.errors?.[0] || 
                           error?.message || 
                           'Failed to submit examination'
        toast.error(errorMessage)
        logger.error('Submit examination error:', error)
      }
    }
  )

  // Timer effect
  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          const exam = data?.data || data
          if (exam?.submissionId || exam?.SubmissionId) {
            handleSubmitRef.current(true)
          } else {
            toast.error('Cannot auto-submit: Submission ID not found')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Warning at 5 minutes
    if (remainingTime <= 300 && !timeWarning) {
      setTimeWarning(true)
      toast.error('5 minutes remaining!', { duration: 5000 })
    }

    return () => clearInterval(timer)
  }, [remainingTime, timeWarning, data])


  const handleAnswerChange = (questionId, value, questionType) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text: value,
        data: value
      }
    }))
  }

  const handleCheckAnswer = async (questionId, answerText) => {
    const text = (answerText || '').toString().trim()
    if (!questionId || !text) {
      toast.error('Enter an answer first.')
      return
    }
    setCheckingQuestionId(questionId)
    setCheckResults(prev => ({ ...prev, [questionId]: undefined }))
    try {
      const res = await examinationsService.checkExaminationAnswer(id, questionId, { answerText: text })
      const payload = res?.data?.data || res?.data
      setCheckResults(prev => ({
        ...prev,
        [questionId]: {
          isCorrect: payload?.isCorrect,
          score: payload?.score,
          message: payload?.message
        }
      }))
      if (payload?.message && payload?.isCorrect === undefined && payload?.score === undefined) {
        toast(payload.message, { icon: 'ℹ️' })
      } else if (payload?.isCorrect !== undefined) {
        toast.success(payload.isCorrect ? `Correct! ${payload?.score != null ? `+${payload.score} marks` : ''}` : 'Incorrect. Try again.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || 'Could not check answer.'
      toast.error(msg)
      setCheckResults(prev => ({ ...prev, [questionId]: { error: msg } }))
    } finally {
      setCheckingQuestionId(null)
    }
  }

  const handleFileChange = (questionId, event) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    setFileUploads(prev => ({ ...prev, [questionId]: files }))
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    const exam = data?.data || data
    const qList = Array.isArray(exam?.questions) ? exam.questions : []
    if (qList.length === 0) return

    const submissionId = exam.submissionId || exam.SubmissionId
    if (!submissionId) {
      toast.error('Submission ID not found. Please refresh the page.')
      return
    }

    const submitAnswers = qList.map(q => {
      const qId = q.id || q.Id
      return {
        questionId: qId,
        answerText: answers[qId]?.text || '',
        answerData: answers[qId]?.data || answers[qId]?.text || ''
      }
    })

    const hasFiles = Object.values(fileUploads).some(arr => arr && arr.length > 0)
    if (hasFiles) {
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('answers', JSON.stringify(submitAnswers))
      qList.forEach(q => {
        const qId = q.id || q.Id
        const files = fileUploads[qId]
        if (files && files.length > 0) {
          files.forEach(file => formData.append(`file_${qId}`, file))
        }
      })
      submitMutation.mutate(formData)
    } else {
      submitMutation.mutate({
        submissionId: submissionId,
        answers: submitAnswers,
        autoSubmit
      })
    }
  }, [data, answers, fileUploads, submitMutation])

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Show loading while starting exam or fetching
  if (isLoading || startMutation.isLoading) {
    return (
      <div className="page-container">
        <Loading />
        {startMutation.isLoading && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>Starting examination...</p>
          </div>
        )}
      </div>
    )
  }

  // Check if error is about needing to start (which we're handling)
  const errorMessage = String(error?.response?.data?.message ?? error?.response?.data?.errors?.[0] ?? error?.message ?? '')
  const needsStart = errorMessage.toLowerCase().includes('start') || errorMessage.toLowerCase().includes('must start')

  // Only show error if it's not about needing to start (we handle that automatically)
  if (error && !needsStart && !startMutation.isLoading) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">Error loading examination</p>
            <p className="empty-state-subtext">
              {errorMessage || 'Please try again later'}
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
    return <Loading />
  }

  const questions = Array.isArray(exam.questions) ? exam.questions : []
  const unansweredCount = questions.filter(q => !answers[q?.id ?? q?.Id]?.text && !answers[q?.id ?? q?.Id]?.data).length

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {exam.title || exam.Title}
            </h1>
            {exam.description || exam.Description ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                {exam.description || exam.Description}
              </p>
            ) : null}
          </div>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: timeWarning ? 'var(--danger-light)' : 'var(--bg-secondary)', 
            borderRadius: '8px',
            border: `2px solid ${timeWarning ? 'var(--danger)' : 'var(--border-color)'}`,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Clock size={20} color={timeWarning ? 'var(--danger)' : 'var(--primary)'} />
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: timeWarning ? 'var(--danger)' : 'var(--text-primary)'
              }}>
                {formatTime(remainingTime)}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Remaining Time
            </p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Questions</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {questions.length}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Answered</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {questions.length - unansweredCount}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Unanswered</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: unansweredCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {unansweredCount}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Marks</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {exam.totalMarks || exam.TotalMarks || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {questions.map((question, index) => {
          const questionId = question?.id ?? question?.Id
          const questionType = question?.questionType ?? question?.QuestionType ?? ''
          const questionTypeLower = String(questionType).toLowerCase()
          const options = question?.options ?? question?.Options
          let parsedOptions = []
          try {
            if (options != null) {
              parsedOptions = typeof options === 'string' ? JSON.parse(options) : (Array.isArray(options) ? options : [])
            }
          } catch (e) {
            logger.error('Failed to parse options:', e)
          }
          if (!Array.isArray(parsedOptions)) parsedOptions = []

          const currentAnswer = answers[questionId]?.text || answers[questionId]?.data || ''

          return (
            <div key={questionId} className="card">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Question {index + 1}
                    {question.isRequired || question.IsRequired ? (
                      <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>*</span>
                    ) : null}
                  </h3>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}>
                    {question.marks || question.Marks || 0} marks
                  </span>
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
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px'
                  }}>
                    {question.instructions || question.Instructions}
                  </p>
                ) : null}
              </div>

              {/* Answer Input: radio for MC/TrueFalse, textarea only for other types */}
              <div>
                {questionTypeLower === 'multiplechoice' && parsedOptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Select one answer:</span>
                    {parsedOptions.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          border: `2px solid ${currentAnswer === option ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: currentAnswer === option ? 'var(--primary-light)' : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${questionId}`}
                          value={option}
                          checked={currentAnswer === option}
                          onChange={(e) => handleAnswerChange(questionId, e.target.value, questionType)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : questionTypeLower === 'truefalse' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Select one answer:</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {['True', 'False'].map(option => (
                        <label
                          key={option}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem 1.5rem',
                            border: `2px solid ${currentAnswer === option ? 'var(--primary)' : 'var(--border-color)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: currentAnswer === option ? 'var(--primary-light)' : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${questionId}`}
                            value={option}
                            checked={currentAnswer === option}
                            onChange={(e) => handleAnswerChange(questionId, e.target.value, questionType)}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Your Answer
                    </label>
                    <textarea
                      className="form-control"
                      rows={questionTypeLower === 'shortanswer' ? 3 : 8}
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(questionId, e.target.value, questionType)}
                      placeholder="Type your answer here..."
                      style={{ minHeight: questionTypeLower === 'shortanswer' ? '80px' : '200px', marginBottom: '1rem' }}
                    />
                    {(question.section === 'Theory' || question.Section === 'Theory') && (
                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                          Upload documents (PDF, Word, or images) — optional
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp,image/bmp"
                          onChange={(e) => handleFileChange(questionId, e)}
                          className="form-control"
                          style={{ padding: '0.5rem' }}
                        />
                        {fileUploads[questionId]?.length > 0 && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {fileUploads[questionId].length} file(s) selected: {fileUploads[questionId].map(f => f.name).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Check answer */}
                {questionId && currentAnswer.trim() && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '0.875rem' }}
                      disabled={checkingQuestionId === questionId}
                      onClick={() => handleCheckAnswer(questionId, currentAnswer)}
                    >
                      {checkingQuestionId === questionId ? 'Checking...' : 'Check answer'}
                    </button>
                    {checkResults[questionId] && !checkResults[questionId].error && (
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: '500',
                        backgroundColor: checkResults[questionId].isCorrect === true ? 'var(--success-light)' : checkResults[questionId].isCorrect === false ? 'var(--danger-light)' : 'var(--bg-secondary)',
                        color: checkResults[questionId].isCorrect === true ? 'var(--success)' : checkResults[questionId].isCorrect === false ? 'var(--danger)' : 'var(--text-muted)'
                      }}>
                        {checkResults[questionId].message || (checkResults[questionId].isCorrect === true ? `Correct${checkResults[questionId].score != null ? ` (+${checkResults[questionId].score} marks)` : ''}` : 'Incorrect')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <div className="card" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {unansweredCount > 0 && (
              <p style={{ color: 'var(--warning)', fontSize: '0.875rem', margin: 0 }}>
                You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to leave? Your progress will be saved.')) {
                  navigate('/examinations')
                }
              }}
            >
              Save & Exit
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (unansweredCount > 0) {
                  if (!window.confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`)) {
                    return
                  }
                } else {
                  if (!window.confirm('Are you sure you want to submit your examination?')) {
                    return
                  }
                }
                handleSubmit(false)
              }}
              disabled={submitMutation.isLoading}
            >
              {submitMutation.isLoading ? 'Submitting...' : 'Submit Examination'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeExamination
