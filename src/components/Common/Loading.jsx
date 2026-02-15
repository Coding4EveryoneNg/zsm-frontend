import React from 'react'

const Loading = ({ message = 'Loading...' }) => (
  <div className="loading" role="status" aria-live="polite" aria-label={message}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" aria-hidden="true" />
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  </div>
)

export default Loading

