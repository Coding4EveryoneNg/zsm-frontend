import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import DashboardCalendar from '../../components/Dashboard/DashboardCalendar'
import { Users, FileText, ClipboardList, TrendingUp, Zap, Plus, Eye, Clock, CheckCircle, BookOpen } from 'lucide-react'
import { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData } from '../../utils/chartConfig'
import { safeStrLower, formatDecimal } from '../../utils/safeUtils'
import logger from '../../utils/logger'

const TeacherDashboard = () => {
  const navigate = useNavigate()
  const { data: dashboardData, isLoading, error } = useQuery(
    'teacherDashboard',
    () => dashboardService.getTeacherDashboard(),
    { 
      refetchInterval: 30000,
      retry: 1,
      onError: (err) => {
        logger.error('Teacher dashboard error:', err)
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
  const recentAssignments = dashboard.recentAssignments || dashboard.RecentAssignments || []
  const pendingSubmissions = dashboard.pendingSubmissions || dashboard.PendingSubmissions || []
  const assignedCourses = dashboard.assignedCourses || dashboard.AssignedCourses || []
  const charts = dashboard.charts || dashboard.Charts || []
  const classPerformance = dashboard.classPerformance || dashboard.ClassPerformance || []
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
    { title: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'var(--primary-yellow)' },
    { title: 'Active Assignments', value: stats.activeAssignments || 0, icon: FileText, color: 'var(--info)' },
    { title: 'Pending Grading', value: stats.pendingGrading || 0, icon: ClipboardList, color: 'var(--warning)' },
    { title: 'Average Performance', value: `${formatDecimal(stats.averagePerformance ?? 0)}%`, icon: TrendingUp, color: 'var(--success)' },
  ]

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

      <div className="dashboard-with-calendar" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
          Teacher Dashboard
        </h1>
        <DashboardCalendar />
      </div>

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
              onClick={() => navigate('/assignments/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Create Assignment
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate('/examinations/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Create Examination
            </button>
            <button
              className="btn btn-info"
              onClick={() => navigate('/assignments')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Eye size={18} />
              View Assignments
            </button>
            <button
              className="btn btn-warning"
              onClick={() => navigate('/assignments?filter=pending')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Clock size={18} />
              Pending Grading
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/reports')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <TrendingUp size={18} />
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Courses */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <BookOpen size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            My Assigned Courses
          </h2>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate('/courses')}
          >
            View All Courses
          </button>
        </div>
        {assignedCourses.length > 0 ? (
          <div>
            {assignedCourses.slice(0, 10).map((course, idx) => {
              const courseId = course.id || course.Id
              const title = course.title || course.Title || 'Untitled'
              const subjectName = course.subjectName || course.SubjectName || ''
              const courseCode = course.courseCode || course.CourseCode || ''
              const status = course.status || course.Status || ''
              return (
                <div
                  key={courseId || idx}
                  style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => courseId && navigate(`/courses/${courseId}`)}
                >
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {subjectName && <span>{subjectName}</span>}
                    {courseCode && <span>{subjectName ? ' • ' : ''}{courseCode}</span>}
                    {status && <span> • {status}</span>}
                  </p>
                </div>
              )
            })}
            {assignedCourses.length > 10 && (
              <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                And {assignedCourses.length - 10} more. <button type="button" className="btn btn-link btn-sm" onClick={() => navigate('/courses')}>View all</button>
              </p>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p className="empty-state-text">No courses assigned yet</p>
            <p className="empty-state-subtext">Courses assigned to you by admin will appear here</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
              if (stat.title === 'Pending Grading') navigate('/assignments?filter=pending')
              else if (stat.title === 'Active Assignments') navigate('/assignments')
              else if (stat.title === 'Total Students') navigate('/students')
            }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Recent Assignments</h2>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate('/assignments')}
            >
              View All
            </button>
          </div>
          {recentAssignments.length > 0 ? (
            <div>
              {recentAssignments.slice(0, 5).map((assignment, idx) => {
                const assignmentId = assignment.id || assignment.Id
                const title = assignment.title || assignment.Title || 'Untitled'
                const submissionCount = assignment.submissionCount || assignment.SubmissionCount || 0
                return (
                  <div 
                    key={assignmentId || idx} 
                    style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => assignmentId && navigate(`/assignments/${assignmentId}`)}
                  >
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Submissions: {submissionCount}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p className="empty-state-text">No assignments yet</p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/assignments/create')}
                style={{ marginTop: '1rem' }}
              >
                Create Your First Assignment
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Pending Submissions</h2>
            <button 
              className="btn btn-sm btn-outline-warning"
              onClick={() => navigate('/assignments?filter=pending')}
            >
              View All
            </button>
          </div>
          {pendingSubmissions.length > 0 ? (
            <div>
              {pendingSubmissions.slice(0, 5).map((submission, idx) => {
                const submissionId = submission.id || submission.Id
                const assignmentId = submission.assignmentId || submission.AssignmentId
                const studentName = submission.studentName || submission.StudentName || 'Unknown Student'
                const assignmentTitle = submission.assignmentTitle || submission.AssignmentTitle || 'Untitled'
                return (
                  <div 
                    key={submissionId || idx} 
                    style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => assignmentId && navigate(`/assignments/${assignmentId}`)}
                  >
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {studentName}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {assignmentTitle}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p className="empty-state-text">All caught up!</p>
              <p className="empty-state-subtext">No pending submissions to grade</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      {recentActivities && recentActivities.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
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

export default TeacherDashboard

