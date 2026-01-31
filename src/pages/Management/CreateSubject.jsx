import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { subjectsService, commonService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateSubject = () => {
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

  const isAdmin = (user?.role || user?.Role || '').toString().toLowerCase() === 'admin'
  const selectedSchoolId = watch('schoolId')
  const { data: schoolsData } = useQuery('schools-dropdown', () => commonService.getSchoolsDropdown(), { enabled: isAdmin })
  const { data: schoolSwitchingData } = useQuery(['dashboard', 'school-switching'], () => dashboardService.getSchoolSwitchingData(), { enabled: !isAdmin })
  const schools = schoolsData?.data ?? schoolsData?.Data ?? []
  const principalSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId
  const schoolId = isAdmin ? (selectedSchoolId || schools?.[0]?.id || schools?.[0]?.Id || '') : (user?.schoolId || user?.SchoolId || principalSchoolId || '')

  useEffect(() => {
    if (isAdmin && schools?.length > 0 && !selectedSchoolId) {
      const firstId = schools[0]?.id || schools[0]?.Id
      if (firstId) setValue('schoolId', firstId)
    }
  }, [isAdmin, schools, selectedSchoolId, setValue])

  const onSubmit = async (data) => {
    if (!schoolId) {
      toast.error('School ID is required. Please ensure you are associated with a school.')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        name: data.name,
        code: data.code || null,
        schoolId: schoolId,
        description: data.description || null,
      }

      const response = await subjectsService.createSubject(requestData)

      if (response && response.success !== false) {
        toast.success('Subject created successfully!')
        navigate('/subjects')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create subject'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create subject. Please try again.'
      
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
      console.error('Create subject error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!schoolId) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/subjects')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Add New Subject
          </h1>
        </div>
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Unable to load subject creation form. Please ensure you are associated with a school.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/subjects')}
            >
              Back to Subjects
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/subjects')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Subject
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
                Subject Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                {...register('name', { required: 'Subject name is required', maxLength: { value: 100, message: 'Subject name cannot exceed 100 characters' } })}
                className="form-input"
                placeholder="e.g., Mathematics, English"
              />
              {errors.name && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Subject Code</label>
              <input
                {...register('code', { maxLength: { value: 20, message: 'Code cannot exceed 20 characters' } })}
                className="form-input"
                placeholder="e.g., MATH, ENG"
              />
              {errors.code && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.code.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea
              {...register('description', { maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' } })}
              className="form-input"
              rows={4}
              placeholder="Enter subject description (optional)"
            />
            {errors.description && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/subjects')}
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
                  Add Subject
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSubject

