import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import api from '../../services/api'
import Loading from '../../components/Common/Loading'
import { ArrowLeft } from 'lucide-react'

const StudentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(['student', id], () => api.get(`/students/${id}`))

  if (isLoading) return <Loading />

  const student = data?.data?.student

  if (!student) {
    return (
      <div>
        <p>Student not found</p>
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
          <h2 className="card-title">Student Details</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Student ID</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{student.studentId || student.id}</p>
          </div>
          <div>
            <label className="form-label">Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {student.firstName} {student.lastName}
            </p>
          </div>
          <div>
            <label className="form-label">Email</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{student.email}</p>
          </div>
          <div>
            <label className="form-label">Class</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{student.className || 'N/A'}</p>
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
      </div>
    </div>
  )
}

export default StudentDetails

