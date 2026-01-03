import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { paymentsService, studentsService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CreatePayment = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const selectedStudentId = watch('studentId')

  // Fetch students for dropdown
  const { data: studentsData, isLoading: studentsLoading } = useQuery(
    ['students-dropdown'],
    () => commonService.getStudentsDropdown({ pageSize: 100 })
  )

  const students = studentsData?.data?.students || studentsData?.data || []

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // For now, we'll create a simplified payment request
      // Note: FeeStructureId might need to be handled differently
      // This is a simplified version - you may need to adjust based on your fee structure setup
      const requestData = {
        studentId: data.studentId,
        amount: parseFloat(data.amount),
        paymentType: data.paymentType || 'Full',
        description: data.description || null,
        dueDate: data.dueDate,
        term: data.term || null,
        session: data.session || null,
      }

      // If feeStructureId is available, include it
      // Otherwise, you may need to create a fee structure first or use a default
      if (data.feeStructureId) {
        requestData.feeStructureId = data.feeStructureId
      }

      const response = await paymentsService.createPayment(requestData)

      if (response && response.success !== false) {
        toast.success('Payment created successfully!')
        navigate('/payments')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create payment'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create payment. Please try again.'
      
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
      console.error('Create payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (studentsLoading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/payments')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Payment
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Student <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              {...register('studentId', { required: 'Student is required' })}
              className="form-input"
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id || student.Id} value={student.id || student.Id}>
                  {student.firstName || student.FirstName} {student.lastName || student.LastName} 
                  {student.email ? ` (${student.email || student.Email})` : ''}
                </option>
              ))}
            </select>
            {errors.studentId && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.studentId.message}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Amount <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="form-input"
                placeholder="0.00"
                min="0.01"
              />
              {errors.amount && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.amount.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Payment Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                {...register('paymentType', { required: 'Payment type is required' })}
                className="form-input"
              >
                <option value="Full">Full Payment</option>
                <option value="Partial">Partial Payment</option>
                <option value="Installment">Installment</option>
              </select>
              {errors.paymentType && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.paymentType.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Due Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.dueDate && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.dueDate.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Term</label>
              <input
                {...register('term')}
                className="form-input"
                placeholder="e.g., First Term, Second Term"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Session</label>
            <input
              {...register('session')}
              className="form-input"
              placeholder="e.g., 2023/2024"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea
              {...register('description', { maxLength: { value: 500, message: 'Description cannot exceed 500 characters' } })}
              className="form-input"
              rows={3}
              placeholder="Enter payment description (optional)"
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
              onClick={() => navigate('/payments')}
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
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePayment
