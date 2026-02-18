import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import LazyChart from '../../components/Charts/LazyChart'
import { dashboardService, userManagementService, schoolsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { 
  ArrowLeft, School, Users, GraduationCap, TrendingUp, CreditCard, 
  BarChart3, DollarSign, Building2, UserCheck, RefreshCw
} from 'lucide-react'
import { defaultChartOptions } from '../../utils/chartHelpers'
import { safeStrLower } from '../../utils/safeUtils'
import logger from '../../utils/logger'
import toast from 'react-hot-toast'

const SchoolDetails = () => {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'parents', 'statistics'

  // Fetch school details
  const { data: schoolData, isLoading: schoolLoading } = useQuery(
    ['school', schoolId],
    () => schoolsService.getSchool(schoolId),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch school details:', err)
        toast.error('Failed to load school details')
      }
    }
  )

  // Fetch school dashboard (principal view)
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery(
    ['schoolDashboard', schoolId],
    () => dashboardService.getSchoolDashboard(schoolId),
    {
      retry: 1,
      enabled: activeTab === 'dashboard',
      onError: (err) => {
        logger.error('Failed to fetch school dashboard:', err)
        toast.error('Failed to load dashboard data')
      }
    }
  )

  // Fetch parents for the school
  const { data: parentsData, isLoading: parentsLoading, refetch: refetchParents } = useQuery(
    ['parentsBySchool', schoolId],
    () => userManagementService.getParentsBySchool(schoolId),
    {
      retry: 1,
      enabled: activeTab === 'parents',
      onError: (err) => {
        logger.error('Failed to fetch parents:', err)
        toast.error('Failed to load parents')
      }
    }
  )

  // Fetch financial dashboard for the school (if available)
  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['schoolFinancial', schoolId],
    () => dashboardService.getFinancialDashboard(),
    {
      retry: 1,
      enabled: activeTab === 'statistics',
      onError: (err) => {
        logger.error('Failed to fetch financial data:', err)
        // Don't show error toast as this might not be available for all schools
      }
    }
  )

  if (schoolLoading) return <Loading />

  const school = schoolData?.data || {}
  const schoolName = school.name || school.Name || 'School Details'
  const dashboard = dashboardData?.data || {}
  const parents = parentsData?.data || []
  const financial = financialData?.data || {}

  // Extract dashboard stats
  const stats = dashboard.stats || dashboard.Stats || dashboard.schoolStatistics || dashboard.SchoolStatistics || {}
  const charts = dashboard.charts || dashboard.Charts || []
  const recentActivities = dashboard.recentActivities || dashboard.RecentActivities || []

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

    const chartType = safeStrLower(chart.type) || 'bar'
    return <LazyChart type={chartType} data={chart} options={chartOptions} />
  }

  const statCards = [
    { 
      title: 'Total Students', 
      value: stats.totalStudents || stats.TotalStudents || 0, 
      icon: Users, 
      color: 'var(--primary-yellow)' 
    },
    { 
      title: 'Total Teachers', 
      value: stats.totalTeachers || stats.TotalTeachers || 0, 
      icon: GraduationCap, 
      color: 'var(--info)' 
    },
    { 
      title: 'Total Classes', 
      value: stats.totalClasses || stats.TotalClasses || 0, 
      icon: Building2, 
      color: 'var(--success)' 
    },
    { 
      title: 'Total Revenue', 
      value: `$${stats.totalRevenue || stats.TotalRevenue || financial.summary?.totalRevenue || financial.Summary?.TotalRevenue || 0}`, 
      icon: CreditCard, 
      color: 'var(--warning)' 
    },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {schoolName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {school.location || school.Location || school.address || school.Address || ''}
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={() => {
            if (activeTab === 'dashboard') refetchDashboard()
            else if (activeTab === 'parents') refetchParents()
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
        <button
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: activeTab === 'dashboard' ? '2px solid var(--primary-yellow)' : 'none' }}
        >
          <BarChart3 size={18} style={{ marginRight: '0.5rem' }} />
          Principal Dashboard
        </button>
        <button
          className={`btn ${activeTab === 'parents' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('parents')}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: activeTab === 'parents' ? '2px solid var(--primary-yellow)' : 'none' }}
        >
          <UserCheck size={18} style={{ marginRight: '0.5rem' }} />
          Parents ({parents.length})
        </button>
        <button
          className={`btn ${activeTab === 'statistics' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('statistics')}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: activeTab === 'statistics' ? '2px solid var(--primary-yellow)' : 'none' }}
        >
          <TrendingUp size={18} style={{ marginRight: '0.5rem' }} />
          Statistics & Financial
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {dashboardLoading ? (
            <Loading />
          ) : (
            <>
              {/* Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {statCards.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.title || index} className="card" style={{ textAlign: 'center' }}>
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
            </>
          )}
        </>
      )}

      {/* Parents Tab */}
      {activeTab === 'parents' && (
        <>
          {parentsLoading ? (
            <Loading />
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Parents ({parents.length})</h2>
              </div>
              <div>
                {parents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No parents found for this school
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 'bold' }}>Name</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 'bold' }}>Email</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 'bold' }}>Phone</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 'bold' }}>Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parents.map((parent) => {
                          const parentId = parent.id || parent.Id
                          const firstName = parent.firstName || parent.FirstName || ''
                          const lastName = parent.lastName || parent.LastName || ''
                          const email = parent.email || parent.Email || ''
                          const phone = parent.phoneNumber || parent.PhoneNumber || parent.phone || parent.Phone || ''
                          const students = parent.students || parent.Students || []
                          return (
                            <tr key={parentId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                                {firstName} {lastName}
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{email || 'N/A'}</td>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{phone || 'N/A'}</td>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                {students.length > 0 ? (
                                  <div>
                                    {students.map((student, idx) => {
                                      const studentFirstName = student.firstName || student.FirstName || ''
                                      const studentLastName = student.lastName || student.LastName || ''
                                      const studentName = `${studentFirstName} ${studentLastName}`.trim()
                                      const studentId = student.studentId || student.StudentId || ''
                                      return (
                                        <div key={student.id || student.Id || idx} style={{ marginBottom: '0.25rem' }}>
                                          <span style={{ fontWeight: '500' }}>{studentName}</span>
                                          {studentId && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                              ({studentId})
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  'No students'
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Statistics & Financial Tab */}
      {activeTab === 'statistics' && (
        <>
          {financialLoading ? (
            <Loading />
          ) : (
            <div>
              {/* Financial Summary */}
              {financial.summary && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="card-header">
                    <h2 className="card-title">
                      <DollarSign size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                      Financial Summary
                    </h2>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Revenue</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          ${financial.summary.totalRevenue || financial.summary.TotalRevenue || 0}
                        </h3>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pending Payments</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                          {financial.summary.pendingPayments || financial.summary.PendingPayments || 0}
                        </h3>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overdue Payments</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                          {financial.summary.overduePayments || financial.summary.OverduePayments || 0}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Charts */}
              {financial.charts && financial.charts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {financial.charts.map((chart, index) => (
                    <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
                      <div style={{ height: '350px' }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!financial.summary && (!financial.charts || financial.charts.length === 0)) && (
                <div className="card">
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Financial data not available for this school
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SchoolDetails

