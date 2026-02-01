import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { subscriptionService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { CheckCircle, XCircle, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PendingSubscriptionPayments = () => {
  const queryClient = useQueryClient()
  const [rejectPayment, setRejectPayment] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data, isLoading, error } = useQuery(
    'subscription-pending-payments',
    () => subscriptionService.getPendingPayments(),
    { retry: 1 }
  )

  const confirmMutation = useMutation(
    (payload) => subscriptionService.confirmPayment(payload),
    {
      onSuccess: (res) => {
        const body = res?.data ?? res
        const success = body?.success ?? res?.success
        if (success) {
          toast.success('Payment confirmed successfully.')
          queryClient.invalidateQueries('subscription-pending-payments')
        } else {
          toast.error(body?.errors?.[0] ?? body?.message ?? 'Failed to confirm payment.')
        }
      },
      onError: (err) => {
        toast.error(err?.errors?.[0] ?? err?.message ?? err?.response?.data?.errors?.[0] ?? 'Failed to confirm payment.')
      },
    }
  )

  const rejectMutation = useMutation(
    (payload) => subscriptionService.confirmPayment({ ...payload, reject: true }),
    {
      onSuccess: (res) => {
        const body = res?.data ?? res
        const success = body?.success ?? res?.success
        if (success) {
          toast.success('Payment rejected.')
          setRejectPayment(null)
          setRejectionReason('')
          queryClient.invalidateQueries('subscription-pending-payments')
        } else {
          toast.error(body?.errors?.[0] ?? body?.message ?? 'Failed to reject payment.')
        }
      },
      onError: (err) => {
        toast.error(err?.errors?.[0] ?? err?.message ?? err?.response?.data?.errors?.[0] ?? 'Failed to reject payment.')
      },
    }
  )

  const payments = data?.data ?? data?.Data ?? []
  const list = Array.isArray(payments) ? payments : []

  const handleConfirm = (payment) => {
    const id = payment.id ?? payment.Id
    confirmMutation.mutate({ paymentId: id })
  }

  const handleRejectClick = (payment) => {
    setRejectPayment(payment)
    setRejectionReason('')
  }

  const handleRejectSubmit = () => {
    if (!rejectPayment) return
    const id = rejectPayment.id ?? rejectPayment.Id
    if (!rejectionReason?.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }
    rejectMutation.mutate({ paymentId: id, rejectionReason: rejectionReason.trim() })
  }

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="card">
        <p style={{ color: 'var(--danger)', margin: 0 }}>
          Failed to load pending payments. You may not have permission or the service is unavailable.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Subscription payments
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Confirm or reject subscription payments from schools. Ensure payment has been verified (e.g. cheque cleared, gateway confirmed) before confirming.
      </p>

      {list.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No pending subscription payments.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table" style={{ minWidth: '640px' }}>
            <thead>
              <tr>
                <th>School</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference / Cheque</th>
                <th>Term start</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const id = p.id ?? p.Id
                const schoolName = p.schoolName ?? p.SchoolName ?? '—'
                const planName = p.planName ?? p.PlanName ?? '—'
                const amount = p.amount ?? p.Amount ?? 0
                const currency = p.currency ?? p.Currency ?? 'NGN'
                const method = p.paymentMethod ?? p.PaymentMethod ?? '—'
                const cheque = p.chequeNumber ?? p.ChequeNumber
                const txRef = p.transactionReference ?? p.TransactionReference
                const termStart = p.termStart ?? p.TermStart
                const createdAt = p.createdAt ?? p.CreatedAt
                return (
                  <tr key={id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
                        {schoolName}
                      </span>
                    </td>
                    <td>{planName}</td>
                    <td>{currency} {Number(amount).toLocaleString()}</td>
                    <td>{method}</td>
                    <td>{cheque || txRef || '—'}</td>
                    <td>{termStart ? new Date(termStart).toLocaleDateString() : '—'}</td>
                    <td>{createdAt ? new Date(createdAt).toLocaleString() : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleConfirm(p)}
                          disabled={confirmMutation.isLoading}
                        >
                          <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleRejectClick(p)}
                          disabled={rejectMutation.isLoading}
                        >
                          <XCircle size={14} style={{ marginRight: '0.25rem' }} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
          }}
          onClick={() => !rejectMutation.isLoading && (setRejectPayment(null), setRejectionReason(''))}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Reject subscription payment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Provide a reason for rejecting this payment. The school will not be activated for this term until a valid payment is confirmed.
            </p>
            <label className="form-label">Rejection reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Cheque bounced; invalid reference"
              style={{ width: '100%', marginTop: '0.25rem', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setRejectPayment(null); setRejectionReason('') }}
                disabled={rejectMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isLoading || !rejectionReason?.trim()}
              >
                {rejectMutation.isLoading ? 'Rejecting...' : 'Reject payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingSubscriptionPayments
