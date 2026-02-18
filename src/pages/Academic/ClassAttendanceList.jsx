import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { attendanceService, commonService, teachersService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import Loading from '../../components/Common/Loading'
import { ArrowLeft, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const ClassAttendanceList = () => {
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const isTeacher = (user?.role || user?.Role || '').toString().toLowerCase() === 'teacher'
  const isAdmin = (user?.role || user?.Role || '').toString().toLowerCase() === 'admin'

  const [selectedClassId, setSelectedClassId] = useState('')

  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    setSelectedClassId('')
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

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

  const { data: attendanceRes, isLoading } = useQuery(
    ['attendance-term', selectedClassId],
    () => attendanceService.getClassAttendanceForTerm(selectedClassId),
    { enabled: !!selectedClassId }
  )

  const payload = attendanceRes?.data?.data ?? attendanceRes?.data ?? attendanceRes ?? {}
  const records = payload.records ?? payload.Records ?? []
  const termStart = payload.termStart ?? payload.TermStart
  const termEnd = payload.termEnd ?? payload.TermEnd
  const termName = payload.termName ?? payload.TermName ?? 'Current Term'

  // Group by date
  const byDate = useMemo(() => {
    const map = {}
    records.forEach((r) => {
      const d = r.date ?? r.Date
      const key = d ? (typeof d === 'string' ? d.substring(0, 10) : format(new Date(d), 'yyyy-MM-dd')) : ''
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.studentName ?? a.StudentName ?? '').localeCompare(b.studentName ?? b.StudentName ?? '')))
    return map
  }, [records])

  const sortedDates = Object.keys(byDate).sort()

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.history.back()}
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} />
            Class Attendance (Current Term)
          </h1>
        </div>
        <div className="card-body">
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
          </div>

          {!selectedClassId && (
            <p style={{ color: 'var(--text-secondary)' }}>Select a class to view attendance for the current term.</p>
          )}

          {selectedClassId && isLoading && <Loading />}

          {selectedClassId && !isLoading && (
            <>
              {termName && (
                <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {termName}
                  {termStart && termEnd && (
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '0.5rem' }}>
                      ({format(new Date(termStart), 'MMM d, yyyy')} – {format(new Date(termEnd), 'MMM d, yyyy')})
                    </span>
                  )}
                </p>
              )}
              {sortedDates.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No attendance records for this term yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {sortedDates.map((dateKey) => (
                    <div key={dateKey} className="card" style={{ padding: '1rem' }}>
                      <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} />
                        {format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Student</th>
                              <th>Status</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(byDate[dateKey] ?? []).map((r, idx) => (
                              <tr key={`${r.studentId ?? r.StudentId}-${r.date ?? r.Date}`}>
                                <td>{idx + 1}</td>
                                <td>{r.studentName ?? r.StudentName ?? '—'}</td>
                                <td>
                                  <span className={`badge badge-${(r.status ?? r.Status) === 'Present' ? 'success' : (r.status ?? r.Status) === 'Absent' ? 'danger' : 'warning'}`}>
                                    {r.status ?? r.Status ?? '—'}
                                  </span>
                                </td>
                                <td>{r.remarks ?? r.Remarks ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClassAttendanceList
