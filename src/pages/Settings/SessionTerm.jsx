import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { sessionTermService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { Calendar, Plus, BookMarked } from 'lucide-react'
import toast from 'react-hot-toast'

const SessionTerm = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [addTermSessionId, setAddTermSessionId] = useState(null)
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false })
  const [termForm, setTermForm] = useState({ name: '', termNumber: 1, startDate: '', endDate: '', isCurrent: false })

  const canManage = user?.role === 'Admin' || user?.role === 'Principal'

  const { data, isLoading, error } = useQuery(
    ['sessionterm', 'sessions'],
    () => sessionTermService.getSessions({ page: 1, pageSize: 50 }),
    { enabled: canManage }
  )

  const createSessionMutation = useMutation(
    (payload) => sessionTermService.createSession(payload),
    {
      onSuccess: () => {
        toast.success('Session created. All school members have been notified.')
        queryClient.invalidateQueries('sessionterm')
        setShowSessionForm(false)
        setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to create session')
    }
  )

  const createTermMutation = useMutation(
    ({ sessionId, payload }) => sessionTermService.createTermForSession(sessionId, payload),
    {
      onSuccess: () => {
        toast.success('Term created. All school members have been notified.')
        queryClient.invalidateQueries('sessionterm')
        setAddTermSessionId(null)
        setTermForm({ name: '', termNumber: 1, startDate: '', endDate: '', isCurrent: false })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to create term')
    }
  )

  const setCurrentSessionMutation = useMutation(
    (sessionId) => sessionTermService.setCurrentSession(sessionId),
    {
      onSuccess: () => {
        toast.success('Current session updated. School members have been notified.')
        queryClient.invalidateQueries('sessionterm')
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to set current session')
    }
  )

  const setCurrentTermMutation = useMutation(
    (termId) => sessionTermService.setCurrentTerm(termId),
    {
      onSuccess: () => {
        toast.success('Current term updated. School members have been notified.')
        queryClient.invalidateQueries('sessionterm')
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to set current term')
    }
  )

  const handleCreateSession = (e) => {
    e.preventDefault()
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      toast.error('Name, start date and end date are required')
      return
    }
    createSessionMutation.mutate({
      name: sessionForm.name,
      startDate: sessionForm.startDate,
      endDate: sessionForm.endDate,
      isCurrent: sessionForm.isCurrent
    })
  }

  const handleCreateTerm = (e) => {
    e.preventDefault()
    if (!addTermSessionId || !termForm.name || !termForm.startDate || !termForm.endDate) {
      toast.error('Name, start date and end date are required')
      return
    }
    createTermMutation.mutate({
      sessionId: addTermSessionId,
      payload: {
        name: termForm.name,
        termNumber: termForm.termNumber,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        isCurrent: termForm.isCurrent
      }
    })
  }

  const res = data?.data || data
  const sessions = res?.sessions || res?.Sessions || []

  if (!canManage) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">Session & Term management is available to Admin and Principal only.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading sessions</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Session & Term
        </h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowSessionForm(true)}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Create session
        </button>
      </div>

      {showSessionForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>New academic session</h3>
          <form onSubmit={handleCreateSession} style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
              <input
                type="text"
                className="form-control"
                value={sessionForm.name}
                onChange={(e) => setSessionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 2024/2025"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Start date</label>
                <input
                  type="date"
                  className="form-control"
                  value={sessionForm.startDate}
                  onChange={(e) => setSessionForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>End date</label>
                <input
                  type="date"
                  className="form-control"
                  value={sessionForm.endDate}
                  onChange={(e) => setSessionForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={sessionForm.isCurrent}
                onChange={(e) => setSessionForm((f) => ({ ...f, isCurrent: e.target.checked }))}
              />
              Set as current session
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowSessionForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createSessionMutation.isLoading}>
                {createSessionMutation.isLoading ? 'Creating…' : 'Create session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {sessions.length === 0 && !showSessionForm ? (
        <div className="card">
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No sessions yet</p>
            <p className="empty-state-subtext">Create an academic session to get started. All school members will be notified.</p>
            <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowSessionForm(true)}>
              Create session
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sessions.map((session) => (
            <div key={session.id || session.Id} className="card" style={{ borderLeft: `4px solid ${session.isCurrent || session.IsCurrent ? 'var(--primary)' : 'var(--border-color)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {session.name || session.Name}
                    {(session.isCurrent || session.IsCurrent) && (
                      <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>Current</span>
                    )}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {session.startDate || session.StartDate} – {session.endDate || session.EndDate}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!(session.isCurrent || session.IsCurrent) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setCurrentSessionMutation.mutate(session.id || session.Id)}
                      disabled={setCurrentSessionMutation.isLoading}
                    >
                      Set as current
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setAddTermSessionId(addTermSessionId === (session.id || session.Id) ? null : session.id || session.Id)}
                  >
                    <Plus size={14} style={{ marginRight: '0.25rem' }} />
                    Add term
                  </button>
                </div>
              </div>

              {addTermSessionId === (session.id || session.Id) && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>New term</h4>
                  <form onSubmit={handleCreateTerm} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr auto', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={termForm.name}
                        onChange={(e) => setTermForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. First Term"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Term number</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={termForm.termNumber}
                        onChange={(e) => setTermForm((f) => ({ ...f, termNumber: parseInt(e.target.value, 10) || 1 }))}
                      />
                    </div>
                    <div />
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Start date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={termForm.startDate}
                        onChange={(e) => setTermForm((f) => ({ ...f, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>End date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={termForm.endDate}
                        onChange={(e) => setTermForm((f) => ({ ...f, endDate: e.target.value }))}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={termForm.isCurrent}
                        onChange={(e) => setTermForm((f) => ({ ...f, isCurrent: e.target.checked }))}
                      />
                      Current
                    </label>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-outline" onClick={() => { setAddTermSessionId(null); setTermForm({ name: '', termNumber: 1, startDate: '', endDate: '', isCurrent: false }) }}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={createTermMutation.isLoading}>
                        {createTermMutation.isLoading ? 'Creating…' : 'Create term'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Terms</h4>
                {(session.terms || session.Terms || []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>No terms yet.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {(session.terms || session.Terms || []).map((term) => (
                      <li key={term.id || term.Id} style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookMarked size={14} color="var(--text-muted)" />
                        <span>{term.name || term.Name}</span>
                        {(term.isCurrent || term.IsCurrent) && <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>Current</span>}
                        {!(term.isCurrent || term.IsCurrent) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => setCurrentTermMutation.mutate(term.id || term.Id)}
                            disabled={setCurrentTermMutation.isLoading}
                          >
                            Set as current
                          </button>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {term.startDate || term.StartDate} – {term.endDate || term.EndDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionTerm
