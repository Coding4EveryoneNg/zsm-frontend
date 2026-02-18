import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { caTestsService, commonService, teachersService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'

const CreateCATest = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    sessionId: '',
    termId: '',
    maxMarks: '100',
    dueDate: ''
  })

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
  const { data: teacherSubjectsRes } = useQuery(
    ['teacher-assigned-subjects', user?.id ?? user?.Id],
    () => teachersService.getMySubjects(),
    { enabled: isTeacher }
  )
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
  const teacherAssignedClasses = teacherClassesRes?.data ?? teacherClassesRes ?? []
  const teacherAssignedSubjects = teacherSubjectsRes?.data ?? teacherSubjectsRes ?? []
  const classes = useMemo(() => {
    if (!isTeacher) return (classesRes?.data ?? classesRes ?? [])
    return teacherAssignedClasses
  }, [isTeacher, classesRes, teacherAssignedClasses])
  const subjects = useMemo(() => {
    if (!isTeacher) return (subjectsRes?.data ?? subjectsRes ?? [])
    return teacherAssignedSubjects
  }, [isTeacher, subjectsRes, teacherAssignedSubjects])

  const selectedClass = Array.isArray(classes) ? classes.find((c) => (c.id || c.Id) === formData.classId) : null
  const { data: sessionsData } = useQuery('sessions-dropdown', () => commonService.getSessionsDropdown())
  const sessions = sessionsData?.data ?? sessionsData?.Data ?? []
  const selectedSession = formData.sessionId && formData.sessionId.length === 36
    ? sessions.find((s) => (s.id || s.Id) === formData.sessionId)
    : null
  const schoolIdForTerms = selectedSession?.schoolId ?? selectedSession?.SchoolId ?? selectedClass?.schoolId ?? selectedClass?.SchoolId
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForTerms],
    () => commonService.getTermsDropdown({ schoolId: schoolIdForTerms }),
    { enabled: !!schoolIdForTerms }
  )
  const terms = termsData?.data ?? termsData?.Data ?? []

  const createMutation = useMutation(
    (data) => caTestsService.createCATest(data),
    {
      onSuccess: (response) => {
        const catestId = response?.data?.catestId ?? response?.data?.CATestId ?? response?.data?.data?.catestId ?? response?.data?.data?.cATestId
        handleSuccess('CA Test created successfully!')
        navigate(`/catests/${catestId}`)
      },
      onError: (err) => handleError(err, 'Failed to create CA Test')
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title?.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formData.subjectId) {
      toast.error('Please select a subject')
      return
    }
    if (!formData.classId) {
      toast.error('Please select a class')
      return
    }
    if (!formData.termId) {
      toast.error('Please select a term')
      return
    }
    if (!formData.dueDate) {
      toast.error('Please select due date')
      return
    }
    const maxMarks = parseFloat(formData.maxMarks) || 100
    if (maxMarks <= 0) {
      toast.error('Max marks must be greater than 0')
      return
    }

    createMutation.mutate({
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      subjectId: formData.subjectId,
      classId: formData.classId,
      termId: formData.termId,
      maxMarks,
      dueDate: new Date(formData.dueDate).toISOString()
    })
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/catests')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="card-title">Create CA Test</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mathematics CA Test 1"
                />
              </div>
              <div>
                <label className="form-label">Max Marks <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Subject <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id ?? s.Id} value={s.id ?? s.Id}>{s.name ?? s.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Class <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id ?? c.Id} value={c.id ?? c.Id}>{c.name ?? c.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Session</label>
                <select
                  className="form-select"
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, termId: '' })}
                >
                  <option value="">Select session</option>
                  {sessions.map((s) => (
                    <option key={s.id ?? s.Id} value={s.id ?? s.Id}>{s.name ?? s.Name} {s.isCurrent || s.IsCurrent ? '(Current)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Term <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={formData.termId}
                  onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                  disabled={!schoolIdForTerms}
                >
                  <option value="">Select term</option>
                  {terms.map((t) => (
                    <option key={t.id ?? t.Id} value={t.id ?? t.Id}>{t.name ?? t.Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Due Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/catests')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>
                <Save size={18} style={{ marginRight: '0.5rem' }} />
                {createMutation.isLoading ? 'Creating...' : 'Create CA Test'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateCATest
