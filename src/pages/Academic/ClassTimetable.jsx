import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { classTimetableService, commonService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { Calendar, Plus, BookOpen, Trash2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ClassTimetable = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [createForm, setCreateForm] = useState({ classId: '', termId: '', sessionId: '' })
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 0, periodNumber: 1, startTime: '08:00', endTime: '09:00', subjectId: '', teacherId: '' })

  const role = String(user?.role ?? '').toLowerCase()
  const isStudent = role === 'student'
  const isAdminOrPrincipal = role === 'admin' || role === 'principal'
  const isClassTeacher = role === 'teacher'
  const canManage = isAdminOrPrincipal || isClassTeacher
  const canApprove = isAdminOrPrincipal

  const { data: listData, isLoading } = useQuery(
    ['class-timetable'],
    () => classTimetableService.list({ pageSize: 100 }),
    { enabled: !!user }
  )
  const { data: detailData } = useQuery(
    ['class-timetable', selectedId],
    () => classTimetableService.get(selectedId),
    { enabled: !!selectedId }
  )
  const { data: slotsData } = useQuery(
    ['class-timetable', selectedId, 'slots'],
    () => classTimetableService.getSlots(selectedId),
    { enabled: !!selectedId }
  )
  const { data: classesData } = useQuery(
    ['common', 'classes'],
    () => commonService.getClassesDropdown(),
    { enabled: (showCreate || showAddSlot) && canManage }
  )
  const classes = classesData?.data ?? classesData?.Data ?? []
  const createFormClass = classes.find((c) => (c.id || c.Id) === createForm.classId)
  const schoolIdForTerms = createFormClass?.schoolId ?? createFormClass?.SchoolId
  const { data: termsData } = useQuery(
    ['terms-dropdown', schoolIdForTerms],
    () => commonService.getTermsDropdown({ schoolId: schoolIdForTerms }),
    { enabled: (showCreate || showAddSlot) && !!schoolIdForTerms && canManage }
  )
  const { data: sessionsData } = useQuery(
    'sessions-dropdown',
    () => commonService.getSessionsDropdown(),
    { enabled: (showCreate || showAddSlot) && canManage }
  )
  const classIdForSubjects = detailData?.data?.data?.classId ?? detailData?.data?.classId ?? createForm.classId
  const schoolIdForTeachers = detailData?.data?.data?.schoolId ?? detailData?.data?.schoolId
  const { data: subjectsData } = useQuery(
    ['class-timetable', 'subjects', classIdForSubjects],
    () => classTimetableService.getSubjectsForClass(classIdForSubjects),
    { enabled: !!(showAddSlot && classIdForSubjects && canManage) }
  )
  const { data: teachersData } = useQuery(
    ['teachers-dropdown', schoolIdForTeachers],
    () => commonService.getTeachersDropdown({ schoolId: schoolIdForTeachers }),
    { enabled: !!(showAddSlot && schoolIdForTeachers && canManage) }
  )

  const createMutation = useMutation(
    (payload) => classTimetableService.create(payload),
    {
      onSuccess: () => {
        toast.success('Class timetable created.')
        queryClient.invalidateQueries('class-timetable')
        setShowCreate(false)
        setCreateForm({ classId: '', termId: '', sessionId: '' })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to create')
    }
  )
  const approveMutation = useMutation(
    ({ id, approve }) => classTimetableService.approve(id, approve),
    {
      onSuccess: (_, { approve }) => {
        toast.success(approve ? 'Class timetable approved.' : 'Class timetable unapproved.')
        queryClient.invalidateQueries('class-timetable')
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to update approval')
    }
  )
  const addSlotMutation = useMutation(
    ({ id, payload }) => classTimetableService.addSlot(id, payload),
    {
      onSuccess: () => {
        toast.success('Slot added.')
        queryClient.invalidateQueries('class-timetable')
        setShowAddSlot(false)
        setSlotForm({ dayOfWeek: 0, periodNumber: 1, startTime: '08:00', endTime: '09:00', subjectId: '', teacherId: '' })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to add slot')
    }
  )
  const deleteTimetableMutation = useMutation(
    (id) => classTimetableService.delete(id),
    {
      onSuccess: () => {
        toast.success('Class timetable deleted.')
        queryClient.invalidateQueries('class-timetable')
        setSelectedId(null)
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to delete')
    }
  )
  const deleteSlotMutation = useMutation(
    (slotId) => classTimetableService.deleteSlot(slotId),
    {
      onSuccess: () => {
        toast.success('Slot deleted.')
        queryClient.invalidateQueries('class-timetable')
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to delete slot')
    }
  )

  const timetables = listData?.data?.data?.timetables ?? listData?.data?.timetables ?? []
  const slots = slotsData?.data?.data ?? slotsData?.data ?? []
  const terms = termsData?.data ?? termsData?.Data ?? []
  const sessions = sessionsData?.data ?? sessionsData?.Data ?? []
  const subjects = subjectsData?.data?.data?.subjects ?? subjectsData?.data?.subjects ?? []
  const teachers = teachersData?.data ?? teachersData?.Data ?? []
  const selected = detailData?.data?.data ?? detailData?.data

  const isApproved = selected?.isApproved ?? selected?.IsApproved ?? false

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

  const handleAddSlot = (e) => {
    e.preventDefault()
    if (!selectedId || !slotForm.subjectId) {
      toast.error('Subject is required')
      return
    }
    addSlotMutation.mutate({
      id: selectedId,
      payload: {
        dayOfWeek: parseInt(slotForm.dayOfWeek, 10) ?? 0,
        periodNumber: parseInt(slotForm.periodNumber, 10) ?? 1,
        startTime: slotForm.startTime || '08:00',
        endTime: slotForm.endTime || '09:00',
        subjectId: slotForm.subjectId,
        teacherId: slotForm.teacherId || undefined
      }
    })
  }

  const handleApprove = (approve) => {
    if (!selectedId) return
    approveMutation.mutate({ id: selectedId, approve })
  }

  // Build grid: rows = periods, cols = days
  const periods = [...new Set(slots.map((s) => s.periodNumber ?? s.PeriodNumber))].sort((a, b) => a - b)
  const days = [...new Set(slots.map((s) => s.dayOfWeek ?? s.DayOfWeek))].sort((a, b) => a - b)

  if (isLoading) return <Loading />

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Class Timetable
        </h1>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            New timetable
          </button>
        )}
      </div>

      {isStudent && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-tertiary)' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            You can view the approved timetable for your class below.
          </p>
        </div>
      )}

      {showCreate && canManage && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create class timetable (Class, Term, Session)</h3>
          {isClassTeacher && (
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              You can only create timetables for classes where you are the class teacher.
            </p>
          )}
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
            <p style={{ color: 'var(--text-muted)' }}>
              {isStudent ? 'No approved timetable for your class yet.' : 'No class timetables yet.'}
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {timetables.map((t) => (
                <li key={t.id || t.Id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedId(t.id || t.Id); setShowAddSlot(false) }}
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
                      {(t.slotCount ?? t.SlotCount ?? 0)} slots
                    </div>
                    {!isStudent && (
                      <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                        {(t.isApproved ?? t.IsApproved) ? (
                          <span style={{ color: 'var(--success)' }}>Approved</span>
                        ) : (
                          <span style={{ color: 'var(--warning)' }}>Pending approval</span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          {!selectedId ? (
            <div className="empty-state">
              <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p className="empty-state-text">Select a timetable to view the weekly schedule</p>
              <p className="empty-state-subtext">
                {isStudent
                  ? 'Your class timetable shows the daily recurring schedule.'
                  : 'Class timetables show the daily recurring schedule (e.g., Mon 8am Math, Tue 9am English).'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>
                    {selected?.className || selected?.ClassName} — {selected?.termName || selected?.TermName} · {selected?.sessionName || selected?.SessionName}
                  </h4>
                  {!isStudent && (
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {isApproved ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Approved
                        </span>
                      ) : (
                        <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <XCircle size={14} /> Pending approval
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {canApprove && (
                    <button
                      type="button"
                      className={`btn btn-sm ${isApproved ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleApprove(!isApproved)}
                      disabled={approveMutation.isLoading}
                    >
                      {isApproved ? <XCircle size={14} style={{ marginRight: '0.25rem' }} /> : <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />}
                      {isApproved ? 'Unapprove' : 'Approve'}
                    </button>
                  )}
                  {canManage && (
                    <>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowAddSlot(true)}>
                        <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add slot
                      </button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => deleteTimetableMutation.mutate(selectedId)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showAddSlot && canManage && (
                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '1rem' }}>
                  <h5 style={{ marginBottom: '0.75rem' }}>Add schedule slot</h5>
                  {isClassTeacher && !isApproved && (
                    <p style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Changes will require Admin/Principal approval before students can see them.
                    </p>
                  )}
                  <form onSubmit={handleAddSlot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                      <label className="form-label">Day</label>
                      <select className="form-control" value={slotForm.dayOfWeek} onChange={(e) => setSlotForm((f) => ({ ...f, dayOfWeek: e.target.value }))}>
                        {DAY_NAMES.map((d, i) => (
                          <option key={d} value={i}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Period</label>
                      <input type="number" min={1} className="form-control" value={slotForm.periodNumber} onChange={(e) => setSlotForm((f) => ({ ...f, periodNumber: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Start</label>
                      <input type="time" className="form-control" value={slotForm.startTime} onChange={(e) => setSlotForm((f) => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">End</label>
                      <input type="time" className="form-control" value={slotForm.endTime} onChange={(e) => setSlotForm((f) => ({ ...f, endTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Subject</label>
                      <select className="form-control" value={slotForm.subjectId} onChange={(e) => setSlotForm((f) => ({ ...f, subjectId: e.target.value }))} required>
                        <option value="">Select</option>
                        {subjects.map((s) => (
                          <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Teacher (optional)</label>
                      <select className="form-control" value={slotForm.teacherId} onChange={(e) => setSlotForm((f) => ({ ...f, teacherId: e.target.value }))}>
                        <option value="">—</option>
                        {teachers.map((t) => (
                          <option key={t.id || t.Id} value={t.id || t.Id}>{t.name || t.Name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowAddSlot(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={addSlotMutation.isLoading}>Add</button>
                    </div>
                  </form>
                </div>
              )}

              <div>
                <h5 style={{ marginBottom: '0.5rem' }}>Weekly schedule</h5>
                {slots.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    {canManage ? 'No slots yet. Add schedule slots above.' : 'No slots in this timetable.'}
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', minWidth: '500px' }}>
                      <thead>
                        <tr>
                          <th>Period</th>
                          {DAY_NAMES.map((d) => (
                            <th key={d}>{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period}>
                            <td style={{ fontWeight: 600 }}>P{period}</td>
                            {DAY_NAMES.map((_, dayIdx) => {
                              const slot = slots.find((s) => (s.periodNumber ?? s.PeriodNumber) === period && (s.dayOfWeek ?? s.DayOfWeek) === dayIdx)
                              return (
                                <td key={dayIdx} style={{ verticalAlign: 'top' }}>
                                  {slot ? (
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.875rem' }}>
                                      <div style={{ fontWeight: 600 }}>{slot.subjectName ?? slot.SubjectName}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {(slot.startTime ?? slot.StartTime) || ''}-{(slot.endTime ?? slot.EndTime) || ''}
                                      </div>
                                      {slot.teacherName ?? slot.TeacherName ? (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{slot.teacherName ?? slot.TeacherName}</div>
                                      ) : null}
                                      {canManage && (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline"
                                          style={{ marginTop: '0.25rem', padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                          onClick={() => deleteSlotMutation.mutate(slot.id ?? slot.Id)}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassTimetable
