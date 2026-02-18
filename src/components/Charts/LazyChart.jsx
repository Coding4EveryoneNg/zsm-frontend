import React, { useState, useEffect, useMemo } from 'react'

const CHART_TYPES = ['bar', 'line', 'pie', 'doughnut']

/**
 * LazyChart - lazily loads Chart.js and react-chartjs-2 only when first chart is rendered.
 * Use this instead of Bar/Line/Pie/Doughnut to defer chart library load until needed.
 * @param {string} type - 'bar' | 'line' | 'pie' | 'doughnut'
 * @param {object} data - Chart.js data
 * @param {object} options - Chart.js options
 */
function LazyChart ({ type = 'bar', data, options = {}, ...rest }) {
  const [ChartComponents, setChartComponents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await import('../../utils/chartConfig')
        const mod = await import('react-chartjs-2')
        if (!cancelled) {
          setChartComponents(mod)
        }
      } catch (e) {
        if (!cancelled) setError(e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const chartType = (type && String(type).toLowerCase()) || 'bar'
  const safeType = CHART_TYPES.includes(chartType) ? chartType : 'bar'

  const ChartComponent = useMemo(() => {
    if (!ChartComponents) return null
    const C = ChartComponents[safeType.charAt(0).toUpperCase() + safeType.slice(1)]
    return C || ChartComponents.Bar
  }, [ChartComponents, safeType])

  if (error) {
    return (
      <div style={{ height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Chart failed to load
      </div>
    )
  }

  if (!ChartComponent || !data) {
    return (
      <div
        style={{
          height: '100%',
          minHeight: 200,
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: 8
        }}
      />
    )
  }

  return <ChartComponent data={data} options={options} {...rest} />
}

export default LazyChart
