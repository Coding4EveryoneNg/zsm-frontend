import React from 'react'
import { X, AlertTriangle } from 'lucide-react'

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      button: 'btn-danger',
      icon: 'var(--danger)',
      bg: 'var(--danger-light)'
    },
    warning: {
      button: 'btn-warning',
      icon: 'var(--warning)',
      bg: 'var(--warning-light)'
    },
    info: {
      button: 'btn-primary',
      icon: 'var(--primary)',
      bg: 'var(--primary-light)'
    }
  }

  const styles = variantStyles[variant] || variantStyles.danger

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: '500px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="card-header" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: styles.bg,
            borderBottom: `2px solid ${styles.icon}`
          }}
        >
          <h2 
            className="card-title" 
            style={{ 
              color: styles.icon, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <AlertTriangle size={20} />
            {title}
          </h2>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-outline" 
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button 
              className={`btn ${styles.button}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

