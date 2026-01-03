import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logger from '../../utils/logger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to logging service
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          fallback={this.props.fallback}
        />
      )
    }

    return this.props.children
  }
}

const ErrorFallback = ({ error, errorInfo, onReset, fallback }) => {
  const navigate = useNavigate()
  const isDevelopment = import.meta.env.DEV

  if (fallback) {
    return fallback({ error, errorInfo, resetError: onReset })
  }

  return (
    <div className="page-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem'
    }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="card-header" style={{ 
          backgroundColor: 'var(--danger-light)',
          borderBottom: '2px solid var(--danger)'
        }}>
          <h2 className="card-title" style={{ 
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={24} />
            Something went wrong
          </h2>
        </div>
        <div className="card-body">
          <p style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '1rem',
            fontSize: '1.1rem'
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
          </p>

          {isDevelopment && error && (
            <details style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}>
              <summary style={{ 
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '0.5rem'
              }}>
                {error.toString()}
                {errorInfo && errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            marginTop: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <button 
              className="btn btn-primary"
              onClick={onReset}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Home size={18} />
              Go Home
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary

