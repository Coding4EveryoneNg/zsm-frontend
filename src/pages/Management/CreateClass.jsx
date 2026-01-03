import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { classesService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateClass = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const schoolId = user?.schoolId || user?.SchoolId

  const onSubmit = async (data) => {
    if (!schoolId) {
      toast.error('School ID is required. Please ensure you are associated with a school.')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        name: data.name,
        section: data.section || null,
        schoolId: schoolId,
        capacity: data.capacity ? parseInt(data.capacity) : null,
      }

      const response = await classesService.createClass(requestData)

      if (response && response.success !== false) {
        toast.success('Class created successfully!')
        navigate('/classes')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create class'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create class. Please try again.'
      
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
      console.error('Create class error:', error)
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
            onClick={() => navigate('/classes')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Add New Class
          </h1>
        </div>
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Unable to load class creation form. Please ensure you are associated with a school.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/classes')}
            >
              Back to Classes
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
          onClick={() => navigate('/classes')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Class
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Class Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                {...register('name', { required: 'Class name is required', maxLength: { value: 100, message: 'Class name cannot exceed 100 characters' } })}
                className="form-input"
                placeholder="e.g., Grade 10, Class 5"
              />
              {errors.name && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Section</label>
              <input
                {...register('section', { maxLength: { value: 10, message: 'Section cannot exceed 10 characters' } })}
                className="form-input"
                placeholder="e.g., A, B, C"
              />
              {errors.section && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.section.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Capacity</label>
            <input
              type="number"
              {...register('capacity', { 
                min: { value: 1, message: 'Capacity must be at least 1' },
                max: { value: 200, message: 'Capacity cannot exceed 200' }
              })}
              className="form-input"
              placeholder="Maximum number of students"
              min="1"
              max="200"
            />
            {errors.capacity && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.capacity.message}
              </span>
            )}
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              Optional: Maximum number of students that can be enrolled in this class
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/classes')}
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
                  Add Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClass

