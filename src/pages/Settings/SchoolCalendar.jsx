import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { schoolCalendarService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Common/Loading'
import { Calendar, Plus, CalendarDays, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'Resumption', label: 'Resumption' },
  { value: 'EndOfTerm', label: 'End of Term' },
  { value: 'Examination', label: 'Examination' },
  { value: 'PublicHoliday', label: 'Public Holiday' },
  { value: 'ImportantDate', label: 'Important Date' },
  { value: 'Other', label: 'Other' }
]

const SchoolCalendar = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', eventType: 'Other', eventDate: '', description: '' })

  const canManage = user?.role === 'Admin' || user?.role === 'Principal'

  const { data, isLoading, error } = useQuery(
    ['schoolcalendar', 'events'],
    () => schoolCalendarService.getEvents({ pageSize: 200 }),
    { enabled: !!user }
  )

  const createMutation = useMutation(
    (payload) => schoolCalendarService.createEvent(payload),
    {
      onSuccess: () => {
        toast.success('Event created. All school members have been notified.')
        queryClient.invalidateQueries('schoolcalendar')
        setShowForm(false)
        setForm({ title: '', eventType: 'Other', eventDate: '', description: '' })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to create event')
    }
  )

  const updateMutation = useMutation(
    ({ id, payload }) => schoolCalendarService.updateEvent(id, payload),
    {
      onSuccess: () => {
        toast.success('Event updated. All school members have been notified.')
        queryClient.invalidateQueries('schoolcalendar')
        setEditingId(null)
        setForm({ title: '', eventType: 'Other', eventDate: '', description: '' })
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to update event')
    }
  )

  const deleteMutation = useMutation(
    (id) => schoolCalendarService.deleteEvent(id),
    {
      onSuccess: () => {
        toast.success('Event deleted.')
        queryClient.invalidateQueries('schoolcalendar')
      },
      onError: (err) => toast.error(err?.response?.data?.errors?.[0] || err?.message || 'Failed to delete event')
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.eventDate) {
      toast.error('Title and date are required')
      return
    }
    const payload = {
      title: form.title,
      eventType: form.eventType,
      eventDate: form.eventDate,
      description: form.description || null
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const startEdit = (evt) => {
    setEditingId(evt.id || evt.Id)
    setForm({
      title: evt.title || evt.Title,
      eventType: evt.eventType || evt.EventType || 'Other',
      eventDate: (evt.eventDate || evt.EventDate || '').slice(0, 10),
      description: evt.description || evt.Description || ''
    })
    setShowForm(true)
  }

  const res = data?.data ?? data
  const events = res?.events ?? res?.Events ?? []

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading school calendar</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          School Calendar
        </h1>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setEditingId(null); setForm({ title: '', eventType: 'Other', eventDate: '', description: '' }); setShowForm(!showForm) }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            {showForm ? 'Cancel' : 'Add date'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {editingId ? 'Edit event' : 'New important date'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '480px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Title</label>
              <input
                type="text"
                className="form-control"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Resumption, End of term, Exams"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Type</label>
              <select
                className="form-control"
                value={form.eventType}
                onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
              >
                {EVENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Date</label>
              <input
                type="date"
                className="form-control"
                value={form.eventDate}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Description (optional)</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Additional details"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {editingId ? (updateMutation.isLoading ? 'Saving…' : 'Save') : (createMutation.isLoading ? 'Adding…' : 'Add date')}
              </button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 && !showForm ? (
        <div className="card">
          <div className="empty-state">
            <CalendarDays size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No calendar dates yet</p>
            <p className="empty-state-subtext">
              {canManage ? 'Add resumption, end of term, examination dates, and other important dates. All school members will be notified.' : 'Your school has not added any calendar dates yet.'}
            </p>
            {canManage && (
              <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
                Add date
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Important dates</h3>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {events
              .sort((a, b) => new Date(a.eventDate || a.EventDate) - new Date(b.eventDate || b.EventDate))
              .map((evt) => (
                <li
                  key={evt.id || evt.Id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <Calendar size={18} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{evt.title || evt.Title}</span>
                    <span className="badge badge-outline" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      {evt.eventType || evt.EventType}
                    </span>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {(evt.eventDate || evt.EventDate)?.slice(0, 10)}
                      {(evt.description || evt.Description) && ` · ${evt.description || evt.Description}`}
                    </div>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => startEdit(evt)}>
                        <Edit2 size={14} />
                      </button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => deleteMutation.mutate(evt.id || evt.Id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SchoolCalendar
