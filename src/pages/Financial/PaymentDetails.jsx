import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { paymentsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  Download,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

const PaymentDetails = () => {
  const { paymentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [processing, setProcessing] = useState(false)

  const { data, isLoading, error } = useQuery(
    ['payment', paymentId],
    () => paymentsService.getPayment(paymentId),
    { enabled: !!paymentId }
  )

  const processPaymentMutation = useMutation(
    (data) => paymentsService.processStudentPayment(paymentId, data),
    {
      onSuccess: (response) => {
        if (response?.data?.redirectUrl) {
          // Redirect to payment gateway
          window.location.href = response.data.redirectUrl
        } else {
          toast.success('Payment processed successfully!')
          queryClient.invalidateQueries(['payment', paymentId])
          queryClient.invalidateQueries(['payments'])
          setShowPaymentModal(false)
        }
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to process payment')
        setProcessing(false)
      }
    }
  )

  const downloadReceiptMutation = useMutation(
    () => paymentsService.generateReceipt(paymentId),
    {
      onSuccess: (blob) => {
        if (!(blob instanceof Blob)) {
          console.error('Invalid response format:', blob)
          toast.error('Invalid response format')
          return
        }
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `PaymentReceipt_${paymentId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('Receipt downloaded successfully!')
      },
      onError: (error) => {
        console.error('Receipt download error:', error)
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.errors?.[0] || 
                           error?.message || 
                           'Failed to download receipt'
        toast.error(errorMessage)
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    const isForbidden = error?.response?.status === 403
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">{isForbidden ? "You don't have access to this payment" : 'Error loading payment details'}</p>
            <p className="empty-state-subtext">{isForbidden ? 'This payment belongs to another school.' : (error?.message || 'Please try again later')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/payments')}>
              Back to Payments
            </button>
          </div>
        </div>
      </div>
    )
  }

  const payment = data?.data || data
  if (!payment) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Payment not found</p>
            <button className="btn btn-primary" onClick={() => navigate('/payments')}>
              Back to Payments
            </button>
          </div>
        </div>
      </div>
    )
  }

  const status = (payment.status || payment.Status || '').trim()
  const statusLower = status.toLowerCase()
  const canMakePayment = (status === 'Pending' || status === 'Overdue' || status === 'PartiallyPaid') &&
                         (user?.role === 'Student' || user?.role === 'Parent')
  // Only show download receipt after partial or full payment has been made
  const canDownloadReceipt = statusLower === 'paid' || statusLower === 'partiallypaid'

  const getStatusBadge = () => {
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
      default:
        return (
          <span className="badge badge-warning">
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Pending
          </span>
        )
    }
  }

  const handleProcessPayment = async () => {
    if (paymentMethod === 'Cash' || paymentMethod === 'BankTransfer') {
      setProcessing(true)
      processPaymentMutation.mutate({})
    } else {
      // For gateway payments, use the gateway endpoint
      setProcessing(true)
      processPaymentMutation.mutate({
        paymentGateway: paymentMethod,
        paidBy: user?.role === 'Student' ? 'Student' : 'Parent'
      })
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/payments')}
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Payment Details
        </h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CreditCard size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {payment.paymentType || payment.paymentType || 'Payment'}
              </h2>
              {getStatusBadge()}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Payment ID: {payment.id || payment.Id}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Amount
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--primary)" />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                ${(payment.amount || payment.Amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
              Due Date
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)' }}>
                {payment.dueDate || payment.DueDate 
                  ? new Date(payment.dueDate || payment.DueDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>

          {payment.paidDate || payment.PaidDate ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Paid Date
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="var(--success)" />
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(payment.paidDate || payment.PaidDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : null}

          {payment.paymentMethod || payment.PaymentMethod ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Payment Method
              </label>
              <span style={{ color: 'var(--text-primary)' }}>
                {payment.paymentMethod || payment.PaymentMethod}
              </span>
            </div>
          ) : null}

          {payment.transactionId || payment.TransactionId ? (
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>
                Transaction ID
              </label>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {payment.transactionId || payment.TransactionId}
              </span>
            </div>
          ) : null}
        </div>

        {payment.notes || payment.Notes ? (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              Description
            </label>
            <p style={{ color: 'var(--text-primary)' }}>
              {payment.notes || payment.Notes}
            </p>
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      {(canMakePayment || canDownloadReceipt) && (
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {canMakePayment && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPaymentModal(true)}
                disabled={processing}
              >
                <CreditCard size={16} style={{ marginRight: '0.5rem' }} />
                Make Payment
              </button>
            )}
            {canDownloadReceipt && (
              <button
                className="btn btn-outline"
                onClick={() => downloadReceiptMutation.mutate()}
                disabled={downloadReceiptMutation.isLoading}
              >
                <Download size={16} style={{ marginRight: '0.5rem' }} />
                {downloadReceiptMutation.isLoading ? 'Downloading...' : 'Download Receipt'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !processing && setShowPaymentModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Process Payment
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Payment Method
              </label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={processing}
              >
                <option value="Cash">Cash</option>
                <option value="BankTransfer">Bank Transfer</option>
                <option value="Flutterwave">Flutterwave</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Amount:</span>
                <span style={{ fontWeight: 'bold' }}>${(payment.amount || payment.Amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleProcessPayment}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentDetails

