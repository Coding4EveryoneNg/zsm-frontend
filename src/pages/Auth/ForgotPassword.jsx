import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email })
      if (response.success) {
        setEmailSent(true)
        toast.success('Password reset email sent! Please check your inbox.')
      } else {
        toast.error(response.message || 'Failed to send reset email')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Check Your Email
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
      </div>
    )
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
            Forgot Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Sending...
              </>
            ) : (
              'Send Reset Link'
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

export default ForgotPassword

