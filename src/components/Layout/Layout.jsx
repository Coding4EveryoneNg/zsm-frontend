import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from '../Common/ErrorBoundary'

const Layout = () => {
  useEffect(() => {
    // Add authenticated class to body for dark theme
    document.body.classList.add('authenticated')
    return () => {
      document.body.classList.remove('authenticated')
    }
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <ErrorBoundary fallback={() => (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Navigation unavailable</div>
      )}>
        <Sidebar />
      </ErrorBoundary>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary fallback={() => (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Header unavailable</div>
        )}>
          <Header />
        </ErrorBoundary>
        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <ErrorBoundary fallback={({ resetError }) => (
            <div className="page-container" style={{ padding: '2rem' }}>
              <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div className="card-header"><h2 className="card-title">Something went wrong</h2></div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>This page could not be loaded. Please try again.</p>
                  <button type="button" className="btn btn-primary" onClick={resetError}>Try again</button>
                </div>
              </div>
            </div>
          )}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default Layout

