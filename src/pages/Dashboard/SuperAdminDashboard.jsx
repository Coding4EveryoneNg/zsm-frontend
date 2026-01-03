import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { dashboardService, examinationsService, schoolApplicationsService, schoolsService, tenantsService, notificationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { 
  Building2, Users, School, TrendingUp, Zap, Eye, Settings, Plus, 
  GraduationCap, DollarSign, Clock, AlertTriangle, Trophy, 
  ClipboardList, BarChart3, RefreshCw, Globe, ChevronDown, Search, Bell
} from 'lucide-react'
import { defaultChartOptions } from '../../utils/chartConfig'
import logger from '../../utils/logger'
import toast from 'react-hot-toast'

const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const [schoolsPage, setSchoolsPage] = useState(1)
  const [schoolsPageSize] = useState(20)
  const [topPerformingSchoolsPage, setTopPerformingSchoolsPage] = useState(1)
  const [topPerformingSchoolsPageSize] = useState(10)
  const [selectedSchoolId, setSelectedSchoolId] = useState(null)
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false)
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSchoolDropdown(false)
      }
    }

    if (showSchoolDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSchoolDropdown])

  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['superAdminDashboard', schoolsPage, schoolsPageSize],
    () => dashboardService.getSuperAdminDashboard({ 
      page: schoolsPage, 
      pageSize: schoolsPageSize 
    }),
    { 
      refetchInterval: 300000, // 5 minutes
      retry: 1,
      onError: (err) => {
        logger.error('SuperAdmin dashboard error:', err)
      }
    }
  )

  const { data: examStats } = useQuery(
    'superAdminExamStats',
    () => examinationsService.getSuperAdminExaminationStats(),
    {
      refetchInterval: 300000,
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch examination stats:', err)
      }
    }
  )

  // Fetch global financial summary for accurate financial metrics
  const { data: financialSummary } = useQuery(
    'globalFinancialSummary',
    () => dashboardService.getGlobalFinancialSummary(),
    {
      refetchInterval: 300000,
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch global financial summary:', err)
      }
    }
  )

  // Fetch global statistics (students, teachers, classes)
  const { data: globalStatistics } = useQuery(
    'superAdminGlobalStatistics',
    () => dashboardService.getSuperAdminGlobalStatistics(),
    {
      refetchInterval: 300000,
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch global statistics:', err)
      }
    }
  )

  // Fetch schools for dropdown
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery(
    ['schools', schoolsPage, schoolsPageSize, schoolSearchTerm],
    () => schoolsService.getSchools({ 
      page: schoolsPage, 
      pageSize: schoolsPageSize,
      search: schoolSearchTerm || undefined
    }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch schools:', err)
      }
    }
  )

  // Fetch tenants for statistics
  const { data: tenantsData } = useQuery(
    ['tenants-stats'],
    () => tenantsService.getTenants({ page: 1, pageSize: 1000 }),
    {
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch tenants:', err)
      }
    }
  )

  // Fetch unread notifications count
  const { data: unreadNotificationsData } = useQuery(
    'unreadNotificationsCount',
    () => notificationsService.getUnreadCount(),
    {
      refetchInterval: 60000, // Refresh every minute
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch unread notifications count:', err)
      }
    }
  )

  const schools = schoolsData?.data?.schools || schoolsData?.data?.Schools || []
  const schoolsTotalCount = schoolsData?.data?.totalCount || schoolsData?.data?.TotalCount || 0
  const schoolsTotalPages = Math.ceil(schoolsTotalCount / schoolsPageSize)

  // Extract data with safe defaults (must be before it's used)
  const dashboard = dashboardData?.data || {}

  // Calculate tenants statistics
  const tenants = tenantsData?.data?.tenants || tenantsData?.data || []
  const totalTenants = tenants.length || dashboard.totalTenants || dashboard.TotalTenants || 0
  const activeTenants = tenants.filter(t => t.isActive !== false).length || dashboard.activeTenants || dashboard.ActiveTenants || 0
  const inactiveTenants = totalTenants - activeTenants

  // Get unread notifications count
  const unreadNotificationsCount = unreadNotificationsData?.data?.unreadCount || dashboard.unreadNotificationsCount || dashboard.UnreadNotificationsCount || 0

  if (isLoading) return <Loading />
  
  // Debug: Log the actual response structure
  console.log('Raw SuperAdmin Dashboard Response:', dashboardData)
  console.log('Dashboard Data:', dashboard)
  console.log('Dashboard Data Keys:', Object.keys(dashboard))
  console.log('TotalStudentsAcrossSchools:', dashboard.totalStudentsAcrossSchools, dashboard.TotalStudentsAcrossSchools)
  console.log('TotalTeachersAcrossSchools:', dashboard.totalTeachersAcrossSchools, dashboard.TotalTeachersAcrossSchools)
  console.log('TotalClassesAcrossSchools:', dashboard.totalClassesAcrossSchools, dashboard.TotalClassesAcrossSchools)
  console.log('TotalUsers:', dashboard.totalUsers, dashboard.TotalUsers)
  
  const stats = dashboard.stats || dashboard.Stats || {}
  const globalStats = dashboard.globalStatistics || dashboard.GlobalStatistics || {}
  const recentSchools = dashboard.recentSchools || dashboard.RecentSchools || []
  const paginatedSchools = dashboard.paginatedSchools || dashboard.PaginatedSchools || []
  const charts = dashboard.charts || dashboard.Charts || []
  const recentActivities = dashboard.recentActivities || dashboard.RecentActivities || []
  const pendingApplications = dashboard.pendingApplications || dashboard.PendingApplications || []
  const globalRevenue = dashboard.globalRevenue || dashboard.GlobalRevenue || []
  const quickActions = dashboard.quickActions || dashboard.QuickActions || []

  const examStatsData = examStats?.data || {}
  const financialSummaryData = financialSummary?.data || {}
  const globalStatisticsData = globalStatistics?.data || {}

  // Use financial summary data if available, otherwise calculate from GlobalRevenue
  const calculatedFinancialMetrics = {
    totalRevenue: financialSummaryData.totalGlobalRevenue || financialSummaryData.TotalGlobalRevenue || 
      globalRevenue
        .filter(p => (p.status || p.Status || '').toLowerCase() === 'paid')
        .reduce((sum, p) => sum + (parseFloat(p.amount || p.Amount || 0)), 0),
    totalPendingPayments: financialSummaryData.totalGlobalPendingPayments || financialSummaryData.TotalGlobalPendingPayments || 
      globalRevenue
        .filter(p => (p.status || p.Status || '').toLowerCase() === 'pending')
        .reduce((sum, p) => sum + (parseFloat(p.amount || p.Amount || 0)), 0),
    totalOverduePayments: financialSummaryData.totalGlobalOverduePayments || financialSummaryData.TotalGlobalOverduePayments || 
      globalRevenue
        .filter(p => (p.status || p.Status || '').toLowerCase() === 'overdue')
        .reduce((sum, p) => sum + (parseFloat(p.amount || p.Amount || 0)), 0),
    pendingPaymentsCount: globalRevenue.filter(p => (p.status || p.Status || '').toLowerCase() === 'pending').length,
    overduePaymentsCount: globalRevenue.filter(p => (p.status || p.Status || '').toLowerCase() === 'overdue').length
  }

  // Map global statistics with fallbacks
  // Use dedicated global statistics endpoint first, then fallback to dashboard data
  // Note: ASP.NET Core defaults to camelCase JSON serialization, so check camelCase first
  const mappedGlobalStats = {
    totalSchools: globalStatisticsData.totalSchools || globalStatisticsData.TotalSchools || dashboard.totalSchools || dashboard.TotalSchools || globalStats.totalSchools || globalStats.TotalSchools || stats.totalSchools || stats.TotalSchools || 0,
    // Read from dedicated global statistics endpoint
    totalStudentsAcrossSchools: globalStatisticsData.totalStudentsAcrossSchools || globalStatisticsData.TotalStudentsAcrossSchools || dashboard.totalStudentsAcrossSchools || dashboard.TotalStudentsAcrossSchools || globalStats.totalStudentsAcrossSchools || globalStats.TotalStudentsAcrossSchools || 0,
    totalTeachersAcrossSchools: globalStatisticsData.totalTeachersAcrossSchools || globalStatisticsData.TotalTeachersAcrossSchools || dashboard.totalTeachersAcrossSchools || dashboard.TotalTeachersAcrossSchools || globalStats.totalTeachersAcrossSchools || globalStats.TotalTeachersAcrossSchools || 0,
    totalClassesAcrossSchools: globalStatisticsData.totalClassesAcrossSchools || globalStatisticsData.TotalClassesAcrossSchools || dashboard.totalClassesAcrossSchools || dashboard.TotalClassesAcrossSchools || globalStats.totalClassesAcrossSchools || globalStats.TotalClassesAcrossSchools || 0,
    activeSchools: globalStatisticsData.activeSchools || globalStatisticsData.ActiveSchools || dashboard.activeSchools || dashboard.ActiveSchools || globalStats.activeSchools || globalStats.ActiveSchools || 0,
    inactiveSchools: globalStatisticsData.inactiveSchools || globalStatisticsData.InactiveSchools || dashboard.inactiveSchools || dashboard.InactiveSchools || globalStats.inactiveSchools || globalStats.InactiveSchools || 0,
    // Use financial summary data for accurate revenue metrics
    totalRevenueAcrossSchools: financialSummaryData.totalGlobalRevenue || financialSummaryData.TotalGlobalRevenue || globalStats.totalRevenueAcrossSchools || globalStats.TotalRevenueAcrossSchools || calculatedFinancialMetrics.totalRevenue || 0,
    totalPendingPayments: financialSummaryData.totalGlobalPendingPayments || financialSummaryData.TotalGlobalPendingPayments || globalStats.totalPendingPayments || globalStats.TotalPendingPayments || calculatedFinancialMetrics.totalPendingPayments || 0,
    totalOverduePayments: financialSummaryData.totalGlobalOverduePayments || financialSummaryData.TotalGlobalOverduePayments || globalStats.totalOverduePayments || globalStats.TotalOverduePayments || calculatedFinancialMetrics.totalOverduePayments || 0,
    activeSchools: globalStats.activeSchools || globalStats.ActiveSchools || 0,
    inactiveSchools: globalStats.inactiveSchools || globalStats.InactiveSchools || 0,
    topPerformingSchools: globalStats.topPerformingSchools || globalStats.TopPerformingSchools || []
  }
  
  // Debug logging
  console.log('Global Statistics Data:', globalStatisticsData)
  logger.debug('Mapped Global Stats:', mappedGlobalStats)
  logger.debug('Financial Summary Data:', financialSummaryData)

  // Calculate top performing schools from paginated schools if not available
  const allTopPerformingSchools = mappedGlobalStats.topPerformingSchools.length > 0 
    ? mappedGlobalStats.topPerformingSchools 
    : paginatedSchools
        .map(school => ({
          schoolId: school.id || school.Id,
          schoolName: school.name || school.Name,
          studentCount: school.totalStudents || school.TotalStudents || school.studentCount || 0,
          teacherCount: school.totalTeachers || school.TotalTeachers || school.teacherCount || 0,
          revenue: 0, // Would need to calculate from payments
          growthRate: 0,
          performanceRating: 'Average',
          lastActivity: school.onboardedDate || school.OnboardedDate || new Date()
        }))
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
  
  // Paginate top performing schools
  const topPerformingSchoolsStartIndex = (topPerformingSchoolsPage - 1) * topPerformingSchoolsPageSize
  const topPerformingSchoolsEndIndex = topPerformingSchoolsStartIndex + topPerformingSchoolsPageSize
  const topPerformingSchools = allTopPerformingSchools.slice(topPerformingSchoolsStartIndex, topPerformingSchoolsEndIndex)
  const topPerformingSchoolsTotalPages = Math.ceil(allTopPerformingSchools.length / topPerformingSchoolsPageSize)

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

  const handleRefresh = () => {
    refetch()
    toast.success('Dashboard refreshed')
  }

  const handleApproveApplication = async (applicationId) => {
    try {
      await schoolApplicationsService.approveApplication(applicationId)
      toast.success('Application approved successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to approve application')
      logger.error('Approve application error:', error)
    }
  }

  const handleRejectApplication = async (applicationId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason && reason.trim()) {
      try {
        await schoolApplicationsService.rejectApplication(applicationId, reason)
        toast.success('Application rejected')
        refetch()
      } catch (error) {
        toast.error('Failed to reject application')
        logger.error('Reject application error:', error)
      }
    }
  }

  return (
    <div className="page-container">
      {/* Error Banner */}
      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            <strong>Error loading dashboard:</strong> {error?.message || 'Please refresh the page or contact support if the problem persists.'}
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Welcome back, {dashboard.userName || 'Super Admin'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Global System Overview - {dashboard.userRole || 'SuperAdmin'} Dashboard
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Notifications Badge */}
          {unreadNotificationsCount > 0 && (
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/notifications')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}
            >
              <Bell size={18} />
              <span>Notifications</span>
              <span className="badge badge-danger" style={{ position: 'absolute', top: '-8px', right: '-8px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', padding: '0 6px' }}>
                {unreadNotificationsCount}
              </span>
            </button>
          )}
          
          {/* School Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px', justifyContent: 'space-between' }}
            >
              <School size={18} />
              <span>{selectedSchoolId ? schools.find(s => s.id === selectedSchoolId || s.Id === selectedSchoolId)?.name || schools.find(s => s.id === selectedSchoolId || s.Id === selectedSchoolId)?.Name || 'Select School' : 'Global View'}</span>
              <ChevronDown size={18} />
            </button>
            {showSchoolDropdown && (
              <div className="card" style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                marginTop: '0.5rem', 
                minWidth: '400px', 
                maxHeight: '500px', 
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search schools..."
                      value={schoolSearchTerm}
                      onChange={(e) => {
                        setSchoolSearchTerm(e.target.value)
                        setSchoolsPage(1)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '350px', overflow: 'auto' }}>
                  {/* Global View Option */}
                  <div
                    onClick={() => {
                      setSelectedSchoolId(null)
                      setShowSchoolDropdown(false)
                      // Stay on SuperAdmin dashboard (global view)
                      window.location.reload()
                    }}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: !selectedSchoolId ? 'var(--primary-yellow-light)' : 'transparent',
                      fontWeight: 'bold'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSchoolId) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSchoolId) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          Global View
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          All Schools Overview
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {mappedGlobalStats.totalSchools || 0} schools • {mappedGlobalStats.totalStudentsAcrossSchools || 0} students
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Individual Schools
                    </div>
                  </div>
                  {schoolsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                  ) : schools.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No schools found</div>
                  ) : (
                    schools.map((school) => {
                      const schoolId = school.id || school.Id
                      const schoolName = school.name || school.Name
                      const schoolLocation = school.location || school.Location || school.address || school.Address || ''
                      const studentCount = school.studentCount || school.StudentCount || 0
                      const teacherCount = school.teacherCount || school.TeacherCount || 0
                      return (
                        <div
                          key={schoolId}
                          onClick={() => {
                            setSelectedSchoolId(schoolId)
                            setShowSchoolDropdown(false)
                            navigate(`/schools/${schoolId}`)
                          }}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            backgroundColor: selectedSchoolId === schoolId ? 'var(--primary-yellow-light)' : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedSchoolId !== schoolId) {
                              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedSchoolId !== schoolId) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                {schoolName}
                              </div>
                              {schoolLocation && (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                  {schoolLocation}
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {studentCount} students • {teacherCount} teachers
                              </div>
                            </div>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSchoolId(schoolId)
                                setShowSchoolDropdown(false)
                                navigate(`/schools/${schoolId}`)
                              }}
                              style={{ marginLeft: '1rem' }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                {schoolsTotalPages > 1 && (
                  <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setSchoolsPage(Math.max(1, schoolsPage - 1))}
                      disabled={schoolsPage === 1}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Page {schoolsPage} of {schoolsTotalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setSchoolsPage(Math.min(schoolsTotalPages, schoolsPage + 1))}
                      disabled={schoolsPage === schoolsTotalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalSchools || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Schools</p>
            </div>
            <School size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalStudentsAcrossSchools || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Students</p>
            </div>
            <Users size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalTeachersAcrossSchools || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Teachers</p>
            </div>
            <GraduationCap size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalClassesAcrossSchools || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Classes</p>
            </div>
            <Building2 size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ${(mappedGlobalStats.totalRevenueAcrossSchools || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Revenue</p>
            </div>
            <DollarSign size={28} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalPendingPayments || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Pending Payments</p>
            </div>
            <Clock size={28} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {mappedGlobalStats.totalOverduePayments || 0}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Overdue Payments</p>
            </div>
            <AlertTriangle size={28} style={{ opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Examinations Overview */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <ClipboardList size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Global Examinations Overview
          </h2>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate('/examinations')}
          >
            View All Examinations
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
            <div className="card">
              <div className="card-body">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {examStatsData.draft || 0}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Draft</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                  {examStatsData.awaitingApproval || 0}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Awaiting Approval</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  {examStatsData.approved || 0}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Approved</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                  {examStatsData.rejected || 0}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Zap size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Quick Actions
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {quickActions.map((action, index) => (
                <div key={index} className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
                  if (action.url) {
                    // Map MVC URLs to client routes
                    const urlMap = {
                      '/TenantManagement/Index': '/settings/tenants',
                      '/SuperAdminManagement/Index': '/superadmins',
                      '/Dashboard/GlobalFinance': '/dashboard/finance/global',
                      '/SchoolApplicationManagement/Index': '/settings/school-applications'
                    }
                    const route = urlMap[action.url] || action.url
                    navigate(route)
                  }
                }}>
                  <div className="card-body">
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: `var(--${action.color || 'primary'})` }}>
                      {action.icon === 'business' && <Building2 size={40} />}
                      {action.icon === 'crown' && <Users size={40} />}
                      {action.icon === 'chart-line' && <BarChart3 size={40} />}
                      {action.icon === 'file-alt' && <ClipboardList size={40} />}
                      {action.icon === 'settings' && <Settings size={40} />}
                    </div>
                    <h5 style={{ marginBottom: '0.5rem' }}>{action.title}</h5>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {action.description}
                    </p>
                    <button className={`btn btn-${action.color || 'primary'}`}>Go</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Default Quick Actions if API doesn't provide */}
      {(!quickActions || quickActions.length === 0) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Zap size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Quick Actions
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/settings/tenants')}>
                <div className="card-body">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                    <Building2 size={40} />
                  </div>
                  <h5 style={{ marginBottom: '0.5rem' }}>Manage Tenants</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Create and manage tenant organizations
                  </p>
                  <button className="btn btn-primary">Go</button>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/superadmins')}>
                <div className="card-body">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--warning)' }}>
                    <Users size={40} />
                  </div>
                  <h5 style={{ marginBottom: '0.5rem' }}>Manage Super Admins</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Invite and manage Super Admin accounts
                  </p>
                  <button className="btn btn-warning">Go</button>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard/finance/global')}>
                <div className="card-body">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                    <BarChart3 size={40} />
                  </div>
                  <h5 style={{ marginBottom: '0.5rem' }}>Global Financial Dashboard</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    View financial analytics across all schools
                  </p>
                  <button className="btn btn-success">Go</button>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/settings/school-applications')}>
                <div className="card-body">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--info)' }}>
                    <ClipboardList size={40} />
                  </div>
                  <h5 style={{ marginBottom: '0.5rem' }}>School Applications</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Review and manage school applications
                  </p>
                  <button className="btn btn-info">Go</button>
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                <div className="card-body">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
                    <Settings size={40} />
                  </div>
                  <h5 style={{ marginBottom: '0.5rem' }}>Settings</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Configure system settings and preferences
                  </p>
                  <button className="btn btn-secondary">Go</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending School Applications */}
      {pendingApplications.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--warning)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--warning-light)' }}>
            <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <Clock size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                Pending School Applications ({pendingApplications.length})
              </span>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/settings/school-applications')}
              >
                View All
              </button>
            </h2>
          </div>
          <div className="card-body">
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.slice(0, 5).map((app) => (
                    <tr key={app.id}>
                      <td><strong>{app.schoolName}</strong></td>
                      <td>{app.contactPerson}</td>
                      <td>{app.contactEmail}</td>
                      <td>{app.contactPhone || 'N/A'}</td>
                      <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveApplication(app.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectApplication(app.id)}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/settings/school-applications`)}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top Performing Schools and System Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Top Performing Schools */}
        {allTopPerformingSchools.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">
                <Trophy size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                Top Performing Schools ({allTopPerformingSchools.length})
              </h2>
            </div>
            <div className="card-body">
              {topPerformingSchools.length > 0 ? (
                <>
                  <div className="table">
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>School</th>
                          <th>Students</th>
                          <th>Teachers</th>
                          <th>Revenue</th>
                          <th>Growth</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPerformingSchools.map((school, index) => {
                          const globalRank = topPerformingSchoolsStartIndex + index + 1
                          return (
                            <tr key={school.schoolId || index}>
                              <td>
                                <span className="badge badge-primary">{globalRank}</span>
                              </td>
                              <td>
                                <strong>{school.schoolName}</strong>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>
                                  Last Activity: {school.lastActivity ? new Date(school.lastActivity).toLocaleDateString() : 'N/A'}
                                </small>
                              </td>
                              <td>{school.studentCount || 0}</td>
                              <td>{school.teacherCount || 0}</td>
                              <td>${(school.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td>
                                <span className={`badge ${(school.growthRate || 0) >= 0 ? 'badge-success' : 'badge-danger'}`}>
                                  {(school.growthRate || 0).toFixed(1)}%
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  school.performanceRating === 'Excellent' ? 'badge-success' :
                                  school.performanceRating === 'Good' ? 'badge-primary' :
                                  school.performanceRating === 'Average' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                  {school.performanceRating || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {topPerformingSchoolsTotalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginTop: '2rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-color)',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => setTopPerformingSchoolsPage(p => Math.max(1, p - 1))}
                        disabled={topPerformingSchoolsPage === 1}
                      >
                        Previous
                      </button>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        {Array.from({ length: Math.min(5, topPerformingSchoolsTotalPages) }, (_, i) => {
                          let pageNum
                          if (topPerformingSchoolsTotalPages <= 5) {
                            pageNum = i + 1
                          } else if (topPerformingSchoolsPage <= 3) {
                            pageNum = i + 1
                          } else if (topPerformingSchoolsPage >= topPerformingSchoolsTotalPages - 2) {
                            pageNum = topPerformingSchoolsTotalPages - 4 + i
                          } else {
                            pageNum = topPerformingSchoolsPage - 2 + i
                          }
                          return (
                            <button
                              key={pageNum}
                              className={`btn ${topPerformingSchoolsPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => setTopPerformingSchoolsPage(pageNum)}
                              style={{ minWidth: '40px' }}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <span style={{ color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                        Page {topPerformingSchoolsPage} of {topPerformingSchoolsTotalPages}
                      </span>
                      <button
                        className="btn btn-outline"
                        onClick={() => setTopPerformingSchoolsPage(p => Math.min(topPerformingSchoolsTotalPages, p + 1))}
                        disabled={topPerformingSchoolsPage >= topPerformingSchoolsTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p className="empty-state-text">No top performing schools found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <BarChart3 size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
              System Overview
            </h2>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.25rem' }}>
                    {mappedGlobalStats.activeSchools || 0}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Active Schools</small>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '0.25rem' }}>
                    {inactiveTenants || mappedGlobalStats.inactiveSchools || 0}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Inactive Schools</small>
                </div>
              </div>
              <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    {totalTenants}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Total Tenants</small>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info)', marginBottom: '0.25rem' }}>
                    {activeTenants}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>Active Tenants</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {unreadNotificationsCount > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)', backgroundColor: 'var(--primary-light)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} />
                Recent Notifications ({unreadNotificationsCount})
              </span>
              <button 
                className="btn btn-sm"
                style={{ backgroundColor: 'white', color: 'var(--primary)' }}
                onClick={() => navigate('/notifications')}
              >
                View All Notifications
              </button>
            </h2>
          </div>
          <div className="card-body">
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--info-light)', 
              borderRadius: '0.5rem',
              border: '1px solid var(--info)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--info)', marginBottom: '0.5rem' }}>
                <Bell size={18} />
                <strong>You have {unreadNotificationsCount} unread notification{unreadNotificationsCount !== 1 ? 's' : ''}.</strong>
              </div>
              <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem' }}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/notifications') }}
                  style={{ color: 'var(--info)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  View all notifications
                </a> to see the latest updates and important information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Schools List */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <Building2 size={20} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            All Schools ({schoolsTotalCount})
          </h2>
        </div>
        <div className="card-body">
          {paginatedSchools.length > 0 ? (
            <>
              <div className="table">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>School</th>
                      <th>Location</th>
                      <th>Students</th>
                      <th>Teachers</th>
                      <th>Classes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSchools.map((school) => (
                      <tr key={school.id}>
                        <td>
                          <strong>{school.name}</strong>
                          <br />
                          <small style={{ color: 'var(--text-muted)' }}>
                            Created: {school.onboardedDate ? new Date(school.onboardedDate).toLocaleDateString() : 'N/A'}
                          </small>
                        </td>
                        <td>{school.location || school.address || 'N/A'}</td>
                        <td>{school.totalStudents || school.studentCount || 0}</td>
                        <td>{school.totalTeachers || school.teacherCount || 0}</td>
                        <td>{school.totalClasses || 0}</td>
                        <td>
                          <span className={`badge ${school.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                            {school.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/settings/school`)}
                          >
                            <Eye size={16} style={{ marginRight: '0.25rem' }} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {schoolsTotalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSchoolsPage(p => Math.max(1, p - 1))}
                    disabled={schoolsPage === 1}
                  >
                    Previous
                  </button>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {Array.from({ length: Math.min(5, schoolsTotalPages) }, (_, i) => {
                      let pageNum
                      if (schoolsTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (schoolsPage <= 3) {
                        pageNum = i + 1
                      } else if (schoolsPage >= schoolsTotalPages - 2) {
                        pageNum = schoolsTotalPages - 4 + i
                      } else {
                        pageNum = schoolsPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`btn ${schoolsPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setSchoolsPage(pageNum)}
                          style={{ minWidth: '40px' }}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <span style={{ color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                    Page {schoolsPage} of {schoolsTotalPages}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSchoolsPage(p => Math.min(schoolsTotalPages, p + 1))}
                    disabled={schoolsPage >= schoolsTotalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p className="empty-state-text">No schools found</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      {charts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Global Analytics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {charts.map((chart, index) => (
              <div key={chart.id || index} className="card" style={{ minHeight: '400px' }}>
                <div className="card-header">
                  <h3 className="card-title">{chart.title || 'Chart'}</h3>
                  {chart.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                      {chart.description}
                    </p>
                  )}
                </div>
                <div className="card-body" style={{ height: '350px' }}>
                  {renderChart(chart)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Quick Access */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Global Financial Analytics</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Access comprehensive financial reports and transaction monitoring across all schools
            </p>
          </div>
          <button
            className="btn"
            style={{ backgroundColor: 'white', color: '#667eea' }}
            onClick={() => navigate('/dashboard/finance/global')}
          >
            <Globe size={18} style={{ marginRight: '0.5rem' }} />
            View Global Financial Dashboard
          </button>
        </div>
      </div>

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

export default SuperAdminDashboard
