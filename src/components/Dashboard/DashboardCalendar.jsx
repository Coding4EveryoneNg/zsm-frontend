import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { schoolCalendarService, dashboardService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

const EVENT_TYPE_COLORS = {
  Resumption: 'var(--success)',
  EndOfTerm: 'var(--warning)',
  Examination: 'var(--danger)',
  PublicHoliday: 'var(--info)',
  ImportantDate: 'var(--primary-yellow)',
  Other: 'var(--text-muted)',
}

const DashboardCalendar = () => {
  const { user } = useAuth()
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  const { data: schoolSwitchData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: ['Admin', 'SuperAdmin'].includes(user?.role || '') }
  )

  const schoolId = useMemo(() => {
    const role = (user?.role || '').toString()
    if (role === 'SuperAdmin' || role === 'Admin') {
      const data = schoolSwitchData?.data?.data ?? schoolSwitchData?.data
      const current = data?.currentSchoolId ?? data?.currentSchool?.id ?? data?.currentSchool?.Id
      const schools = data?.availableSchools ?? []
      if (current) return current
      return schools?.[0]?.id ?? schools?.[0]?.Id ?? null
    }
    return null
  }, [user?.role, schoolSwitchData])

  const monthStart = useMemo(() => new Date(currentYear, currentMonth, 1), [currentYear, currentMonth])
  const monthEnd = useMemo(() => new Date(currentYear, currentMonth + 1, 0), [currentYear, currentMonth])
  const from = monthStart.toISOString().slice(0, 10)
  const to = monthEnd.toISOString().slice(0, 10)

  const params = useMemo(() => {
    const p = { page: 1, pageSize: 100, from, to }
    if (schoolId && ['Admin', 'SuperAdmin'].includes(user?.role || '')) p.schoolId = schoolId
    return p
  }, [from, to, schoolId, user?.role])

  const { data, isLoading } = useQuery(
    ['schoolcalendar', 'events', from, to, schoolId],
    () => schoolCalendarService.getEvents(params),
    { enabled: !!user }
  )

  const eventsByDate = useMemo(() => {
    const res = data?.data ?? data
    const events = res?.events ?? res?.Events ?? []
    const map = {}
    events.forEach((evt) => {
      const d = (evt.eventDate || evt.EventDate || '').toString().slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(evt)
    })
    return map
  }, [data])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else setCurrentMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else setCurrentMonth((m) => m + 1)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const firstDay = monthStart.getDay()
  const daysInMonth = monthEnd.getDate()
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarDays size={18} />
          Calendar
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" className="btn btn-sm btn-outline" onClick={prevMonth} style={{ padding: '0.25rem 0.5rem' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ minWidth: '140px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button type="button" className="btn btn-sm btn-outline" onClick={nextMonth} style={{ padding: '0.25rem 0.5rem' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
            {dayNames.map((d) => (
              <div key={d} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {blanks.map((_, i) => (
              <div key={`b-${i}`} style={{ aspectRatio: '1', minHeight: 32 }} />
            ))}
            {days.map((d) => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dayEvents = eventsByDate[dateStr] || []
              const isToday =
                currentYear === now.getFullYear() && currentMonth === now.getMonth() && d === now.getDate()

              return (
                <div
                  key={d}
                  style={{
                    aspectRatio: '1',
                    minHeight: 32,
                    border: isToday ? '2px solid var(--primary-yellow)' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '2px',
                    fontSize: '0.75rem',
                    backgroundColor: isToday ? 'rgba(var(--primary-yellow-rgb, 255, 193, 7), 0.1)' : 'var(--bg-primary)',
                  }}
                >
                  <span style={{ fontWeight: isToday ? 700 : 400 }}>{d}</span>
                  {dayEvents.length > 0 && (
                    <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id || evt.Id}
                          title={`${evt.title || evt.Title} (${evt.eventType || evt.EventType})`}
                          style={{
                            fontSize: '0.6rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '1px 2px',
                            borderRadius: 2,
                            backgroundColor: EVENT_TYPE_COLORS[evt.eventType || evt.EventType] || EVENT_TYPE_COLORS.Other,
                            color: 'white',
                          }}
                        >
                          {evt.title || evt.Title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardCalendar
