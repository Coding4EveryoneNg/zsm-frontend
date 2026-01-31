import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { paymentsService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_CATEGORY_SCHOOL_FEES = 'SchoolFees'
const PAYMENT_CATEGORY_OTHER = 'Other'

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
  } = useForm({
    defaultValues: { paymentCategory: PAYMENT_CATEGORY_OTHER },
  })

  const selectedStudentId = watch('studentId')
  const paymentCategory = watch('paymentCategory')
  const selectedTermId = watch('termId')
  const selectedFeeStructureId = watch('feeStructureId')
  const paymentType = watch('paymentType')

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery(
    ['students-dropdown'],
    () => commonService.getStudentsDropdown({ pageSize: 100 })
  )
  const students = studentsData?.data ?? studentsData?.Data ?? []
  const selectedStudent = students?.find((s) => (s.id || s.Id) === selectedStudentId)
  const schoolIdForFees = selectedStudent?.schoolId || selectedStudent?.SchoolId
  const classIdForFees = selectedStudent?.classId || selectedStudent?.ClassId

  // Terms dropdown - when School Fees selected (filter by school when student selected)
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForFees, paymentCategory],
    () => commonService.getTermsDropdown(schoolIdForFees ? { schoolId: schoolIdForFees } : {}),
    { enabled: paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES }
  )
  const terms = termsData?.data ?? termsData?.Data ?? []

  // Fee structures for School Fees by term - when term selected
  const { data: schoolFeesData } = useQuery(
    ['fee-structures-dropdown', schoolIdForFees, classIdForFees, selectedTermId],
    () => commonService.getFeeStructuresDropdown(
      schoolIdForFees
        ? {
            schoolId: schoolIdForFees,
            ...(classIdForFees && { classId: classIdForFees }),
            termId: selectedTermId || undefined,
            feeCategory: PAYMENT_CATEGORY_SCHOOL_FEES,
          }
        : {}
    ),
    { enabled: !!schoolIdForFees && !!selectedTermId && paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES }
  )
  const schoolFeesForTerm = schoolFeesData?.data ?? schoolFeesData?.Data ?? []
  const matchedSchoolFee = schoolFeesForTerm?.[0]

  // Fee structures for Books/Other - exclude school fees (school fees are term-based)
  const { data: otherFeesData } = useQuery(
    ['fee-structures-dropdown-other', schoolIdForFees, classIdForFees],
    () => commonService.getFeeStructuresDropdown(
      schoolIdForFees
        ? {
            schoolId: schoolIdForFees,
            ...(classIdForFees && { classId: classIdForFees }),
            feeCategory: 'ExcludeSchoolFees',
          }
        : {}
    ),
    { enabled: !!schoolIdForFees && paymentCategory === PAYMENT_CATEGORY_OTHER }
  )
  const otherFees = otherFeesData?.data ?? otherFeesData?.Data ?? []
  const selectedFeeStructure = otherFees?.find((f) => (f.id || f.Id) === selectedFeeStructureId)

  // When School Fees + term selected: set feeStructureId and amount from matched school fee
  useEffect(() => {
    if (paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES && selectedTermId && matchedSchoolFee) {
      setValue('feeStructureId', matchedSchoolFee.id || matchedSchoolFee.Id)
      if (paymentType === 'Full') {
        setValue('amount', matchedSchoolFee.amount ?? matchedSchoolFee.Amount ?? 0)
      }
    }
  }, [paymentCategory, selectedTermId, matchedSchoolFee, paymentType, setValue])

  // When Other + fee structure selected: auto-fill amount for Full Payment
  useEffect(() => {
    if (
      paymentCategory === PAYMENT_CATEGORY_OTHER &&
      paymentType === 'Full' &&
      selectedFeeStructure &&
      (selectedFeeStructure.amount ?? selectedFeeStructure.Amount) != null
    ) {
      setValue('amount', selectedFeeStructure.amount ?? selectedFeeStructure.Amount)
    }
  }, [paymentCategory, paymentType, selectedFeeStructure, setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      let feeStructureId = data.feeStructureId
      let termId = data.termId || null

      if (paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES && matchedSchoolFee) {
        feeStructureId = matchedSchoolFee.id || matchedSchoolFee.Id
        termId = selectedTermId || null
      }

      if (paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES) {
        if (!selectedTermId) {
          toast.error('Please select a term for school fees')
          setLoading(false)
          return
        }
        if (!matchedSchoolFee) {
          toast.error('No school fee configured for this term. Add one in Settings → Fee Structures.')
          setLoading(false)
          return
        }
      } else if (!feeStructureId) {
        toast.error('Please select what is being paid for')
        setLoading(false)
        return
      }

      const requestData = {
        studentId: data.studentId,
        feeStructureId,
        amount: parseFloat(data.amount),
        paymentType: data.paymentType || 'Full',
        description: data.description || null,
        dueDate: data.dueDate,
        termId: termId || null,
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
        if (errorData.message) errorMessage = errorData.message
        else if (errorData.errors?.length) errorMessage = errorData.errors[0]
      } else if (error.message) errorMessage = error.message
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
        <button className="btn btn-secondary" onClick={() => navigate('/payments')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Add New Payment</h1>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Create a payment for a student. Select school fees (by term) or books/other payments.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Student <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                {...register('studentId', { required: 'Student is required' })}
                className="form-input"
                onChange={() => {
                  setValue('termId', '')
                  setValue('feeStructureId', '')
                }}
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
              <label className="form-label">What is being paid for <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                {...register('paymentCategory', { required: true })}
                className="form-input"
                onChange={(e) => {
                  setValue('paymentCategory', e.target.value)
                  setValue('termId', '')
                  setValue('feeStructureId', '')
                }}
              >
                <option value={PAYMENT_CATEGORY_SCHOOL_FEES}>School Fees</option>
                <option value={PAYMENT_CATEGORY_OTHER}>Books / Other</option>
              </select>
            </div>
          </div>

          {paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Term <span style={{ color: '#ef4444' }}>*</span></label>
              {!schoolIdForFees && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  Select a student first to load terms for their school.
                </p>
              )}
              <select
                {...register('termId', {
                  required: paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES ? 'Select term for school fees' : false,
                })}
                className="form-input"
                onChange={(e) => setValue('termId', e.target.value)}
              >
                <option value="">Select term</option>
                {Array.isArray(terms) && terms.map((t) => (
                  <option key={t.id || t.Id} value={t.id || t.Id}>
                    {t.name || t.Name} {t.sessionName ? `(${t.sessionName})` : ''}
                  </option>
                ))}
              </select>
              {errors.termId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.termId.message}
                </span>
              )}
              {selectedTermId && !matchedSchoolFee && terms.length > 0 && (
                <span style={{ color: 'var(--warning)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                  No school fee configured for this term. Add one in Settings → Fee Structures.
                </span>
              )}
            </div>
          )}

          {paymentCategory === PAYMENT_CATEGORY_OTHER && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Payment type <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                {...register('feeStructureId', {
                  required: paymentCategory === PAYMENT_CATEGORY_OTHER ? 'Select what is being paid for' : false,
                })}
                className="form-input"
              >
                <option value="">Select (Books, Other fees...)</option>
                {Array.isArray(otherFees) && otherFees.map((fs) => (
                  <option key={fs.id || fs.Id} value={fs.id || fs.Id}>
                    {fs.name || fs.Name} - {typeof (fs.amount ?? fs.Amount) === 'number' ? (fs.amount ?? fs.Amount).toLocaleString() : fs.amount ?? fs.Amount}
                  </option>
                ))}
              </select>
              {errors.feeStructureId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.feeStructureId.message}
                </span>
              )}
              {otherFees.length === 0 && schoolIdForFees && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                  No books or other fees found. Add them in Settings → Fee Structures.
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Amount <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' },
                })}
                className="form-input"
                placeholder="0.00"
                min="0.01"
                readOnly={paymentCategory === PAYMENT_CATEGORY_SCHOOL_FEES && !!matchedSchoolFee && paymentType === 'Full'}
              />
              {errors.amount && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.amount.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">Payment Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select {...register('paymentType', { required: 'Payment type is required' })} className="form-input">
                <option value="Full">Full Payment (amount auto-filled)</option>
                <option value="Partial">Partial Payment</option>
                <option value="Installment">Installment</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Due Date <span style={{ color: '#ef4444' }}>*</span></label>
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
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea
              {...register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })}
              className="form-input"
              rows={3}
              placeholder="Optional"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/payments')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : <><Save size={18} style={{ marginRight: '0.5rem' }} /> Add Payment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePayment
