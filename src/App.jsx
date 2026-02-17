import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { getUserRole } from './utils/safeUtils'
import Layout from './components/Layout/Layout'
import Loading from './components/Common/Loading'
import ErrorBoundary from './components/Common/ErrorBoundary'

// Eager load: Landing (first paint), Layout, Auth pages (small, critical path)
import Landing from './pages/Landing/Landing'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import Unauthorized from './pages/Auth/Unauthorized'

// Lazy load: Onboarding
const SchoolOnboarding = lazy(() => import('./pages/Onboarding/SchoolOnboarding'))

// Lazy load: Dashboards (heavy with charts)
const StudentDashboard = lazy(() => import('./pages/Dashboard/StudentDashboard'))
const TeacherDashboard = lazy(() => import('./pages/Dashboard/TeacherDashboard'))
const AdminDashboard = lazy(() => import('./pages/Dashboard/AdminDashboard'))
const PrincipalDashboard = lazy(() => import('./pages/Dashboard/PrincipalDashboard'))
const SuperAdminDashboard = lazy(() => import('./pages/Dashboard/SuperAdminDashboard'))
const GlobalFinancialDashboard = lazy(() => import('./pages/Dashboard/GlobalFinancialDashboard'))
const ParentDashboard = lazy(() => import('./pages/Dashboard/ParentDashboard'))

// Lazy load: Management
const Students = lazy(() => import('./pages/Management/Students'))
const StudentDetails = lazy(() => import('./pages/Management/StudentDetails'))
const CreateStudent = lazy(() => import('./pages/Management/CreateStudent'))
const Teachers = lazy(() => import('./pages/Management/Teachers'))
const TeacherDetails = lazy(() => import('./pages/Management/TeacherDetails'))
const CreateTeacher = lazy(() => import('./pages/Management/CreateTeacher'))
const CreatePrincipal = lazy(() => import('./pages/Management/CreatePrincipal'))
const Principals = lazy(() => import('./pages/Management/Principals'))
const Parents = lazy(() => import('./pages/Management/Parents'))
const PrincipalDetails = lazy(() => import('./pages/Management/PrincipalDetails'))
const Admins = lazy(() => import('./pages/Management/Admins'))
const CreateAdmin = lazy(() => import('./pages/Management/CreateAdmin'))
const SuperAdmins = lazy(() => import('./pages/Management/SuperAdmins'))
const SuperAdminDetails = lazy(() => import('./pages/Management/SuperAdminDetails'))
const Classes = lazy(() => import('./pages/Management/Classes'))
const ClassDetails = lazy(() => import('./pages/Management/ClassDetails'))
const CreateClass = lazy(() => import('./pages/Management/CreateClass'))
const Subjects = lazy(() => import('./pages/Management/Subjects'))
const SubjectDetails = lazy(() => import('./pages/Management/SubjectDetails'))
const CreateSubject = lazy(() => import('./pages/Management/CreateSubject'))
const AdminDetails = lazy(() => import('./pages/Management/AdminDetails'))

// Lazy load: Academic
const Assignments = lazy(() => import('./pages/Academic/Assignments'))
const AssignmentDetails = lazy(() => import('./pages/Academic/AssignmentDetails'))
const CreateAssignment = lazy(() => import('./pages/Academic/CreateAssignment'))
const TeacherSubmissions = lazy(() => import('./pages/Academic/TeacherSubmissions'))
const Examinations = lazy(() => import('./pages/Academic/Examinations'))
const ExaminationDetails = lazy(() => import('./pages/Academic/ExaminationDetails'))
const CreateExamination = lazy(() => import('./pages/Academic/CreateExamination'))
const TakeExamination = lazy(() => import('./pages/Academic/TakeExamination'))
const MarkAttendance = lazy(() => import('./pages/Academic/MarkAttendance'))
const ClassAttendanceList = lazy(() => import('./pages/Academic/ClassAttendanceList'))
const CATests = lazy(() => import('./pages/Academic/CATests'))
const CreateCATest = lazy(() => import('./pages/Academic/CreateCATest'))
const CATestDetails = lazy(() => import('./pages/Academic/CATestDetails'))
const ExaminationTimetable = lazy(() => import('./pages/Academic/ExaminationTimetable'))
const ClassTimetable = lazy(() => import('./pages/Academic/ClassTimetable'))
const Courses = lazy(() => import('./pages/Academic/Courses'))
const CourseDetails = lazy(() => import('./pages/Academic/CourseDetails'))
const Books = lazy(() => import('./pages/Academic/Books'))
const CreateBook = lazy(() => import('./pages/Academic/CreateBook'))

// Lazy load: Financial
const Payments = lazy(() => import('./pages/Financial/Payments'))
const PaymentDetails = lazy(() => import('./pages/Financial/PaymentDetails'))
const PaymentCallback = lazy(() => import('./pages/Financial/PaymentCallback'))
const CreatePayment = lazy(() => import('./pages/Financial/CreatePayment'))

// Lazy load: Reports, Notifications, Settings
const Reports = lazy(() => import('./pages/Reports/Reports'))
const Notifications = lazy(() => import('./pages/Notifications/Notifications'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const SessionTerm = lazy(() => import('./pages/Settings/SessionTerm'))
const SchoolCalendar = lazy(() => import('./pages/Settings/SchoolCalendar'))
const SchoolManagement = lazy(() => import('./pages/Settings/SchoolManagement'))
const TenantManagement = lazy(() => import('./pages/Settings/TenantManagement'))
const SchoolApplications = lazy(() => import('./pages/Settings/SchoolApplications'))
const CreateSchoolApplication = lazy(() => import('./pages/Settings/CreateSchoolApplication'))
const SchoolDetails = lazy(() => import('./pages/Settings/SchoolDetails'))
const FeeStructures = lazy(() => import('./pages/Settings/FeeStructures'))
const SchoolSubscription = lazy(() => import('./pages/Settings/SchoolSubscription'))
const PendingSubscriptionPayments = lazy(() => import('./pages/Settings/PendingSubscriptionPayments'))

// Wrapper for lazy routes with Suspense
const LazyRoute = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
)

// Redirect /dashboard to role-specific dashboard
const DashboardRedirect = () => {
  const { user } = useAuth()
  const roleLower = getUserRole(user).toLowerCase()
  const routes = { student: '/dashboard/student', teacher: '/dashboard/teacher', admin: '/dashboard/admin', principal: '/dashboard/principal', superadmin: '/dashboard/superadmin', parent: '/dashboard/parent' }
  return <Navigate to={routes[roleLower] || '/dashboard/student'} replace />
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = getUserRole(user)
  if (allowedRoles.length > 0 && !allowedRoles.some((r) => String(r).toLowerCase() === userRole.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (isAuthenticated) {
    // Redirect based on role (case-insensitive)
    const roleRoutes = {
      Student: '/dashboard/student',
      Teacher: '/dashboard/teacher',
      Admin: '/dashboard/admin',
      Principal: '/dashboard/principal',
      SuperAdmin: '/dashboard/superadmin',
      Parent: '/dashboard/parent',
    }
    const roleKey = Object.keys(roleRoutes).find((k) => k.toLowerCase() === getUserRole(user).toLowerCase())
    const redirectTo = roleKey ? roleRoutes[roleKey] : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return children
}

function App() {
  const { loading } = useAuth()
  const location = useLocation()
  
  // Only show loading for protected routes, not for public routes
  // This allows the landing page to render immediately
  const isPublicRoute = location.pathname === '/' || 
                       location.pathname === '/login' || 
                       location.pathname === '/register' || 
                       location.pathname === '/forgot-password' || 
                       location.pathname === '/reset-password' ||
                       location.pathname === '/school-onboarding' ||
                       location.pathname.startsWith('/school-onboarding/')

  // Don't block public routes on auth loading
  if (loading && !isPublicRoute) {
    return <Loading />
  }

  return (
    <ErrorBoundary>
      <Routes>
      {/* Landing Page - Public, no auth check */}
      <Route path="/" element={<Landing />} />
      
      {/* Public Routes */}
      <Route path="/school-onboarding" element={<PublicRoute><LazyRoute><SchoolOnboarding /></LazyRoute></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        {/* Redirect /dashboard to role-specific dashboard */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        {/* Dashboard Routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <LazyRoute>
                <ErrorBoundary
                  fallback={({ resetError }) => (
                    <div className="page-container" style={{ padding: '2rem' }}>
                      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <div className="card-header" style={{ borderBottom: '2px solid var(--warning)' }}>
                          <h2 className="card-title">Student Dashboard</h2>
                        </div>
                        <div className="card-body">
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Something went wrong while loading the dashboard. Please try again.
                          </p>
                          <button type="button" className="btn btn-primary" onClick={resetError}>
                            Try again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <StudentDashboard />
                </ErrorBoundary>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <LazyRoute><TeacherDashboard /></LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <LazyRoute><AdminDashboard /></LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/principal"
          element={
            <ProtectedRoute allowedRoles={['Principal']}>
              <LazyRoute><PrincipalDashboard /></LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/superadmin"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <LazyRoute><SuperAdminDashboard /></LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent"
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <LazyRoute><ParentDashboard /></LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Management Routes */}
        <Route path="/students" element={<ProtectedRoute allowedRoles={['Admin', 'Principal', 'Teacher']}><LazyRoute><Students /></LazyRoute></ProtectedRoute>} />
        <Route path="/students/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateStudent /></LazyRoute></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal', 'Teacher']}><LazyRoute><StudentDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><Teachers /></LazyRoute></ProtectedRoute>} />
        <Route path="/teachers/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateTeacher /></LazyRoute></ProtectedRoute>} />
        <Route path="/teachers/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><TeacherDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/principals" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><Principals /></LazyRoute></ProtectedRoute>} />
        <Route path="/parents" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><Parents /></LazyRoute></ProtectedRoute>} />
        <Route path="/principals/create" element={<ProtectedRoute allowedRoles={['Admin']}><LazyRoute><CreatePrincipal /></LazyRoute></ProtectedRoute>} />
        <Route path="/principals/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><PrincipalDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/admins" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><Admins /></LazyRoute></ProtectedRoute>} />
        <Route path="/admins/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admins/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><AdminDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/superadmins" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><SuperAdmins /></LazyRoute></ProtectedRoute>} />
        <Route path="/superadmins/:id" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><SuperAdminDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><Classes /></LazyRoute></ProtectedRoute>} />
        <Route path="/classes/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateClass /></LazyRoute></ProtectedRoute>} />
        <Route path="/classes/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><ClassDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute allowedRoles={['Admin', 'Principal', 'Student']}><LazyRoute><Subjects /></LazyRoute></ProtectedRoute>} />
        <Route path="/subjects/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateSubject /></LazyRoute></ProtectedRoute>} />
        <Route path="/subjects/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Principal', 'Student']}><LazyRoute><SubjectDetails /></LazyRoute></ProtectedRoute>} />

        {/* Academic Routes */}
        <Route path="/assignments" element={<ProtectedRoute><LazyRoute><Assignments /></LazyRoute></ProtectedRoute>} />
        <Route path="/assignments/create" element={<ProtectedRoute allowedRoles={['Teacher']}><LazyRoute><CreateAssignment /></LazyRoute></ProtectedRoute>} />
        <Route path="/assignments/:id" element={<ProtectedRoute><LazyRoute><ErrorBoundary fallback={({ resetError }) => (<div className="page-container" style={{ padding: '2rem' }}><div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}><div className="card-header"><h2 className="card-title">Assignment</h2></div><div className="card-body"><p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Something went wrong while loading this assignment. Please try again.</p><button type="button" className="btn btn-primary" onClick={resetError}>Try again</button></div></div></div>)}><AssignmentDetails /></ErrorBoundary></LazyRoute></ProtectedRoute>} />
        <Route path="/assignments/submissions" element={<ProtectedRoute allowedRoles={['Teacher']}><LazyRoute><TeacherSubmissions /></LazyRoute></ProtectedRoute>} />
        <Route path="/attendance/mark" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin', 'Principal']}><LazyRoute><MarkAttendance /></LazyRoute></ProtectedRoute>} />
        <Route path="/attendance/term" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin', 'Principal']}><LazyRoute><ClassAttendanceList /></LazyRoute></ProtectedRoute>} />
        <Route path="/catests" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin', 'Principal']}><LazyRoute><CATests /></LazyRoute></ProtectedRoute>} />
        <Route path="/catests/create" element={<ProtectedRoute allowedRoles={['Teacher']}><LazyRoute><CreateCATest /></LazyRoute></ProtectedRoute>} />
        <Route path="/catests/:id" element={<ProtectedRoute allowedRoles={['Teacher', 'Admin', 'Principal']}><LazyRoute><CATestDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/examinations" element={<ProtectedRoute><LazyRoute><Examinations /></LazyRoute></ProtectedRoute>} />
        <Route path="/academic/examination-timetable" element={<ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin', 'Principal']}><LazyRoute><ExaminationTimetable /></LazyRoute></ProtectedRoute>} />
        <Route path="/academic/class-timetable" element={<ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin', 'Principal']}><LazyRoute><ClassTimetable /></LazyRoute></ProtectedRoute>} />
        <Route path="/examinations/create" element={<ProtectedRoute allowedRoles={['Teacher']}><LazyRoute><CreateExamination /></LazyRoute></ProtectedRoute>} />
        <Route path="/examinations/:id" element={<ProtectedRoute><LazyRoute><ExaminationDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/examinations/:id/take" element={<ProtectedRoute allowedRoles={['Student']}><LazyRoute><ErrorBoundary fallback={({ resetError }) => (<div className="page-container" style={{ padding: '2rem' }}><div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}><div className="card-header"><h2 className="card-title">Examination</h2></div><div className="card-body"><p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Something went wrong while loading this examination. Please try again.</p><button type="button" className="btn btn-primary" onClick={resetError}>Try again</button></div></div></div>)}><TakeExamination /></ErrorBoundary></LazyRoute></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><LazyRoute><Courses /></LazyRoute></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><LazyRoute><CourseDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/books" element={<ProtectedRoute><LazyRoute><Books /></LazyRoute></ProtectedRoute>} />
        <Route path="/books/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreateBook /></LazyRoute></ProtectedRoute>} />

        {/* Financial Routes */}
        <Route path="/payments" element={<ProtectedRoute><LazyRoute><Payments /></LazyRoute></ProtectedRoute>} />
        <Route path="/payments/callback/:gateway" element={<ProtectedRoute allowedRoles={['Parent', 'Admin', 'Principal']}><LazyRoute><PaymentCallback /></LazyRoute></ProtectedRoute>} />
        <Route path="/payments/cancel" element={<ProtectedRoute allowedRoles={['Parent', 'Admin', 'Principal']}><LazyRoute><PaymentCallback /></LazyRoute></ProtectedRoute>} />
        <Route path="/payments/:paymentId" element={<ProtectedRoute allowedRoles={['Student', 'Parent', 'Admin', 'Principal']}><LazyRoute><PaymentDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/payments/create" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><CreatePayment /></LazyRoute></ProtectedRoute>} />

        {/* Reports Routes */}
        <Route path="/reports" element={<ProtectedRoute><LazyRoute><Reports /></LazyRoute></ProtectedRoute>} />
        <Route path="/reports/student/:studentId/results" element={<ProtectedRoute allowedRoles={['Student', 'Parent', 'Teacher', 'Admin', 'Principal']}><LazyRoute><Reports /></LazyRoute></ProtectedRoute>} />
        <Route path="/reports/student/:studentId/performance" element={<ProtectedRoute allowedRoles={['Student', 'Parent', 'Teacher', 'Admin', 'Principal']}><LazyRoute><Reports /></LazyRoute></ProtectedRoute>} />

        {/* Other Routes */}
        <Route path="/notifications" element={<ProtectedRoute><LazyRoute><Notifications /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><LazyRoute><Settings /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/session-term" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal']}><LazyRoute><SessionTerm /></LazyRoute></ProtectedRoute>} />
        <Route path="/school-calendar" element={<ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin', 'Principal', 'Parent']}><LazyRoute><SchoolCalendar /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/school" element={<ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}><LazyRoute><SchoolManagement /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/fee-structures" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><FeeStructures /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/subscription" element={<ProtectedRoute allowedRoles={['Admin', 'Principal']}><LazyRoute><SchoolSubscription /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/subscription-payments" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><PendingSubscriptionPayments /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/tenants" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><TenantManagement /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/school-applications" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}><LazyRoute><SchoolApplications /></LazyRoute></ProtectedRoute>} />
        <Route path="/settings/school-applications/create" element={<ProtectedRoute allowedRoles={['Admin']}><LazyRoute><CreateSchoolApplication /></LazyRoute></ProtectedRoute>} />
        <Route path="/schools/:schoolId" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><SchoolDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="/dashboard/finance/global" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><LazyRoute><GlobalFinancialDashboard /></LazyRoute></ProtectedRoute>} />
      </Route>

        {/* Default redirect for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App

