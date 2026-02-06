import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from 'react-query'
import { notificationsService } from '../../services/apiServices'
import { Users, BookOpen, CreditCard, BarChart3, Shield, Rocket, CheckCircle, ArrowRight, School, UserCheck, Award, TrendingUp, Clock, Globe, Sun, Moon, GraduationCap, Bell, LogOut, LayoutDashboard } from 'lucide-react'
import { safeStrLower } from '../../utils/safeUtils'
import './Landing.css'
import logo from '../../assets/logo2.jpg'

const Landing = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  // Safely get theme with fallback
  let theme, toggleTheme, isDark
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
    toggleTheme = themeContext.toggleTheme
    isDark = themeContext.isDark
  } catch (error) {
    // Fallback if ThemeProvider is not available
    console.warn('ThemeContext not available, using default theme', error)
    theme = 'light'
    isDark = false
    toggleTheme = () => {
      console.warn('Theme toggle not available')
    }
  }

  // Unread notifications count (only when logged in)
  const { data: unreadData } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: !!isAuthenticated,
  })
  const unreadCount = unreadData?.data?.unreadCount ?? 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    // Remove authenticated class for light theme on landing page
    document.body.classList.remove('authenticated')
    // Set background based on theme
    if (isDark) {
      document.body.style.backgroundColor = '#0b0e11'
      document.body.style.color = '#ffffff'
    } else {
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#0b0e11'
    }
    return () => {
      // Cleanup if needed
    }
  }, [isDark])

  const navBg = isDark ? 'rgba(24, 26, 32, 0.8)' : 'rgba(255, 255, 255, 0.8)'
  const navBorder = isDark ? '#2b3139' : '#e5e7eb'
  const textColor = isDark ? '#ffffff' : '#0b0e11'
  const textSecondary = isDark ? '#b7bdc6' : '#474d57'
  const pageBg = isDark 
    ? 'linear-gradient(to bottom right, #0b0e11, #181a20, #1e2026)' 
    : 'linear-gradient(to bottom right, #ffffff, #f5f5f5, #fafafa)'

  // Ensure we have valid values with fallbacks
  const safePageBg = pageBg || (isDark ? '#0b0e11' : '#ffffff')
  const safeTextColor = textColor || (isDark ? '#ffffff' : '#0b0e11')
  const safeTextSecondary = textSecondary || (isDark ? '#b7bdc6' : '#474d57')
  const safeNavBg = navBg || (isDark ? 'rgba(24, 26, 32, 0.8)' : 'rgba(255, 255, 255, 0.8)')
  const safeNavBorder = navBorder || (isDark ? '#2b3139' : '#e5e7eb')

  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: safePageBg, transition: 'background 0.3s ease', color: safeTextColor }}>
      {/* Navigation */}
      <nav className="landing-nav" style={{ background: safeNavBg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${safeNavBorder}`, position: 'sticky', top: 0, zIndex: 50, transition: 'all 0.3s ease' }}>
        <div className="landing-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={logo} 
                alt="Zentrium Logo" 
                style={{ 
                  height: '36px', 
                  width: 'auto',
                  objectFit: 'contain'
                }} 
              />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f0b90b' }}>
                Zentrium
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: isDark ? '#1e2026' : '#f5f5f5',
                  border: `1px solid ${navBorder}`,
                  color: textColor,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0b90b'
                  e.target.style.color = '#0b0e11'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5'
                  e.target.style.color = safeTextColor
                }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              {isAuthenticated ? (
                <>
                  <Link
                    to={`/dashboard/${safeStrLower(user?.role) || 'student'}`}
                    style={{ color: safeTextSecondary, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f0b90b'; e.currentTarget.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = safeTextSecondary; e.currentTarget.style.backgroundColor = 'transparent' }}
                    title="Go to Dashboard"
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </Link>
                  <Link
                    to="/notifications"
                    style={{ position: 'relative', color: safeTextSecondary, padding: '0.5rem', borderRadius: '0.5rem', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f0b90b'; e.currentTarget.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = safeTextSecondary; e.currentTarget.style.backgroundColor = 'transparent' }}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: `1px solid ${navBorder}`,
                      color: safeTextSecondary,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      font: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f0b90b'; e.currentTarget.style.borderColor = '#f0b90b'; e.currentTarget.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = safeTextSecondary; e.currentTarget.style.borderColor = navBorder; e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    style={{ color: safeTextSecondary, padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.target.style.color = '#f0b90b'; e.target.style.backgroundColor = isDark ? '#1e2026' : '#f5f5f5' }}
                    onMouseLeave={(e) => { e.target.style.color = safeTextSecondary; e.target.style.backgroundColor = 'transparent' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/school-onboarding"
                    style={{ background: '#f0b90b', color: '#0b0e11', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 15px -3px rgba(240, 185, 11, 0.3)'; e.target.style.background = '#f5c842' }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f0b90b' }}
                  >
                    <Rocket size={16} />
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{ padding: '5rem 0 8rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(to right, rgba(240, 185, 11, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(240, 185, 11, 0.1) 1px, transparent 1px)`, backgroundSize: '50px 50px', opacity: 0.05 }}></div>
        <div className="landing-container" style={{ position: 'relative' }}>
          <div className="landing-text-center">
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '9999px', background: isDark ? 'rgba(240, 185, 11, 0.1)' : '#fef3c7', color: '#f0b90b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '2rem' }}>
              <Rocket size={16} style={{ marginRight: '0.5rem' }} />
              Transform Your School Management
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, color: safeTextColor, marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Empowering Education with
              <span style={{ display: 'block', color: '#f0b90b' }}>
                Modern Technology
              </span>
            </h1>
            <p style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', color: safeTextSecondary, marginBottom: '2.5rem', maxWidth: '768px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
              Streamline your school operations with our comprehensive platform. 
              Manage students, teachers, assignments, payments, and more—all in one place.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <Link
                to="/school-onboarding"
                style={{ background: '#f0b90b', color: '#0b0e11', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 20px 25px -5px rgba(240, 185, 11, 0.3)'; e.target.style.background = '#f5c842' }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f0b90b' }}
              >
                <Rocket size={20} />
                Get Started
              </Link>
              <Link
                to="/login"
                style={{ background: isDark ? '#1e2026' : 'white', color: safeTextColor, padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 600, textDecoration: 'none', border: `2px solid ${safeNavBorder}`, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#f0b90b'; e.target.style.color = '#f0b90b' }}
                onMouseLeave={(e) => { e.target.style.borderColor = safeNavBorder; e.target.style.color = safeTextColor }}
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', maxWidth: '900px', width: '100%' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #f0b90b, #f5c842)', borderRadius: '1.5rem', filter: 'blur(40px)', opacity: 0.2, transform: 'rotate(6deg)' }}></div>
              <div style={{ position: 'relative', background: 'var(--bg-tertiary)', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '2rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&h=500&fit=crop&q=80" 
                  alt="Modern School Management" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    borderRadius: '0.75rem',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)'
                  }} 
                  onError={(e) => {
                    // Fallback to gradient pattern if image fails to load
                    e.target.style.display = 'none'
                    e.target.parentElement.style.background = 'linear-gradient(135deg, var(--primary-yellow) 0%, var(--primary-yellow-light) 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" style={{ padding: '5rem 0', background: 'var(--bg-secondary)' }}>
        <div className="landing-container">
          <div className="landing-text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Key Features</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '672px', margin: '0 auto' }}>
              Everything you need to manage your educational institution efficiently
            </p>
          </div>

          <div className="landing-grid landing-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              {
                icon: <Users size={32} />,
                title: 'Multi-Tenant Architecture',
                description: 'Each school gets its own dedicated space with custom branding, colors, and domain. Perfect for managing multiple institutions.',
                gradient: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop&q=80'
              },
              {
                icon: <BookOpen size={32} />,
                title: 'Assignment Management',
                description: 'Teachers can create assignments with automatic grading. Students can submit work and track their progress seamlessly.',
                gradient: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop&q=80'
              },
              {
                icon: <CreditCard size={32} />,
                title: 'Payment Processing',
                description: 'Integrated payment system for school fees and other charges. Parents can make secure payments online.',
                gradient: 'linear-gradient(to right, #10b981, #059669)',
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80'
              },
              {
                icon: <BarChart3 size={32} />,
                title: 'Analytics & Reports',
                description: 'Comprehensive reporting and analytics to track student performance, attendance, and school operations.',
                gradient: 'linear-gradient(to right, #f97316, #ef4444)',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&q=80'
              },
              {
                icon: <Globe size={32} />,
                title: 'Mobile Responsive',
                description: 'Fully responsive design that works perfectly on all devices - desktop, tablet, and mobile.',
                gradient: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&q=80'
              },
              {
                icon: <Shield size={32} />,
                title: 'Secure & Scalable',
                description: 'Built with security in mind using modern technologies and scalable architecture for growing institutions.',
                gradient: 'linear-gradient(to right, #14b8a6, #3b82f6)',
                image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop&q=80'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="landing-card"
                style={{ 
                  position: 'relative', 
                  transition: 'all 0.3s',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  padding: 0,
                  borderRadius: '1rem',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = 'translateY(-8px)'; 
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary-yellow)';
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = 'translateY(0)'; 
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = feature.gradient
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: '1rem', 
                    left: '1rem',
                    display: 'inline-flex', 
                    padding: '0.75rem', 
                    borderRadius: '0.75rem', 
                    background: feature.gradient, 
                    color: 'white'
                  }}>
                    {feature.icon}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(to right, #f0b90b, #f5c842)' }}>
        <div className="landing-container">
          <div className="landing-grid landing-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { number: '50+', label: 'Schools', icon: <School className="h-6 w-6" /> },
              { number: '10,000+', label: 'Students', icon: <Users className="h-6 w-6" /> },
              { number: '1,500+', label: 'Teachers', icon: <UserCheck className="h-6 w-6" /> },
              { number: '99.9%', label: 'Uptime', icon: <TrendingUp className="h-6 w-6" /> }
            ].map((stat, index) => (
              <div key={index} className="landing-text-center">
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', background: 'rgba(11, 14, 17, 0.2)', borderRadius: '9999px', marginBottom: '1rem', color: '#0b0e11' }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0b0e11', marginBottom: '0.5rem' }}>{stat.number}</div>
                <div style={{ color: isDark ? '#0b0e11' : '#0b0e11', fontSize: '1.125rem', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="landing-section" style={{ padding: '5rem 0', background: 'var(--bg-secondary)' }}>
        <div className="landing-container">
          <div className="landing-text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Designed for Everyone</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '672px', margin: '0 auto' }}>
              A comprehensive platform that serves all stakeholders in education
            </p>
          </div>

          <div className="landing-grid landing-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {[
              {
                title: 'Students',
                icon: <GraduationCap size={24} />,
                gradient: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&h=300&fit=crop&q=80',
                features: [
                  'Access assignments and submit work',
                  'View grades and progress reports',
                  'Track academic performance',
                  'Communicate with teachers'
                ]
              },
              {
                title: 'Teachers',
                icon: <BookOpen size={24} />,
                gradient: 'linear-gradient(to right, #10b981, #059669)',
                image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=300&fit=crop&q=80',
                features: [
                  'Create and manage assignments',
                  'Automatic grading system',
                  'Track student progress',
                  'Generate reports and analytics'
                ]
              },
              {
                title: 'Principals & Admins',
                icon: <Award size={24} />,
                gradient: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&h=300&fit=crop&q=80',
                features: [
                  'School-wide management',
                  'User management and permissions',
                  'Custom branding and configuration',
                  'Comprehensive analytics'
                ]
              },
              {
                title: 'Parents',
                icon: <Users size={24} />,
                gradient: 'linear-gradient(to right, #f97316, #ef4444)',
                image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=300&fit=crop&q=80',
                features: [
                  'Monitor child\'s academic progress',
                  'Make fee payments online',
                  'Communicate with teachers',
                  'Access school announcements'
                ]
              }
            ].map((role, index) => (
              <div
                key={index}
                className="landing-card"
                style={{ 
                  transition: 'all 0.3s',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  padding: 0,
                  borderRadius: '1rem',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary-yellow)';
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img 
                    src={role.image} 
                    alt={role.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = role.gradient
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '1rem', 
                    left: '1rem',
                    display: 'inline-flex', 
                    alignItems: 'center',
                    padding: '0.75rem 1rem', 
                    borderRadius: '0.75rem', 
                    background: role.gradient, 
                    color: 'white'
                  }}>
                    {role.icon}
                    <h3 style={{ marginLeft: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>{role.title}</h3>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {role.features.map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <CheckCircle size={20} color="#10b981" style={{ marginRight: '0.75rem', marginTop: '0.125rem', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(to right, #f0b90b, #f5c842)' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#0b0e11', marginBottom: '1.5rem' }}>
            Ready to Transform Your School Management?
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#0b0e11', marginBottom: '2.5rem', opacity: 0.8 }}>
            Join thousands of educational institutions already using Zentrium to streamline their operations.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <Link
                to="/school-onboarding"
                style={{ background: '#0b0e11', color: '#f0b90b', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'; e.target.style.background = '#181a20' }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#0b0e11' }}
              >
                <Rocket size={20} />
                Get Started
              </Link>
            <Link
              to="/login"
              style={{ background: 'rgba(11, 14, 17, 0.2)', backdropFilter: 'blur(12px)', color: '#0b0e11', border: '2px solid rgba(11, 14, 17, 0.3)', padding: '1rem 2rem', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(11, 14, 17, 0.3)' }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(11, 14, 17, 0.2)' }}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{ background: isDark ? '#0b0e11' : '#181a20', color: isDark ? '#b7bdc6' : '#d1d5db', padding: '3rem 0' }}>
        <div className="landing-container">
          <div className="landing-grid landing-grid-4" style={{ marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <img 
                  src={logo} 
                  alt="Zentrium Logo" 
                  style={{ 
                    height: '24px', 
                    width: 'auto',
                    objectFit: 'contain'
                  }} 
                />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Zentrium</span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                Empowering educational institutions with modern, scalable, and efficient management solutions.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Features</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Pricing</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>About</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Blog</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Help Center</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Contact</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: isDark ? '#b7bdc6' : '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f0b90b'} onMouseLeave={(e) => e.target.style.color = isDark ? '#b7bdc6' : '#d1d5db'}>Privacy</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <p>&copy; {new Date().getFullYear()} Zentrium. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

