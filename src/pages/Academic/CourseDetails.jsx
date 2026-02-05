import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { coursesService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import { ArrowLeft, BookOpen, FileText, Download, Clock, User, Calendar, Upload, X, Plus, ArrowUp, ArrowDown, GripVertical, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import logger from '../../utils/logger'
import { formatDecimal } from '../../utils/safeUtils'

const CourseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [isRequired, setIsRequired] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fileToDelete, setFileToDelete] = useState(null)

  const { data, isLoading, error } = useQuery(
    ['course', id],
    () => coursesService.getCourse(id),
    { enabled: !!id }
  )

  const uploadMutation = useMutation(
    (formData) => coursesService.uploadCourseMaterial(id, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        setShowUploadModal(false)
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setIsRequired(false)
        toast.success('Material uploaded successfully!')
      },
      onError: (err) => {
        logger.error('Error uploading material:', err)
        const errorMessage = err?.response?.data?.errors?.[0] || err?.message || 'Failed to upload material'
        toast.error(errorMessage)
      }
    }
  )

  const deleteMutation = useMutation(
    (fileId) => coursesService.deleteFile(fileId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        toast.success('File deleted successfully!')
        setShowDeleteConfirm(false)
        setFileToDelete(null)
      },
      onError: (err) => {
        logger.error('Error deleting file:', err)
        const errorMessage = err?.response?.data?.errors?.[0] || err?.message || 'Failed to delete file'
        toast.error(errorMessage)
        setShowDeleteConfirm(false)
        setFileToDelete(null)
      }
    }
  )

  const reorderMutation = useMutation(
    (data) => coursesService.reorderMaterials(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        toast.success('Materials reordered successfully!')
      },
      onError: (err) => {
        logger.error('Error reordering materials:', err)
        const errorMessage = err?.response?.data?.errors?.[0] || err?.message || 'Failed to reorder materials'
        toast.error(errorMessage)
      }
    }
  )

  const handleMoveUp = (index) => {
    if (index === 0 || materials.length === 0) return
    
    const newMaterials = [...materials]
    const temp = newMaterials[index]
    newMaterials[index] = newMaterials[index - 1]
    newMaterials[index - 1] = temp
    
    // Update order values
    const reorderData = newMaterials.map((m, idx) => ({
      materialId: m.id || m.Id,
      order: idx + 1
    }))
    
    reorderMutation.mutate({ materialOrders: reorderData })
  }

  const handleMoveDown = (index) => {
    if (index === materials.length - 1 || materials.length === 0) return
    
    const newMaterials = [...materials]
    const temp = newMaterials[index]
    newMaterials[index] = newMaterials[index + 1]
    newMaterials[index + 1] = temp
    
    // Update order values
    const reorderData = newMaterials.map((m, idx) => ({
      materialId: m.id || m.Id,
      order: idx + 1
    }))
    
    reorderMutation.mutate({ materialOrders: reorderData })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      toast.error('Please select a file')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('title', uploadTitle)
    if (uploadDescription) formData.append('description', uploadDescription)
    formData.append('isRequired', isRequired.toString())
    formData.append('order', (materials.length + 1).toString()) // Set order to next available

    uploadMutation.mutate(formData)
  }

  const handleDelete = (fileId) => {
    setFileToDelete(fileId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete)
    }
  }

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
        title: 'Error Loading Course',
        message: errorMessage,
        errors: errorList.length > 1 ? errorList : []
      })
      logger.error('Course details error:', error)
    } else if (data && data.success === false) {
      const errorMsg = data.errors?.[0] || data.message || 'Failed to load course'
      const errorList = data.errors || []
      
      setErrorModal({
        title: 'Error Loading Course',
        message: errorMsg,
        errors: errorList.length > 1 ? errorList : []
      })
    } else {
      setErrorModal(null)
    }
  }, [error, data])

  if (isLoading) return <Loading />

  // Handle both ApiResponse structure and direct data
  let course = null
  if (data && data.success !== false) {
    course = data.data || data
  }

  // If no course data and there's an error, show page with error modal
  // Otherwise, show the course details
  const materials = course?.materials || course?.Materials || []
  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin'

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await coursesService.downloadFile(fileId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      logger.error('Error downloading file:', err)
      const errorMessage = err?.response?.data?.errors?.[0] || err?.message || 'Failed to download file'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="page-container">
      <button
        className="btn btn-outline"
        onClick={() => navigate('/courses')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setFileToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

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
                <button className="btn btn-outline" onClick={() => navigate('/courses')}>
                  Back to Courses
                </button>
                <button className="btn btn-primary" onClick={() => setErrorModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {course ? (
        <>
          <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {course.title || course.Title || 'Untitled Course'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            {course.courseCode || course.CourseCode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <FileText size={16} />
                <span>Code: {course.courseCode || course.CourseCode}</span>
              </div>
            ) : null}
            {course.subjectName || course.SubjectName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <BookOpen size={16} />
                <span>{course.subjectName || course.SubjectName}</span>
              </div>
            ) : null}
            {course.level || course.Level ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <span>Level: {course.level || course.Level}</span>
              </div>
            ) : null}
            {course.duration || course.Duration ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Clock size={16} />
                <span>Duration: {course.duration || course.Duration} hours</span>
              </div>
            ) : null}
            {course.createdAt || course.CreatedAt ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Calendar size={16} />
                <span>Created: {new Date(course.createdAt || course.CreatedAt).toLocaleDateString()}</span>
              </div>
            ) : null}
          </div>
        </div>

        {(course.description || course.Description) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Description
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {course.description || course.Description}
            </p>
          </div>
        )}

        {(course.instructions || course.Instructions) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Instructions
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {course.instructions || course.Instructions}
            </p>
          </div>
        )}
      </div>

      {/* Course Materials */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <FileText size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Course Materials ({materials.length})
          </h2>
          {isTeacher && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowUploadModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              Upload Material
            </button>
          )}
        </div>
        {materials.length > 0 ? (
          <div>
            {materials.map((material, index) => {
              const materialId = material.id || material.Id
              const title = material.title || material.Title || 'Untitled Material'
              const description = material.description || material.Description
              const fileName = material.fileName || material.FileName || 'file'
              const fileSize = material.fileSize || material.FileSize || 0
              const isRequired = material.isRequired !== undefined ? material.isRequired : (material.IsRequired !== undefined ? material.IsRequired : false)
              const uploadedAt = material.uploadedAt || material.UploadedAt

              return (
                <div
                  key={materialId || index}
                  style={{
                    padding: '1.5rem',
                    borderBottom: index < materials.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    {isTeacher && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isLoading}
                          style={{ padding: '0.25rem', minWidth: 'auto' }}
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === materials.length - 1 || reorderMutation.isLoading}
                          style={{ padding: '0.25rem', minWidth: 'auto' }}
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {title}
                        </h4>
                        {isRequired && (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            Required
                          </span>
                        )}
                      </div>
                      {description && (
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <span>{fileName}</span>
                        {fileSize > 0 && (
                          <span>{formatDecimal(fileSize / 1024 / 1024)} MB</span>
                        )}
                        {uploadedAt && (
                          <span>Uploaded: {new Date(uploadedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownload(materialId, fileName)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    {isTeacher && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(materialId)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={deleteMutation.isLoading}
                      >
                        <X size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">No materials available</p>
            <p className="empty-state-subtext">Course materials will appear here when uploaded</p>
          </div>
        )}
      </div>

      {/* Upload Material Modal */}
      {showUploadModal && (
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
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Upload Course Material</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpload}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    placeholder="Enter material title"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows="3"
                    placeholder="Enter material description (optional)"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    File *
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    required
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Accepted formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, JPEG, PNG
                  </small>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                    />
                    <span>Mark as required</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={uploadMutation.isLoading}>
                    {uploadMutation.isLoading ? (
                      <>
                        <Upload size={16} style={{ marginRight: '0.5rem' }} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} style={{ marginRight: '0.5rem' }} />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Course information not available</p>
            <p className="empty-state-subtext">Please check back later or try refreshing the page</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetails

