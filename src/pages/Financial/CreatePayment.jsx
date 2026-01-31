import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { paymentsService, commonService } from '../../services/apiServices'
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
    setValue,
    formState: { errors },
  } = useForm()

  const selectedStudentId = watch('studentId')
  const selectedFeeStructureId = watch('feeStructureId')
  const paymentType = watch('paymentType')

  // Fetch students and fee structures for dropdowns
  const { data: studentsData, isLoading: studentsLoading } = useQuery(
    ['students-dropdown'],
    () => commonService.getStudentsDropdown({ pageSize: 100 })
  )
  const students = studentsData?.data ?? []
  const selectedStudent = students?.find((s) => (s.id || s.Id) === selectedStudentId)
  const schoolIdForFees = selectedStudent?.schoolId || selectedStudent?.SchoolId
  const classIdForFees = selectedStudent?.classId || selectedStudent?.ClassId

  const { data: feeStructuresData } = useQuery(
    ['fee-structures-dropdown', schoolIdForFees, classIdForFees],
    () => commonService.getFeeStructuresDropdown(
      schoolIdForFees ? { schoolId: schoolIdForFees, ...(classIdForFees && { classId: classIdForFees }) } : {}
    ),
    { enabled: true }
  )

  const feeStructures = feeStructuresData?.data ?? []

  // Auto-fill amount when Full Payment selected and fee structure chosen
  useEffect(() => {
    if (paymentType === 'Full' && selectedFeeStructureId && feeStructures.length > 0) {
      const fs = feeStructures.find((f) => (f.id || f.Id) === selectedFeeStructureId)
      if (fs && (fs.amount ?? fs.Amount) != null) {
        setValue('amount', fs.amount ?? fs.Amount)
      }
    }
  }, [paymentType, selectedFeeStructureId, feeStructures, setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const requestData = {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: parseFloat(data.amount),
        paymentType: data.paymentType || 'Full',
        description: data.description || null,
        dueDate: data.dueDate,
        termId: data.termId || null,
      }

      const response = await paymentsService.createPayment(requestData)
      const body = response?.data

      if (body?.success !== false && body?.data) {
        toast.success(body?.message || 'Payment created successfully!')
        navigate('/payments')
      } else {
        const errorMessage = body?.errors?.[0] || body?.message || 'Failed to create payment'
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
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Create a payment for a student. Select what the payment is for from the fee structures configured for your school.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">
                Student <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                {...register('studentId', { required: 'Student is required' })}
                className="form-input"
              >
                <option value="">Select Student</option>
                {Array.isArray(students) && students.map((student) => (
                  <option key={student.id || student.Id} value={student.id || student.Id}>
                    {student.name || student.Name || `${student.firstName || student.FirstName} ${student.lastName || student.LastName}`}
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

            <div>
              <label className="form-label">
                What is being paid for <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                {...register('feeStructureId', { required: 'Please select what is being paid for' })}
                className="form-input"
              >
                <option value="">Select payment type</option>
                {Array.isArray(feeStructures) && feeStructures.map((fs) => (
                  <option key={fs.id || fs.Id} value={fs.id || fs.Id}>
                    {fs.name || fs.Name} - {typeof (fs.amount ?? fs.Amount) === 'number' ? (fs.amount ?? fs.Amount).toLocaleString() : (fs.amount ?? fs.Amount)}
                  </option>
                ))}
              </select>
              {errors.feeStructureId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.feeStructureId.message}
                </span>
              )}
              {Array.isArray(feeStructures) && feeStructures.length === 0 && !studentsLoading && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                  No fee structures found. Contact your admin to add fees (school fees, books, etc.) in Settings.
                </span>
              )}
            </div>
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
                <option value="Full">Full Payment (amount auto-filled from fee)</option>
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
              <label className="form-label">Term (optional)</label>
              <input
                {...register('term')}
                className="form-input"
                placeholder="Auto-detected if not selected"
              />
            </div>
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
