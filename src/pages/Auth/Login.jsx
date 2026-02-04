import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock } from 'lucide-react'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_expired') === 'true') {
        sessionStorage.removeItem('session_expired')
        toast.error('Your session has expired. Please log in again.')
      }
    } catch (_) {}
  }, [])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
  setLoading(true);

  const result = await login(
    data.email,
    data.password,
    data.rememberMe
  );

  if (!result.success) {
    toast.error(result.message || result.errors?.[0] || 'Login failed')
    setLoading(false)
    return
  }

  const userStr = localStorage.getItem('user');
  if (!userStr) return;

  const user = JSON.parse(userStr);

  const roleRoutes = {
    Student: '/dashboard/student',
    Teacher: '/dashboard/teacher',
    Admin: '/dashboard/admin',
    Principal: '/dashboard/principal',
    SuperAdmin: '/dashboard/superadmin',
    Parent: '/dashboard/parent',
  };
  const roleKey = Object.keys(roleRoutes).find((k) => k.toLowerCase() === String(user.role ?? '').toLowerCase());
  navigate(roleKey ? roleRoutes[roleKey] : '/dashboard');
  setLoading(false);
};


  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--primary-black) 0%, var(--primary-black-light) 100%)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '2.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div 
          style={{ textAlign: 'center', marginBottom: '2rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => {
            const h1 = e.currentTarget.querySelector('h1')
            if (h1) h1.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            const h1 = e.currentTarget.querySelector('h1')
            if (h1) h1.style.opacity = '1'
          }}
        >
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--primary-yellow)',
              marginBottom: '0.5rem',
              transition: 'opacity 0.2s ease',
            }}
          >
            Zentrium
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>School Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password && <div className="form-error">{errors.password.message}</div>}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('rememberMe')}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              style={{
                color: 'var(--primary-yellow)',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}

export default Login

