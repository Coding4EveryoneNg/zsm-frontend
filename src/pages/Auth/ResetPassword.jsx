import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Lock, ArrowLeft } from 'lucide-react'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('newPassword')

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new one.')
      navigate('/forgot-password')
    }
  }, [token, email, navigate])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        email,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      if (response.success) {
        toast.success('Password reset successful! Please login with your new password.')
        navigate('/login')
      } else {
        toast.error(response.message || 'Password reset failed')
      }
    } catch (error) {
      toast.error(error.message || 'Password reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--primary-yellow)',
              marginBottom: '0.5rem',
            }}
          >
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              New Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter new password"
              {...register('newPassword', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.newPassword && <div className="form-error">{errors.newPassword.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Confirm new password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword.message}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--primary-yellow)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

