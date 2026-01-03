import React from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Users, GraduationCap, TrendingUp, CreditCard, Zap, Eye, FileText, Settings, BarChart3 } from 'lucide-react'
import { defaultChartOptions } from '../../utils/chartConfig'
import logger from '../../utils/logger'

const PrincipalDashboard = () => {
  const navigate = useNavigate()
  const { data: dashboardData, isLoading, error } = useQuery(
    'principalDashboard',
    () => dashboardService.getPrincipalDashboard(),
    { 
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        logger.error('Principal dashboard error:', err)
      }
    }
  )

  if (isLoading) return <Loading />

  // Handle errors gracefully
  if (error) {
    logger.error('Dashboard error details:', error)
  }

  // Extract data with safe defaults
  const dashboard = dashboardData?.data || {}
  const stats = dashboard.stats || dashboard.Stats || {}
  const charts = dashboard.charts || dashboard.Charts || []
  const recentActivities = dashboard.recentActivities || dashboard.RecentActivities || []

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'var(--primary-yellow)' },
    { title: 'Total Teachers', value: stats.totalTeachers || 0, icon: GraduationCap, color: 'var(--info)' },
    { title: 'Average Performance', value: `${stats.averagePerformance || 0}%`, icon: TrendingUp, color: 'var(--success)' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue || 0}`, icon: CreditCard, color: 'var(--warning)' },
  ]

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

  return (
    <div className="page-container">
      {/* Error Banner */}
      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger)', color: 'white', padding: '1rem' }}>
          <p style={{ margin: 0 }}>
            <strong>Error loading dashboard:</strong> {error?.message || 'Please refresh the page or contact support if the problem persists.'}
          </p>
        </div>
      )}

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Principal Dashboard
      </h1>

      {/* Quick Actions */}
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
              className="btn btn-primary"
              onClick={() => navigate('/students')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Users size={18} />
              View Students
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate('/teachers')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <GraduationCap size={18} />
              View Teachers
            </button>
            <button
              className="btn btn-info"
              onClick={() => navigate('/reports')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BarChart3 size={18} />
              View Reports
            </button>
            <button
              className="btn btn-warning"
              onClick={() => navigate('/payments')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CreditCard size={18} />
              View Payments
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/examinations')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} />
              View Examinations
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className="card" 
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                if (stat.title === 'Total Students') navigate('/students')
                else if (stat.title === 'Total Teachers') navigate('/teachers')
                else if (stat.title === 'Average Performance') navigate('/reports')
                else if (stat.title === 'Total Revenue') navigate('/payments')
              }}
            >
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
      {charts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {charts.map((chart, index) => (
            <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
              <div style={{ height: '350px' }}>
                {renderChart(chart)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities && recentActivities.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activities</h2>
          </div>
          <div>
            {recentActivities.slice(0, 10).map((activity, idx) => {
              const activityId = activity.id || activity.Id || idx
              const title = activity.title || activity.Title || ''
              const description = activity.description || activity.Description || ''
              const timestamp = activity.timestamp || activity.Timestamp || activity.createdAt || activity.CreatedAt
              return (
                <div key={activityId} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.9375rem' }}>
                    {title}
                  </h4>
                  {description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {description}
                    </p>
                  )}
                  {timestamp && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PrincipalDashboard

