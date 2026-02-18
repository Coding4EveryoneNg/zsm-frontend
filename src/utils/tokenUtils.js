/**
 * Token utility functions for JWT token management
 */
import logger from './logger'

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    
    // Add 5 minute buffer to refresh before actual expiry
    return now >= (exp - 5 * 60 * 1000)
  } catch (error) {
    logger.error('Error parsing token:', error)
    return true
  }
}

/**
 * Get token expiry time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiry date or null if invalid
 */
export const getTokenExpiry = (token) => {
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return new Date(payload.exp * 1000)
  } catch (error) {
    logger.error('Error parsing token:', error)
    return null
  }
}

/**
 * Get time until token expires in seconds
 * @param {string} token - JWT token
 * @returns {number|null} - Seconds until expiry or null if invalid
 */
export const getTimeUntilExpiry = (token) => {
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    const now = Date.now()
    const diff = Math.floor((exp - now) / 1000)
    return diff > 0 ? diff : 0
  } catch (error) {
    logger.error('Error parsing token:', error)
    return null
  }
}

