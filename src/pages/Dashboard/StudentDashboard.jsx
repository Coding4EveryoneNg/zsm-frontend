import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { BookOpen, ClipboardList, FileText, Award, Calendar, TrendingUp } from 'lucide-react'
import DashboardCalendar from '../../components/Dashboard/DashboardCalendar'
import ErrorBoundary from '../../components/Common/ErrorBoundary'
import { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData } from '../../utils/chartConfig'
import { getErrorMessage } from '../../utils/errorHandler'
import { ensureArray, safeFormatDate, safeStrLower } from '../../utils/safeUtils'
import logger from '../../utils/logger'

const StudentDashboard = () => {
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    'studentDashboard',
    () => dashboardService.getStudentDashboard(),
    { 
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        try { logger.error('Student dashboard error:', err) } catch (_) {}
      },
      onSuccess: (data) => {
        try { logger.debug('Student dashboard success:', data) } catch (_) {}
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Student Dashboard
          </h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading dashboard</p>
            <p className="empty-state-subtext">
              {getErrorMessage(error) || 'Please try again later'}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => refetch()} style={{ marginTop: '1rem' }}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardData == null) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="card-header"><h2 className="card-title">Student Dashboard</h2></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle different response structures (wrap in try so any unexpected shape doesn't crash the page)
  let body = {}
  let safeDashboard = {}
  try {
    body = dashboardData && typeof dashboardData === 'object' ? dashboardData : {}
    const isApiWrapper = body.success !== undefined && body.data !== undefined
    safeDashboard = (isApiWrapper && body.data && typeof body.data === 'object' && !Array.isArray(body.data))
      ? body.data
      : (body?.success === false ? {} : (body && typeof body === 'object' && !Array.isArray(body) ? body : {}))
  } catch (_) {
    safeDashboard = {}
  }
  try {

  try {
    logger.debug('Dashboard raw data:', dashboardData)
    logger.debug('Dashboard body:', body)
    logger.debug('Dashboard payload:', safeDashboard)
  } catch (_) { /* never let logger throw */ }

  if (body?.success === false) {
    try { logger.error('Dashboard API returned error:', body.errors || body.message) } catch (_) {}
  }

  // Extract data from StudentDashboardData structure (camelCase or PascalCase)
  const rawAverage = safeDashboard.averageGrade ?? safeDashboard.AverageGrade ?? 0
  const upcomingEventsList = ensureArray(safeDashboard.upcomingEvents ?? safeDashboard.UpcomingEvents)
  const stats = {
    activeAssignments: safeDashboard.pendingAssignments ?? safeDashboard.PendingAssignments ?? 0,
    upcomingExams: upcomingEventsList.filter(e => (e?.type || e?.Type) === 'Examination').length,
    completedCourses: safeDashboard.completedAssignments ?? safeDashboard.CompletedAssignments ?? 0,
    averageScore: typeof rawAverage === 'number' && !Number.isNaN(rawAverage) ? rawAverage : Number(rawAverage) || 0,
    totalAssignments: safeDashboard.totalAssignments ?? safeDashboard.TotalAssignments ?? 0,
  }

  const recentAssignments = ensureArray(safeDashboard.recentAssignments ?? safeDashboard.RecentAssignments)
  const upcomingExaminations = upcomingEventsList.filter(e => (e?.type || e?.Type) === 'Examination')
  const recentResults = ensureArray(safeDashboard.recentGrades ?? safeDashboard.RecentGrades ?? safeDashboard.termResults ?? safeDashboard.TermResults)
  const charts = ensureArray(safeDashboard.charts ?? safeDashboard.Charts)
  const subjectPerformance = ensureArray(safeDashboard.subjectPerformance ?? safeDashboard.SubjectPerformance)
  const rawSessionTerm = safeDashboard.currentSessionTerm ?? safeDashboard.CurrentSessionTerm
  const currentSessionTerm = rawSessionTerm && typeof rawSessionTerm === 'object' && !Array.isArray(rawSessionTerm) ? rawSessionTerm : null
  const currentTermSubjects = ensureArray(safeDashboard.currentTermSubjects ?? safeDashboard.CurrentTermSubjects)

  // Convert ChartData to Chart.js format (charts already ensured as array above)
  const safeCharts = charts
  const convertedCharts = safeCharts.map(chart => {
    if (!chart || typeof chart !== 'object') return null
    try {
      const labels = Array.isArray(chart.labels ?? chart.Labels) ? (chart.labels ?? chart.Labels) : []
      const rawDatasets = chart.datasets ?? chart.Datasets
      const datasets = Array.isArray(rawDatasets) ? rawDatasets.map(ds => {
        const rawData = ds?.data ?? ds?.Data
        const dataArr = Array.isArray(rawData) ? rawData.map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0)) : []
        return {
          label: String(ds?.label ?? ds?.Label ?? ''),
          data: dataArr,
          backgroundColor: ds?.backgroundColor ?? ds?.BackgroundColor ?? chartColors.primary,
          borderColor: ds?.borderColor ?? ds?.BorderColor ?? chartColors.primary,
        }
      }) : []
      const type = safeStrLower(chart.type ?? chart.Type, 'bar') || 'bar'
      return {
        id: chart.id ?? chart.Id,
        title: chart.title ?? chart.Title ?? '',
        type,
        labels,
        datasets,
      }
    } catch (_) {
      return null
    }
  }).filter(chart => chart !== null && Array.isArray(chart?.labels) && Array.isArray(chart?.datasets))

  const avgNum = typeof stats.averageScore === 'number' && !Number.isNaN(stats.averageScore) ? stats.averageScore : 0
  const statCards = [
    { title: 'Active Assignments', value: stats.activeAssignments || 0, icon: FileText, color: 'var(--primary-yellow)' },
    { title: 'Upcoming Exams', value: stats.upcomingExams || 0, icon: ClipboardList, color: 'var(--info)' },
    { title: 'Completed Assignments', value: stats.completedCourses || 0, icon: BookOpen, color: 'var(--success)' },
    { title: 'Average Grade', value: `${Number(avgNum).toFixed(1)}%`, icon: TrendingUp, color: 'var(--warning)' },
  ]

  // Prepare chart data (ensure subjectPerformance is array to avoid .map throw)
  const safeSubjectPerformance = Array.isArray(subjectPerformance) ? subjectPerformance : []
  const performanceChartData = useMemo(() => {
    if (safeSubjectPerformance.length === 0) return null
    try {
      return createBarChartData(
        safeSubjectPerformance.map(s => s?.subjectName ?? s?.SubjectName ?? 'Unknown'),
        [{
          label: 'Score (%)',
          data: safeSubjectPerformance.map(s => s?.averageScore ?? s?.AverageScore ?? 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary
        }]
      )
    } catch {
      return null
    }
  }, [safeSubjectPerformance])

  // Render chart based on chart data from API (guard so Chart.js never throws)
  const renderChart = (chart) => {
    if (!chart || !Array.isArray(chart.labels) || !Array.isArray(chart.datasets)) return null
    const chartType = safeStrLower(chart.type, 'bar') || 'bar'
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
    try {
      switch (chartType) {
        case 'bar':
          return <Bar data={chart} options={chartOptions} />
        case 'line':
          return <Line data={chart} options={chartOptions} />
        case 'pie':
          return <Pie data={chart} options={chartOptions} />
        case 'doughnut':
          return <Doughnut data={chart} options={chartOptions} />
        default:
          return <Bar data={chart} options={chartOptions} />
      }
    } catch {
      return null
    }
  }

  // Show error banner if there was an error but we still have some data
  const hasError = body?.success === false

  // Ensure we always have valid data structures to prevent rendering errors
  const safeRecentAssignments = Array.isArray(recentAssignments) ? recentAssignments : []
  const safeUpcomingExaminations = Array.isArray(upcomingExaminations) ? upcomingExaminations : []
  const safeStatCards = Array.isArray(statCards) ? statCards : []

  return (
    <div style={{ width: '100%', minHeight: '100%' }}>
      {hasError && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Error loading dashboard data</p>
            {Array.isArray(body?.errors) && body.errors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--danger)' }}>
                {body.errors.map((err, idx) => (
                  <li key={idx} style={{ fontSize: '0.875rem' }}>{typeof err === 'string' ? err : String(err)}</li>
                ))}
              </ul>
            )}
            {body?.message && (
              <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{body.message}</p>
            )}
          </div>
        </div>
      )}

      <ErrorBoundary fallback={() => <div className="card" style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Header section unavailable</p></div>}>
        <div className="dashboard-with-calendar" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Student Dashboard
            </h1>
            {(safeDashboard.schoolName || safeDashboard.SchoolName) && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {safeDashboard.schoolName || safeDashboard.SchoolName} {(safeDashboard.className || safeDashboard.ClassName) && ` • ${safeDashboard.className || safeDashboard.ClassName}`}
              </p>
            )}
            {currentSessionTerm && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {currentSessionTerm.sessionName || currentSessionTerm.SessionName} • {currentSessionTerm.termName || currentSessionTerm.TermName}
              </p>
            )}
          </div>
          <ErrorBoundary fallback={() => <div className="card" style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Calendar unavailable</p></div>}>
            <DashboardCalendar />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>

      {/* Stats Cards */}
      <ErrorBoundary fallback={() => <div className="card"><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Stats unavailable</p></div>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {safeStatCards.map((stat, index) => {
            const Icon = stat?.icon
            if (!Icon || typeof Icon !== 'function') return null
            return (
              <div key={index} className="card" style={{ textAlign: 'center' }}>
                <Icon size={32} color={stat.color} style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>
                  {stat.value}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>{stat.title}</p>
              </div>
            )
          })}
        </div>
      </ErrorBoundary>

      {/* Charts Section */}
      <ErrorBoundary fallback={() => <div className="card"><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Charts unavailable</p></div>}>
        {(convertedCharts.length > 0 || performanceChartData) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {convertedCharts.map((chart, index) => (
              <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
                <div style={{ height: '350px' }}>
                  {renderChart(chart)}
                </div>
              </div>
            ))}
            {performanceChartData?.labels && Array.isArray(performanceChartData.datasets) && (
              <div className="card" style={{ minHeight: '400px' }}>
                <div className="card-header">
                  <h2 className="card-title">Subject Performance</h2>
                </div>
                <div style={{ height: '350px', padding: '1rem' }}>
                  <Bar 
                    data={performanceChartData} 
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
      </ErrorBoundary>

      <ErrorBoundary fallback={() => <div className="card"><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Assignments and exams list unavailable</p></div>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Assignments */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Assignments</h2>
            </div>
            {safeRecentAssignments.length > 0 ? (
              <div>
                {safeRecentAssignments.slice(0, 5).map((assignment, idx) => {
                  const dueStr = safeFormatDate(assignment?.dueDate, 'short', '') ? `Due: ${safeFormatDate(assignment?.dueDate, 'short')}` : 'No due date'
                  return (
                    <div
                      key={assignment?.id ?? assignment?.Id ?? idx}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {assignment?.title ?? assignment?.assignmentTitle ?? 'Untitled Assignment'}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {dueStr}
                        </p>
                      </div>
                      <span className={`badge ${(assignment?.status ?? '') === 'Submitted' ? 'badge-success' : 'badge-warning'}`}>
                        {assignment?.status ?? '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state-text">No assignments</p>
              </div>
            )}
          </div>

          {/* Upcoming Examinations */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upcoming Examinations</h2>
            </div>
            {safeUpcomingExaminations.length > 0 ? (
              <div>
                {safeUpcomingExaminations.slice(0, 5).map((exam, idx) => {
                  const dateStr = safeFormatDate(exam?.examDate ?? exam?.startDate, 'short', 'Date TBD')
                  return (
                    <div
                      key={exam?.id ?? exam?.Id ?? idx}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {exam?.title ?? exam?.examinationTitle ?? 'Untitled Examination'}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {dateStr}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state-text">No upcoming examinations</p>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  )
  } catch (e) {
    try { logger.error('Student dashboard render error', e) } catch (_) {}
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="card-header"><h2 className="card-title">Student Dashboard</h2></div>
          <div className="card-body">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Something went wrong while loading the dashboard. Please try again.</p>
            <button type="button" className="btn btn-primary" onClick={() => typeof refetch === 'function' && refetch()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default StudentDashboard

