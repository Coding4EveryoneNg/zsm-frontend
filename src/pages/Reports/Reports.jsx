import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { reportsService, dashboardService, coursesService, commonService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { BarChart3, Download, Filter, TrendingUp, ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react'
import { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData } from '../../utils/chartConfig'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { handleError, handleSuccess } from '../../utils/errorHandler'
import logger from '../../utils/logger'

const Reports = () => {
  const { studentId, view } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  const isAdmin = user?.role === 'Admin'
  const isPrincipal = user?.role === 'Principal'
  const isTeacher = user?.role === 'Teacher'
  const showSchoolFilter = isAdmin
  const showTermSessionFilters = isAdmin || isPrincipal || isTeacher

  // School dropdown for Admin (data scoped by selected school)
  const { data: schoolsData } = useQuery(
    'schools-dropdown',
    () => commonService.getSchoolsDropdown(),
    { enabled: isAdmin }
  )
  const { data: schoolSwitchingData } = useQuery(
    ['dashboard', 'school-switching'],
    () => dashboardService.getSchoolSwitchingData(),
    { enabled: isAdmin || isPrincipal || isTeacher }
  )
  const principalOrAdminSchoolId = schoolSwitchingData?.data?.currentSchoolId ?? schoolSwitchingData?.data?.CurrentSchoolId ?? schoolSwitchingData?.currentSchoolId ?? schoolSwitchingData?.CurrentSchoolId
  const schoolsList = schoolsData?.data ?? schoolsData?.Data ?? []
  const defaultSchoolId = schoolsList?.[0]?.id ?? schoolsList?.[0]?.Id ?? ''

  useEffect(() => {
    if (isAdmin && schoolsList?.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(principalOrAdminSchoolId || defaultSchoolId || '')
    }
  }, [isAdmin, schoolsList, principalOrAdminSchoolId, defaultSchoolId, selectedSchoolId])

  const effectiveSchoolId = isAdmin ? (selectedSchoolId || principalOrAdminSchoolId || defaultSchoolId) : principalOrAdminSchoolId

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

  // Get current student ID for result generation
  // For students, we need to get their student ID from the dashboard or user context
  // For parents viewing a child, use the studentId from URL params
  const currentStudentId = studentId || (user?.role === 'Student' ? user?.id : null)

  // Fetch dashboard data to get current term and session
  const { data: studentDashboardData } = useQuery(
    'studentDashboard',
    () => dashboardService.getStudentDashboard(),
    { 
      enabled: user?.role === 'Student',
      refetchInterval: 60000
    }
  )

  // Fetch parent dashboard to get current term and session for parent view
  // This is needed for both viewing children list and getting current term/session
  const { data: parentDashboardData } = useQuery(
    'parentDashboard',
    () => dashboardService.getParentDashboard(),
    { 
      enabled: user?.role === 'Parent',
      refetchInterval: 60000
    }
  )

  // Extract current term and session from dashboard data
  useEffect(() => {
    let currentSessionTerm = null
    
    if (user?.role === 'Student' && studentDashboardData) {
      const dashboard = studentDashboardData?.data || studentDashboardData || {}
      currentSessionTerm = dashboard.currentSessionTerm || dashboard.CurrentSessionTerm
    } else if (user?.role === 'Parent' && parentDashboardData) {
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
  }, [studentDashboardData, parentDashboardData, user?.role, selectedTerm, selectedSession])

  // Check if result can be generated - only call if we have term and session
  const { data: canGenerateData } = useQuery(
    ['canGenerateResult', currentStudentId, selectedTerm, selectedSession],
    () => coursesService.canGenerateResult(currentStudentId, { term: selectedTerm, session: selectedSession }),
    { 
      enabled: !!currentStudentId && (user?.role === 'Student' || user?.role === 'Parent') && !!selectedTerm && !!selectedSession
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
      if (studentId && user?.role === 'Parent') {
        // Parent viewing student performance/results
        return dashboardService.getParentStudentSubjectPerformance(studentId, { term: selectedTerm, session: selectedSession })
      }
      // For different roles, call appropriate endpoints
      if (user?.role === 'Teacher') {
        return reportsService.getTeacherStudentsResults({ term: selectedTerm, session: selectedSession })
      } else if (user?.role === 'Principal') {
        return reportsService.getPrincipalStudentsPerformance({ term: selectedTerm, session: selectedSession })
      }
      // Default: return empty data structure
      return Promise.resolve({ data: { charts: [], performanceData: [], paymentData: [] } })
    },
    { 
      refetchInterval: 60000,
      enabled: (studentId && user?.role === 'Parent') || user?.role === 'Teacher' || user?.role === 'Principal'
    }
  )

  if (isLoading) return <Loading />

  // Debug logging
  logger.debug('Reports Data:', reportsData)
  logger.debug('Reports Error:', reportsError)
  logger.debug('Student ID:', studentId)
  logger.debug('View:', view)
  logger.debug('User Role:', user?.role)
  logger.debug('Selected Term:', selectedTerm)
  logger.debug('Selected Session:', selectedSession)

  // Handle error response
  if (reportsError) {
    logger.error('Reports error details:', reportsError)
  }

  // Extract data based on view type - handle both camelCase and PascalCase
  // API returns: { success: true, data: SubjectPerformanceData } or { success: false, errors: [...] }
  // After axios interceptor: reportsData is the ApiResponse object
  let apiData = {}
  if (reportsData) {
    if (reportsData.success === false) {
      logger.error('Reports API returned error:', reportsData.errors || reportsData.message)
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

  // Debug logging
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

  // Render chart based on chart data from API
  const renderChart = (chart) => {
    if (!chart || !chart.labels || !chart.datasets) return null

    const chartOptions = {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: chart.title || '',
          font: { size: 16, weight: 'bold' }
        }
      }
    }

    switch (chart.type?.toLowerCase()) {
      case 'bar':
        return <Bar data={chart} options={chartOptions} />
      case 'line':
        return <Line data={chart} options={chartOptions} />
      case 'pie':
        return <Pie data={chart} options={chartOptions} />
      case 'doughnut':
        return <Doughnut data={chart} options={chartOptions} />
      default:
        return null
    }
  }

  // Subject Performance Chart (for parent viewing student performance)
  const subjectPerformanceChart = useMemo(() => {
    if (safeSubjectPerformance && safeSubjectPerformance.length > 0) {
      return createBarChartData(
        safeSubjectPerformance.map(p => p.subjectName || p.SubjectName || 'Unknown'),
        [{
          label: 'Average Score (%)',
          data: safeSubjectPerformance.map(p => p.percentage || p.Percentage || p.averageScore || p.AverageScore || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary
        }]
      )
    }
    return null
  }, [safeSubjectPerformance])

  // Performance by class chart
  const classPerformanceChart = useMemo(() => {
    if (safePerformanceData && safePerformanceData.length > 0) {
      return createBarChartData(
        safePerformanceData.map(p => p.className || p.ClassName || 'Unknown'),
        [{
          label: 'Average Score (%)',
          data: safePerformanceData.map(p => p.averageScore || p.AverageScore || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary
        }]
      )
    }
    return null
  }, [safePerformanceData])

  // Payment status pie chart
  const paymentStatusChart = useMemo(() => {
    if (safePaymentData && safePaymentData.length > 0) {
      const paid = safePaymentData.filter(p => (p.status || p.Status) === 'Paid').length
      const pending = safePaymentData.filter(p => (p.status || p.Status) === 'Pending').length
      const partial = safePaymentData.filter(p => (p.status || p.Status) === 'PartiallyPaid').length

      return createPieChartData(
        ['Paid', 'Pending', 'Partially Paid'],
        [paid, pending, partial],
        [chartColors.success, chartColors.warning, chartColors.info]
      )
    }
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
        {studentId && (
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => navigate('/dashboard/parent')}
            style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
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
          {/* Result Generation Buttons for Students and Parents */}
          {(user?.role === 'Student' || (user?.role === 'Parent' && studentId)) && canGenerate && (
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
          {(user?.role === 'Teacher' || user?.role === 'Principal' || user?.role === 'Admin') && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  try {
                    let response
                    if (user?.role === 'Teacher') {
                      response = await reportsService.exportTeacherStudentsResults({ term: selectedTerm, session: selectedSession })
                    } else if (user?.role === 'Principal') {
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
                onChange={(e) => setSelectedSchoolId(e.target.value)}
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
                  {(overallPerformance.overallAverage || overallPerformance.OverallAverage || 0).toFixed(2)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overall Average</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {(overallPerformance.overallPercentage || overallPerformance.OverallPercentage || 0).toFixed(2)}%
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
            <Bar 
              data={subjectPerformanceChart} 
              options={{
                ...defaultChartOptions,
                plugins: {
                  ...defaultChartOptions.plugins,
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
                      <td>{(subject.averageScore || subject.AverageScore || 0).toFixed(2)}</td>
                      <td>{(subject.percentage || subject.Percentage || 0).toFixed(2)}%</td>
                      <td>
                        <span className={`badge ${(subject.percentage || subject.Percentage || 0) >= 70 ? 'badge-success' : 'badge-warning'}`}>
                          {subject.grade || subject.Grade || 'N/A'}
                        </span>
                      </td>
                      <td>{subject.classRank || subject.ClassRank || 'N/A'} / {subject.totalStudentsInClass || subject.TotalStudentsInClass || 'N/A'}</td>
                      <td>{subject.performanceLevel || subject.PerformanceLevel || 'N/A'}</td>
                      <td>
                        <span className={`badge ${(subject.trend || subject.Trend || '').toLowerCase() === 'improving' ? 'badge-success' : (subject.trend || subject.Trend || '').toLowerCase() === 'declining' ? 'badge-danger' : 'badge-secondary'}`}>
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
                <Bar 
                  data={classPerformanceChart} 
                  options={{
                    ...defaultChartOptions,
                    plugins: {
                      ...defaultChartOptions.plugins,
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
                <Pie 
                  data={paymentStatusChart} 
                  options={{
                    ...defaultChartOptions,
                    plugins: {
                      ...defaultChartOptions.plugins,
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
