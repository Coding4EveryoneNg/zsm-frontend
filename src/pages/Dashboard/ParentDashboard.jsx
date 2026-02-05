import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService, examinationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Users, Award, CreditCard, FileText, Zap, BookOpen, TrendingUp, ClipboardList, Clock, CheckCircle } from 'lucide-react'
import DashboardCalendar from '../../components/Dashboard/DashboardCalendar'
import { defaultChartOptions, chartColors, createPieChartData } from '../../utils/chartConfig'
import { safeStrLower, formatDecimal } from '../../utils/safeUtils'
import logger from '../../utils/logger'

const ParentDashboard = () => {
  const navigate = useNavigate()
  
  const { data: dashboardData, isLoading, error } = useQuery(
    'parentDashboard',
    () => dashboardService.getParentDashboard(),
    { 
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        logger.error('Parent dashboard error:', err)
      },
      onSuccess: (data) => {
        logger.debug('Parent dashboard success:', data)
      }
    }
  )

  // Fetch examination statistics for parent's children
  const { data: examStatsData } = useQuery(
    'parentExamStats',
    () => examinationsService.getParentExaminationStats(),
    {
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        logger.error('Parent exam stats error:', err)
      }
    }
  )

  // Extract exam stats from response
  const examStats = examStatsData?.data || examStatsData || null

  // Debug logging
  logger.debug('Parent Dashboard State:', {
    isLoading,
    hasError: !!error,
    hasData: !!dashboardData,
    error,
    dashboardData
  })

  // Handle different response structures
  // API returns: { success: true, data: ParentDashboardData } or { success: false, errors: [...] }
  // After axios interceptor: response.data (which is the ApiResponse object)
  let dashboard = {}
  
  if (error) {
    logger.error('Dashboard error details:', error)
    // Even with error, try to extract any partial data
    if (error?.data) {
      dashboard = error.data?.data || error.data || {}
    }
  } else if (dashboardData) {
    // Check if it's an error response
    if (dashboardData.success === false) {
      logger.error('Parent Dashboard API returned error:', dashboardData.errors || dashboardData.message)
      // Still try to render with empty data
      dashboard = {}
    } else {
      // Success response - extract the data
      // Handle both ApiResponse structure and direct data
      // Check if dashboardData has a 'data' property (ApiResponse structure)
      if (dashboardData.data !== undefined) {
        dashboard = dashboardData.data || {}
      } else {
        // dashboardData itself is the data
        dashboard = dashboardData || {}
      }
    }
  } else {
    // No data and no error - this might happen on first load
    logger.warn('Parent Dashboard: No dashboardData and no error - using empty dashboard')
    dashboard = {}
  }
  
  // Debug: Log the response to see structure
  logger.debug('Parent Dashboard raw data:', dashboardData)
  logger.debug('Parent Dashboard processed data:', dashboard)
  logger.debug('Dashboard keys:', dashboard ? Object.keys(dashboard) : [])
  logger.debug('Dashboard type:', typeof dashboard, 'Is array:', Array.isArray(dashboard))
  
  // Always render the dashboard structure, even if data is empty
  // Ensure dashboard is always an object
  const safeDashboard = dashboard && typeof dashboard === 'object' && !Array.isArray(dashboard) ? dashboard : {}
  
  // Additional safety check - if safeDashboard is still empty, ensure we have at least an empty object
  if (!safeDashboard || Object.keys(safeDashboard).length === 0) {
    logger.warn('Parent Dashboard: safeDashboard is empty, using default structure')
  }
  
  // Extract data with property name flexibility (camelCase and PascalCase)
  const stats = safeDashboard.stats || safeDashboard.Stats || {}
  const children = safeDashboard.children || safeDashboard.Children || []
  const recentPayments = safeDashboard.recentPayments || safeDashboard.RecentPayments || []
  const charts = safeDashboard.charts || safeDashboard.Charts || []

  // Ensure we always have valid data structures
  const safeChildren = Array.isArray(children) ? children : []
  const safeRecentPayments = Array.isArray(recentPayments) ? recentPayments : []
  const safeCharts = Array.isArray(charts) ? charts : []

  // Payment status chart - must be called before any conditional returns
  const paymentChart = useMemo(() => {
    if (safeRecentPayments.length > 0) {
      const paid = safeRecentPayments.filter(p => (p.status || p.Status) === 'Paid').length
      const pending = safeRecentPayments.filter(p => (p.status || p.Status) === 'Pending' || (p.status || p.Status) === 'Overdue').length
      const partial = safeRecentPayments.filter(p => (p.status || p.Status) === 'PartiallyPaid').length

      if (paid + pending + partial > 0) {
        return createPieChartData(
          ['Paid', 'Pending', 'Partially Paid'],
          [paid, pending, partial],
          [chartColors.success, chartColors.warning, chartColors.info]
        )
      }
    }
    return null
  }, [safeRecentPayments])

  // Now we can do conditional returns after all hooks are called
  if (isLoading) return <Loading />

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

    const chartType = safeStrLower(chart.type)
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
        return null
    }
  }

  const statCards = [
    { title: 'Children', value: stats.totalChildren || stats.TotalChildren || 0, icon: Users, color: 'var(--primary-yellow)' },
    { title: 'Pending Payments', value: stats.pendingPayments || stats.PendingPayments || 0, icon: CreditCard, color: 'var(--warning)' },
    { title: 'Total Paid', value: `$${formatDecimal(stats.totalPaid ?? stats.TotalPaid)}`, icon: CreditCard, color: 'var(--success)' },
    { title: 'Recent Results', value: stats.recentResults || stats.RecentResults || 0, icon: Award, color: 'var(--info)' },
  ]
  
  // Ensure statCards is always an array
  const safeStatCards = Array.isArray(statCards) ? statCards : []

  // Show error banner if there was an error
  const hasError = error || dashboardData?.success === false
  const errorMessage = error?.message || error?.errors?.[0] || error?.error || dashboardData?.message
  const errorList = error?.errors || dashboardData?.errors || []

  // Ensure we always render something - even if data is completely empty
  // This prevents blank screens
  // Force render even if dashboardData is null/undefined
  if (!dashboardData && !error && !isLoading) {
    logger.warn('Parent Dashboard: No data, no error, not loading - this should not happen')
  }

  // Force render - ensure we always show something
  // This component should ALWAYS render, even if data is empty
  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '1.5rem', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      {/* Error Banner */}
      {hasError && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fee', border: '1px solid #f00', padding: '1rem' }}>
          <p style={{ color: '#c00', fontWeight: 'bold', marginBottom: '0.5rem' }}>Error loading dashboard data</p>
          {errorList.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#c00' }}>
              {errorList.map((err, idx) => (
                <li key={idx} style={{ fontSize: '0.875rem' }}>{err}</li>
              ))}
            </ul>
          )}
          {errorMessage && (
            <p style={{ color: '#c00', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errorMessage}</p>
          )}
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <p>Please check the browser console (F12) for more details.</p>
          </div>
        </div>
      )}

      {/* Header - Always visible */}
      <div className="dashboard-with-calendar" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
        <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Parent Dashboard
        </h1>
        {(safeDashboard.schoolName || safeDashboard.SchoolName) && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {safeDashboard.schoolName || safeDashboard.SchoolName}
          </p>
        )}
        {(safeDashboard.userName || safeDashboard.UserName) && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Welcome, {safeDashboard.userName || safeDashboard.UserName}
          </p>
        )}
        </div>
        <DashboardCalendar />
      </div>

      {/* Always show stat cards, even if values are zero */}
      {safeStatCards && safeStatCards.length > 0 ? (
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
      ) : (
        // Fallback stat cards if safeStatCards is empty
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <Users size={32} color="var(--primary-yellow)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-yellow)', marginBottom: '0.5rem' }}>0</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Children</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <CreditCard size={32} color="var(--warning)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.5rem' }}>0</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Pending Payments</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <CreditCard size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.5rem' }}>$0</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Total Paid</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <Award size={32} color="var(--info)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)', marginBottom: '0.5rem' }}>0</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Recent Results</p>
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Zap size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Quick Actions
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success"
              onClick={() => navigate('/payments')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CreditCard size={18} />
              Make Payment
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/payments')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} />
              View Payment History
            </button>
          </div>
        </div>
      </div>

      {/* Examination Statistics Section */}
      {examStats && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">
              <ClipboardList size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Children's Examinations
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ border: '2px solid var(--info)', textAlign: 'center' }}>
                <div style={{ padding: '1rem' }}>
                  <Clock size={32} color="var(--info)" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                    {examStats.available || examStats.Available || 0}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Available Examinations</small>
                </div>
              </div>
              <div className="card" style={{ border: '2px solid var(--warning)', textAlign: 'center' }}>
                <div style={{ padding: '1rem' }}>
                  <Clock size={32} color="var(--warning)" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                    {examStats.inProgress || examStats.InProgress || 0}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>In Progress</small>
                </div>
              </div>
              <div className="card" style={{ border: '2px solid var(--success)', textAlign: 'center' }}>
                <div style={{ padding: '1rem' }}>
                  <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                    {examStats.completed || examStats.Completed || 0}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Completed</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show message if no data is available - but always show children section */}
      {safeChildren.length === 0 && !hasError && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="empty-state">
            <p className="empty-state-text">No children found</p>
            <p className="empty-state-subtext">
              Your dashboard will populate once you have children enrolled and payment records.
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {(safeCharts.length > 0 || paymentChart) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {safeCharts.map((chart, index) => (
            <div key={chart.id || chart.Id || index} className="card" style={{ minHeight: '400px' }}>
              <div style={{ height: '350px' }}>
                {renderChart(chart)}
              </div>
            </div>
          ))}
          {paymentChart && (
            <div className="card" style={{ minHeight: '400px' }}>
              <div className="card-header">
                <h2 className="card-title">Payment Status</h2>
              </div>
              <div style={{ height: '350px', padding: '1rem' }}>
                <Pie 
                  data={paymentChart} 
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
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Children</h2>
          </div>
          {safeChildren.length > 0 ? (
            <div>
              {safeChildren.map((child, idx) => {
                const childId = child.id || child.Id
                const studentId = child.studentId || child.StudentId || childId
                const firstName = child.firstName || child.FirstName || ''
                const lastName = child.lastName || child.LastName || ''
                const className = child.className || child.ClassName || 'N/A'
                const schoolName = child.schoolName || child.SchoolName || ''
                
                // Use childId (Guid) for API calls, studentId (string) for display
                const studentGuid = childId
                
                return (
                  <div key={childId || idx} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {firstName} {lastName}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <strong>Student ID:</strong> {studentId}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <strong>Class:</strong> {className}
                    </p>
                    {schoolName && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        <strong>School:</strong> {schoolName}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/payments?studentId=${studentGuid}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <CreditCard size={16} />
                        View Payments
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => navigate(`/reports/student/${studentGuid}/results`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <TrendingUp size={16} />
                        View Results
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => navigate(`/courses?studentId=${studentGuid}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <BookOpen size={16} />
                        View Courses
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => navigate(`/reports/student/${studentGuid}/performance`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Award size={16} />
                        View Performance
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No children found</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Payments</h2>
          </div>
          {safeRecentPayments.length > 0 ? (
            <div>
              {safeRecentPayments.slice(0, 5).map((payment, idx) => {
                const paymentId = payment.id || payment.Id || idx
                const paymentType = payment.type || payment.Type || payment.paymentType || payment.PaymentType || 'Payment'
                const studentName = payment.studentName || payment.StudentName || 'Unknown'
                const amount = payment.amount || payment.Amount || 0
                const status = payment.status || payment.Status || 'Pending'
                return (
                  <div key={paymentId} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {paymentType}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {studentName}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          ${formatDecimal(amount)}
                        </p>
                        <span className={`badge ${status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No payments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParentDashboard

