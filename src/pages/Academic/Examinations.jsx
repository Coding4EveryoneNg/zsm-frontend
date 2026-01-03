import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { examinationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { ClipboardList, Clock, CheckCircle, Calendar, BookOpen, User } from 'lucide-react'

const Examinations = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('available') // available, completed, all
  const pageSize = 20

  // Get studentId from URL params for parent view
  const urlParams = new URLSearchParams(window.location.search)
  const studentId = urlParams.get('studentId')

  const { data, isLoading, error } = useQuery(
    ['examinations', page, filter, user?.role, studentId],
    () => {
      if (user?.role === 'Student' && filter === 'available') {
        return examinationsService.getAvailableExaminations()
      }
      const params = { page, pageSize }
      if (user?.role === 'Parent') {
        // Use parent-specific endpoint
        if (studentId) {
          params.studentId = studentId
        }
        return examinationsService.getParentExaminations(params)
      }
      return examinationsService.getExaminations(params)
    },
    { keepPreviousData: true }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading examinations</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const examinations = user?.role === 'Student' && filter === 'available'
    ? (data?.data?.examinations || data?.examinations || [])
    : (data?.data?.examinations || data?.examinations || [])
  const totalCount = data?.data?.totalCount || data?.totalCount || examinations.length
  const totalPages = Math.ceil(totalCount / pageSize)

  const getStatusBadge = (exam) => {
    if (exam.status === 'Submitted' || exam.status === 'Completed') {
      return (
        <span className="badge badge-success">
          <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
          {exam.status}
        </span>
      )
    }
    if (exam.status === 'Started' || exam.status === 'InProgress') {
      return (
        <span className="badge badge-info">
          <Clock size={14} style={{ marginRight: '0.25rem' }} />
          In Progress
        </span>
      )
    }
    return (
      <span className="badge badge-primary">
        <Clock size={14} style={{ marginRight: '0.25rem' }} />
        Available
      </span>
    )
  }

  const canTakeExam = (exam) => {
    if (user?.role !== 'Student') return false
    if (exam.status === 'Submitted' || exam.status === 'Completed') return false
    const startDate = exam.startDate ? new Date(exam.startDate) : null
    const endDate = exam.endDate ? new Date(exam.endDate) : null
    const now = new Date()
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    return true
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Examinations
          </h1>
          {user?.role === 'Parent' && studentId && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Viewing examinations for selected child
            </p>
          )}
        </div>
        {user?.role === 'Teacher' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/examinations/create')}
          >
            Create Examination
          </button>
        )}
      </div>

      {/* Filter Tabs for Students */}
      {user?.role === 'Student' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filter === 'available' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('available')}
          >
            Available
          </button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      )}

      {/* Examinations List */}
      {examinations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {examinations.map((exam, idx) => (
            <div
              key={exam.id || exam.Id || idx}
              className="card"
              style={{
                borderLeft: `4px solid ${exam.status === 'Submitted' || exam.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ClipboardList size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                      {exam.title}
                    </h3>
                    {getStatusBadge(exam)}
                  </div>
                  
                  {exam.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {exam.description.length > 150 
                        ? `${exam.description.substring(0, 150)}...` 
                        : exam.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {exam.subjectName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BookOpen size={14} />
                        <span>{exam.subjectName}</span>
                      </div>
                    )}
                    {exam.className && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={14} />
                        <span>{exam.className}</span>
                      </div>
                    )}
                    {exam.startDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>Start: {new Date(exam.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {exam.durationMinutes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        <span>Duration: {exam.durationMinutes} minutes</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/examinations/${exam.id || exam.Id}`)}
                    >
                      View Details
                    </button>
                    {user?.role === 'Student' && canTakeExam(exam) && (
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/examinations/${exam.id || exam.Id}/take`)}
                      >
                        {exam.status === 'Started' ? 'Continue Exam' : 'Take Exam'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No examinations found</p>
            <p className="empty-state-subtext">
              {filter === 'available' 
                ? 'No available examinations at this time' 
                : filter === 'completed'
                ? 'You have no completed examinations'
                : 'No examinations available'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Examinations
