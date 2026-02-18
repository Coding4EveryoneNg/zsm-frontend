import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'
import { ArrowLeft, Power } from 'lucide-react'
import { teachersService, userManagementService } from '../../services/apiServices'

const TeacherDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const { data, isLoading } = useQuery(['teacher', id], () => teachersService.getTeacher(id))

  const toggleMutation = useMutation(
    (userId) => userManagementService.toggleUserStatus(userId),
    {
      onSuccess: (res) => {
        const success = res?.data?.success ?? res?.success
        if (success) {
          toast.success(res?.data?.message || 'Status updated successfully')
          queryClient.invalidateQueries(['teacher', id])
          queryClient.invalidateQueries('teachers')
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

  // Support different possible API response shapes:
  // { teacher: { ... } } or { data: { ... } } or plain { ... }
  const teacherResponse = data?.data
  const teacher =
    teacherResponse?.teacher ||
    teacherResponse?.data ||
    teacherResponse ||
    null

  if (!teacher) {
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
          <h2 className="card-title">Teacher Details</h2>
          <p>Teacher not found.</p>
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
          <h2 className="card-title">Teacher Details</h2>
          <button
            className={teacher.isActive ? 'btn btn-warning' : 'btn btn-info'}
            onClick={() => setToggleConfirm(teacher)}
            disabled={toggleMutation.isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Power size={16} />
            {teacher.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Employee ID</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
              {teacher.employeeId || teacher.id}
            </p>
          </div>
          <div>
            <label className="form-label">Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>
          <div>
            <label className="form-label">Email</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{teacher.email}</p>
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{teacher.phoneNumber || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Department</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{teacher.department || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Specialization</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{teacher.specialization || 'N/A'}</p>
          </div>
          <div>
            <label className="form-label">Hire Date</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Experience (Years)</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {teacher.experience ?? 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Salary</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {teacher.salary != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(teacher.salary) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <p>
              <span className={`badge ${teacher.isActive ? 'badge-success' : 'badge-danger'}`}>
                {teacher.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {toggleConfirm && (
        <ConfirmDialog
          isOpen={!!toggleConfirm}
          onClose={() => setToggleConfirm(null)}
          onConfirm={() => {
            const userId = toggleConfirm.userId ?? toggleConfirm.UserId
            if (userId) toggleMutation.mutate(userId)
          }}
          title={toggleConfirm.isActive ? 'Deactivate Teacher' : 'Activate Teacher'}
          message={`Are you sure you want to ${toggleConfirm.isActive ? 'deactivate' : 'activate'} ${toggleConfirm.firstName} ${toggleConfirm.lastName}?`}
          confirmText={toggleConfirm.isActive ? 'Deactivate' : 'Activate'}
          variant={toggleConfirm.isActive ? 'warning' : 'info'}
        />
      )}
    </div>
  )
}

export default TeacherDetails

