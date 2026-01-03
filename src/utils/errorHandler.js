/**
 * Standardized error handling utilities
 */

import toast from 'react-hot-toast'
import logger from './logger'

/**
 * Extract error message from various error formats
 * @param {any} error - Error object
 * @returns {string} - Error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred'

  // Handle API response errors
  if (error?.response?.data) {
    const data = error.response.data
    
    // Check for errors array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0]
    }
    
    // Check for error message
    if (data.message) {
      return data.message
    }
    
    // Check for error object
    if (data.error?.message) {
      return data.error.message
    }
  }
  
  // Handle direct error messages
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0]
  }
  
  if (error?.message) {
    return error.message
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Extract all error messages from error object
 * @param {any} error - Error object
 * @returns {string[]} - Array of error messages
 */
export const getAllErrorMessages = (error) => {
  if (!error) return ['An unexpected error occurred']

  const messages = []

  // Handle API response errors
  if (error?.response?.data) {
    const data = error.response.data
    
    if (Array.isArray(data.errors)) {
      messages.push(...data.errors)
    } else if (data.message) {
      messages.push(data.message)
    } else if (data.error?.message) {
      messages.push(data.error.message)
    }
  }
  
  // Handle direct error messages
  if (error?.errors && Array.isArray(error.errors)) {
    messages.push(...error.errors)
  }
  
  if (error?.message && !messages.includes(error.message)) {
    messages.push(error.message)
  }
  
  if (messages.length === 0) {
    messages.push('An unexpected error occurred. Please try again.')
  }
  
  return messages
}

/**
 * Handle error and show toast notification
 * @param {any} error - Error object
 * @param {string} defaultMessage - Default message if error cannot be parsed
 */
export const handleError = (error, defaultMessage = 'An error occurred') => {
  const message = getErrorMessage(error) || defaultMessage
  logger.error('Error:', error)
  toast.error(message)
  return message
}

/**
 * Handle success and show toast notification
 * @param {string} message - Success message
 */
export const handleSuccess = (message = 'Operation completed successfully') => {
  toast.success(message)
}

/**
 * Handle API error response
 * @param {any} error - Error object
 * @param {object} options - Options
 * @param {string} options.defaultMessage - Default error message
 * @param {boolean} options.logError - Whether to log the error
 * @param {Function} options.onError - Callback function
 * @returns {object} - Error info object
 */
export const handleApiError = (error, options = {}) => {
  const {
    defaultMessage = 'An error occurred',
    logError = true,
    onError = null
  } = options

  const message = getErrorMessage(error) || defaultMessage
  const allMessages = getAllErrorMessages(error)

  if (logError) {
    logger.error('API Error:', error)
  }

  if (onError) {
    onError({ message, allMessages, error })
  } else {
    toast.error(message)
  }

  return {
    message,
    allMessages,
    error
  }
}

export default {
  getErrorMessage,
  getAllErrorMessages,
  handleError,
  handleSuccess,
  handleApiError
}

