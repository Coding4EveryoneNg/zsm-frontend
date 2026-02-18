import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { assignmentsService, commonService, teachersService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'

const CreateAssignment = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    teacherId: '',
    dueDate: '',
    maxMarks: '',
    maxScore: '',
    weight: '',
    termId: '',
    term: '',
    session: '',
    assignmentType: 'Assignment',
    type: 'Regular',
    questions: []
  })
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('Essay')
  const [questionMarks, setQuestionMarks] = useState('')
  const [questionOrder, setQuestionOrder] = useState(1)
  const [isRequired, setIsRequired] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])

  // For teachers: fetch only assigned classes and subjects; for others: full dropdowns
  const isTeacher = (user?.role || user?.Role || '').toString().toLowerCase() === 'teacher'
  const { data: schoolData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isTeacher }
  )
  const teacherSchoolId = schoolData?.data?.currentSchoolId ?? schoolData?.data?.CurrentSchoolId ?? user?.schoolId ?? user?.SchoolId
  const { data: teacherClassesRes } = useQuery(
    ['teacher-assigned-classes', user?.id ?? user?.Id],
    () => teachersService.getMyClasses(),
    { enabled: isTeacher }
  )
  const teacherAssignedClasses = teacherClassesRes?.data ?? teacherClassesRes ?? []
  const { data: classesRes } = useQuery(
    ['classes-dropdown', teacherSchoolId, isTeacher],
    () => commonService.getClassesDropdown(isTeacher && teacherSchoolId ? { schoolId: teacherSchoolId } : {}),
    { enabled: !isTeacher || !!teacherSchoolId }
  )
  const { data: subjectsRes } = useQuery(
    ['subjects-dropdown', teacherSchoolId, isTeacher],
    () => commonService.getSubjectsDropdown(isTeacher && teacherSchoolId ? { schoolId: teacherSchoolId } : {}),
    { enabled: !isTeacher || !!teacherSchoolId }
  )
  const { data: teachersRes } = useQuery(
    ['teachers-dropdown', teacherSchoolId],
    () => commonService.getTeachersDropdown(teacherSchoolId ? { schoolId: teacherSchoolId } : {}),
    { enabled: !isTeacher }
  )
  const { data: teacherSubjectsRes } = useQuery(
    ['teacher-assigned-subjects', user?.id ?? user?.Id],
    () => teachersService.getMySubjects(),
    { enabled: isTeacher }
  )
  const teacherAssignedSubjects = teacherSubjectsRes?.data ?? teacherSubjectsRes ?? []
  const classes = useMemo(() => {
    if (!isTeacher) return (classesRes?.data ?? classesRes ?? [])
    return teacherAssignedClasses
  }, [isTeacher, classesRes, teacherAssignedClasses])
  const subjects = useMemo(() => {
    if (!isTeacher) return (subjectsRes?.data ?? subjectsRes ?? [])
    return teacherAssignedSubjects
  }, [isTeacher, subjectsRes, teacherAssignedSubjects])
  const { data: sessionsData } = useQuery(['sessions-dropdown'], () => commonService.getSessionsDropdown(), { staleTime: 5 * 60 * 1000 })
  const sessions = sessionsData?.data ?? sessionsData?.Data ?? []
  const selectedSession = formData.session && formData.session.length === 36
    ? sessions.find((s) => (s.id || s.Id) === formData.session)
    : null
  const schoolIdForTerms = selectedSession?.schoolId ?? selectedSession?.SchoolId
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForTerms],
    () => commonService.getTermsDropdown({ schoolId: schoolIdForTerms }),
    { enabled: !!schoolIdForTerms }
  )

  const createMutation = useMutation(
    (data) => assignmentsService.createAssignment(data),
    {
      onSuccess: (response) => {
        const assignmentId = response?.data?.assignmentId || response?.data?.AssignmentId || response?.data?.data?.assignmentId
        handleSuccess('Assignment created successfully!')
        navigate(`/assignments/${assignmentId}`)
      },
      onError: (err) => {
        handleError(err, 'Failed to create assignment')
      }
    }
  )

  const { data: teacherMeRes } = useQuery(
    ['teacher-me', user?.id ?? user?.Id],
    () => teachersService.getMe(),
    { enabled: isTeacher }
  )
  const currentTeacherId = teacherMeRes?.data?.id ?? teacherMeRes?.data?.Id ?? teacherMeRes?.id ?? teacherMeRes?.Id

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title?.trim()) {
      toast.error('Title is required')
      return
    }

    // Get teacher ID from user if teacher, otherwise from dropdown
    let teacherId = formData.teacherId
    if (isTeacher) {
      teacherId = currentTeacherId
    } else if (!teacherId) {
      const teacher = teachers?.find(t => (t.email ?? t.Email) === (user?.email ?? user?.Email))
      teacherId = teacher?.id ?? teacher?.Id
    }

    if (!teacherId) {
      toast.error(isTeacher ? 'Unable to identify teacher. Please try again.' : 'Please select a teacher')
      return
    }

    // Send session and term names (backend uses names for lookup when TermId not provided)
    const sessionName = selectedSession ? (selectedSession.name ?? selectedSession.Name ?? '') : ''
    const termName = formData.term || ''

    const payload = {
      title: formData.title?.trim() || '',
      description: formData.description?.trim() || null,
      subjectId: formData.subjectId,
      classId: formData.classId,
      teacherId: teacherId,
      dueDate: new Date(formData.dueDate).toISOString(),
      maxMarks: parseFloat(formData.maxMarks) || 0,
      maxScore: parseFloat(formData.maxScore) || parseFloat(formData.maxMarks) || 0,
      weight: parseFloat(formData.weight) || 0,
      termId: formData.termId || null,
      term: termName,
      session: sessionName,
      assignmentType: formData.assignmentType,
      type: formData.type,
      questions: formData.questions.length > 0 ? formData.questions.map((q, idx) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        correctAnswer: q.correctAnswer || null,
        marks: parseFloat(q.marks) || 0,
        order: q.order || idx + 1,
        isRequired: q.isRequired || false,
        options: q.options && q.options.length > 0 ? q.options.filter(opt => opt && opt.trim()) : null
      })) : null
    }

    createMutation.mutate(payload)
  }

  const addQuestion = () => {
    if (!questionText.trim()) {
      toast.error('Please enter question text')
      return
    }

    const resolvedCorrectAnswer = (questionType === 'TrueFalse' || questionType === 'MultipleChoice')
      ? (correctAnswer?.trim() || null)
      : (correctAnswer?.trim() || null)

    const newQuestion = {
      questionText,
      questionType,
      correctAnswer: resolvedCorrectAnswer,
      marks: parseFloat(questionMarks) || 0,
      order: questionOrder,
      isRequired,
      options: questionType === 'MultipleChoice' ? options.filter(opt => opt.trim()) : null
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    })

    // Reset question form
    setQuestionText('')
    setQuestionType('Essay')
    setQuestionMarks('')
    setQuestionOrder(formData.questions.length + 2)
    setIsRequired(false)
    setCorrectAnswer('')
    setOptions(['', '', '', ''])
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    })
  }

  const teachers = teachersRes?.data ?? teachersRes ?? []
  const terms = termsData?.data || []

  return (
    <div className="page-container">
      <button
        className="btn btn-outline"
        onClick={() => navigate('/assignments')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} />
        Back to Assignments
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create New Assignment</h1>
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

              {user?.role !== 'Teacher' && (
                <div className="form-group">
                  <label className="form-label">Teacher *</label>
                  <select
                    className="form-control"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id || teacher.Id} value={teacher.id || teacher.Id}>
                        {teacher.name || teacher.Name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Marks *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                  required
                  min="0"
                  max="1000"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Score</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  min="0"
                  max="1000"
                  step="0.01"
                  placeholder="Same as Max Marks if not specified"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Session</label>
                <select
                  className="form-control"
                  value={formData.session}
                  onChange={(e) => {
                    setFormData({ ...formData, session: e.target.value, termId: '', term: '' })
                  }}
                >
                  <option value="">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session.id || session.Id} value={session.id || session.Id}>
                      {session.name || session.Name} {session.isCurrent || session.IsCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Term</label>
                <select
                  className="form-control"
                  value={formData.termId}
                  onChange={(e) => {
                    const selectedTerm = terms.find(t => (t.id || t.Id) === e.target.value)
                    setFormData({
                      ...formData,
                      termId: e.target.value,
                      term: selectedTerm ? (selectedTerm.name || selectedTerm.Name) : ''
                    })
                  }}
                  disabled={!formData.session}
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => (
                    <option key={term.id || term.Id} value={term.id || term.Id}>
                      {term.name || term.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Type *</label>
                <select
                  className="form-control"
                  value={formData.assignmentType}
                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                  required
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Project">Project</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Homework">Homework</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="Regular">Regular</option>
                  <option value="Extra Credit">Extra Credit</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                maxLength={5000}
                placeholder="Enter assignment description (optional)"
              />
            </div>

            {/* Questions Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Questions (Optional)</h3>
              
              {/* Add Question Form */}
              <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <input
                        type="text"
                        className="form-control"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter question"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select
                        className="form-control"
                        value={questionType}
                        onChange={(e) => {
                          const newType = e.target.value
                          setQuestionType(newType)
                          if (newType !== 'MultipleChoice') {
                            setOptions(['', '', '', ''])
                          }
                          if (newType !== 'TrueFalse' && newType !== 'MultipleChoice') {
                            setCorrectAnswer('')
                          }
                        }}
                      >
                        <option value="Essay">Essay</option>
                        <option value="MultipleChoice">Multiple Choice</option>
                        <option value="TrueFalse">True/False</option>
                        <option value="ShortAnswer">Short Answer</option>
                      </select>
                    </div>
                    {(questionType === 'MultipleChoice' || questionType === 'TrueFalse') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Correct Answer</label>
                        {questionType === 'TrueFalse' ? (
                          <select
                            className="form-control"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                          >
                            <option value="">Select correct answer</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        ) : (
                          <select
                            className="form-control"
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                          >
                            <option value="">Select correct answer (add options below first)</option>
                            {options.filter(opt => opt.trim()).map((opt, idx) => (
                              <option key={idx} value={opt.trim()}>{opt.trim()}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    {(questionType === 'Essay' || questionType === 'ShortAnswer') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Correct Answer (optional, for reference)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                          placeholder="Expected answer or marking guide"
                        />
                      </div>
                    )}
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
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                      />
                      <span>Required</span>
                    </label>
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
                            {q.isRequired && <span className="badge badge-warning">Required</span>}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Type: {q.questionType} | Marks: {q.marks} | Order: {q.order}
                            {q.correctAnswer && ` | Correct: ${q.correctAnswer}`}
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
                onClick={() => navigate('/assignments')}
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
                    Create Assignment
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

export default CreateAssignment
