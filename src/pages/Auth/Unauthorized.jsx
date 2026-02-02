import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, Home, LogIn } from 'lucide-react'

const Unauthorized = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary, #f5f5f5)',
      }}
    >
      <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div className="card-header" style={{ borderBottom: '2px solid var(--warning)' }}>
          <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={28} color="var(--warning)" />
            Access denied
          </h1>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
            You don't have permission to view this page. If you believe this is an error, please contact your administrator or try logging in again.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Home size={18} />
              Go to Home
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogIn size={18} />
              Log in again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
