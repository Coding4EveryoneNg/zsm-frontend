import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'
import { ArrowLeft, Power } from 'lucide-react'
import { studentsService, userManagementService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'

const StudentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['student', id],
    () => studentsService.getStudent(id),
    { enabled: !!id }
  )

  const toggleMutation = useMutation(
    (userId) => userManagementService.toggleUserStatus(userId),
    {
      onSuccess: (res) => {
        const success = res?.data?.success ?? res?.success
        if (success) {
          toast.success(res?.data?.message || 'Status updated successfully')
          queryClient.invalidateQueries(['student', id])
          queryClient.invalidateQueries('students')
          setToggleConfirm(null)
        } else {
          toast.error(res?.data?.errors?.[0] || res?.data?.message || 'Failed to update status')
        }
      },
      onError: (err) => {
        handleError(err, 'Failed to update status')
        setToggleConfirm(null)
      },
    }
  )

  if (isLoading) return <Loading />

  // API returns { success, data: <student payload> }; support both camelCase and PascalCase
  const rawPayload = data?.data ?? data?.Data ?? data
  const rawStudent = rawPayload && typeof rawPayload === 'object' && ('id' in rawPayload || 'Id' in rawPayload)
    ? rawPayload
    : null
  const roleLower = (user?.role ?? user?.Role ?? '').toString().toLowerCase()
  const showAttendance = ['admin', 'principal', 'parent', 'teacher'].includes(roleLower)

  // Normalize to camelCase for display (API may return PascalCase)
  const student = rawStudent ? {
    id: rawStudent.id ?? rawStudent.Id,
    studentId: rawStudent.studentId ?? rawStudent.StudentId,
    studentNumber: rawStudent.studentNumber ?? rawStudent.StudentNumber,
    firstName: rawStudent.firstName ?? rawStudent.FirstName,
    lastName: rawStudent.lastName ?? rawStudent.LastName,
    email: rawStudent.email ?? rawStudent.Email,
    phoneNumber: rawStudent.phoneNumber ?? rawStudent.PhoneNumber,
    className: rawStudent.className ?? rawStudent.ClassName,
    classId: rawStudent.classId ?? rawStudent.ClassId,
    gender: rawStudent.gender ?? rawStudent.Gender,
    dateOfBirth: rawStudent.dateOfBirth ?? rawStudent.DateOfBirth,
    admissionDate: rawStudent.admissionDate ?? rawStudent.AdmissionDate,
    address: rawStudent.address ?? rawStudent.Address,
    schoolName: rawStudent.schoolName ?? rawStudent.SchoolName,
    isActive: rawStudent.isActive ?? rawStudent.IsActive,
    parentId: rawStudent.parentId ?? rawStudent.ParentId,
    parentName: rawStudent.parentName ?? rawStudent.ParentName,
    parentEmail: rawStudent.parentEmail ?? rawStudent.ParentEmail,
    parentPhone: rawStudent.parentPhone ?? rawStudent.ParentPhone,
    relationship: rawStudent.relationship ?? rawStudent.Relationship,
    userId: rawStudent.userId ?? rawStudent.UserId,
    attendancePercentCurrentTerm: rawStudent.attendancePercentCurrentTerm ?? rawStudent.AttendancePercentCurrentTerm,
    attendanceTotalDays: rawStudent.attendanceTotalDays ?? rawStudent.AttendanceTotalDays,
    attendancePresentDays: rawStudent.attendancePresentDays ?? rawStudent.AttendancePresentDays,
  } : null

  if (isError) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="card">
          <h2 className="card-title">Student Details</h2>
          <p style={{ color: 'var(--text-danger, #dc3545)', marginBottom: '1rem' }}>
            {error?.response?.data?.message || error?.message || 'Failed to load student.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="card">
          <h2 className="card-title">Student Details</h2>
          <p>Student not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Student Details</h2>
          <button
            className={student.isActive ? 'btn btn-warning' : 'btn btn-info'}
            onClick={() => setToggleConfirm(student)}
            disabled={toggleMutation.isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Power size={16} />
            {student.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Student Number</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
              {student.studentNumber || student.studentId || student.id}
            </p>
          </div>
          <div>
            <label className="form-label">Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
              {student.firstName} {student.lastName}
            </p>
          </div>
          <div>
            <label className="form-label">Email</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.email}</p>
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.phoneNumber || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Class</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.className || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Gender</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.gender || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Date of Birth</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Admission Date</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <p>
              <span className={`badge ${student.isActive ? 'badge-success' : 'badge-danger'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        {showAttendance && (student.attendancePercentCurrentTerm != null || student.attendanceTotalDays != null) && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Attendance (term to date)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {student.attendancePercentCurrentTerm != null && (
                <div>
                  <label className="form-label">Attendance % till date</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
                    {Number(student.attendancePercentCurrentTerm).toFixed(1)}%
                  </p>
                </div>
              )}
              {student.attendancePresentDays != null && (
                <div>
                  <label className="form-label">Days present</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.attendancePresentDays}</p>
                </div>
              )}
              {student.attendanceTotalDays != null && (
                <div>
                  <label className="form-label">Total days</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.attendanceTotalDays}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {student.parentName || student.parentEmail || student.parentPhone ? (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Parent Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {student.parentName && (
                <div>
                  <label className="form-label">Parent Name</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
                    {student.parentName}
                  </p>
                </div>
              )}
              {student.relationship && (
                <div>
                  <label className="form-label">Relationship</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                    {student.relationship}
                  </p>
                </div>
              )}
              {student.parentEmail && (
                <div>
                  <label className="form-label">Parent Email</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.parentEmail}</p>
                </div>
              )}
              {student.parentPhone && (
                <div>
                  <label className="form-label">Parent Phone</label>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{student.parentPhone}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No parent or guardian information on file.
          </p>
        )}

        {toggleConfirm && (
          <ConfirmDialog
            isOpen={!!toggleConfirm}
            onClose={() => setToggleConfirm(null)}
            onConfirm={() => {
              const userId = toggleConfirm.userId ?? toggleConfirm.UserId
              if (userId) toggleMutation.mutate(userId)
            }}
            title={toggleConfirm.isActive ? 'Deactivate Student' : 'Activate Student'}
            message={`Are you sure you want to ${toggleConfirm.isActive ? 'deactivate' : 'activate'} ${toggleConfirm.firstName} ${toggleConfirm.lastName}?`}
            confirmText={toggleConfirm.isActive ? 'Deactivate' : 'Activate'}
            variant={toggleConfirm.isActive ? 'warning' : 'info'}
          />
        )}
      </div>
    </div>
  )
}

export default StudentDetails

