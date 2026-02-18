import React, { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import LazyChart from '../../components/Charts/LazyChart'
import { reportsService, dashboardService, coursesService, commonService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { BarChart3, Download, Filter, TrendingUp, ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react'
import { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData } from '../../utils/chartHelpers'
import { useAuth } from '../../contexts/AuthContext'
import { useSchool, useSwitchSchool } from '../../contexts/SchoolContext'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import { safeStrLower, formatDecimal, roundDecimal } from '../../utils/safeUtils'
import logger from '../../utils/logger'

const Reports = () => {
  const { studentId, view } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { effectiveSchoolId, selectedSchoolId, setSelectedSchoolId, availableSchools, canUseSchoolSwitching, canSwitchSchools } = useSchool()
  const switchSchoolMutation = useSwitchSchool()
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState('')

  const roleLower = String(user?.role ?? '').toLowerCase()
  const isAdmin = roleLower === 'admin'
  const isPrincipal = roleLower === 'principal'
  const isTeacher = roleLower === 'teacher'
  const isParent = roleLower === 'parent'
  const isStudent = roleLower === 'student'
  const showSchoolFilter = isAdmin
  const showTermSessionFilters = isAdmin || isPrincipal || isTeacher
  const schoolsList = canUseSchoolSwitching ? availableSchools : []

  const handleSchoolChange = (schoolId) => {
    setSelectedSchoolId(schoolId)
    if (canSwitchSchools && schoolId) switchSchoolMutation.mutate(schoolId)
  }

  // Terms dropdown (requires schoolId – per school)
  const { data: termsData } = useQuery(
    ['terms-dropdown', effectiveSchoolId],
    () => commonService.getTermsDropdown({ schoolId: effectiveSchoolId }),
    { enabled: showTermSessionFilters && !!effectiveSchoolId }
  )
  // Sessions dropdown (tenant-wide)
  const { data: sessionsData } = useQuery(
    'sessions-dropdown',
    () => commonService.getSessionsDropdown(),
    { enabled: showTermSessionFilters }
  )

  const terms = Array.isArray(termsData) ? termsData : (termsData?.data ?? termsData?.Data ?? termsData?.items ?? termsData?.Items ?? [])
  const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.data ?? sessionsData?.Data ?? sessionsData?.items ?? sessionsData?.Items ?? [])

  // Fetch dashboard data to get current term and session
  const { data: studentDashboardData } = useQuery(
    'studentDashboard',
    () => dashboardService.getStudentDashboard(),
    { 
      enabled: isStudent,
      refetchInterval: 60000,
      refetchOnError: false
    }
  )

  // Fetch parent dashboard to get current term and session for parent view
  const { data: parentDashboardData } = useQuery(
    'parentDashboard',
    () => dashboardService.getParentDashboard(),
    { 
      enabled: isParent,
      refetchInterval: 60000,
      refetchOnError: false
    }
  )

  // Get current student ID for result generation (must be Student entity Guid, not ApplicationUser id)
  // For students: use studentId from URL, or studentGuidId from dashboard when at /reports
  // For parents viewing a child: use studentId from URL params
  const studentDashboardPayload = studentDashboardData?.data || studentDashboardData || {}
  const studentGuidIdFromDashboard = studentDashboardPayload.studentGuidId ?? studentDashboardPayload.StudentGuidId
  const currentStudentId = studentId || (isStudent ? studentGuidIdFromDashboard : null)

  // Redirect student from /reports to their results page when we have their studentGuidId
  const emptyGuid = '00000000-0000-0000-0000-000000000000'
  const validStudentGuid = studentGuidIdFromDashboard && String(studentGuidIdFromDashboard) !== emptyGuid
  useEffect(() => {
    if (isStudent && !studentId && validStudentGuid) {
      navigate(`/reports/student/${studentGuidIdFromDashboard}/results`, { replace: true })
    }
  }, [isStudent, studentId, validStudentGuid, studentGuidIdFromDashboard, navigate])

  // Extract current term and session from dashboard data
  useEffect(() => {
    let currentSessionTerm = null
    if (isStudent && studentDashboardData) {
      const dashboard = studentDashboardData?.data || studentDashboardData || {}
      currentSessionTerm = dashboard.currentSessionTerm || dashboard.CurrentSessionTerm
    } else if (isParent && parentDashboardData) {
      const dashboard = parentDashboardData?.data || parentDashboardData || {}
      currentSessionTerm = dashboard.currentSessionTerm || dashboard.CurrentSessionTerm
    }

    // Set default term and session if not already set
    if (currentSessionTerm && !selectedTerm && !selectedSession) {
      const termName = currentSessionTerm.termName || currentSessionTerm.TermName || ''
      const sessionName = currentSessionTerm.sessionName || currentSessionTerm.SessionName || ''
      
      if (termName) setSelectedTerm(termName)
      if (sessionName) setSelectedSession(sessionName)
    }
  }, [studentDashboardData, parentDashboardData, isStudent, isParent, selectedTerm, selectedSession])

  // Set default term/session for Teacher from reports API response
  useEffect(() => {
    if (isTeacher && !studentId && reportsData?.data && !selectedTerm && !selectedSession) {
      const data = reportsData.data || reportsData
      const terms = data.availableTerms || data.AvailableTerms || []
      const sessions = data.availableSessions || data.AvailableSessions || []
      if (terms.length > 0) setSelectedTerm(terms[0])
      if (sessions.length > 0) setSelectedSession(sessions[0])
    }
  }, [isTeacher, studentId, reportsData, selectedTerm, selectedSession])

  // Check if result can be generated - only call if we have term and session
  const { data: canGenerateData } = useQuery(
    ['canGenerateResult', currentStudentId, selectedTerm, selectedSession],
    () => coursesService.canGenerateResult(currentStudentId, { term: selectedTerm, session: selectedSession }),
    { 
      enabled: !!currentStudentId && (isStudent || isParent || (isTeacher && studentId)) && !!selectedTerm && !!selectedSession
    }
  )

  const canGenerate = canGenerateData?.data?.canGenerate || canGenerateData?.data?.CanGenerate || false

  const handleGeneratePDF = async () => {
    if (!currentStudentId) {
      toast.error('Student ID is required')
      return
    }
    try {
      const response = await coursesService.generateStudentResultPDF(currentStudentId, { term: selectedTerm, session: selectedSession })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `student-result-${currentStudentId}-${selectedTerm || 'all'}-${selectedSession || 'all'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      handleSuccess('PDF generated successfully!')
    } catch (err) {
      handleError(err, 'Failed to generate PDF')
    }
  }

  const handleGenerateExcel = async () => {
    if (!currentStudentId) {
      toast.error('Student ID is required')
      return
    }
    try {
      const response = await coursesService.generateStudentResultExcel(currentStudentId, { term: selectedTerm, session: selectedSession })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `student-result-${currentStudentId}-${selectedTerm || 'all'}-${selectedSession || 'all'}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      handleSuccess('Excel file generated successfully!')
    } catch (err) {
      handleError(err, 'Failed to generate Excel')
    }
  }

  // Note: parentDashboardData is already fetched above for getting current term/session

  // If viewing a specific student (parent view), use parent student performance endpoint
  const { data: reportsData, isLoading, error: reportsError } = useQuery(
    ['reports', studentId, view, selectedTerm, selectedSession],
    () => {
      if (studentId && isParent) {
        return dashboardService.getParentStudentSubjectPerformance(studentId, { term: selectedTerm, session: selectedSession })
      }
      if (studentId && isTeacher) {
        return dashboardService.getTeacherStudentSubjectPerformance(studentId, { term: selectedTerm, session: selectedSession })
      }
      if (isTeacher) {
        return reportsService.getTeacherStudentsResults({ term: selectedTerm, session: selectedSession })
      }
      if (isPrincipal) {
        return reportsService.getPrincipalStudentsPerformance({ term: selectedTerm, session: selectedSession })
      }
      if (isStudent) {
        return dashboardService.getSubjectPerformance({ term: selectedTerm, session: selectedSession })
      }
      return Promise.resolve({ data: { charts: [], performanceData: [], paymentData: [] } })
    },
    { 
      refetchInterval: 60000,
      refetchOnError: false,
      enabled: (!!studentId && (isParent || isTeacher)) || (isTeacher && !studentId) || isPrincipal || isStudent
    }
  )

  if (isLoading) return <Loading />

  // Debug logging (guarded so logger never throws)
  try {
    if (typeof logger?.debug === 'function') {
      logger.debug('Reports Data:', reportsData)
      logger.debug('Reports Error:', reportsError)
      logger.debug('Student ID:', studentId)
      logger.debug('View:', view)
      logger.debug('User Role:', user?.role)
      logger.debug('Selected Term:', selectedTerm)
      logger.debug('Selected Session:', selectedSession)
    }
  } catch (_) { /* no-op */ }

  // Handle error response
  if (reportsError) {
    try { if (typeof logger?.error === 'function') logger.error('Reports error details:', reportsError) } catch (_) { /* no-op */ }
  }

  // Extract data based on view type - handle both camelCase and PascalCase
  // API returns: { success: true, data: SubjectPerformanceData } or { success: false, errors: [...] }
  // After axios interceptor: reportsData is the ApiResponse object
  let apiData = {}
  if (reportsData) {
    if (reportsData.success === false) {
      try { if (typeof logger?.error === 'function') logger.error('Reports API returned error:', reportsData.errors || reportsData.message) } catch (_) { /* no-op */ }
      // Still try to extract any partial data
      apiData = reportsData.data || {}
    } else {
      // Success response - extract the data
      apiData = reportsData.data || reportsData || {}
    }
  }
  
  // Handle SubjectPerformanceData structure
  // API returns SubjectPerformanceData with:
  // - SubjectPerformances (plural) - List<SubjectPerformance>
  // - OverallPerformance - PerformanceSummary
  // - StudentName, StudentIdNumber, ClassName, SchoolName, etc.
  // - CurrentTermSession, AvailableTermsSessions
  const subjectPerformance = apiData.subjectPerformances || apiData.SubjectPerformances || apiData.subjectPerformance || apiData.SubjectPerformance || []
  const charts = apiData.charts || apiData.Charts || []
  const paymentData = apiData.paymentData || apiData.PaymentData || []
  const teacherStudentResults = apiData.studentResults || apiData.StudentResults || []
  const studentName = apiData.studentName || apiData.StudentName || ''
  const overallPerformance = apiData.overallPerformance || apiData.OverallPerformance || {}
  const performanceData = studentId && view === 'performance' 
    ? subjectPerformance
    : (apiData.performanceData || apiData.PerformanceData || [])
  
  // Ensure arrays are actually arrays
  const safeSubjectPerformance = Array.isArray(subjectPerformance) ? subjectPerformance : []
  const safeCharts = Array.isArray(charts) ? charts : []
  const safePaymentData = Array.isArray(paymentData) ? paymentData : []
  const safePerformanceData = Array.isArray(performanceData) ? performanceData : []
  const safeTeacherStudentResults = Array.isArray(teacherStudentResults) ? teacherStudentResults : []

  try {
    if (typeof logger?.debug === 'function') {
      logger.debug('Extracted Data:', {
        apiData,
        subjectPerformance: safeSubjectPerformance,
        subjectPerformanceLength: safeSubjectPerformance.length,
        performanceData: safePerformanceData,
        charts: safeCharts,
        paymentData: safePaymentData,
        studentName,
        overallPerformance,
        overallPerformanceKeys: Object.keys(overallPerformance)
      })
    }
  } catch (_) { /* no-op */ }

  // Safe chart options/colors to avoid spread on undefined
  const safeChartOptions = defaultChartOptions && typeof defaultChartOptions === 'object' ? defaultChartOptions : { responsive: true, maintainAspectRatio: false, plugins: {} }
  const safeChartPlugins = safeChartOptions.plugins && typeof safeChartOptions.plugins === 'object' ? safeChartOptions.plugins : {}
  const safeChartColors = chartColors && typeof chartColors === 'object' ? chartColors : { primary: '#6366f1', success: '#10b981', warning: '#f59e0b', info: '#3b82f6' }

  // Render chart based on chart data from API (defensive to prevent runtime errors)
  const renderChart = (chart) => {
    try {
      if (!chart || typeof chart !== 'object') return null
      const labels = chart.labels
      const datasets = chart.datasets
      if (!Array.isArray(labels) || !Array.isArray(datasets) || datasets.length === 0) return null

      const chartOptions = {
        ...safeChartOptions,
        plugins: {
          ...safeChartPlugins,
          title: {
            display: true,
            text: chart.title || '',
            font: { size: 16, weight: 'bold' }
          }
        }
      }

      const chartType = safeStrLower(chart.type) || 'bar'
      return <LazyChart type={chartType} data={chart} options={chartOptions} />
    } catch (err) {
      try { if (typeof logger?.error === 'function') logger.error('Chart render error:', err) } catch (_) { /* no-op */ }
      return null
    }
  }

  // Subject Performance Chart (for parent viewing student performance)
  const subjectPerformanceChart = useMemo(() => {
    try {
      if (safeSubjectPerformance && safeSubjectPerformance.length > 0) {
        return createBarChartData(
          safeSubjectPerformance.map(p => p.subjectName || p.SubjectName || 'Unknown'),
          [{
            label: 'Average Score (%)',
            data: safeSubjectPerformance.map(p => roundDecimal(p.percentage ?? p.Percentage ?? p.averageScore ?? p.AverageScore ?? 0)),
            backgroundColor: safeChartColors.primary,
            borderColor: safeChartColors.primary
          }]
        )
      }
    } catch (_) { /* no-op */ }
    return null
  }, [safeSubjectPerformance])

  // Performance by class chart
  const classPerformanceChart = useMemo(() => {
    try {
      if (safePerformanceData && safePerformanceData.length > 0) {
        return createBarChartData(
          safePerformanceData.map(p => p.className || p.ClassName || 'Unknown'),
          [{
            label: 'Average Score (%)',
            data: safePerformanceData.map(p => roundDecimal(p.averageScore ?? p.AverageScore ?? 0)),
            backgroundColor: safeChartColors.primary,
            borderColor: safeChartColors.primary
          }]
        )
      }
    } catch (_) { /* no-op */ }
    return null
  }, [safePerformanceData])

  // Payment status pie chart
  const paymentStatusChart = useMemo(() => {
    try {
      if (safePaymentData && safePaymentData.length > 0) {
        const paid = safePaymentData.filter(p => (p.status || p.Status) === 'Paid').length
        const pending = safePaymentData.filter(p => (p.status || p.Status) === 'Pending').length
        const partial = safePaymentData.filter(p => (p.status || p.Status) === 'PartiallyPaid').length

        return createPieChartData(
          ['Paid', 'Pending', 'Partially Paid'],
          [paid, pending, partial],
          [safeChartColors.success, safeChartColors.warning, safeChartColors.info]
        )
      }
    } catch (_) { /* no-op */ }
    return null
  }, [safePaymentData])

  // Check if we have any data to display
  const hasData = safeSubjectPerformance.length > 0 || 
                  safeCharts.length > 0 || 
                  safePerformanceData.length > 0 ||
                  safePaymentData.length > 0 ||
                  (overallPerformance && Object.keys(overallPerformance).length > 0)

  return (
    <div>
      {/* Error Banner */}
      {reportsError && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Error loading reports data</p>
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
              {reportsError?.message || reportsError?.errors?.[0] || reportsError?.response?.data?.errors?.[0] || 'Please try again later'}
            </p>
            {reportsError?.response?.data?.errors && reportsError.response.data.errors.length > 1 && (
              <ul style={{ margin: '0.5rem 0 0 1.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                {reportsError.response.data.errors.slice(1).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Show error if API returned error response */}
      {reportsData && reportsData.success === false && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Error loading reports data</p>
            {reportsData.errors && reportsData.errors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                {reportsData.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
            {reportsData.message && (
              <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{reportsData.message}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        {(studentId || isStudent) && (
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => navigate(isStudent ? '/dashboard/student' : (isTeacher && studentId) ? '/reports' : '/dashboard/parent')}
            style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} />
            {isStudent ? 'Back to Dashboard' : (isTeacher && studentId) ? 'Back to Students' : 'Back to Dashboard'}
          </button>
        )}
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <BarChart3 size={32} />
          {studentId 
            ? (view === 'performance' ? `Student Performance${studentName ? ` - ${studentName}` : ''}` : `Student Results${studentName ? ` - ${studentName}` : ''}`)
            : 'Reports & Analytics'
          }
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Result Generation Buttons for Students, Parents, and Teachers (when viewing a student) */}
          {(isStudent || (isParent && studentId) || (isTeacher && studentId)) && canGenerate && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={handleGeneratePDF}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="Generate PDF Result"
              >
                <FileText size={18} />
                Generate PDF
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleGenerateExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="Generate Excel Result"
              >
                <FileSpreadsheet size={18} />
                Generate Excel
              </button>
            </>
          )}
          {/* Export button for other roles */}
          {(isTeacher || isPrincipal || isAdmin) && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  try {
                    let response
                    if (isTeacher) {
                      response = await reportsService.exportTeacherStudentsResults({ term: selectedTerm, session: selectedSession })
                    } else if (isPrincipal) {
                      response = await reportsService.exportPrincipalStudentsPerformance({ term: selectedTerm, session: selectedSession })
                    }
                    if (response) {
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `reports-${selectedTerm || 'all'}-${selectedSession || 'all'}.xlsx`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                      window.URL.revokeObjectURL(url)
                    }
                  } catch (err) {
                    handleError(err, 'Failed to export reports')
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={18} />
                Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} />
            Filters
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {showSchoolFilter && (
            <div className="form-group">
              <label className="form-label">School</label>
              <select
                className="form-select"
                value={selectedSchoolId || effectiveSchoolId || ''}
                onChange={(e) => handleSchoolChange(e.target.value)}
                disabled={switchSchoolMutation.isLoading}
              >
                <option value="">Select school</option>
                {Array.isArray(schoolsList) && schoolsList.map((s) => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name}</option>
                ))}
              </select>
            </div>
          )}
          {showTermSessionFilters && (
            <>
              <div className="form-group">
                <label className="form-label">Term</label>
                <select
                  className="form-select"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  disabled={!effectiveSchoolId && isAdmin}
                >
                  <option value="">All Terms</option>
                  {Array.isArray(terms) && terms.map((t) => (
                    <option key={t.id || t.Id} value={t.name || t.Name}>
                      {t.name || t.Name}{t.sessionName ? ` (${t.sessionName})` : ''}
                    </option>
                  ))}
                </select>
                {isAdmin && !effectiveSchoolId && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Select a school first</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Session</label>
                <select
                  className="form-select"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="">All Sessions</option>
                  {Array.isArray(sessions) && sessions.map((s) => (
                    <option key={s.id || s.Id} value={s.name || s.Name}>{s.name || s.Name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Teacher: Student list with View/Generate Result links */}
      {isTeacher && !studentId && safeTeacherStudentResults.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Students - View & Generate Results</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Select a student to view their performance and generate PDF/Excel reports
            </p>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student Number</th>
                    <th>Class</th>
                    <th>Results</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeTeacherStudentResults.map((sr) => {
                    const sid = sr.studentId || sr.StudentId
                    const name = sr.studentName || sr.StudentName || 'N/A'
                    const num = sr.studentNumber || sr.StudentNumber || 'N/A'
                    const cls = sr.className || sr.ClassName || 'N/A'
                    const numResults = Array.isArray(sr.results || sr.Results) ? (sr.results || sr.Results).length : 0
                    return (
                      <tr key={sid}>
                        <td>{name}</td>
                        <td>{num}</td>
                        <td>{cls}</td>
                        <td>{numResults} term(s)</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/reports/student/${sid}/results`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <FileText size={16} />
                            View / Generate Result
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts from API */}
      {safeCharts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {safeCharts.map((chart, index) => (
            <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
              <div style={{ height: '350px' }}>
                {renderChart(chart)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Performance Summary */}
      {overallPerformance && Object.keys(overallPerformance).length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Overall Performance Summary</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {formatDecimal(overallPerformance.overallAverage ?? overallPerformance.OverallAverage)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overall Average</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {formatDecimal(overallPerformance.overallPercentage ?? overallPerformance.OverallPercentage)}%
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overall Percentage</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>
                  {overallPerformance.overallGrade || overallPerformance.OverallGrade || 'N/A'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overall Grade</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                  {overallPerformance.overallClassRank || overallPerformance.OverallClassRank || 'N/A'} / {overallPerformance.totalStudentsInClass || overallPerformance.TotalStudentsInClass || 'N/A'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Class Rank</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Performance Chart (for parent viewing student performance) */}
      {subjectPerformanceChart && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Subject Performance</h2>
          </div>
          <div style={{ height: '350px', padding: '1rem' }}>
            <LazyChart
              type="bar"
              data={subjectPerformanceChart}
              options={{
                ...safeChartOptions,
                plugins: {
                  ...safeChartPlugins,
                  title: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Subject Performance Table */}
      {safeSubjectPerformance && safeSubjectPerformance.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Subject Performance Details</h2>
            {studentName && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Student: {studentName}
              </p>
            )}
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Average Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Class Rank</th>
                    <th>Performance Level</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {safeSubjectPerformance.map((subject, index) => (
                    <tr key={subject.subjectId || subject.SubjectId || index}>
                      <td>{subject.subjectName || subject.SubjectName || 'N/A'}</td>
                      <td>{formatDecimal(subject.averageScore ?? subject.AverageScore)}</td>
                      <td>{formatDecimal(subject.percentage ?? subject.Percentage)}%</td>
                      <td>
                        <span className={`badge ${(subject.percentage || subject.Percentage || 0) >= 70 ? 'badge-success' : 'badge-warning'}`}>
                          {subject.grade || subject.Grade || 'N/A'}
                        </span>
                      </td>
                      <td>{subject.classRank || subject.ClassRank || 'N/A'} / {subject.totalStudentsInClass || subject.TotalStudentsInClass || 'N/A'}</td>
                      <td>{subject.performanceLevel || subject.PerformanceLevel || 'N/A'}</td>
                      <td>
                        <span className={`badge ${safeStrLower(subject.trend ?? subject.Trend) === 'improving' ? 'badge-success' : safeStrLower(subject.trend ?? subject.Trend) === 'declining' ? 'badge-danger' : 'badge-secondary'}`}>
                          {subject.trend || subject.Trend || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Charts */}
      {(classPerformanceChart || paymentStatusChart) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {classPerformanceChart && (
            <div className="card" style={{ minHeight: '400px' }}>
              <div className="card-header">
                <h2 className="card-title">Performance by Class</h2>
              </div>
              <div style={{ height: '350px', padding: '1rem' }}>
                <LazyChart
                  type="bar"
                  data={classPerformanceChart}
                  options={{
                    ...safeChartOptions,
                    plugins: {
                      ...safeChartPlugins,
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {paymentStatusChart && (
            <div className="card" style={{ minHeight: '400px' }}>
              <div className="card-header">
                <h2 className="card-title">Payment Status Distribution</h2>
              </div>
              <div style={{ height: '350px', padding: '1rem' }}>
                <LazyChart
                  type="pie"
                  data={paymentStatusChart}
                  options={{
                    ...safeChartOptions,
                    plugins: {
                      ...safeChartPlugins,
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State - only show if no error and no data */}
      {safeCharts.length === 0 && !subjectPerformanceChart && !classPerformanceChart && !paymentStatusChart && safeSubjectPerformance.length === 0 && !reportsError && (!reportsData || reportsData.success !== false) && (
        <div className="card">
          <div className="empty-state">
            <BarChart3 size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">No report data available</p>
            <p className="empty-state-subtext">
              {!selectedTerm || !selectedSession 
                ? 'Please select a term and session to view reports' 
                : 'No data found for the selected filters'}
            </p>
            {/* Debug info */}
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <p>Debug: Student ID: {studentId || 'N/A'}, View: {view || 'N/A'}, Term: {selectedTerm || 'N/A'}, Session: {selectedSession || 'N/A'}</p>
              <p>API Response: {reportsData ? 'Received' : 'Not received'}</p>
              {reportsData && (
                <pre style={{ fontSize: '0.7rem', maxHeight: '200px', overflow: 'auto', textAlign: 'left', marginTop: '0.5rem' }}>
                  {JSON.stringify(reportsData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
