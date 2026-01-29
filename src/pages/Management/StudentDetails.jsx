import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft } from 'lucide-react'
import { studentsService } from '../../services/apiServices'

const StudentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['student', id],
    () => studentsService.getStudent(id),
    { enabled: !!id }
  )

  if (isLoading) return <Loading />

  // API returns { success, data: <student payload> }; axios puts response body in data
  const student = data?.data ?? null

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
        <div className="card-header">
          <h2 className="card-title">Student Details</h2>
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
      </div>
    </div>
  )
}

export default StudentDetails

