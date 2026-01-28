import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { subjectsService } from '../../services/apiServices'

const SubjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery(['subject', id], () => subjectsService.getSubject(id))

  if (isLoading) return <Loading />

  const subjectResponse = data?.data
  const subject =
    subjectResponse?.subject ||
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
        </div>
      </div>
    </div>
  )
}

export default SubjectDetails

