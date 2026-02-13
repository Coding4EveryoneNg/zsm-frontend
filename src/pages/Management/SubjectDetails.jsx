import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react'
import { subjectsService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'

const SubjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isStudent = (user?.role ?? user?.Role ?? '').toString().toLowerCase() === 'student'

  const { data, isLoading } = useQuery(
    ['subject', id, isStudent],
    () => (isStudent ? subjectsService.getStudentSubject(id) : subjectsService.getSubject(id))
  )

  if (isLoading) return <Loading />

  const subjectResponse = data?.data ?? data
  const subject =
    subjectResponse?.subject ||
    subjectResponse?.Subject ||
    subjectResponse?.data ||
    subjectResponse ||
    null

  if (!subject) {
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
          <h2 className="card-title">Subject Details</h2>
          <p>Subject not found.</p>
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
          <h2 className="card-title">Subject Details</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Subject Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              <BookOpen size={16} style={{ marginRight: '0.5rem' }} />
              {subject.name || subject.Name}
            </p>
          </div>
          <div>
            <label className="form-label">Code</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {subject.code || subject.Code || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Description</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {subject.description || subject.Description || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <p>
              <span className={`badge ${(subject.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                {(subject.isActive !== false) ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          {(subject.teacherNames ?? subject.TeacherNames ?? []).length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Teacher(s)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {(subject.teacherNames ?? subject.TeacherNames ?? []).map((name, idx) => (
                  <span key={idx} className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GraduationCap size={14} />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubjectDetails

