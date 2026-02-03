import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { teachersService, commonService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateTeacher = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm()

  const [subjectAssignments, setSubjectAssignments] = useState([])
  const isAdmin = (user?.role || user?.Role || '').toString().toLowerCase() === 'admin'
  const selectedSchoolId = watch('schoolId')
  const { data: schoolsData } = useQuery('schools-dropdown', () => commonService.getSchoolsDropdown(), { enabled: isAdmin })
  const { data: schoolSwitchingData } = useQuery(['dashboard', 'school-switching'], () => dashboardService.getSchoolSwitchingData(), { enabled: !isAdmin })
  const schools = schoolsData?.data ?? schoolsData?.Data ?? []
  const principalSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId
  const schoolId = isAdmin ? (selectedSchoolId || schools?.[0]?.id || schools?.[0]?.Id || '') : (user?.schoolId || user?.SchoolId || principalSchoolId || '')

  const { data: subjectsData } = useQuery(
    ['subjects-dropdown', schoolId],
    () => commonService.getSubjectsDropdown({ schoolId }),
    { enabled: !!schoolId }
  )
  const { data: classesData } = useQuery(
    ['classes-dropdown', schoolId],
    () => commonService.getClassesDropdown({ schoolId }),
    { enabled: !!schoolId }
  )
  const subjects = subjectsData?.data ?? subjectsData?.Data ?? []
  const classes = classesData?.data ?? classesData?.Data ?? []

  // Default school for Admin: prefer current user's assigned school (when tenant has multiple schools)
  useEffect(() => {
    if (isAdmin && schools?.length > 0 && !selectedSchoolId) {
      const userSchoolId = user?.schoolId || user?.SchoolId
      const preferredId = userSchoolId && schools.some((s) => (s.id || s.Id) === userSchoolId)
        ? userSchoolId
        : schools[0]?.id || schools[0]?.Id
      if (preferredId) setValue('schoolId', preferredId)
    }
  }, [isAdmin, schools, selectedSchoolId, setValue, user?.schoolId, user?.SchoolId])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const requestData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        specialization: data.specialization || null,
        department: data.department || null,
        employeeId: data.employeeId || null,
        hireDate: data.hireDate || null,
        experience: data.experience ? parseInt(data.experience) : null,
        subjectAssignments: subjectAssignments.length > 0 ? subjectAssignments.map((a) => ({ subjectId: a.subjectId, classId: a.classId })) : undefined,
      }
      if (isAdmin && schoolId) requestData.schoolId = schoolId

      const response = await teachersService.createTeacher(requestData)

      if (response && response.success) {
        toast.success(response.message || 'Teacher created successfully!')
        navigate('/teachers')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create teacher'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create teacher. Please try again.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0]
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      console.error('Create teacher error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/teachers')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Teacher
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">School <span style={{ color: '#ef4444' }}>*</span></label>
              <select {...register('schoolId', { required: isAdmin ? 'Please select a school' : false })} className="form-input">
                <option value="">Select school</option>
                {Array.isArray(schools) && schools.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
              {errors.schoolId && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.schoolId.message}</span>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                First Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="form-input"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Last Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="form-input"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="form-input"
                placeholder="teacher@example.com"
              />
              {errors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                {...register('phoneNumber')}
                className="form-input"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Department</label>
              <input
                {...register('department')}
                className="form-input"
                placeholder="e.g., Mathematics, Science"
              />
            </div>

            <div>
              <label className="form-label">Specialization</label>
              <input
                {...register('specialization')}
                className="form-input"
                placeholder="e.g., Algebra, Physics"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Employee ID (Optional - Auto-generated if not provided)</label>
              <input
                {...register('employeeId')}
                className="form-input"
                placeholder="Leave empty for auto-generation"
              />
            </div>

            <div>
              <label className="form-label">Hire Date</label>
              <input
                type="date"
                {...register('hireDate')}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              {...register('experience', { 
                min: { value: 0, message: 'Experience cannot be negative' },
                max: { value: 50, message: 'Experience cannot exceed 50 years' }
              })}
              className="form-input"
              placeholder="0"
              min="0"
              max="50"
            />
            {errors.experience && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.experience.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Assign subjects to this teacher (optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
              <select
                id="newSubjectId"
                className="form-input"
                style={{ minWidth: '140px' }}
              >
                <option value="">Subject</option>
                {Array.isArray(subjects) && subjects.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
              <select
                id="newClassId"
                className="form-input"
                style={{ minWidth: '140px' }}
              >
                <option value="">Class</option>
                {Array.isArray(classes) && classes.map((c) => (
                  <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  const subSel = document.getElementById('newSubjectId')
                  const classSel = document.getElementById('newClassId')
                  const subjectId = subSel?.value
                  const classId = classSel?.value
                  if (subjectId && classId) {
                    setSubjectAssignments((prev) => [...prev, { subjectId, classId }])
                    if (subSel) subSel.value = ''
                    if (classSel) classSel.value = ''
                  }
                }}
              >
                Add
              </button>
            </div>
            {subjectAssignments.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {subjectAssignments.map((a, idx) => {
                  const sub = subjects.find((s) => (s.id || s.Id) === a.subjectId)
                  const cls = classes.find((c) => (c.id || c.Id) === a.classId)
                  return (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{sub?.name || sub?.Name || a.subjectId} – {cls?.name || cls?.Name || a.classId}</span>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setSubjectAssignments((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/teachers')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} />
                  Add Teacher
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTeacher

