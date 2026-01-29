import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { schoolApplicationsService } from '../../services/apiServices'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateSchoolApplication = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const requestData = {
        schoolName: data.schoolName,
        contactPersonName: data.contactPersonName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        schoolAddress: data.schoolAddress,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        subdomain: data.subdomain || null,
        customDomain: data.customDomain || null,
        schoolDescription: data.schoolDescription || null,
        schoolType: data.schoolType || null,
        curriculum: data.curriculum || null
      }

      const response = await schoolApplicationsService.createApplication(requestData)
      const body = response?.data
      const success = body?.success ?? response?.success

      if (success) {
        toast.success(body?.message || 'Application created. It will be reviewed by Super Admin.')
        navigate('/settings/school-applications')
      } else {
        toast.error(body?.message || (body?.errors && body.errors[0]) || 'Failed to create application.')
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || 'Failed to create application.'
      toast.error(msg)
      console.error('Create school application error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/settings/school-applications')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add another school
        </h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--info-light)', border: '1px solid var(--info)' }}>
        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          This will add a new school to your organization (same tenant). The request will be reviewed by Super Admin before the school is created.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">School Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input {...register('schoolName', { required: 'School name is required' })} className="form-input" placeholder="e.g. Central High" />
              {errors.schoolName && <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.schoolName.message}</span>}
            </div>
            <div>
              <label className="form-label">Contact Person Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input {...register('contactPersonName', { required: 'Contact person is required' })} className="form-input" placeholder="Full name" />
              {errors.contactPersonName && <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.contactPersonName.message}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Contact Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" {...register('contactEmail', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }})} className="form-input" placeholder="contact@school.com" />
              {errors.contactEmail && <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.contactEmail.message}</span>}
            </div>
            <div>
              <label className="form-label">Contact Phone</label>
              <input type="tel" {...register('contactPhone')} className="form-input" placeholder="+1234567890" />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">School Address <span style={{ color: '#ef4444' }}>*</span></label>
            <input {...register('schoolAddress', { required: 'Address is required' })} className="form-input" placeholder="Street, city, state" />
            {errors.schoolAddress && <span style={{ color: '#ef4444', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.schoolAddress.message}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">City</label>
              <input {...register('city')} className="form-input" placeholder="City" />
            </div>
            <div>
              <label className="form-label">State</label>
              <input {...register('state')} className="form-input" placeholder="State" />
            </div>
            <div>
              <label className="form-label">Postal Code</label>
              <input {...register('postalCode')} className="form-input" placeholder="Postal code" />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Country</label>
            <input {...register('country')} className="form-input" placeholder="Country" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Subdomain</label>
              <input {...register('subdomain')} className="form-input" placeholder="e.g. newbranch" />
            </div>
            <div>
              <label className="form-label">School Type</label>
              <input {...register('schoolType')} className="form-input" placeholder="e.g. Secondary" />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">School Description</label>
            <textarea {...register('schoolDescription')} className="form-input" rows={3} placeholder="Brief description" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/school-applications')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : (<><Save size={18} style={{ marginRight: '0.5rem' }} /> Submit application</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSchoolApplication
