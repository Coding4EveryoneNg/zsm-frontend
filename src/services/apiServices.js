import api from './api'

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  generateOtp: (email) => api.post('/auth/generate-otp', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Dashboard Services
export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
  getStudentDashboard: () => api.get('/dashboard/student'),
  getTeacherDashboard: () => api.get('/dashboard/teacher'),
  getPrincipalDashboard: () => api.get('/dashboard/principal'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getSuperAdminDashboard: (params) => api.get('/dashboard/superadmin', { params }),
  getSuperAdminGlobalStatistics: () => api.get('/dashboard/superadmin/statistics'),
  getParentDashboard: () => api.get('/dashboard/parent'),
  getFinancialDashboard: () => api.get('/dashboard/finance'),
  getGlobalFinancialSummary: () => api.get('/dashboard/finance/global'),
  getPaymentAnalytics: (params) => api.get('/dashboard/finance/payment-analytics', { params }),
  getTransactionMonitoring: (params) => api.get('/dashboard/finance/transaction-monitoring', { params }),
  getSubjectPerformance: (params) => api.get('/dashboard/student/subject-performance', { params }),
  getParentStudentSubjectPerformance: (studentId, params) => api.get(`/dashboard/parent/student/${studentId}/subject-performance`, { params }),
  getTermsSessions: () => api.get('/dashboard/student/terms-sessions'),
  getSchoolSwitchingData: () => api.get('/dashboard/school-switching'),
  getSchoolDashboard: (schoolId) => api.get(`/dashboard/school/${schoolId}`),
  switchSchool: (schoolId) => api.post('/dashboard/switch-school', { schoolId }),
}

// Students Services
export const studentsService = {
  getStudents: (params) => api.get('/students', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  exportStudents: (format, params) => api.get(`/students/export/${format}`, { params, responseType: 'blob' }),
}

// Teachers Services
export const teachersService = {
  getTeachers: (params) => api.get('/teachers', { params }),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  createTeacher: (data) => api.post('/teachers', data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
  exportTeachers: (format, params) => api.get(`/teachers/export/${format}`, { params, responseType: 'blob' }),
}

// Classes Services
export const classesService = {
  getClasses: (params) => api.get('/classes', { params }),
  getClass: (id) => api.get(`/classes/${id}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  exportClasses: (format, params) => api.get(`/classes/export/${format}`, { params, responseType: 'blob' }),
}

// Subjects Services
export const subjectsService = {
  getSubjects: (params) => api.get('/subjects', { params }),
  getSubject: (id) => api.get(`/subjects/${id}`),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  exportSubjects: (format, params) => api.get(`/subjects/export/${format}`, { params, responseType: 'blob' }),
}

// Assignments Services
export const assignmentsService = {
  getAssignments: (params) => api.get('/assignments', { params }),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  createAssignment: (data) => api.post('/assignments', data),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  submitAssignment: (id, data) => api.post(`/assignments/${id}/submit`, data),
  gradeAssignment: (submissionId, data) => api.post(`/assignments/submissions/${submissionId}/grade`, data),
  getTeacherSubmissions: (params) => api.get('/assignments/teacher/submissions', { params }),
  exportAssignments: (format, params) => api.get(`/assignments/export/${format}`, { params, responseType: 'blob' }),
  // Additional endpoints
  getStudentAssignments: (params) => api.get('/assignments/student', { params }),
  getTeacherAssignments: (params) => api.get('/assignments/teacher', { params }),
  // Parent-specific endpoints
  getParentAssignments: (params) => api.get('/assignments/parent', { params }),
  getParentAssignment: (id, params) => api.get(`/assignments/parent/${id}`, { params }),
}

// Examinations Services
export const examinationsService = {
  getExaminations: (params) => api.get('/examinations', { params }),
  getExamination: (id) => api.get(`/examinations/${id}`),
  createExamination: (data) => api.post('/examinations', data),
  updateExamination: (id, data) => api.put(`/examinations/${id}`, data),
  deleteExamination: (id) => api.delete(`/examinations/${id}`),
  submitForApproval: (id) => api.post(`/examinations/${id}/submit-for-approval`),
  approveExamination: (id) => api.post(`/examinations/${id}/approve`),
  rejectExamination: (id, reason) => api.post(`/examinations/${id}/reject`, { reason }),
  startExamination: (id) => api.post(`/examinations/${id}/start`),
  submitExamination: (id, data) => api.post(`/examinations/${id}/submit`, data),
  getAvailableExaminations: () => api.get('/examinations/student/available'),
  getExaminationForStudent: (id) => api.get(`/examinations/${id}/student`),
  // Stats endpoints
  getStudentExaminationStats: () => api.get('/examinations/stats/student'),
  getTeacherExaminationStats: () => api.get('/examinations/stats/teacher'),
  getAdminExaminationStats: () => api.get('/examinations/stats/admin'),
  getPrincipalExaminationStats: () => api.get('/examinations/stats/principal'),
  getSuperAdminExaminationStats: () => api.get('/examinations/stats/superadmin'),
  getParentExaminationStats: () => api.get('/examinations/stats/parent'),
  // Parent-specific endpoints
  getParentExaminations: (params) => api.get('/examinations/parent', { params }),
}

// Payments Services
export const paymentsService = {
  getPayments: (params) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  processPayment: (id, data) => api.post(`/payments/${id}/process`, data),
  processStudentPayment: (id, data) => api.post(`/payments/${id}/process-payment`, data),
  processPaymentWithGateway: (id, data) => api.post(`/payments/${id}/process-gateway`, data),
  processPaymentGateway: (data) => api.post('/payments/gateway', data),
  verifyPayment: (id, data) => api.post(`/payments/${id}/verify`, data),
  getStudentPaymentSummary: (studentId) => api.get(`/payments/student/${studentId}/summary`),
  createStudentPayment: (data) => api.post('/payments/student', data),
  getMyPayments: (params) => api.get('/payments/my-payments', { params }),
  getParentPayments: (params) => api.get('/payments/parent-payments', { params }),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  generateReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
  paymentCallback: (params) => api.get('/payments/callback', { params }),
  paymentCancel: (params) => api.get('/payments/cancel', { params }),
  exportPayments: (format, params) => api.get(`/payments/export/${format}`, { params, responseType: 'blob' }),
}

// Courses Services
export const coursesService = {
  getCourses: (params) => api.get('/courses', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  getParentCourses: (params) => api.get('/courses/parent', { params }),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  uploadCourseMaterial: (courseId, formData) => api.post(`/courses/${courseId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadProfilePicture: (formData) => api.post('/courses/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadFile: (fileId) => api.get(`/courses/files/${fileId}/download`, { responseType: 'blob' }),
  deleteFile: (fileId) => api.delete(`/courses/files/${fileId}`),
  reorderMaterials: (data) => api.put('/courses/materials/reorder', data),
  generateStudentResultPDF: (studentId, params) => api.get(`/courses/results/${studentId}/pdf`, { params, responseType: 'blob' }),
  generateStudentResultExcel: (studentId, params) => api.get(`/courses/results/${studentId}/excel`, { params, responseType: 'blob' }),
  generateClassResultPDF: (classId, params) => api.get(`/courses/results/class/${classId}/pdf`, { params, responseType: 'blob' }),
  canGenerateResult: (studentId, params) => api.get(`/courses/results/${studentId}/can-generate`, { params }),
}

// Notifications Services
export const notificationsService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUserNotifications: (params) => api.get('/notifications/user-notifications', { params }),
  getNotification: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.post(`/notifications/mark-as-read/${id}`),
  markAsReadWithBody: (data) => api.post('/notifications/mark-as-read', data),
  markAllAsRead: () => api.post('/notifications/mark-all-as-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  notifyStudentOnboarding: (data) => api.post('/notifications/notify-student-onboarding', data),
  notifyTeacherOnboarding: (data) => api.post('/notifications/notify-teacher-onboarding', data),
}

// Session & Term Services
export const sessionTermService = {
  getSessions: (params) => api.get('/sessionterm/sessions', { params }),
  createSession: (data) => api.post('/sessionterm/sessions', data),
  setCurrentSession: (sessionId) => api.post(`/sessionterm/sessions/${sessionId}/set-current`),
  createTerm: (data) => api.post('/sessionterm/terms', data),
  createTermForSession: (sessionId, data) => api.post(`/sessionterm/sessions/${sessionId}/terms`, data),
  setCurrentTerm: (termId) => api.post(`/sessionterm/terms/${termId}/set-current`),
  exportSessions: (params) => api.get('/sessionterm/sessions/export/excel', { params, responseType: 'blob' }),
  exportSessionsPDF: (params) => api.get('/sessionterm/export/pdf', { params, responseType: 'blob' }),
}

// School Applications Services
export const schoolApplicationsService = {
  getApplications: (params) => api.get('/schoolapplications', { params }),
  getApplication: (id) => api.get(`/schoolapplications/${id}`),
  createApplication: (data) => api.post('/schoolapplications', data),
  submitApplication: (applicationId) => api.post(`/schoolapplications/${applicationId}/submit`),
  approveApplication: (applicationId, notes) => api.post(`/schoolapplications/${applicationId}/approve`, notes ? { notes } : {}),
  rejectApplication: (applicationId, reason) => api.post(`/schoolapplications/${applicationId}/reject`, { rejectionReason: reason }),
}

// Tenants Services (SuperAdmin only)
export const tenantsService = {
  getTenants: (params) => api.get('/tenants', { params }),
  getTenant: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => api.post('/tenants', data),
  updateTenant: (id, data) => api.put(`/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),
}

// Schools Services
export const schoolsService = {
  getSchools: (params) => api.get('/schools', { params }),
  getSchool: (id) => api.get(`/schools/${id}`),
  getCurrentSchool: () => api.get('/schools'),
  updateSchool: (id, data) => api.put(`/schools/${id}`, data),
  viewSchool: (schoolId) => api.get(`/schools/${schoolId}/view`),
  uploadLogo: (formData) => api.post('/schools/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Admins Services
export const adminsService = {
  getAdmins: (params) => api.get('/admins', { params }),
  getAdmin: (id) => api.get(`/admins/${id}`),
  createAdmin: (data) => api.post('/admins', data),
}

// SuperAdmins Services
export const superAdminsService = {
  getSuperAdmins: (params) => api.get('/superadmins', { params }),
  getSuperAdmin: (id) => api.get(`/superadmins/${id}`),
  inviteSuperAdmin: (data) => api.post('/superadmins/invite', data),
  toggleStatus: (id) => api.post(`/superadmins/${id}/toggle-status`),
  resetPassword: (id) => api.post(`/superadmins/${id}/reset-password`),
}

// Books Services
export const booksService = {
  getBooks: (params) => api.get('/books', { params }),
  getStudentBooks: (params) => api.get('/books/student', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
  /** Assign a book to a class (Admin/Principal). A book can be in multiple classes; assignment is optional. */
  assignBookToClass: (data) => api.post('/books/assign-to-class', data),
  /** Remove a book from a class. A book may have zero or more class assignments. */
  removeBookFromClass: (bookId, classId) => api.delete('/books/remove-from-class', { params: { bookId, classId } }),
  /** Get classes a book is assigned to (Admin/Principal). */
  getBookClasses: (bookId) => api.get(`/books/${bookId}/classes`),
  // Parent-specific endpoints
  getParentBooks: (params) => api.get('/books/parent', { params }),
}

// Reports Services
export const reportsService = {
  // Teacher Reports
  getTeacherStudentsResults: (params) => api.get('/reports/teacher/students-results', { params }),
  exportTeacherStudentsResults: (params) => api.get('/reports/teacher/students-results/export', { params, responseType: 'blob' }),
  
  // Principal Reports
  getPrincipalStudentsPerformance: (params) => api.get('/reports/principal/students-performance', { params }),
  exportPrincipalStudentsPerformance: (params) => api.get('/reports/principal/students-performance/export', { params, responseType: 'blob' }),
  getPrincipalStudentsPayments: (params) => api.get('/reports/principal/students-payments', { params }),
  exportPrincipalStudentsPayments: (params) => api.get('/reports/principal/students-payments/export', { params, responseType: 'blob' }),
  getPrincipalTeachers: () => api.get('/reports/principal/teachers'),
  getPrincipalClasses: () => api.get('/reports/principal/classes'),
  getPrincipalClassPerformance: (classId, params) => api.get(`/reports/principal/class-performance/${classId}`, { params }),
  exportPrincipalClassPerformance: (classId, params) => api.get(`/reports/principal/class-performance/${classId}/export`, { params, responseType: 'blob' }),
}

// Setup Services (Public)
export const setupService = {
  createSuperAdmin: (data) => api.post('/setup/create-super-admin', data),
  checkSuperAdmin: () => api.get('/setup/check-super-admin'),
}

// Common Services
export const commonService = {
  getStudentsDropdown: (params) => api.get('/common/students', { params }),
  getTeachersDropdown: (params) => api.get('/common/teachers', { params }),
  getSchoolsDropdown: () => api.get('/common/schools'),
  getClassesDropdown: (params) => api.get('/common/classes', { params }),
  getSubjectsDropdown: (params) => api.get('/common/subjects', { params }),
  getAssignmentsDropdown: (params) => api.get('/common/assignments', { params }),
  getExaminationsDropdown: (params) => api.get('/common/examinations', { params }),
  getTermsDropdown: (params) => api.get('/common/terms', { params }),
  getSessionsDropdown: () => api.get('/common/sessions'),
}

// User Management Services
export const userManagementService = {
  getParentsBySchool: (schoolId) => api.get(`/userManagement/schools/${schoolId}/parents`),
  getClassesBySchool: (schoolId) => api.get(`/userManagement/schools/${schoolId}/classes`),
  createParent: (data) => api.post('/userManagement/parents', data),
  createPrincipal: (data) => api.post('/userManagement/principals', data),
}

