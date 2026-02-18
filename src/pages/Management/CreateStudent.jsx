import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { studentsService, userManagementService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import logger from '../../utils/logger'

const DEFAULT_PASSWORD = 'Welcome2ZSM'

const CreateStudent = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const [loading, setLoading] = useState(false)
  const [showAddParent, setShowAddParent] = useState(false)
  const [creatingParent, setCreatingParent] = useState(false)
  const [newParentId, setNewParentId] = useState(null)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm()

  const selectedParentId = watch('parentId')
  const selectedClassId = watch('classId')
  const formSchoolId = watch('schoolId')

  const roleLower = String(user?.role ?? user?.Role ?? '').toLowerCase()
  const isAdmin = roleLower === 'admin'
  const schools = canUseSchoolSwitching ? availableSchools : []
  const schoolId = isAdmin ? (formSchoolId || selectedSchoolId || effectiveSchoolId || schools?.[0]?.id || schools?.[0]?.Id || '') : (user?.schoolId || user?.SchoolId || effectiveSchoolId || '')

  // Fetch classes for the school
  const { data: classesData, isLoading: classesLoading } = useQuery(
    ['classes-by-school', schoolId],
    () => userManagementService.getClassesBySchool(schoolId),
    {
      enabled: !!schoolId,
      retry: false,
      onError: (error) => {
        logger.error('Error fetching classes:', error)
        // Don't show toast on initial load if schoolId is missing
        if (schoolId) {
          toast.error('Failed to load classes')
        }
      }
    }
  )

  // Fetch parents dropdown (common endpoint) — scoped to this school's tenant; parents for this school listed first
  const { data: parentsData, isLoading: parentsLoading, refetch: refetchParents } = useQuery(
    ['parents-dropdown', schoolId],
    () => commonService.getParentsDropdown({ schoolId }),
    {
      enabled: !!schoolId,
      retry: false,
      onError: (error) => {
        logger.error('Error fetching parents:', error)
        if (schoolId) {
          toast.error('Failed to load parents')
        }
      }
    }
  )

  const classes = classesData?.data ?? classesData?.Data ?? []
  const parents = parentsData?.data ?? parentsData?.Data ?? []

  // Handle parent selection change
  useEffect(() => {
    if (selectedParentId && selectedParentId !== '') {
      setValue('relationship', '')
    }
  }, [selectedParentId, setValue])

  useEffect(() => {
    if (isAdmin && (availableSchools?.length > 0 || schools?.length > 0) && !formSchoolId) {
      const userSchoolId = user?.schoolId || user?.SchoolId
      const preferredId = userSchoolId && (availableSchools || schools).some((s) => (s.id || s.Id) === userSchoolId)
        ? userSchoolId
        : effectiveSchoolId || selectedSchoolId || availableSchools?.[0]?.id || availableSchools?.[0]?.Id || schools?.[0]?.id || schools?.[0]?.Id
      if (preferredId) setValue('schoolId', preferredId)
    }
  }, [isAdmin, availableSchools, schools, formSchoolId, effectiveSchoolId, selectedSchoolId, setValue, user?.schoolId, user?.SchoolId])

  // Create parent mutation
  const createParentMutation = useMutation(
    (data) => userManagementService.createParent(data),
    {
      onSuccess: (response) => {
        if (response?.data?.userId) {
          toast.success('Parent created successfully!')
          setShowAddParent(false)
          // Reset parent form
          setValue('parentFirstName', '')
          setValue('parentLastName', '')
          setValue('parentEmail', '')
          setValue('parentPhone', '')
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 
                           (error.response?.data?.errors && error.response.data.errors.length > 0 
                             ? error.response.data.errors[0] 
                             : 'Failed to create parent')
        toast.error(errorMessage)
      }
    }
  )

  const handleCreateParent = async (data) => {
    if (!data.parentFirstName || !data.parentLastName || !data.parentEmail) {
      toast.error('Please fill in all required parent fields')
      return
    }

    setCreatingParent(true)
    try {
      const parentData = {
        email: data.parentEmail,
        firstName: data.parentFirstName,
        lastName: data.parentLastName,
        phoneNumber: data.parentPhone || null,
        password: data.parentPassword || DEFAULT_PASSWORD,
        role: 'Parent',
        tenantId: user?.tenantId,
        schoolId: schoolId,
      }
      if (isAdmin && schoolId) parentData.schoolId = schoolId

      await createParentMutation.mutateAsync(parentData)

      // Refetch and select the newly created parent by email in a single round-trip
      const { data: updatedParents } = await refetchParents()
      const newParent = updatedParents?.data?.find((p) => {
        const parentEmail = (p.email || p.Email || '').toLowerCase()
        return parentEmail === (data.parentEmail || '').toLowerCase()
      })

      if (newParent) {
        setValue('parentId', newParent.id || newParent.Id)
      }
    } catch (error) {
      logger.error('Error creating parent:', error)
    } finally {
      setCreatingParent(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Transform form data to match API request
      const requestData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        dateOfBirth: data.dateOfBirth,
        classId: data.classId,
        address: data.address || null,
        studentId: data.studentId || null,
        admissionDate: data.admissionDate || null,
        gender: data.gender || null,
        parentId: data.parentId || null,
        relationship: data.relationship || null,
        password: data.password || DEFAULT_PASSWORD,
      }
      if (isAdmin && schoolId) requestData.schoolId = schoolId

      const response = await studentsService.createStudent(requestData)

      if (response && response.success) {
        toast.success(response.message || 'Student created successfully!')
        queryClient.invalidateQueries('students')
        navigate('/students')
      } else {
        const errorMessage = response?.message || 
                           (response?.errors && response.errors.length > 0 ? response.errors[0] : null) ||
                           'Failed to create student'
        toast.error(errorMessage)
      }
    } catch (error) {
      let errorMessage = 'Failed to create student. Please try again.'
      
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
      logger.error('Create student error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading only if we have a schoolId and are actually loading
  if ((classesLoading || parentsLoading) && schoolId) {
    return <Loading />
  }

  // If no schoolId, show a message
  if (!schoolId) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/students')}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Add New Student
          </h1>
        </div>
        <div className="card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Unable to load student creation form. Please ensure you are associated with a school.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/students')}
            >
              Back to Students
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
          onClick={() => navigate('/students')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Add New Student
        </h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)}>
          {isAdmin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">School <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                {...register('schoolId', {
                  required: isAdmin ? 'Please select a school' : false,
                  onChange: (e) => {
                    setSelectedSchoolId(e.target.value)
                    if (canSwitchSchools && e.target.value) switchSchoolMutation.mutate(e.target.value)
                  },
                })}
                className="form-input"
                disabled={switchSchoolMutation.isLoading}
              >
                <option value="">Select school</option>
                {Array.isArray(schools) && schools.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
              {errors.schoolId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.schoolId.message}</span>
              )}
            </div>
          )}
          {/* Personal Information */}
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Personal Information
          </h3>
          
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
                placeholder="student@example.com"
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
              <label className="form-label">
                Date of Birth <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className="form-input"
              />
              {errors.dateOfBirth && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.dateOfBirth.message}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Class <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                {...register('classId', { required: 'Class is required' })}
                className="form-input"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id || cls.Id} value={cls.id || cls.Id}>
                    {cls.name || cls.Name}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.classId.message}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Gender</label>
              <select {...register('gender')} className="form-input">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Admission Date</label>
              <input
                type="date"
                {...register('admissionDate')}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Address</label>
            <textarea
              {...register('address')}
              className="form-input"
              rows={3}
              placeholder="Enter address"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Student ID (Optional - Auto-generated if not provided)</label>
            <input
              {...register('studentId')}
              className="form-input"
              placeholder="Leave empty for auto-generation"
            />
          </div>

          {/* Parent Information */}
          <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)' }} />
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Parent Information (Optional)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label">Parent</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  {...register('parentId')}
                  className="form-input"
                  style={{ flex: 1 }}
                  disabled={showAddParent}
                >
                  <option value="">None - Create student without parent</option>
                  {parents.map((parent) => {
                    const parentName =
                      parent.name ||
                      parent.Name ||
                      [parent.firstName || parent.FirstName, parent.lastName || parent.LastName]
                        .filter(Boolean)
                        .join(' ')

                    const parentEmail = parent.email || parent.Email

                    return (
                      <option key={parent.id || parent.Id} value={parent.id || parent.Id}>
                        {parentName || 'Unnamed Parent'} {parentEmail ? `(${parentEmail})` : ''}
                      </option>
                    )
                  })}
                </select>
                {!showAddParent && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowAddParent(true)
                      setValue('parentId', '')
                    }}
                    title="Add New Parent"
                  >
                    <Plus size={16} />
                  </button>
                )}
                {showAddParent && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowAddParent(false)
                      setValue('parentId', '')
                    }}
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                Select an existing parent or add a new one
              </small>
            </div>

            <div>
              <label className="form-label">Relationship</label>
              <select
                {...register('relationship')}
                className="form-input"
                disabled={!selectedParentId || selectedParentId === ''}
              >
                <option value="">Select Relationship</option>
                <option value="Parent">Parent</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Add New Parent Form */}
          {showAddParent && (
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Add New Parent</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">
                    Parent First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('parentFirstName')}
                    className="form-input"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Parent Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    {...register('parentLastName')}
                    className="form-input"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">
                    Parent Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    {...register('parentEmail')}
                    className="form-input"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="form-label">Parent Phone</label>
                  <input
                    type="tel"
                    {...register('parentPhone')}
                    className="form-input"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Parent Password (Optional)</label>
                <input
                  type="password"
                  {...register('parentPassword')}
                  className="form-input"
                  placeholder="Leave empty for default password"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Default password: {DEFAULT_PASSWORD}
                </small>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit(handleCreateParent)}
                disabled={creatingParent}
              >
                {creatingParent ? 'Creating...' : 'Create Parent'}
              </button>
            </div>
          )}

          {/* Authentication */}
          <hr style={{ margin: '2rem 0', borderColor: 'var(--border-color)' }} />
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Authentication
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password (Optional)</label>
            <input
              type="password"
              {...register('password')}
              className="form-input"
              placeholder="Leave empty for default password"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              Default password will be used if not provided
            </small>
          </div>

          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--info-light)', 
            borderRadius: '0.5rem', 
            marginBottom: '1.5rem',
            border: '1px solid var(--info)'
          }}>
            <strong style={{ color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>ℹ️</span> Note:
            </strong>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
              The student will be created with the default password <strong>"{DEFAULT_PASSWORD}"</strong> if no password is provided.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/students')}
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
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateStudent
