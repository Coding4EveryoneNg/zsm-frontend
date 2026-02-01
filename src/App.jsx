import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Loading from './components/Common/Loading'
import ErrorBoundary from './components/Common/ErrorBoundary'

// Landing Page
import Landing from './pages/Landing/Landing'

// Onboarding Pages
import SchoolOnboarding from './pages/Onboarding/SchoolOnboarding'

// Auth Pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'

// Dashboard Pages
import StudentDashboard from './pages/Dashboard/StudentDashboard'
import TeacherDashboard from './pages/Dashboard/TeacherDashboard'
import AdminDashboard from './pages/Dashboard/AdminDashboard'
import PrincipalDashboard from './pages/Dashboard/PrincipalDashboard'
import SuperAdminDashboard from './pages/Dashboard/SuperAdminDashboard'
import GlobalFinancialDashboard from './pages/Dashboard/GlobalFinancialDashboard'
import ParentDashboard from './pages/Dashboard/ParentDashboard'

// Management Pages
import Students from './pages/Management/Students'
import StudentDetails from './pages/Management/StudentDetails'
import CreateStudent from './pages/Management/CreateStudent'
import Teachers from './pages/Management/Teachers'
import TeacherDetails from './pages/Management/TeacherDetails'
import CreateTeacher from './pages/Management/CreateTeacher'
import CreatePrincipal from './pages/Management/CreatePrincipal'
import Principals from './pages/Management/Principals'
import PrincipalDetails from './pages/Management/PrincipalDetails'
import Admins from './pages/Management/Admins'
import CreateAdmin from './pages/Management/CreateAdmin'
import SuperAdmins from './pages/Management/SuperAdmins'
import SuperAdminDetails from './pages/Management/SuperAdminDetails'
import Classes from './pages/Management/Classes'
import ClassDetails from './pages/Management/ClassDetails'
import CreateClass from './pages/Management/CreateClass'
import Subjects from './pages/Management/Subjects'
import SubjectDetails from './pages/Management/SubjectDetails'
import CreateSubject from './pages/Management/CreateSubject'
import AdminDetails from './pages/Management/AdminDetails'

// Academic Pages
import Assignments from './pages/Academic/Assignments'
import AssignmentDetails from './pages/Academic/AssignmentDetails'
import CreateAssignment from './pages/Academic/CreateAssignment'
import TeacherSubmissions from './pages/Academic/TeacherSubmissions'
import Examinations from './pages/Academic/Examinations'
import ExaminationDetails from './pages/Academic/ExaminationDetails'
import CreateExamination from './pages/Academic/CreateExamination'
import TakeExamination from './pages/Academic/TakeExamination'
import ExaminationTimetable from './pages/Academic/ExaminationTimetable'
import Courses from './pages/Academic/Courses'
import CourseDetails from './pages/Academic/CourseDetails'
import Books from './pages/Academic/Books'
import CreateBook from './pages/Academic/CreateBook'

// Financial Pages
import Payments from './pages/Financial/Payments'
import PaymentDetails from './pages/Financial/PaymentDetails'
import CreatePayment from './pages/Financial/CreatePayment'

// Reports Pages
import Reports from './pages/Reports/Reports'

// Other Pages
import Notifications from './pages/Notifications/Notifications'
import Settings from './pages/Settings/Settings'
import SessionTerm from './pages/Settings/SessionTerm'
import SchoolCalendar from './pages/Settings/SchoolCalendar'
import SchoolManagement from './pages/Settings/SchoolManagement'
import TenantManagement from './pages/Settings/TenantManagement'
import SchoolApplications from './pages/Settings/SchoolApplications'
import CreateSchoolApplication from './pages/Settings/CreateSchoolApplication'
import SchoolDetails from './pages/Settings/SchoolDetails'
import FeeStructures from './pages/Settings/FeeStructures'
import SchoolSubscription from './pages/Settings/SchoolSubscription'
import PendingSubscriptionPayments from './pages/Settings/PendingSubscriptionPayments'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
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
    // Redirect based on role
    const roleRoutes = {
      Student: '/dashboard/student',
      Teacher: '/dashboard/teacher',
      Admin: '/dashboard/admin',
      Principal: '/dashboard/principal',
      SuperAdmin: '/dashboard/superadmin',
      Parent: '/dashboard/parent',
    }
    const redirectTo = roleRoutes[user?.role] || '/dashboard'
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
      <Route path="/school-onboarding" element={<PublicRoute><SchoolOnboarding /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        {/* Dashboard Routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/principal"
          element={
            <ProtectedRoute allowedRoles={['Principal']}>
              <PrincipalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/superadmin"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent"
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Management Routes */}
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal', 'Teacher']}>
              <StudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <Teachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <TeacherDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/principals"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Principals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/principals/create"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <CreatePrincipal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/principals/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <PrincipalDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <Admins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <AdminDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmins"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdmins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmins/:id"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <ClassDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateSubject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <SubjectDetails />
            </ProtectedRoute>
          }
        />

        {/* Academic Routes */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/create"
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <CreateAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <ProtectedRoute>
              <AssignmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/submissions"
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/examinations"
          element={
            <ProtectedRoute>
              <Examinations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic/examination-timetable"
          element={
            <ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin', 'Principal']}>
              <ExaminationTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/examinations/create"
          element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <CreateExamination />
            </ProtectedRoute>
          }
        />
        <Route
          path="/examinations/:id"
          element={
            <ProtectedRoute>
              <ExaminationDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/examinations/:id/take"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <TakeExamination />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <Books />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreateBook />
            </ProtectedRoute>
          }
        />

        {/* Financial Routes */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:paymentId"
          element={
            <ProtectedRoute allowedRoles={['Student', 'Parent', 'Admin', 'Principal']}>
              <PaymentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/create"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <CreatePayment />
            </ProtectedRoute>
          }
        />

        {/* Reports Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/student/:studentId/results"
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/student/:studentId/performance"
          element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Other Routes */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/session-term"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Principal']}>
              <SessionTerm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-calendar"
          element={
            <ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin', 'Principal', 'Parent']}>
              <SchoolCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/school"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
              <SchoolManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/fee-structures"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <FeeStructures />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/subscription"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Principal']}>
              <SchoolSubscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/subscription-payments"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <PendingSubscriptionPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/tenants"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <TenantManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/school-applications"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
              <SchoolApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/school-applications/create"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <CreateSchoolApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schools/:schoolId"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SchoolDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/finance/global"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <GlobalFinancialDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

        {/* Default redirect for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App

