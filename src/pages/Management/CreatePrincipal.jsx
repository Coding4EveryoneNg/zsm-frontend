import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { principalsService, commonService } from '../../services/apiServices'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import logger from '../../utils/logger'

const CreatePrincipal = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const { data: schoolsData } = useQuery(['schools-dropdown'], () => commonService.getSchoolsDropdown(), { staleTime: 5 * 60 * 1000 })
  const schools = schoolsData?.data?.data ?? schoolsData?.data ?? []

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const requestData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        employeeId: data.employeeId || null,
        schoolId: data.schoolId,
      }

      const response = await principalsService.createPrincipal(requestData)
      const body = response?.data
      const success = body?.success ?? response?.success

      if (success) {
        toast.success(body?.message || 'Principal created successfully!')
        navigate('/principals')
      } else {
        const errMsg =
          body?.message ||
          (body?.errors && body.errors[0]) ||
          'Failed to create principal'
        toast.error(errMsg)
      }
    } catch (error) {
      let errorMessage = 'Failed to create principal. Please try again.'
      if (error.response?.data) {
        const d = error.response.data
        if (d.message) errorMessage = d.message
        else if (d.errors?.length) errorMessage = d.errors[0]
      } else if (error.message) errorMessage = error.message
      toast.error(errorMessage)
      logger.error('Create principal error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/principals')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add Principal
        </h1>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Add a principal for a school in your tenant. Select the school they will manage.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">First Name <span style={{ color: '#ef4444' }}>*</span></label>
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
              <label className="form-label">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
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
              <label className="form-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                })}
                className="form-input"
                placeholder="principal@school.com"
              />
              {errors.email && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.email.message}
                </span>
              )}
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input type="tel" {...register('phoneNumber')} className="form-input" placeholder="+1234567890" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">School <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                {...register('schoolId', { required: 'Please select a school' })}
                className="form-input"
              >
                <option value="">Select school</option>
                {Array.isArray(schools) && schools.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>
                    {s.name || s.Name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.schoolId.message}
                </span>
              )}
            </div>
            <div>
              <label className="form-label">Employee ID (optional)</label>
              <input
                {...register('employeeId')}
                className="form-input"
                placeholder="Leave empty for auto-generation"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="form-input"
                placeholder="••••••••"
              />
              {errors.password && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/principals')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : (<><Save size={18} style={{ marginRight: '0.5rem' }} /> Add Principal</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePrincipal
