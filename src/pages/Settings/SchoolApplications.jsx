import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { schoolApplicationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import ConfirmDialog from '../../components/Common/ConfirmDialog'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import { Search, FileText, CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SchoolApplications = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [approveConfirm, setApproveConfirm] = useState(null)
  const [rejectConfirm, setRejectConfirm] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data, isLoading, error } = useQuery(
    ['schoolApplications', page, pageSize, statusFilter],
    () => schoolApplicationsService.getApplications({ page, pageSize, status: statusFilter || undefined }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch school applications:', err)
      }
    }
  )

  const approveMutation = useMutation(
    ({ applicationId, notes }) => schoolApplicationsService.approveApplication(applicationId, notes),
    {
      onSuccess: () => {
        handleSuccess('School application approved successfully')
        // Close modal if open
        setShowDetailsModal(false)
        setSelectedApplication(null)
        // Invalidate and refetch queries
        queryClient.invalidateQueries(['schoolApplications'])
        queryClient.refetchQueries(['schoolApplications', page, pageSize, statusFilter])
        setApproveConfirm(null)
      },
      onError: handleError
    }
  )

  const rejectMutation = useMutation(
    ({ applicationId, reason }) => schoolApplicationsService.rejectApplication(applicationId, reason),
    {
      onSuccess: () => {
        handleSuccess('School application rejected')
        queryClient.invalidateQueries('schoolApplications')
        setRejectConfirm(null)
        setRejectionReason('')
      },
      onError: handleError
    }
  )

  const applications = data?.data?.applications || []
  const pagination = data?.data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      app.schoolName?.toLowerCase().includes(search) ||
      (app.contactPersonName || app.contactPerson)?.toLowerCase().includes(search) ||
      app.contactEmail?.toLowerCase().includes(search) ||
      app.contactPhone?.toLowerCase().includes(search)
    )
  })

  const handleViewDetails = async (applicationId) => {
    setLoadingDetails(true)
    try {
      const response = await schoolApplicationsService.getApplication(applicationId)
      // Handle API response structure: response.data or response.data.data
      const applicationData = response?.data || response?.data?.data || response
      if (applicationData) {
        setSelectedApplication(applicationData)
        setShowDetailsModal(true)
      } else {
        toast.error('Failed to load application details')
      }
    } catch (error) {
      handleError(error, 'Failed to load application details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const submitMutation = useMutation(
    (applicationId) => schoolApplicationsService.submitApplication(applicationId),
    {
      onError: handleError
    }
  )

  const handleApprove = async (application) => {
    // Check if application is in Draft status (0) - need to submit first
    const status = application.status
    const statusStr = status != null ? String(status).toLowerCase() : ''
    const isDraft = status === 0 || statusStr === 'draft' || statusStr === '0'
    
    if (isDraft) {
      // Auto-submit the application first, then approve
      try {
        toast.loading('Submitting application...', { id: 'submit-app' })
        const submitResponse = await submitMutation.mutateAsync(application.id)
        if (submitResponse && submitResponse.success) {
          toast.success('Application submitted successfully', { id: 'submit-app' })
          // Immediately proceed with approval after successful submission
          // The backend will handle the status check
          setApproveConfirm(application)
        } else {
          toast.error('Failed to submit application before approval', { id: 'submit-app' })
        }
      } catch (error) {
        toast.error('Failed to submit application before approval', { id: 'submit-app' })
        handleError(error, 'Failed to submit application before approval')
      }
    } else {
      setApproveConfirm(application)
    }
  }

  const handleReject = (application) => {
    setRejectConfirm(application)
  }

  const confirmApprove = () => {
    if (approveConfirm) {
      approveMutation.mutate({ applicationId: approveConfirm.id, notes: null })
    }
  }

  const confirmReject = () => {
    if (rejectConfirm && rejectionReason.trim()) {
      rejectMutation.mutate({ applicationId: rejectConfirm.id, reason: rejectionReason })
    } else {
      toast.error('Please provide a rejection reason')
    }
  }

  const getStatusBadge = (status) => {
    // Convert status to string and handle null/undefined
    const statusStr = status != null ? String(status) : ''
    const statusLower = statusStr.toLowerCase()
    const statusNum = typeof status === 'number' ? status : (isNaN(parseInt(statusStr)) ? null : parseInt(statusStr))
    
    // Handle enum values: Draft=0, Submitted=1, UnderReview=2, Approved=3, Rejected=4
    if (statusNum !== null && !isNaN(statusNum)) {
      switch (statusNum) {
        case 0: // Draft
          return <span className="badge badge-secondary"><Clock size={14} style={{ marginRight: '0.25rem' }} />Draft</span>
        case 1: // Submitted
          return <span className="badge badge-warning"><Clock size={14} style={{ marginRight: '0.25rem' }} />Submitted</span>
        case 2: // UnderReview
          return <span className="badge badge-info"><Clock size={14} style={{ marginRight: '0.25rem' }} />Under Review</span>
        case 3: // Approved
          return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: '0.25rem' }} />Approved</span>
        case 4: // Rejected
          return <span className="badge badge-danger"><XCircle size={14} style={{ marginRight: '0.25rem' }} />Rejected</span>
      }
    }
    
    // Fallback to string matching for backward compatibility
    switch (statusLower) {
      case 'draft':
        return <span className="badge badge-secondary"><Clock size={14} style={{ marginRight: '0.25rem' }} />Draft</span>
      case 'submitted':
      case 'pending':
        return <span className="badge badge-warning"><Clock size={14} style={{ marginRight: '0.25rem' }} />Submitted</span>
      case 'underreview':
      case 'under_review':
        return <span className="badge badge-info"><Clock size={14} style={{ marginRight: '0.25rem' }} />Under Review</span>
      case 'approved':
        return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: '0.25rem' }} />Approved</span>
      case 'rejected':
        return <span className="badge badge-danger"><XCircle size={14} style={{ marginRight: '0.25rem' }} />Rejected</span>
      default:
        return <span className="badge badge-secondary">{statusStr || 'Unknown'}</span>
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          School Applications
        </h1>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            Error loading applications: {error?.message || 'Please refresh the page'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} 
            />
            <input
              type="text"
              placeholder="Search by school name, contact person, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                minWidth: '150px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        {filteredApplications.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Contact Person</th>
                  <th>Contact Email</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="var(--primary-yellow)" />
                        <strong>{app.schoolName}</strong>
                      </div>
                    </td>
                    <td>{app.contactPersonName || app.contactPerson}</td>
                    <td>{app.contactEmail}</td>
                    <td>{app.contactPhone || 'N/A'}</td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(app.id)}
                          title="View Details"
                          disabled={loadingDetails}
                        >
                          <Eye size={16} />
                        </button>
                        {(String(app.status || '').toLowerCase() === 'pending' || 
                          String(app.status || '').toLowerCase() === 'submitted' ||
                          String(app.status || '').toLowerCase() === 'underreview' ||
                          app.status === 0 || app.status === 1 || app.status === 2) && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(app)}
                              title="Approve"
                              disabled={approveMutation.isLoading || rejectMutation.isLoading || submitMutation.isLoading}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(app)}
                              title="Reject"
                              disabled={approveMutation.isLoading || rejectMutation.isLoading}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">
              {searchTerm || statusFilter ? 'No applications found matching your filters' : 'No school applications found'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>
              Page {pagination.currentPage || page} of {totalPages}
            </span>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && (
        <ApplicationDetailsModal
          application={selectedApplication}
          isLoading={loadingDetails || approveMutation.isLoading || rejectMutation.isLoading}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedApplication(null)
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Approve Confirmation */}
      {approveConfirm && (
        <ConfirmDialog
          isOpen={!!approveConfirm}
          onClose={() => setApproveConfirm(null)}
          onConfirm={confirmApprove}
          title="Approve Application"
          message={`Are you sure you want to approve the application for "${approveConfirm.schoolName}"? This will create a new tenant and school.`}
          confirmText="Approve"
          cancelText="Cancel"
          variant="info"
        />
      )}

      {/* Reject Confirmation */}
      {rejectConfirm && (
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
          onClick={() => {
            setRejectConfirm(null)
            setRejectionReason('')
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ backgroundColor: 'var(--danger-light)', borderBottom: '2px solid var(--danger)' }}>
              <h2 className="card-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} />
                Reject Application
              </h2>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Are you sure you want to reject the application for <strong>"{rejectConfirm.schoolName}"</strong>?
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setRejectConfirm(null)
                    setRejectionReason('')
                  }}
                  disabled={rejectMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmReject}
                  disabled={rejectMutation.isLoading || !rejectionReason.trim()}
                >
                  {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Application Details Modal Component
const ApplicationDetailsModal = ({ application, onClose, onApprove, onReject, isLoading }) => {
  if (isLoading && !application) {
    return (
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
        }}
      >
        <div className="card" style={{ padding: '2rem' }}>
          <Loading />
        </div>
      </div>
    )
  }

  if (!application) return null

  const getStatusBadge = (status) => {
    // Convert status to string and handle null/undefined
    const statusStr = status != null ? String(status) : ''
    const statusLower = statusStr.toLowerCase()
    const statusNum = typeof status === 'number' ? status : (isNaN(parseInt(statusStr)) ? null : parseInt(statusStr))
    
    // Handle enum values: Draft=0, Submitted=1, UnderReview=2, Approved=3, Rejected=4
    if (statusNum !== null && !isNaN(statusNum)) {
      switch (statusNum) {
        case 0: // Draft
          return <span className="badge badge-secondary"><Clock size={14} style={{ marginRight: '0.25rem' }} />Draft</span>
        case 1: // Submitted
          return <span className="badge badge-warning"><Clock size={14} style={{ marginRight: '0.25rem' }} />Submitted</span>
        case 2: // UnderReview
          return <span className="badge badge-info"><Clock size={14} style={{ marginRight: '0.25rem' }} />Under Review</span>
        case 3: // Approved
          return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: '0.25rem' }} />Approved</span>
        case 4: // Rejected
          return <span className="badge badge-danger"><XCircle size={14} style={{ marginRight: '0.25rem' }} />Rejected</span>
      }
    }
    
    // Fallback to string matching for backward compatibility
    switch (statusLower) {
      case 'draft':
        return <span className="badge badge-secondary"><Clock size={14} style={{ marginRight: '0.25rem' }} />Draft</span>
      case 'submitted':
      case 'pending':
        return <span className="badge badge-warning"><Clock size={14} style={{ marginRight: '0.25rem' }} />Submitted</span>
      case 'underreview':
      case 'under_review':
        return <span className="badge badge-info"><Clock size={14} style={{ marginRight: '0.25rem' }} />Under Review</span>
      case 'approved':
        return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: '0.25rem' }} />Approved</span>
      case 'rejected':
        return <span className="badge badge-danger"><XCircle size={14} style={{ marginRight: '0.25rem' }} />Rejected</span>
      default:
        return <span className="badge badge-secondary">{statusStr || 'Unknown'}</span>
    }
  }

  return (
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
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h2 className="card-title">Application Details</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Status */}
            <div>
              <strong>Status:</strong> {getStatusBadge(application.status)}
            </div>

            {/* School Information */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                School Information
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><strong>School Name:</strong> {application.schoolName}</div>
                {application.schoolDescription && (
                  <div><strong>Description:</strong> {application.schoolDescription}</div>
                )}
                {application.schoolType && (
                  <div><strong>School Type:</strong> {application.schoolType}</div>
                )}
                {application.curriculum && (
                  <div><strong>Curriculum:</strong> {application.curriculum}</div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Contact Information
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div><strong>Contact Person:</strong> {application.contactPersonName}</div>
                <div><strong>Email:</strong> {application.contactEmail}</div>
                {application.contactPhone && (
                  <div><strong>Phone:</strong> {application.contactPhone}</div>
                )}
              </div>
            </div>

            {/* Address */}
            {(application.schoolAddress || application.city || application.state || application.postalCode || application.country) && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Address
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {application.schoolAddress && <div>{application.schoolAddress}</div>}
                  {(application.city || application.state || application.postalCode) && (
                    <div>
                      {application.city && <span>{application.city}, </span>}
                      {application.state && <span>{application.state} </span>}
                      {application.postalCode && <span>{application.postalCode}</span>}
                    </div>
                  )}
                  {application.country && <div>{application.country}</div>}
                </div>
              </div>
            )}

            {/* Domain Information */}
            {(application.subdomain || application.customDomain) && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Domain Information
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {application.subdomain && (
                    <div><strong>Subdomain:</strong> {application.subdomain}</div>
                  )}
                  {application.customDomain && (
                    <div><strong>Custom Domain:</strong> {application.customDomain}</div>
                  )}
                </div>
              </div>
            )}

            {/* Expected Counts */}
            {(application.expectedStudentCount || application.expectedTeacherCount) && (
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Expected Capacity
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {application.expectedStudentCount && (
                    <div><strong>Expected Students:</strong> {application.expectedStudentCount}</div>
                  )}
                  {application.expectedTeacherCount && (
                    <div><strong>Expected Teachers:</strong> {application.expectedTeacherCount}</div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Timeline
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {application.createdAt && (
                  <div><strong>Created:</strong> {new Date(application.createdAt).toLocaleString()}</div>
                )}
                {application.submittedAt && (
                  <div><strong>Submitted:</strong> {new Date(application.submittedAt).toLocaleString()}</div>
                )}
                {application.reviewedAt && (
                  <div><strong>Reviewed:</strong> {new Date(application.reviewedAt).toLocaleString()}</div>
                )}
                {application.approvedAt && (
                  <div><strong>Approved:</strong> {new Date(application.approvedAt).toLocaleString()}</div>
                )}
                {application.rejectedAt && (
                  <div><strong>Rejected:</strong> {new Date(application.rejectedAt).toLocaleString()}</div>
                )}
                {application.rejectionReason && (
                  <div>
                    <strong>Rejection Reason:</strong>
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--danger-light)', borderRadius: '0.5rem', color: 'var(--danger)' }}>
                      {application.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {(String(application.status || '').toLowerCase() === 'pending' || 
              String(application.status || '').toLowerCase() === 'submitted' ||
              String(application.status || '').toLowerCase() === 'underreview' ||
              application.status === 0 || application.status === 1 || application.status === 2) && (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    onApprove(application)
                    onClose()
                  }}
                  disabled={isLoading}
                >
                  <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    onReject(application)
                    onClose()
                  }}
                  disabled={isLoading}
                >
                  <XCircle size={18} style={{ marginRight: '0.5rem' }} />
                  Reject
                </button>
              </>
            )}
            <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolApplications
