import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft } from 'lucide-react'
import { teachersService } from '../../services/apiServices'

const TeacherDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery(['teacher', id], () => teachersService.getTeacher(id))

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
        <div className="card-header">
          <h2 className="card-title">Teacher Details</h2>
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
    </div>
  )
}

export default TeacherDetails

