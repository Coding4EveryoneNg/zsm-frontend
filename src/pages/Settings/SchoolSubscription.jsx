import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { subscriptionService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import Loading from '../../components/Common/Loading'
import { CreditCard, Building2, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'

const PAYMENT_METHODS = [
  { value: 'Flutterwave', label: 'Flutterwave' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Cheque', label: 'Cheque' },
]

const SchoolSubscription = () => {
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const queryClient = useQueryClient()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Flutterwave',
    termStart: '',
    termEnd: '',
    transactionReference: '',
    chequeNumber: '',
  })

  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

  const { data: subResponse, isLoading: subLoading } = useQuery(
    ['subscription-school', effectiveSchoolId],
    () => subscriptionService.getSchoolSubscription(effectiveSchoolId),
    { enabled: !!effectiveSchoolId }
  )
  const { data: plansResponse } = useQuery(
    'subscription-plans',
    () => subscriptionService.getPlans(),
    { staleTime: 5 * 60 * 1000 }
  )
  const plans = plansResponse?.data ?? plansResponse?.Data ?? []
  const subscription = subResponse?.data ?? subResponse?.Data ?? null

  const initiateMutation = useMutation(
    (data) => subscriptionService.initiatePayment(data),
    {
      onSuccess: (res) => {
        const body = res?.data ?? res
        const success = body?.success ?? res?.success
        const message = body?.message ?? body?.Message ?? 'Payment initiated successfully.'
        if (success) {
          toast.success(message)
          setShowPaymentModal(false)
          setPaymentForm({ paymentMethod: 'Flutterwave', termStart: '', termEnd: '', transactionReference: '', chequeNumber: '' })
          queryClient.invalidateQueries(['subscription-school', effectiveSchoolId])
        } else {
          toast.error(body?.errors?.[0] ?? body?.message ?? 'Failed to initiate payment.')
        }
      },
      onError: (err) => handleError(err, 'Failed to initiate payment'),
    }
  )

  const [selectedPlanIdForPayment, setSelectedPlanIdForPayment] = useState('')
  const planIdForPayment = subscription?.planId ?? subscription?.PlanId ?? selectedPlanIdForPayment

  const handleInitiatePayment = (e) => {
    e.preventDefault()
    const planId = planIdForPayment
    if (!planId) {
      toast.error('Please select a subscription plan or ensure this school has an active plan.')
      return
    }
    if (!effectiveSchoolId) {
      toast.error('Please select a school.')
      return
    }
    if (paymentForm.paymentMethod === 'Cheque' && !paymentForm.chequeNumber?.trim()) {
      toast.error('Cheque number is required for cheque payments.')
      return
    }
    const payload = {
      schoolId: effectiveSchoolId,
      subscriptionPlanId: planId,
      paymentMethod: paymentForm.paymentMethod,
      termStart: paymentForm.termStart ? new Date(paymentForm.termStart).toISOString().split('T')[0] : undefined,
      termEnd: paymentForm.termEnd ? new Date(paymentForm.termEnd).toISOString().split('T')[0] : undefined,
      transactionReference: paymentForm.transactionReference?.trim() || undefined,
      chequeNumber: paymentForm.chequeNumber?.trim() || undefined,
    }
    initiateMutation.mutate(payload)
  }

  if (subLoading && !subscription) {
    return <Loading />
  }

  const planName = subscription?.planName ?? subscription?.PlanName ?? subscription?.planCode ?? subscription?.PlanCode ?? '—'
  const status = subscription?.status ?? subscription?.Status ?? '—'
  const termStart = subscription?.termStart ?? subscription?.TermStart
  const termEnd = subscription?.termEnd ?? subscription?.TermEnd
  const isPending = status === 'PendingPayment' || status === 'Pending'

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        School Subscription
      </h1>

      {user?.role === 'Admin' && schoolsList?.length > 1 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">School</label>
          <select
            className="form-input"
            value={selectedSchoolId || effectiveSchoolId || ''}
            onChange={(e) => handleSchoolChange(e.target.value)}
            disabled={switchSchoolMutation.isLoading}
            style={{ maxWidth: '320px' }}
          >
            {schoolsList.map((s) => {
              const id = s.id ?? s.Id
              const name = s.name ?? s.Name ?? id
              return <option key={id} value={id}>{name}</option>
            })}
          </select>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Building2 size={24} style={{ color: 'var(--primary-yellow)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Current subscription</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Plan</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{planName}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPending ? <AlertCircle size={18} style={{ color: '#f59e0b' }} /> : <CheckCircle size={18} style={{ color: '#10b981' }} />}
              <span style={{ fontWeight: 500, color: isPending ? '#f59e0b' : '#10b981' }}>{status}</span>
            </div>
          </div>
          {(termStart || termEnd) && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Term</span>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {termStart ? new Date(termStart).toLocaleDateString() : '—'} – {termEnd ? new Date(termEnd).toLocaleDateString() : '—'}
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard size={18} style={{ marginRight: '0.5rem' }} />
            Pay subscription
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !initiateMutation.isLoading && setShowPaymentModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '440px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Initiate subscription payment</h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem' }}
                onClick={() => !initiateMutation.isLoading && setShowPaymentModal(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleInitiatePayment}>
              {!subscription && plans.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Subscription plan <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="form-input"
                    value={selectedPlanIdForPayment}
                    onChange={(e) => setSelectedPlanIdForPayment(e.target.value)}
                  >
                    <option value="">Select plan</option>
                    {plans.map((p) => {
                      const id = p.id ?? p.Id
                      const name = p.name ?? p.Name ?? p.code ?? p.Code
                      return <option key={id} value={id}>{name}</option>
                    })}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Payment method <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-input"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Term start (optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentForm.termStart}
                    onChange={(e) => setPaymentForm({ ...paymentForm, termStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Term end (optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentForm.termEnd}
                    onChange={(e) => setPaymentForm({ ...paymentForm, termEnd: e.target.value })}
                  />
                </div>
              </div>
              {paymentForm.paymentMethod === 'Cheque' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Cheque number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CHQ-001"
                    value={paymentForm.chequeNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Transaction reference (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="From Flutterwave / PayPal"
                    value={paymentForm.transactionReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    You can enter the reference after completing payment via gateway.
                  </small>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={initiateMutation.isLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={initiateMutation.isLoading}>
                  {initiateMutation.isLoading ? 'Submitting...' : 'Submit payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolSubscription
