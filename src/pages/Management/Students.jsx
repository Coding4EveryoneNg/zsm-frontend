import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { studentsService, commonService, dashboardService, teachersService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const Students = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  const roleLower = String(user?.role ?? '').toLowerCase()
  const isAdmin = roleLower === 'admin'
  const isTeacher = roleLower === 'teacher'
  const isPrincipal = roleLower === 'principal'

  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isAdmin || isTeacher || isPrincipal }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  const schoolIdForClasses = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : principalOrAdminSchoolId
  const { data: classesData } = useQuery(
    ['classes-dropdown', schoolIdForClasses],
    () => commonService.getClassesDropdown({ schoolId: schoolIdForClasses }),
    { enabled: !!schoolIdForClasses && isAdmin }
  )
  const { data: teacherClassesData } = useQuery(
    'teacher-my-classes',
    () => teachersService.getMyClasses(),
    { enabled: isTeacher }
  )
  const classesList = isTeacher
    ? (teacherClassesData?.data ?? teacherClassesData?.Data ?? [])
    : (classesData?.data ?? classesData?.Data ?? [])

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : (isTeacher || isPrincipal ? principalOrAdminSchoolId : null)

  const { data, isLoading, refetch } = useQuery(
    ['students', page, pageSize, effectiveSchoolId, isTeacher ? selectedClassId : null],
    () => {
      const params = { page, pageSize }
      if (isAdmin && effectiveSchoolId) params.schoolId = effectiveSchoolId
      if (isTeacher && selectedClassId) params.classId = selectedClassId
      return studentsService.getStudents(params)
    },
    { keepPreviousData: true, enabled: isTeacher || isPrincipal || (isAdmin && !!effectiveSchoolId) || (!isAdmin && !!principalOrAdminSchoolId) }
  )

  const handleExportExcel = async () => {
    try {
      const params = isAdmin && effectiveSchoolId ? { schoolId: effectiveSchoolId } : {}
      const response = await studentsService.exportStudents('excel', params)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `students_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export started')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  if (isLoading) return <Loading />

  const rawStudents = data?.data?.students ?? data?.data?.Students ?? []
  const totalPages = data?.data?.totalPages ?? data?.data?.TotalPages ?? 1
  const currentPage = data?.data?.currentPage ?? data?.data?.CurrentPage ?? page

  // Client-side search: filter by name, email, studentId, className
  const students = Array.isArray(rawStudents)
    ? rawStudents.filter((s) => {
        if (!searchTerm?.trim()) return true
        const q = searchTerm.toLowerCase().trim()
        const firstName = (s.firstName ?? s.FirstName ?? '').toLowerCase()
        const lastName = (s.lastName ?? s.LastName ?? '').toLowerCase()
        const email = (s.email ?? s.Email ?? '').toLowerCase()
        const studentId = (s.studentId ?? s.StudentId ?? s.id ?? s.Id ?? '').toString().toLowerCase()
        const className = (s.className ?? s.ClassName ?? '').toLowerCase()
        return (
          firstName.includes(q) ||
          lastName.includes(q) ||
          email.includes(q) ||
          studentId.includes(q) ||
          className.includes(q) ||
          `${firstName} ${lastName}`.includes(q) ||
          `${lastName} ${firstName}`.includes(q)
        )
      })
    : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Students</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!isTeacher && (
            <>
              <button className="btn btn-secondary" onClick={handleExportExcel}>
                <Download size={18} />
                Export Excel
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/students/create')}>
                <Plus size={18} />
                Add Student
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && schoolsList?.length > 0 && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>School</label>
              <select
                className="form-input"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => { setSelectedSchoolId(e.target.value); setPage(1) }}
              >
                <option value="">Select school</option>
                {schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {isTeacher && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.875rem' }}>Class</label>
              <select
                className="form-input"
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setPage(1) }}
              >
                <option value="">All my classes</option>
                {(classesList || []).map((c) => (
                  <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search students by name, email, ID, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Class</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentId || student.id}</td>
                    <td>{student.firstName ?? student.FirstName} {student.lastName ?? student.LastName}</td>
                    <td>{student.email ?? student.Email}</td>
                    <td>{student.className ?? student.ClassName ?? 'N/A'}</td>
                    <td>
                      <span className={`badge ${(student.isActive !== false) ? 'badge-success' : 'badge-danger'}`}>
                        {(student.isActive !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <p className="empty-state-text">No students found</p>
                      {searchTerm ? <p className="empty-state-subtext">Try a different search term</p> : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!searchTerm && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Students
