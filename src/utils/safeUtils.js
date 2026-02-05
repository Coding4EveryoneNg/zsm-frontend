/**
 * Central safe utilities to avoid render-time errors from unexpected API/data shapes.
 * Use these for any value that might be null, undefined, or non-string/non-array.
 */

/**
 * Ensures a value is always an array. Handles null, undefined, JSON strings, and non-arrays.
 * @param {any} val
 * @returns {any[]}
 */
export function ensureArray(val) {
  if (Array.isArray(val)) return val
  if (val == null) return []
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Returns a safe string for comparisons (e.g. role, status). Never throws.
 * @param {any} val
 * @param {string} fallback
 * @returns {string}
 */
export function safeStr(val, fallback = '') {
  if (val == null) return fallback
  if (typeof val === 'string') return val
  try {
    return String(val)
  } catch {
    return fallback
  }
}

/**
 * Lowercase string for role/status comparisons. Use instead of raw .toLowerCase() on possibly non-strings.
 * @param {any} val
 * @param {string} fallback
 * @returns {string}
 */
export function safeStrLower(val, fallback = '') {
  return safeStr(val, fallback).toLowerCase()
}

/**
 * Safely format a date. Returns fallback for invalid/missing values.
 * @param {any} dateVal - Date, string, or timestamp
 * @param {string} fmt - 'short' | 'long' | 'iso' (default 'short')
 * @param {string} fallback
 * @returns {string}
 */
export function safeFormatDate(dateVal, fmt = 'short', fallback = '') {
  if (dateVal == null || dateVal === '') return fallback
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal)
    if (Number.isNaN(d.getTime())) return fallback
    if (fmt === 'iso') return d.toISOString().slice(0, 10)
    if (fmt === 'long') return d.toLocaleDateString(undefined, { dateStyle: 'long' })
    return d.toLocaleDateString()
  } catch {
    return fallback
  }
}

/**
 * Format a numeric value to a fixed number of decimal places for display.
 * Use for amounts, percentages, averages, scores, and any decimal shown on the FE.
 * @param {any} val - Number, string, or null/undefined
 * @param {number} decimals - Default 2
 * @returns {string} e.g. "12.34" or "0.00"
 */
export function formatDecimal(val, decimals = 2) {
  if (val == null || val === '') return (0).toFixed(decimals)
  const n = Number(val)
  if (Number.isNaN(n)) return (0).toFixed(decimals)
  return n.toFixed(decimals)
}

/**
 * Round a number to N decimal places (returns number). Use when building chart data.
 * @param {any} val
 * @param {number} decimals - Default 2
 * @returns {number}
 */
export function roundDecimal(val, decimals = 2) {
  if (val == null || val === '') return 0
  const n = Number(val)
  if (Number.isNaN(n)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

export default {
  ensureArray,
  safeStr,
  safeStrLower,
  safeFormatDate,
  formatDecimal,
  roundDecimal
}
