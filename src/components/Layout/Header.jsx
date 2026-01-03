import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Bell, LogOut, User, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import logo from '../../assets/logo2.jpg'

const Header = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        onClick={() => navigate('/')}
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
            height: '40px', 
            width: 'auto',
            objectFit: 'contain'
          }} 
        />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-yellow)' }}>
          Zentrium
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--primary-yellow)'
            e.target.style.color = 'var(--primary-black)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--bg-tertiary)'
            e.target.style.color = 'var(--text-primary)'
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => navigate('/notifications')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--bg-tertiary)'
            e.target.style.color = 'var(--primary-yellow)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.color = 'var(--text-secondary)'
          }}
        >
          <Bell size={20} />
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '0.5rem',
          }}
        >
          <User size={20} color="var(--primary-yellow)" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--error)'
            e.target.style.borderColor = 'var(--error)'
            e.target.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.borderColor = 'var(--border-color)'
            e.target.style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Header

