# API Integration Summary

This document lists all API endpoints that are integrated in the React client application.

## ✅ Fully Integrated Endpoints

### Authentication (`/api/auth`)
- ✅ `POST /api/auth/login` - Login
- ✅ `POST /api/auth/register` - Register
- ✅ `POST /api/auth/forgot-password` - Forgot password
- ✅ `POST /api/auth/reset-password` - Reset password
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/auth/change-password` - Change password
- ✅ `POST /api/auth/generate-otp` - Generate OTP
- ✅ `POST /api/auth/verify-otp` - Verify OTP
- ✅ `POST /api/auth/confirm-email` - Confirm email
- ✅ `POST /api/auth/logout` - Logout

### Dashboard (`/api/dashboard`)
- ✅ `GET /api/dashboard` - General dashboard
- ✅ `GET /api/dashboard/student` - Student dashboard
- ✅ `GET /api/dashboard/teacher` - Teacher dashboard
- ✅ `GET /api/dashboard/principal` - Principal dashboard
- ✅ `GET /api/dashboard/admin` - Admin dashboard
- ✅ `GET /api/dashboard/superadmin` - SuperAdmin dashboard
- ✅ `GET /api/dashboard/finance` - Financial dashboard
- ✅ `GET /api/dashboard/finance/global` - Global financial summary
- ✅ `GET /api/dashboard/finance/payment-analytics` - Payment analytics
- ✅ `GET /api/dashboard/finance/transaction-monitoring` - Transaction monitoring
- ✅ `GET /api/dashboard/student/subject-performance` - Subject performance
- ✅ `GET /api/dashboard/student/terms-sessions` - Terms and sessions
- ✅ `GET /api/dashboard/school-switching` - School switching data
- ✅ `GET /api/dashboard/school/{schoolId}` - School dashboard
- ✅ `POST /api/dashboard/switch-school` - Switch school

### Students (`/api/students`)
- ✅ `GET /api/students` - Get students (paginated)
- ✅ `GET /api/students/{id}` - Get student by ID
- ✅ `POST /api/students` - Create student
- ✅ `PUT /api/students/{id}` - Update student
- ✅ `DELETE /api/students/{id}` - Delete student
- ✅ `GET /api/students/export/{format}` - Export students

### Teachers (`/api/teachers`)
- ✅ `GET /api/teachers` - Get teachers (paginated)
- ✅ `GET /api/teachers/{id}` - Get teacher by ID
- ✅ `POST /api/teachers` - Create teacher
- ✅ `PUT /api/teachers/{id}` - Update teacher
- ✅ `DELETE /api/teachers/{id}` - Delete teacher
- ✅ `GET /api/teachers/export/{format}` - Export teachers

### Classes (`/api/classes`)
- ✅ `GET /api/classes` - Get classes (paginated)
- ✅ `GET /api/classes/{id}` - Get class by ID
- ✅ `POST /api/classes` - Create class
- ✅ `PUT /api/classes/{id}` - Update class
- ✅ `DELETE /api/classes/{id}` - Delete class
- ✅ `GET /api/classes/export/{format}` - Export classes

### Subjects (`/api/subjects`)
- ✅ `GET /api/subjects` - Get subjects (paginated)
- ✅ `GET /api/subjects/{id}` - Get subject by ID
- ✅ `POST /api/subjects` - Create subject
- ✅ `PUT /api/subjects/{id}` - Update subject
- ✅ `DELETE /api/subjects/{id}` - Delete subject
- ✅ `GET /api/subjects/export/{format}` - Export subjects

### Assignments (`/api/assignments`)
- ✅ `GET /api/assignments` - Get assignments (paginated)
- ✅ `GET /api/assignments/{id}` - Get assignment by ID
- ✅ `POST /api/assignments` - Create assignment
- ✅ `POST /api/assignments/{id}/submit` - Submit assignment
- ✅ `POST /api/assignments/{id}/grade` - Grade assignment
- ✅ `GET /api/assignments/export/{format}` - Export assignments
- ✅ `GET /api/assignments/student` - Get student assignments
- ✅ `GET /api/assignments/teacher` - Get teacher assignments

### Examinations (`/api/examinations`)
- ✅ `GET /api/examinations` - Get examinations (paginated)
- ✅ `GET /api/examinations/{id}` - Get examination by ID
- ✅ `POST /api/examinations` - Create examination
- ✅ `PUT /api/examinations/{id}` - Update examination
- ✅ `POST /api/examinations/{id}/submit-for-approval` - Submit for approval
- ✅ `POST /api/examinations/{id}/approve` - Approve examination
- ✅ `POST /api/examinations/{id}/reject` - Reject examination
- ✅ `POST /api/examinations/{id}/start` - Start examination
- ✅ `POST /api/examinations/{id}/submit` - Submit examination
- ✅ `GET /api/examinations/student/available` - Get available examinations
- ✅ `GET /api/examinations/{id}/student` - Get examination for student
- ✅ `GET /api/examinations/stats/student` - Student examination stats
- ✅ `GET /api/examinations/stats/teacher` - Teacher examination stats
- ✅ `GET /api/examinations/stats/admin` - Admin examination stats
- ✅ `GET /api/examinations/stats/principal` - Principal examination stats
- ✅ `GET /api/examinations/stats/superadmin` - SuperAdmin examination stats
- ✅ `GET /api/examinations/stats/parent` - Parent examination stats

### Payments (`/api/payments`)
- ✅ `GET /api/payments` - Get payments (paginated)
- ✅ `GET /api/payments/{id}` - Get payment by ID
- ✅ `POST /api/payments` - Create payment
- ✅ `POST /api/payments/{id}/process` - Process payment
- ✅ `POST /api/payments/{id}/process-gateway` - Process payment with gateway
- ✅ `POST /api/payments/gateway` - Process payment with gateway (alternative)
- ✅ `POST /api/payments/{id}/verify` - Verify payment
- ✅ `GET /api/payments/student/{studentId}/summary` - Student payment summary
- ✅ `POST /api/payments/student` - Create student payment
- ✅ `GET /api/payments/my-payments` - Get current student's payments
- ✅ `GET /api/payments/parent-payments` - Get parent's payments for their children
- ✅ `GET /api/payments/history` - Payment history
- ✅ `GET /api/payments/{id}/receipt` - Generate receipt
- ✅ `GET /api/payments/callback` - Payment callback from gateway
- ✅ `GET /api/payments/cancel` - Payment cancellation callback
- ✅ `GET /api/payments/export/{format}` - Export payments

### Courses (`/api/courses`)
- ✅ `GET /api/courses` - Get courses
- ✅ `POST /api/courses` - Create course
- ✅ `POST /api/courses/{courseId}/materials` - Upload course material
- ✅ `POST /api/courses/profile-picture` - Upload profile picture
- ✅ `GET /api/courses/files/{fileId}/download` - Download file
- ✅ `DELETE /api/courses/files/{fileId}` - Delete file
- ✅ `GET /api/courses/results/{studentId}/pdf` - Generate result PDF
- ✅ `GET /api/courses/results/{studentId}/excel` - Generate result Excel
- ✅ `GET /api/courses/results/class/{classId}/pdf` - Generate class result PDF
- ✅ `GET /api/courses/results/{studentId}/can-generate` - Check if result can be generated

### Notifications (`/api/notifications`)
- ✅ `GET /api/notifications` - Get notifications (paginated)
- ✅ `GET /api/notifications/user-notifications` - Get user notifications
- ✅ `GET /api/notifications/{id}` - Get notification by ID
- ✅ `POST /api/notifications/mark-as-read/{id}` - Mark as read
- ✅ `POST /api/notifications/mark-as-read` - Mark as read (with body)
- ✅ `POST /api/notifications/mark-all-as-read` - Mark all as read
- ✅ `GET /api/notifications/unread-count` - Get unread count
- ✅ `POST /api/notifications/notify-student-onboarding` - Notify student onboarding
- ✅ `POST /api/notifications/notify-teacher-onboarding` - Notify teacher onboarding

### Session & Terms (`/api/sessionterm`)
- ✅ `GET /api/sessionterm/sessions` - Get sessions (paginated)
- ✅ `POST /api/sessionterm/sessions` - Create session
- ✅ `POST /api/sessionterm/sessions/{sessionId}/set-current` - Set current session
- ✅ `POST /api/sessionterm/terms` - Create term
- ✅ `POST /api/sessionterm/sessions/{sessionId}/terms` - Create term for session
- ✅ `POST /api/sessionterm/terms/{termId}/set-current` - Set current term
- ✅ `GET /api/sessionterm/sessions/export/excel` - Export sessions
- ✅ `GET /api/sessionterm/export/pdf` - Export sessions PDF

### Reports (`/api/reports`)
- ✅ `GET /api/reports/teacher/students-results` - Teacher students results
- ✅ `GET /api/reports/teacher/students-results/export` - Export teacher results
- ✅ `GET /api/reports/principal/students-performance` - Principal students performance
- ✅ `GET /api/reports/principal/students-performance/export` - Export principal performance
- ✅ `GET /api/reports/principal/students-payments` - Principal students payments
- ✅ `GET /api/reports/principal/students-payments/export` - Export principal payments
- ✅ `GET /api/reports/principal/teachers` - Principal teachers report
- ✅ `GET /api/reports/principal/classes` - Get principal classes
- ✅ `GET /api/reports/principal/class-performance/{classId}` - Class performance
- ✅ `GET /api/reports/principal/class-performance/{classId}/export` - Export class performance

### School Applications (`/api/schoolapplications`)
- ✅ `GET /api/schoolapplications` - Get applications
- ✅ `GET /api/schoolapplications/{id}` - Get application by ID
- ✅ `POST /api/schoolapplications` - Create application
- ✅ `POST /api/schoolapplications/{applicationId}/submit` - Submit application
- ✅ `POST /api/schoolapplications/{applicationId}/approve` - Approve application
- ✅ `POST /api/schoolapplications/{applicationId}/reject` - Reject application

### Tenants (`/api/tenants`)
- ✅ `GET /api/tenants` - Get tenants (paginated)
- ✅ `GET /api/tenants/{id}` - Get tenant by ID
- ✅ `POST /api/tenants` - Create tenant
- ✅ `PUT /api/tenants/{id}` - Update tenant
- ✅ `DELETE /api/tenants/{id}` - Delete tenant

### Schools (`/api/schools`)
- ✅ `GET /api/schools` - Get schools (paginated) or current school
- ✅ `GET /api/schools/{id}` - Get school by ID
- ✅ `PUT /api/schools/{id}` - Update school
- ✅ `GET /api/schools/{schoolId}/view` - View school details (SuperAdmin)
- ✅ `POST /api/schools/upload-logo` - Upload school logo

### Admins (`/api/admins`)
- ✅ `GET /api/admins` - Get admins (paginated)
- ✅ `POST /api/admins` - Create admin

### SuperAdmins (`/api/superadmins`)
- ✅ `GET /api/superadmins` - Get super admins (paginated)

### Books (`/api/books`)
- ✅ `GET /api/books` - Get books (paginated)
- ✅ `GET /api/books/{id}` - Get book by ID
- ✅ `POST /api/books` - Create book
- ✅ `PUT /api/books/{id}` - Update book
- ✅ `DELETE /api/books/{id}` - Delete book

### Common (`/api/common`)
- ✅ `GET /api/common/students` - Get students dropdown
- ✅ `GET /api/common/teachers` - Get teachers dropdown
- ✅ `GET /api/common/schools` - Get schools dropdown
- ✅ `GET /api/common/classes` - Get classes dropdown
- ✅ `GET /api/common/subjects` - Get subjects dropdown
- ✅ `GET /api/common/assignments` - Get assignments dropdown
- ✅ `GET /api/common/examinations` - Get examinations dropdown

### User Management (`/api/usermanagement`)
- ✅ `POST /api/usermanagement/students` - Create student
- ✅ `POST /api/usermanagement/teachers` - Create teacher
- ✅ `POST /api/usermanagement/parents` - Create parent
- ✅ `GET /api/usermanagement/tenants/{tenantId}/schools` - Get schools by tenant
- ✅ `GET /api/usermanagement/schools/{schoolId}/classes` - Get classes by school
- ✅ `GET /api/usermanagement/schools/{schoolId}/parents` - Get parents by school
- ✅ `GET /api/usermanagement/schools/{schoolId}/students` - Get students by school

### Setup (`/api/setup`)
- ✅ `POST /api/setup/create-super-admin` - Create super admin
- ✅ `GET /api/setup/check-super-admin` - Check super admin

## Service Layer

All endpoints are accessible through the centralized service layer in `src/services/apiServices.js`:

- `authService` - Authentication endpoints
- `dashboardService` - Dashboard endpoints
- `studentsService` - Student management
- `teachersService` - Teacher management
- `classesService` - Class management
- `subjectsService` - Subject management
- `assignmentsService` - Assignment management
- `examinationsService` - Examination management
- `paymentsService` - Payment management
- `coursesService` - Course management
- `notificationsService` - Notification management
- `sessionTermService` - Session and term management
- `reportsService` - Report generation
- `schoolApplicationsService` - School application management
- `tenantsService` - Tenant management
- `schoolsService` - School management
- `adminsService` - Admin management
- `superAdminsService` - SuperAdmin management
- `booksService` - Book management
- `commonService` - Common dropdown data
- `userManagementService` - User management
- `setupService` - Setup operations

## Notes

- All services use the centralized `api` instance from `src/services/api.js`
- Authentication tokens are automatically injected via axios interceptors
- Error handling is centralized in the axios response interceptor
- File downloads (blob responses) are properly handled
- All endpoints support pagination where applicable

