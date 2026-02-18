import { lazy } from 'react'

/**
 * Lazy load with retry - handles chunk load failures (e.g. network issues, 404).
 * Retries up to `retries` times with exponential backoff.
 * @param {() => Promise<{ default: React.Component }>} importFn - Dynamic import function
 * @param {number} retries - Number of retries (default 2)
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithRetry(importFn, retries = 2) {
  return lazy(async () => {
    let lastErr
    for (let i = 0; i <= retries; i++) {
      try {
        return await importFn()
      } catch (e) {
        lastErr = e
        if (i < retries) {
          await new Promise((r) => setTimeout(r, 500 * (i + 1)))
        }
      }
    }
    throw lastErr
  })
}
