import React, { useEffect, useState } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { paymentsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { CheckCircle, XCircle } from 'lucide-react'

/**
 * Handles redirect from payment gateways (Flutterwave, PayPal) after user completes payment.
 * Route: /payments/callback/:gateway - gateway from path (e.g. flutterwave, paypal)
 * Query: paymentId, transaction_id (Flutterwave) or transactionReference
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams()
  const { gateway: gatewayParam } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('verifying') // verifying | success | error | cancelled
  const [message, setMessage] = useState('')

  const gateway = gatewayParam || searchParams.get('gateway') || searchParams.get('Gateway')
  const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id')
  const transactionReference = searchParams.get('transactionReference') ||
    searchParams.get('transaction_id') ||
    searchParams.get('tx_ref') ||
    searchParams.get('transactionId')

  const isCancel = window.location.pathname.includes('/payments/cancel') ||
    searchParams.get('cancelled') === 'true'

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setStatus('error')
      setMessage('Please log in to complete your payment verification.')
      return
    }

    if (isCancel) {
      setStatus('cancelled')
      setMessage('Payment was cancelled.')
      return
    }

    if (!paymentId || !transactionReference || !gateway) {
      setStatus('error')
      setMessage('Invalid callback parameters. Missing paymentId, transaction reference, or gateway.')
      return
    }

    const verify = async () => {
      try {
        const res = await paymentsService.paymentCallback({
          gateway: gateway.toLowerCase(),
          paymentId,
          transactionReference
        })
        const data = res?.data ?? res
        const success = data?.success ?? data?.Success ?? res?.success ?? res?.Success
        if (success) {
          setStatus('success')
          setMessage(data?.message ?? data?.Message ?? 'Payment verified and processed successfully.')
        } else {
          setStatus('error')
          setMessage(data?.message ?? data?.Message || (Array.isArray(data?.errors) ? data.errors[0] : null) || (Array.isArray(data?.Errors) ? data.Errors[0] : null) || 'Payment verification failed.')
        }
      } catch (err) {
        setStatus('error')
        const errData = err?.response?.data ?? err
        const errMsg = errData?.message ||
          (Array.isArray(errData?.errors) ? errData.errors[0] : null) ||
          err?.message ||
          'Failed to verify payment.'
        setMessage(errMsg)
      }
    }

    verify()
  }, [isAuthenticated, authLoading, paymentId, transactionReference, gateway, isCancel])

  const handleViewPayment = () => {
    if (paymentId && status === 'success') {
      navigate(`/payments/${paymentId}`)
    } else {
      navigate('/payments')
    }
  }

  const handleBackToPayments = () => navigate('/payments')

  if (authLoading || status === 'verifying') {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
          <Loading />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '450px', textAlign: 'center', padding: '2rem' }}>
        {status === 'success' && (
          <>
            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Payment Successful</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={handleViewPayment}>
                View Payment
              </button>
              <button type="button" className="btn btn-outline" onClick={handleBackToPayments}>
                Back to Payments
              </button>
            </div>
          </>
        )}
        {(status === 'error' || status === 'cancelled') && (
          <>
            <XCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {status === 'cancelled' ? 'Payment Cancelled' : 'Verification Failed'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <button type="button" className="btn btn-primary" onClick={handleBackToPayments}>
              Back to Payments
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentCallback
