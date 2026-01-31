import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { examinationsService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'

const CreateExamination = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    termId: '',
    durationMinutes: '',
    startDate: '',
    endDate: '',
    questions: []
  })
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('MultipleChoice')
  const [questionMarks, setQuestionMarks] = useState('')
  const [questionOrder, setQuestionOrder] = useState(1)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])

  // Fetch dropdown data (terms only take schoolId; get school from selected class)
  const { data: classesData } = useQuery('classes-dropdown', () => commonService.getClassesDropdown())
  const { data: subjectsData } = useQuery('subjects-dropdown', () => commonService.getSubjectsDropdown())
  const { data: sessionsData } = useQuery('sessions-dropdown', () => commonService.getSessionsDropdown())
  const classes = classesData?.data ?? classesData?.Data ?? []
  const selectedClassForTerms = classes.find((c) => (c.id || c.Id) === formData.classId)
  const schoolIdForTerms = selectedClassForTerms?.schoolId ?? selectedClassForTerms?.SchoolId
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForTerms],
    () => commonService.getTermsDropdown({ schoolId: schoolIdForTerms }),
    { enabled: !!schoolIdForTerms }
  )

  const createMutation = useMutation(
    (data) => examinationsService.createExamination(data),
    {
      onSuccess: (response) => {
        const examinationId = response?.data?.examinationId || response?.data?.ExaminationId || response?.data?.data?.examinationId
        handleSuccess('Examination created successfully!')
        navigate(`/examinations/${examinationId}`)
      },
      onError: (err) => {
        handleError(err, 'Failed to create examination')
      }
    }
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      title: formData.title,
      description: formData.description || null,
      subjectId: formData.subjectId,
      classId: formData.classId,
      termId: formData.termId,
      durationMinutes: parseInt(formData.durationMinutes) || 60,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      questions: formData.questions.length > 0 ? formData.questions.map((q, idx) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        correctAnswer: q.correctAnswer || null,
        marks: parseFloat(q.marks) || 0,
        order: q.order || idx + 1,
        options: q.options && q.options.length > 0 ? q.options.filter(opt => opt.trim()) : null
      })) : null
    }

    createMutation.mutate(payload)
  }

  const addQuestion = () => {
    if (!questionText.trim()) {
      toast.error('Please enter question text')
      return
    }

    const newQuestion = {
      questionText,
      questionType,
      correctAnswer: correctAnswer || null,
      marks: parseFloat(questionMarks) || 0,
      order: questionOrder,
      options: questionType === 'MultipleChoice' ? options.filter(opt => opt.trim()) : null
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    })

    // Reset question form
    setQuestionText('')
    setQuestionType('MultipleChoice')
    setQuestionMarks('')
    setQuestionOrder(formData.questions.length + 2)
    setCorrectAnswer('')
    setOptions(['', '', '', ''])
  }

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    })
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const subjects = subjectsData?.data ?? subjectsData?.Data ?? []
  const terms = termsData?.data ?? termsData?.Data ?? []

  return (
    <div className="page-container">
      <button
        className="btn btn-outline"
        onClick={() => navigate('/examinations')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} />
        Back to Examinations
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create New Examination</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select
                  className="form-control"
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id || subject.Id} value={subject.id || subject.Id}>
                      {subject.name || subject.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Class *</label>
                <select
                  className="form-control"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id || cls.Id} value={cls.id || cls.Id}>
                      {cls.name || cls.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Term *</label>
                <select
                  className="form-control"
                  value={formData.termId}
                  onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => (
                    <option key={term.id || term.Id} value={term.id || term.Id}>
                      {term.name || term.Name} {term.sessionName || term.SessionName ? `(${term.sessionName || term.SessionName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Minutes) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  required
                  min="1"
                  max="1440"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                maxLength={2000}
                placeholder="Enter examination description (optional)"
              />
            </div>

            {/* Questions Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Questions (Optional)</h3>
              
              {/* Add Question Form */}
              <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Question Text</label>
                      <textarea
                        className="form-control"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter question"
                        rows="2"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select
                        className="form-control"
                        value={questionType}
                        onChange={(e) => {
                          setQuestionType(e.target.value)
                          if (e.target.value !== 'MultipleChoice') {
                            setOptions(['', '', '', ''])
                          }
                        }}
                      >
                        <option value="MultipleChoice">Multiple Choice</option>
                        <option value="TrueFalse">True/False</option>
                        <option value="ShortAnswer">Short Answer</option>
                        <option value="Essay">Essay</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marks</label>
                      <input
                        type="number"
                        className="form-control"
                        value={questionMarks}
                        onChange={(e) => setQuestionMarks(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={questionOrder}
                        onChange={(e) => setQuestionOrder(parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Correct Answer</label>
                      <input
                        type="text"
                        className="form-control"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder={questionType === 'TrueFalse' ? 'Enter "True" or "False"' : 'Enter correct answer'}
                      />
                    </div>
                    {questionType === 'MultipleChoice' && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Options</label>
                        {options.map((option, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-control"
                            style={{ marginBottom: '0.5rem' }}
                            value={option}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={addQuestion}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {formData.questions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Added Questions ({formData.questions.length})</h4>
                  {formData.questions.map((q, index) => (
                    <div key={index} className="card" style={{ marginBottom: '0.5rem' }}>
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <strong>Q{index + 1}:</strong>
                            <span>{q.questionText}</span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Type: {q.questionType} | Marks: {q.marks} | Order: {q.order}
                            {q.correctAnswer && ` | Correct Answer: ${q.correctAnswer}`}
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Options: {q.options.join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/examinations')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {createMutation.isLoading ? (
                  <>
                    <Loading />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Examination
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateExamination
