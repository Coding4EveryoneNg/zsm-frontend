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

export default {
  ensureArray,
  safeStr,
  safeStrLower,
  safeFormatDate
}
