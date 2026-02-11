import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { paymentsService, commonService, dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { CreditCard, CheckCircle, Clock, XCircle, Calendar, DollarSign, Plus } from 'lucide-react'
import { formatDecimal } from '../../utils/safeUtils'

const Payments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // all, pending, paid
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const pageSize = 20

  const isAdmin = user?.role === 'Admin'

  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isAdmin }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : null

  const { data, isLoading, error } = useQuery(
    ['payments', page, filter, effectiveSchoolId],
    () => {
      const params = { page, pageSize }
      const urlParams = new URLSearchParams(window.location.search)
      const studentId = urlParams.get('studentId')

      if (user?.role === 'Parent') {
        if (studentId) return paymentsService.getParentPayments({ ...params, studentId })
        return paymentsService.getParentPayments(params)
      }
      if (user?.role === 'Student') {
        return paymentsService.getMyPayments(params)
      }
      if (isAdmin && effectiveSchoolId) params.schoolId = effectiveSchoolId
      return paymentsService.getPayments(params)
    },
    { keepPreviousData: true, enabled: !isAdmin || !!effectiveSchoolId }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading payments</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  // API returns ApiResponse<PaginatedResponse<...>>: { data: { items, currentPage, pageSize, totalCount, totalPages } }; axios returns response.data so data is the wrapper
  const payments = data?.data?.items ?? data?.items ?? data?.data?.payments ?? data?.payments ?? []
  const totalCount = data?.data?.totalCount ?? data?.totalCount ?? 0
  const totalPages = data?.data?.totalPages ?? data?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1)

  const filteredPayments = filter === 'all' 
    ? payments 
    : filter === 'pending'
    ? payments.filter(p => ['Pending', 'Overdue', 'PendingApproval'].includes(p.status))
    : payments.filter(p => p.status === 'Paid')

  const getStatusBadge = (payment) => {
    const status = (payment.status || '').trim()
    switch (status) {
      case 'Paid':
        return (
          <span className="badge badge-success">
            <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
            Paid
          </span>
        )
      case 'Overdue':
        return (
          <span className="badge badge-danger">
            <XCircle size={14} style={{ marginRight: '0.25rem' }} />
            Overdue
          </span>
        )
      case 'PartiallyPaid':
        return (
          <span className="badge badge-warning">
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Partially Paid
          </span>
        )
      case 'PendingApproval':
        return (
          <span className="badge badge-warning" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Pending Approval
          </span>
        )
      case 'Rejected':
        return (
          <span className="badge badge-danger">
            <XCircle size={14} style={{ marginRight: '0.25rem' }} />
            Rejected
          </span>
        )
      default:
        return (
          <span className="badge badge-warning">
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Pending
          </span>
        )
    }
  }

  const totalPending = payments.filter(p => ['Pending', 'Overdue', 'PendingApproval'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Payments
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setPage(1) }}
              >
                <option value="">Select school</option>
                {schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {(user?.role === 'Admin' || user?.role === 'Principal' || user?.role === 'Parent') && (
            <button className="btn btn-primary" onClick={() => navigate('/payments/create')}>
              <Plus size={18} />
              Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards for Students/Parents */}
      {(user?.role === 'Student' || user?.role === 'Parent') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <DollarSign size={32} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.25rem' }}>
              ${formatDecimal(totalPending)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending Payments</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.25rem' }}>
              ${formatDecimal(totalPaid)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Paid</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {(user?.role === 'Student' || user?.role === 'Parent') && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All Payments
          </button>
          <button
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`btn ${filter === 'paid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('paid')}
          >
            Paid
          </button>
        </div>
      )}

      {/* Payments List */}
      {filteredPayments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPayments.map((payment) => (
            <div
              key={payment.id || payment.Id}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  payment.status === 'Paid' ? 'var(--success)' : 
                  payment.status === 'Overdue' || payment.status === 'Rejected' ? 'var(--danger)' : 
                  'var(--warning)'
                }`,
                cursor: (user?.role === 'Student' || user?.role === 'Parent') ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (user?.role === 'Student' || user?.role === 'Parent') {
                  navigate(`/payments/${payment.id || payment.Id}`)
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CreditCard size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                      {payment.type || payment.paymentType || 'Payment'}
                    </h3>
                    {getStatusBadge(payment)}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DollarSign size={14} />
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Amount: ${formatDecimal(payment.amount ?? 0)}
                      </span>
                    </div>
                    {payment.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {payment.paidDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={14} />
                        <span>Paid: {new Date(payment.paidDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {payment.studentName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>Student: {payment.studentName}</span>
                      </div>
                    )}
                  </div>

                  {payment.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {payment.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <CreditCard size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No payments found</p>
            <p className="empty-state-subtext">
              {filter === 'pending' 
                ? 'You have no pending payments' 
                : filter === 'paid'
                ? 'You have no paid payments'
                : 'No payments available'}
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

export default Payments
