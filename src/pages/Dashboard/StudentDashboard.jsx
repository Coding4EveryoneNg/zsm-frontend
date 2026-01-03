import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { BookOpen, ClipboardList, FileText, Award, Calendar, TrendingUp } from 'lucide-react'
import { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData } from '../../utils/chartConfig'
import logger from '../../utils/logger'

const StudentDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'studentDashboard',
    () => dashboardService.getStudentDashboard(),
    { 
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        logger.error('Student dashboard error:', err)
      },
      onSuccess: (data) => {
        logger.debug('Student dashboard success:', data)
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    logger.error('Dashboard error details:', error)
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
              {error?.message || error?.errors?.[0] || error?.error || 'Please try again later'}
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <p>Please check the browser console (F12) for more details.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle different response structures
  // API returns: { success: true, data: StudentDashboardData }
  // After axios interceptor: { success: true, data: StudentDashboardData }
  // If success is false, data will be null
  const dashboard = dashboardData?.success === false 
    ? null 
    : (dashboardData?.data || dashboardData || {})
  
  // Debug: Log the response to see structure
  logger.debug('Dashboard raw data:', dashboardData)
  logger.debug('Dashboard processed data:', dashboard)
  logger.debug('Dashboard data structure:', {
    hasData: !!dashboardData,
    success: dashboardData?.success,
    hasDataProperty: !!dashboardData?.data,
    dashboardKeys: dashboard ? Object.keys(dashboard) : [],
    dashboardType: typeof dashboard,
    isArray: Array.isArray(dashboard)
  })
  
  // Check if we have an error response
  if (dashboardData?.success === false) {
    logger.error('Dashboard API returned error:', dashboardData.errors || dashboardData.message)
  }
  
  // Always render the dashboard structure, even if data is empty
  // This prevents blank screens
  // Ensure dashboard is always an object - MUST BE DEFINED BEFORE USE
  const safeDashboard = dashboard && typeof dashboard === 'object' && !Array.isArray(dashboard) ? dashboard : {}
  
  // Extract data from StudentDashboardData structure
  // API returns StudentDashboardData with properties: TotalAssignments, PendingAssignments, CompletedAssignments, AverageGrade, RecentAssignments, RecentGrades, etc.
  // Handle both camelCase (default JSON serialization) and PascalCase (if configured differently)
  const stats = {
    activeAssignments: safeDashboard.pendingAssignments || safeDashboard.PendingAssignments || 0,
    upcomingExams: (safeDashboard.upcomingEvents || safeDashboard.UpcomingEvents || [])
      .filter(e => (e?.type || e?.Type) === 'Examination')?.length || 0,
    completedCourses: safeDashboard.completedAssignments || safeDashboard.CompletedAssignments || 0,
    averageScore: safeDashboard.averageGrade || safeDashboard.AverageGrade || 0,
    totalAssignments: safeDashboard.totalAssignments || safeDashboard.TotalAssignments || 0,
  }
  
  const recentAssignments = safeDashboard.recentAssignments || safeDashboard.RecentAssignments || []
  const upcomingExaminations = (safeDashboard.upcomingEvents || safeDashboard.UpcomingEvents || [])
    .filter(e => (e?.type || e?.Type) === 'Examination') || []
  const recentResults = safeDashboard.recentGrades || safeDashboard.RecentGrades || safeDashboard.termResults || safeDashboard.TermResults || []
  const charts = safeDashboard.charts || safeDashboard.Charts || []
  const subjectPerformance = safeDashboard.subjectPerformance || safeDashboard.SubjectPerformance || []
  const currentSessionTerm = safeDashboard.currentSessionTerm || safeDashboard.CurrentSessionTerm
  const currentTermSubjects = safeDashboard.currentTermSubjects || safeDashboard.CurrentTermSubjects || []
  
  // Convert ChartData to Chart.js format
  const convertedCharts = (charts || []).map(chart => {
    if (!chart) return null
    return {
      id: chart.id || chart.Id,
      title: chart.title || chart.Title,
      type: (chart.type || chart.Type || 'bar')?.toLowerCase(),
      labels: chart.labels || chart.Labels || [],
      datasets: (chart.datasets || chart.Datasets || []).map(ds => ({
        label: ds.label || ds.Label,
        data: ds.data || ds.Data || [],
        backgroundColor: ds.backgroundColor || ds.BackgroundColor || chartColors.primary,
        borderColor: ds.borderColor || ds.BorderColor || chartColors.primary,
      }))
    }
  }).filter(chart => chart !== null)

  const statCards = [
    { title: 'Active Assignments', value: stats.activeAssignments || 0, icon: FileText, color: 'var(--primary-yellow)' },
    { title: 'Upcoming Exams', value: stats.upcomingExams || 0, icon: ClipboardList, color: 'var(--info)' },
    { title: 'Completed Assignments', value: stats.completedCourses || 0, icon: BookOpen, color: 'var(--success)' },
    { title: 'Average Grade', value: `${stats.averageScore?.toFixed(1) || 0}%`, icon: TrendingUp, color: 'var(--warning)' },
  ]

  // Prepare chart data
  const performanceChartData = useMemo(() => {
    if (subjectPerformance && subjectPerformance.length > 0) {
      return createBarChartData(
        subjectPerformance.map(s => s.subjectName || s.SubjectName || 'Unknown'),
        [{
          label: 'Score (%)',
          data: subjectPerformance.map(s => s.averageScore || s.AverageScore || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary
        }]
      )
    }
    return null
  }, [subjectPerformance])

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

  // Show error banner if there was an error but we still have some data
  const hasError = dashboardData?.success === false

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
            {dashboardData?.errors && dashboardData.errors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--danger)' }}>
                {dashboardData.errors.map((err, idx) => (
                  <li key={idx} style={{ fontSize: '0.875rem' }}>{err}</li>
                ))}
              </ul>
            )}
            {dashboardData?.message && (
              <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{dashboardData.message}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Student Dashboard
        </h1>
        {(safeDashboard.schoolName || safeDashboard.SchoolName) && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {safeDashboard.schoolName || safeDashboard.SchoolName} {(safeDashboard.className || safeDashboard.ClassName) && `• ${safeDashboard.className || safeDashboard.ClassName}`}
          </p>
        )}
        {currentSessionTerm && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {currentSessionTerm.sessionName || currentSessionTerm.SessionName} • {currentSessionTerm.termName || currentSessionTerm.TermName}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {safeStatCards.map((stat, index) => {
          const Icon = stat.icon
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

      {/* Charts Section */}
      {(convertedCharts.length > 0 || performanceChartData) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {convertedCharts.map((chart, index) => (
            <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
              <div style={{ height: '350px' }}>
                {renderChart(chart)}
              </div>
            </div>
          ))}
          {performanceChartData && (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Assignments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Assignments</h2>
          </div>
          {safeRecentAssignments.length > 0 ? (
            <div>
              {safeRecentAssignments.slice(0, 5).map((assignment, idx) => (
                <div
                  key={assignment?.id || assignment?.Id || idx}
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
                      {assignment.title || assignment.assignmentTitle || 'Untitled Assignment'}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}` : assignment.subject || 'No due date'}
                    </p>
                  </div>
                  <span className={`badge ${assignment.status === 'Submitted' ? 'badge-success' : 'badge-warning'}`}>
                    {assignment.status}
                  </span>
                </div>
              ))}
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
              {safeUpcomingExaminations.slice(0, 5).map((exam, idx) => (
                <div
                  key={exam?.id || exam?.Id || idx}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {exam.title || exam.examinationTitle || 'Untitled Examination'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'Date TBD'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No upcoming examinations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

