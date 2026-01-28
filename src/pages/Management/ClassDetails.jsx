import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, School, Users } from 'lucide-react'
import { classesService } from '../../services/apiServices'

const ClassDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery(['class', id], () => classesService.getClass(id))

  if (isLoading) return <Loading />

  const classResponse = data?.data
  const cls =
    classResponse?.class ||
    classResponse?.data ||
    classResponse ||
    null

  if (!cls) {
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
          <h2 className="card-title">Class Details</h2>
          <p>Class not found.</p>
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
          <h2 className="card-title">Class Details</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label className="form-label">Class Name</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              <School size={16} style={{ marginRight: '0.5rem' }} />
              {cls.name || cls.Name}
            </p>
          </div>
          <div>
            <label className="form-label">Section</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {cls.section || cls.Section || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Capacity</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {cls.capacity || cls.Capacity || 'N/A'}
            </p>
          </div>
          <div>
            <label className="form-label">Current Students</label>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} />
              <span>{cls.currentStudentCount || cls.CurrentStudentCount || 0}</span>
            </p>
          </div>
          <div>
            <label className="form-label">Status</label>
            <p>
              <span className={`badge ${(cls.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                {(cls.isActive !== false) ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClassDetails

