import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, School, Building2, FileCheck, Settings } from 'lucide-react'

const Settings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const settingActions = [
    {
      title: 'Session & Term',
      description: 'Create and manage academic sessions and terms. All school members are notified when you create or update them.',
      path: '/settings/session-term',
      icon: Calendar,
      roles: ['Admin', 'Principal'],
    },
    {
      title: 'School',
      description: 'Manage school details, settings, and configuration.',
      path: '/settings/school',
      icon: School,
      roles: ['Admin', 'SuperAdmin'],
    },
    {
      title: 'Tenants',
      description: 'Manage tenants (organizations) and their configuration.',
      path: '/settings/tenants',
      icon: Building2,
      roles: ['SuperAdmin'],
    },
    {
      title: 'School Applications',
      description: 'View and manage school registration applications.',
      path: '/settings/school-applications',
      icon: FileCheck,
      roles: ['SuperAdmin', 'Admin'],
    },
  ]

  const availableActions = settingActions.filter((action) =>
    action.roles.includes(user?.role)
  )

  if (availableActions.length === 0) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <Settings size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">Settings</p>
            <p className="empty-state-subtext">
              Settings are available to Admin, Principal, and Super Admin only.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Choose what you want to manage below.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {availableActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.path}
              type="button"
              onClick={() => navigate(action.path)}
              className="card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-yellow)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color="var(--primary-yellow)" />
              </div>
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {action.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {action.description}
                </p>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--primary-yellow)', fontWeight: 500 }}>
                Open →
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Settings
