import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { coursesService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { BookOpen, Clock, CheckCircle, User, FileText, AlertCircle, X } from 'lucide-react'
import logger from '../../utils/logger'

const Courses = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [errorModal, setErrorModal] = useState(null)
  const pageSize = 20

  // Get studentId from URL params for parent view
  const urlParams = new URLSearchParams(window.location.search)
  const studentId = urlParams.get('studentId')

  const { data, isLoading, error } = useQuery(
    ['courses', page, user?.role, studentId],
    () => {
      const params = { page, pageSize }
      // Courses endpoint already supports parent role through GetCoursesQuery
      // If studentId is provided, it can be used for filtering on the client side
      return coursesService.getCourses(params)
    },
    { keepPreviousData: true }
  )

  // Handle errors by showing them in a modal instead of blank page
  useEffect(() => {
    if (error) {
      const errorMessage = error?.errors?.[0] || 
                          error?.message || 
                          error?.response?.data?.errors?.[0] ||
                          error?.response?.data?.message ||
                          'Please try again later'
      const errorList = error?.errors || error?.response?.data?.errors || []
      
      setErrorModal({
        title: 'Error Loading Courses',
        message: errorMessage,
        errors: errorList.length > 1 ? errorList : []
      })
      logger.error('Courses error:', error)
    } else if (data && data.success === false) {
      const errorMsg = data.errors?.[0] || data.message || 'Failed to load courses'
      const errorList = data.errors || []
      
      setErrorModal({
        title: 'Error Loading Courses',
        message: errorMsg,
        errors: errorList.length > 1 ? errorList : []
      })
    } else {
      setErrorModal(null)
    }
  }, [error, data])

  if (isLoading) return <Loading />

  // API returns: { success: true, data: [array of courses], errors: [] }
  // After axios interceptor: { success: true, data: [array of courses], errors: [] }
  // Handle both ApiResponse structure and direct array
  let courses = []
  if (data && data.success !== false) {
    // Extract courses from ApiResponse structure
    courses = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
  }
  
  const totalCount = courses.length
  const totalPages = Math.ceil(totalCount / pageSize)

  // Debug: Log the response to see structure
  logger.debug('Courses data:', { data, courses, coursesLength: courses.length })

  const getStatusBadge = (course) => {
    // CourseListItemResponse doesn't have status, so we'll show based on level or just a default badge
    const level = course.level || course.Level || 'Course'
    return (
      <span className="badge badge-primary">
        <BookOpen size={14} style={{ marginRight: '0.25rem' }} />
        {level}
      </span>
    )
  }

  return (
    <div className="page-container">
      {/* Error Modal */}
      {errorModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
          onClick={() => setErrorModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--danger-light)', borderBottom: '2px solid var(--danger)' }}>
              <h2 className="card-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} />
                {errorModal.title}
              </h2>
              <button className="btn btn-sm btn-outline" onClick={() => setErrorModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-primary)', marginBottom: errorModal.errors.length > 0 ? '1rem' : 0 }}>
                {errorModal.message}
              </p>
              {errorModal.errors.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Additional errors:</p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                    {errorModal.errors.map((err, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setErrorModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Courses
        </h1>
        {user?.role === 'Parent' && studentId && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Viewing courses for selected child
          </p>
        )}
      </div>

      {courses.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course) => (
            <div
              key={course.id || course.Id}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderTop: `4px solid var(--primary)`
              }}
              onClick={() => navigate(`/courses/${course.id || course.Id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {course.title || course.Title || 'Untitled Course'}
                  </h3>
                  {getStatusBadge(course)}
                </div>
              </div>

              {(course.description || course.Description) && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5', fontSize: '0.875rem' }}>
                  {(() => {
                    const desc = course.description || course.Description || ''
                    return desc.length > 120 ? `${desc.substring(0, 120)}...` : desc
                  })()}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {(course.subjectName || course.SubjectName) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={14} />
                    <span>{course.subjectName || course.SubjectName}</span>
                  </div>
                )}
                {(course.courseCode || course.CourseCode) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FileText size={14} />
                    <span>Code: {course.courseCode || course.CourseCode}</span>
                  </div>
                )}
                {(course.level || course.Level) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Level: {course.level || course.Level}</span>
                  </div>
                )}
                {(course.createdAt || course.CreatedAt) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    <span>Created: {new Date(course.createdAt || course.CreatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No courses found</p>
            <p className="empty-state-subtext">No courses available at this time</p>
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

export default Courses
