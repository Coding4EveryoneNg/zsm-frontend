import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { examinationTimetableService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { ClipboardList, Plus, BookOpen, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError } from '../../utils/errorHandler'

const ExaminationTimetable = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [createForm, setCreateForm] = useState({ classId: '', termId: '', sessionId: '' })
  const [entryForm, setEntryForm] = useState({ subjectId: '', scheduledStart: '', durationMinutes: 60, sortOrder: 0 })

  const canManage = user?.role === 'Admin' || user?.role === 'Principal'

  const { data: listData, isLoading } = useQuery(
    ['examination-timetable'],
    () => examinationTimetableService.list({ pageSize: 100 }),
    { enabled: !!user }
  )
  const { data: detailData } = useQuery(
    ['examination-timetable', selectedId],
    () => examinationTimetableService.get(selectedId),
    { enabled: !!selectedId }
  )
  const { data: entriesData } = useQuery(
    ['examination-timetable', selectedId, 'entries'],
    () => examinationTimetableService.getEntries(selectedId),
    { enabled: !!selectedId }
  )
  const { data: classesData } = useQuery(
    ['common', 'classes'],
    () => commonService.getClassesDropdown(),
    { enabled: showCreate || showAddEntry }
  )
  const classes = classesData?.data ?? classesData?.Data ?? []
  const createFormClass = classes.find((c) => (c.id || c.Id) === createForm.classId)
  const schoolIdForTerms = createFormClass?.schoolId ?? createFormClass?.SchoolId
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForTerms],
    () => commonService.getTermsDropdown({ schoolId: schoolIdForTerms }),
    { enabled: (showCreate || showAddEntry) && !!schoolIdForTerms }
  )
  const { data: sessionsData } = useQuery(
    ['sessions-dropdown'],
    () => commonService.getSessionsDropdown(),
    { enabled: showCreate || showAddEntry, staleTime: 5 * 60 * 1000 }
  )
  const classIdForSubjects = detailData?.data?.data?.classId ?? detailData?.data?.classId ?? createForm.classId
  const { data: subjectsData } = useQuery(
    ['exam-timetable', 'subjects', classIdForSubjects],
    () => examinationTimetableService.getSubjectsForClass(classIdForSubjects),
    { enabled: !!(showAddEntry && classIdForSubjects) }
  )

  const createMutation = useMutation(
    (payload) => examinationTimetableService.create(payload),
    {
      onSuccess: () => {
        toast.success('Timetable created.')
        queryClient.invalidateQueries('examination-timetable')
        setShowCreate(false)
        setCreateForm({ classId: '', termId: '', sessionId: '' })
      },
      onError: (err) => handleError(err, 'Failed to create')
    }
  )
  const addEntryMutation = useMutation(
    ({ id, payload }) => examinationTimetableService.addEntry(id, payload),
    {
      onSuccess: () => {
        toast.success('Entry added.')
        queryClient.invalidateQueries('examination-timetable')
        setShowAddEntry(false)
        setEntryForm({ subjectId: '', scheduledStart: '', durationMinutes: 60, sortOrder: 0 })
      },
      onError: (err) => handleError(err, 'Failed to add entry')
    }
  )
  const deleteTimetableMutation = useMutation(
    (id) => examinationTimetableService.delete(id),
    {
      onSuccess: () => {
        toast.success('Timetable deleted.')
        queryClient.invalidateQueries('examination-timetable')
        setSelectedId(null)
      },
      onError: (err) => handleError(err, 'Failed to delete')
    }
  )

  const timetables = listData?.data?.data?.timetables ?? listData?.data?.timetables ?? []
  const entries = entriesData?.data?.data ?? entriesData?.data ?? []
  const terms = termsData?.data ?? termsData?.Data ?? []
  const sessions = sessionsData?.data ?? sessionsData?.Data ?? []
  const subjects = subjectsData?.data?.data?.subjects ?? subjectsData?.data?.subjects ?? []
  const selected = detailData?.data?.data ?? detailData?.data

  const handleCreate = (e) => {
    e.preventDefault()
    if (!createForm.classId || !createForm.termId || !createForm.sessionId) {
      toast.error('Class, term, and session are required')
      return
    }
    createMutation.mutate({
      classId: createForm.classId,
      termId: createForm.termId,
      sessionId: createForm.sessionId
    })
  }

  const handleAddEntry = (e) => {
    e.preventDefault()
    if (!selectedId || !entryForm.subjectId || !entryForm.scheduledStart) {
      toast.error('Subject and scheduled start are required')
      return
    }
    addEntryMutation.mutate({
      id: selectedId,
      payload: {
        subjectId: entryForm.subjectId,
        scheduledStart: entryForm.scheduledStart,
        durationMinutes: parseInt(entryForm.durationMinutes, 10) || 60,
        sortOrder: parseInt(entryForm.sortOrder, 10) || 0
      }
    })
  }

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Examination Timetables
        </h1>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            New timetable
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create timetable (Class, Term, Session)</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">Class</label>
              <select className="form-control" value={createForm.classId} onChange={(e) => setCreateForm((f) => ({ ...f, classId: e.target.value }))} required>
                <option value="">Select</option>
                {classes.map((c) => (
                  <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Term</label>
              <select className="form-control" value={createForm.termId} onChange={(e) => setCreateForm((f) => ({ ...f, termId: e.target.value }))} required>
                <option value="">Select</option>
                {terms.map((t) => (
                  <option key={t.id || t.Id} value={t.id || t.Id}>{t.name || t.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Session</label>
              <select className="form-control" value={createForm.sessionId} onChange={(e) => setCreateForm((f) => ({ ...f, sessionId: e.target.value }))} required>
                <option value="">Select</option>
                {sessions.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading}>Create</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Timetables</h4>
          {timetables.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No timetables yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {timetables.map((t) => (
                <li key={t.id || t.Id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(t.id || t.Id); setShowAddEntry(false) }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      background: selectedId === (t.id || t.Id) ? 'var(--bg-tertiary)' : 'transparent',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{t.className || t.ClassName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t.termName || t.TermName} · {t.sessionName || t.SessionName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(t.entryCount ?? t.EntryCount ?? 0)} entries
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          {!selectedId ? (
            <div className="empty-state">
              <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p className="empty-state-text">Select a timetable to view entries</p>
              <p className="empty-state-subtext">Exams can only be accessed from the scheduled time on the timetable.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>
                  {selected?.className || selected?.ClassName} — {selected?.termName || selected?.TermName} · {selected?.sessionName || selected?.SessionName}
                </h4>
                {canManage && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowAddEntry(true)}>
                      <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add entry
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => deleteTimetableMutation.mutate(selectedId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {showAddEntry && (
                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '1rem' }}>
                  <h5 style={{ marginBottom: '0.75rem' }}>Add exam slot</h5>
                  <form onSubmit={handleAddEntry} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                      <label className="form-label">Subject</label>
                      <select className="form-control" value={entryForm.subjectId} onChange={(e) => setEntryForm((f) => ({ ...f, subjectId: e.target.value }))} required>
                        <option value="">Select</option>
                        {subjects.map((s) => (
                          <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Scheduled start</label>
                      <input type="datetime-local" className="form-control" value={entryForm.scheduledStart} onChange={(e) => setEntryForm((f) => ({ ...f, scheduledStart: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="form-label">Duration (min)</label>
                      <input type="number" min={1} className="form-control" value={entryForm.durationMinutes} onChange={(e) => setEntryForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowAddEntry(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={addEntryMutation.isLoading}>Add</button>
                    </div>
                  </form>
                </div>
              )}

              <div>
                <h5 style={{ marginBottom: '0.5rem' }}>Entries</h5>
                {entries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No entries yet. Add exam slots above.</p>
                ) : (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Scheduled start</th>
                        <th>Duration</th>
                        <th>Exam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => (
                        <tr key={e.id || e.Id}>
                          <td>{e.subjectName || e.SubjectName}</td>
                          <td>{(e.scheduledStart || e.ScheduledStart)?.slice(0, 16)?.replace('T', ' ')}</td>
                          <td>{(e.durationMinutes ?? e.DurationMinutes) ?? 0} min</td>
                          <td>{e.examinationTitle || e.ExaminationTitle || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExaminationTimetable
