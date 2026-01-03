/**
 * Centralized logging utility
 * Logs are only shown in development or when explicitly enabled
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENVIRONMENT === 'development'
const enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'

const shouldLog = isDevelopment || enableDebugLogs

export const logger = {
  log: (...args) => {
    if (shouldLog) {
      console.log('[LOG]', ...args)
    }
  },
  
  info: (...args) => {
    if (shouldLog) {
      console.info('[INFO]', ...args)
    }
  },
  
  warn: (...args) => {
    // Warnings are always shown
    console.warn('[WARN]', ...args)
  },
  
  error: (...args) => {
    // Errors are always shown
    console.error('[ERROR]', ...args)
  },
  
  debug: (...args) => {
    if (shouldLog) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

export default logger

