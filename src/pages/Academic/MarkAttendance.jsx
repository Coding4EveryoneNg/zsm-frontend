import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { attendanceService, commonService, teachersService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Save, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import { format, isWeekend, addDays } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Excused', label: 'Excused' },
]

const MarkAttendance = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const isTeacher = (user?.role || user?.Role || '').toString().toLowerCase() === 'teacher'
  const isAdmin = (user?.role || user?.Role || '').toString().toLowerCase() === 'admin'
  const isPrincipal = (user?.role || user?.Role || '').toString().toLowerCase() === 'principal'

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return isWeekend(today) ? format(addDays(today, 1), 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd')
  })
  const [studentStatuses, setStudentStatuses] = useState({})

  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    setSelectedClassId('')
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

  // Teachers see only classes where they are class teacher (for attendance). Admin/Principal see all.
  const { data: teacherClassTeacherClassesRes } = useQuery(
    ['teacher-class-teacher-classes', user?.id ?? user?.Id],
    () => teachersService.getMyClassesAsClassTeacher(),
    { enabled: isTeacher }
  )
  const teacherClassTeacherClasses = teacherClassTeacherClassesRes?.data?.data ?? teacherClassTeacherClassesRes?.data ?? teacherClassTeacherClassesRes ?? []
  const { data: classesRes } = useQuery(
    ['classes-dropdown', effectiveSchoolId, isTeacher],
    () => commonService.getClassesDropdown({ schoolId: effectiveSchoolId }),
    { enabled: !!effectiveSchoolId && !isTeacher }
  )
  const classes = useMemo(() => {
    if (!isTeacher) return (classesRes?.data ?? classesRes ?? [])
    return teacherClassTeacherClasses
  }, [isTeacher, classesRes, teacherClassTeacherClasses])

  const dateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null
  const isWeekday = dateObj && !isWeekend(dateObj)

  const { data: attendanceRes, isLoading: loadingAttendance } = useQuery(
    ['attendance', selectedClassId, selectedDate],
    () => attendanceService.getClassAttendanceForDate(selectedClassId, selectedDate),
    { enabled: !!selectedClassId && !!selectedDate && isWeekday }
  )

  const records = attendanceRes?.data?.records ?? attendanceRes?.data?.data?.records ?? attendanceRes?.records ?? []
  const attendanceAvailable = attendanceRes?.data?.attendanceAvailable ?? attendanceRes?.data?.data?.attendanceAvailable ?? attendanceRes?.attendanceAvailable ?? true
  const attendanceUnavailableReason = attendanceRes?.data?.attendanceUnavailableReason ?? attendanceRes?.data?.data?.attendanceUnavailableReason ?? attendanceRes?.attendanceUnavailableReason ?? null
  const initialStatuses = useMemo(() => {
    const map = {}
    records.forEach((r) => {
      map[r.studentId ?? r.StudentId] = r.status ?? r.Status ?? 'Present'
    })
    return map
  }, [records])

  React.useEffect(() => {
    setStudentStatuses(initialStatuses)
  }, [initialStatuses])

  const markMutation = useMutation(
    (payload) => attendanceService.markAttendance(payload),
    {
      onSuccess: () => {
        handleSuccess('Attendance marked successfully.')
        queryClient.invalidateQueries(['attendance', selectedClassId, selectedDate])
      },
      onError: (err) => {
        const msg = err?.response?.data?.message ?? err?.response?.data?.errors?.[0] ?? err?.message
        if (msg && String(msg).toLowerCase().includes('attendance module')) {
          handleError(err, 'Attendance module is not enabled for this school. Contact your administrator.')
        } else {
          handleError(err, 'Failed to mark attendance')
        }
      },
    }
  )

  const handleStatusChange = (studentId, status) => {
    setStudentStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAll = (status) => {
    const next = {}
    records.forEach((r) => {
      next[r.studentId ?? r.StudentId] = status
    })
    setStudentStatuses(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedClassId || !selectedDate) {
      toast.error('Please select class and date')
      return
    }
    if (!isWeekday) {
      toast.error('Attendance can only be marked on weekdays')
      return
    }
    const studentAttendances = records.map((r) => {
      const sid = r.studentId ?? r.StudentId
      return {
        studentId: sid,
        status: studentStatuses[sid] ?? 'Present',
        remarks: null,
      }
    })
    markMutation.mutate({
      classId: selectedClassId,
      attendanceDate: `${selectedDate}T00:00:00`,
      studentAttendances,
    })
  }

  const canMark = isWeekday && attendanceAvailable && records.length > 0

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.history.back()}
              style={{ padding: '0.5rem' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="card-title">Mark Attendance</h1>
          </div>
          <Link to="/attendance/term" className="btn btn-outline btn-sm">
            View Term Attendance
          </Link>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {isAdmin && schoolsList?.length > 1 && (
                <div>
                  <label className="form-label">School</label>
                  <select
                    className="form-select"
                    value={selectedSchoolId || effectiveSchoolId || ''}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    disabled={switchSchoolMutation.isLoading}
                  >
                    {schoolsList.map((s) => (
                      <option key={s.id ?? s.Id} value={s.id ?? s.Id}>{s.name ?? s.Name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id ?? c.Id} value={c.id ?? c.Id}>
                      {c.name ?? c.Name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {dateObj && isWeekend(dateObj) && (
                  <small style={{ color: 'var(--warning)', marginTop: '0.25rem', display: 'block' }}>
                    Weekend – attendance cannot be marked
                  </small>
                )}
                {!loadingAttendance && selectedClassId && selectedDate && isWeekday && !attendanceAvailable && attendanceUnavailableReason && (
                  <small style={{ color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                    {attendanceUnavailableReason}
                  </small>
                )}
              </div>
            </div>

            {loadingAttendance && selectedClassId && selectedDate && (
              <Loading />
            )}

            {!loadingAttendance && selectedClassId && selectedDate && isWeekday && !attendanceAvailable && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--danger)', margin: 0, fontWeight: 500 }}>
                  {attendanceUnavailableReason || 'Attendance cannot be marked for this date.'}
                </p>
              </div>
            )}

            {!loadingAttendance && selectedClassId && selectedDate && isWeekday && (
              <>
                {records.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No students in this class.</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => handleMarkAll('Present')}>
                        <Check size={14} /> Mark all Present
                      </button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => handleMarkAll('Absent')}>
                        <X size={14} /> Mark all Absent
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r, idx) => {
                            const sid = r.studentId ?? r.StudentId
                            const name = r.studentName ?? r.StudentName ?? '—'
                            return (
                              <tr key={sid}>
                                <td>{idx + 1}</td>
                                <td>{name}</td>
                                <td>
                                  <select
                                    className="form-select"
                                    style={{ minWidth: '120px' }}
                                    value={studentStatuses[sid] ?? 'Present'}
                                    onChange={(e) => handleStatusChange(sid, e.target.value)}
                                  >
                                    {STATUS_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {canMark && (
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={markMutation.isLoading}
                >
                  <Save size={18} /> {markMutation.isLoading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default MarkAttendance
