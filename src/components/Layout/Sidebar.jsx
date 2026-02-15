import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  GraduationCap,
  ClipboardList,
  School,
  Building2,
  Menu,
  X,
  CalendarDays,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react'
import logo from '../../assets/logo2.jpg'

const DASHBOARD_ROUTES = {
  student: '/dashboard/student',
  teacher: '/dashboard/teacher',
  admin: '/dashboard/admin',
  principal: '/dashboard/principal',
  superadmin: '/dashboard/superadmin',
  parent: '/dashboard/parent',
}

const Sidebar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const roleLower = String(user?.role ?? '').toLowerCase()
  const hasRole = (roles) => Array.isArray(roles) && roles.some((r) => String(r).toLowerCase() === roleLower)
  const dashboardPath = DASHBOARD_ROUTES[roleLower] || '/dashboard/student'

  const isActive = useCallback((path) => {
    if (path === '/dashboard') {
      return location.pathname.startsWith('/dashboard')
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  const handleNavigate = useCallback((path) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }, [navigate])

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: `/dashboard/${String(user?.role ?? '').toLowerCase()}`,
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'SuperAdmin', 'Parent'],
    },
    {
      title: 'Students',
      icon: Users,
      path: '/students',
      roles: ['Admin', 'Principal', 'Teacher'],
    },
    {
      title: 'Teachers',
      icon: GraduationCap,
      path: '/teachers',
      roles: ['Admin', 'Principal'],
    },
    {
      title: 'Parents',
      icon: Users,
      path: '/parents',
      roles: ['Admin', 'Principal'],
    },
    {
      title: 'Admins',
      icon: Users,
      path: '/admins',
      roles: ['Admin'],
    },
    {
      title: 'Super Admins',
      icon: Users,
      path: '/superadmins',
      roles: ['SuperAdmin'],
    },
    {
      title: 'Classes',
      icon: School,
      path: '/classes',
      roles: ['Admin', 'Principal'],
    },
    {
      title: 'Subjects',
      icon: BookOpen,
      path: '/subjects',
      roles: ['Admin', 'Principal', 'Student'],
    },
    {
      title: 'Assignments',
      icon: FileText,
      path: '/assignments',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'Parent'],
    },
    {
      title: 'Grade Submissions',
      icon: FileText,
      path: '/assignments/submissions',
      roles: ['Teacher'],
    },
    {
      title: 'Mark Attendance',
      icon: ClipboardCheck,
      path: '/attendance/mark',
      roles: ['Teacher', 'Admin', 'Principal'],
    },
    {
      title: 'Examinations',
      icon: ClipboardList,
      path: '/examinations',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'Parent'],
    },
    {
      title: 'CA Tests',
      icon: FileCheck,
      path: '/catests',
      roles: ['Teacher', 'Admin', 'Principal'],
    },
    {
      title: 'Courses',
      icon: BookOpen,
      path: '/courses',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'Parent'],
    },
    {
      title: 'Books',
      icon: BookOpen,
      path: '/books',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'Parent'],
    },
    {
      title: 'Class Timetable',
      icon: CalendarDays,
      path: '/academic/class-timetable',
      roles: ['Student', 'Teacher', 'Admin', 'Principal'],
    },
    {
      title: 'School Calendar',
      icon: CalendarDays,
      path: '/school-calendar',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'Parent'],
    },
    {
      title: 'Fees and Payment',
      icon: CreditCard,
      path: '/payments',
      activePaths: ['/payments', '/settings/fee-structures'],
      roles: ['Student', 'Parent', 'Admin', 'Principal'],
      submenu: [
        { title: 'Payments', path: '/payments', roles: ['Student', 'Parent', 'Admin', 'Principal'] },
        { title: 'School Fees', path: '/settings/fee-structures', roles: ['Admin', 'Principal'] },
      ],
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/reports',
      roles: ['Student', 'Teacher', 'Principal', 'Admin', 'Parent'],
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: '/notifications',
      roles: ['Student', 'Teacher', 'Admin', 'Principal', 'SuperAdmin', 'Parent'],
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['Admin', 'Principal', 'SuperAdmin', 'Student', 'Teacher'],
      submenu: [
        { title: 'Session & Term', path: '/settings/session-term', roles: ['SuperAdmin', 'Admin', 'Principal'] },
        { title: 'School', path: '/settings/school', roles: ['Admin', 'SuperAdmin'] },
        { title: 'Subscription', path: '/settings/subscription', roles: ['Admin', 'Principal'] },
        { title: 'Manage Principals', path: '/principals', roles: ['Admin', 'Principal'] },
        { title: 'Exam Timetable', path: '/academic/examination-timetable', roles: ['Student', 'Teacher', 'Admin', 'Principal'] },
        { title: 'Class Timetable', path: '/academic/class-timetable', roles: ['Student', 'Teacher', 'Admin', 'Principal'] },
        { title: 'Tenants', path: '/settings/tenants', roles: ['SuperAdmin'] },
        { title: 'School Applications', path: '/settings/school-applications', roles: ['SuperAdmin', 'Admin'] },
        { title: 'Subscription Payments', path: '/settings/subscription-payments', roles: ['SuperAdmin'] },
      ],
    },
  ]

  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => hasRole(item.roles)),
    [roleLower]
  )

  const SidebarContent = () => (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: '250px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div 
        style={{ padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        onClick={() => navigate(dashboardPath)}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        <img 
          src={logo} 
          alt="Zentrium Logo" 
          style={{ 
            height: '36px', 
            width: 'auto',
            objectFit: 'contain'
          }} 
        />
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-yellow)' }}>
          Zentrium
        </span>
      </div>
      {filteredMenuItems.map((item) => {
        const Icon = item.icon
        const active = item.activePaths
          ? item.activePaths.some((p) => location.pathname.startsWith(p))
          : isActive(item.path)

        return (
          <div key={item.path}>
            <button
              type="button"
              onClick={() => handleNavigate(item.path)}
              aria-current={active ? 'page' : undefined}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: active ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                borderLeft: active ? '3px solid var(--primary-yellow)' : '3px solid transparent',
                color: active ? 'var(--primary-yellow)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: active ? '600' : '400',
                transition: 'all 0.3s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)'
                  e.target.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </button>
            {item.submenu && active && (
              <div style={{ paddingLeft: '2rem', marginTop: '0.5rem' }}>
                {item.submenu
                  .filter((sub) => hasRole(sub.roles))
                  .map((sub) => (
                    <button
                      type="button"
                      key={sub.path}
                      onClick={() => handleNavigate(sub.path)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: location.pathname === sub.path ? 'var(--bg-tertiary)' : 'transparent',
                        border: 'none',
                        color: location.pathname === sub.path ? 'var(--primary-yellow)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        borderRadius: '0.25rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {sub.title}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <div className="desktop-sidebar" style={{ display: 'block' }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '250px',
            height: '100vh',
            backgroundColor: 'var(--bg-secondary)',
            zIndex: 999,
            boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
          }}
          className="mobile-sidebar"
        >
          <SidebarContent />
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-sidebar {
            display: none !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}

export default Sidebar

