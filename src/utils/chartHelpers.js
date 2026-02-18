/**
 * Chart helpers - pure data utilities (no Chart.js dependency).
 * Import from here to avoid loading chart.js until charts are actually rendered.
 */

function chartValueFormat (value) {
  const n = Number(value)
  return Number.isNaN(n) ? '0.00' : n.toFixed(2)
}

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          weight: '500'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label (context) {
          const raw = context.parsed?.y ?? context.parsed ?? context.raw
          const formatted = chartValueFormat(raw)
          return `${context.dataset.label || context.label || ''}: ${formatted}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        },
        callback (value) {
          return chartValueFormat(value)
        }
      }
    }
  }
}

export const chartColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  indigo: '#6366f1',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  green: '#10b981',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444'
}

export const gradientColors = {
  primary: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.1)'],
  secondary: ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.1)'],
  success: ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.1)'],
  warning: ['rgba(245, 158, 11, 0.8)', 'rgba(245, 158, 11, 0.1)'],
  danger: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.1)']
}

export const createGradient = (ctx, colorStart, colorEnd) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, colorStart)
  gradient.addColorStop(1, colorEnd)
  return gradient
}

export const createPieChartData = (labels, data, colors) => {
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  }
}

export const createBarChartData = (labels, datasets) => {
  const safeLabels = Array.isArray(labels) ? labels : []
  const safeDatasets = Array.isArray(datasets) ? datasets : []
  return {
    labels: safeLabels,
    datasets: safeDatasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors.primary,
      borderColor: dataset.borderColor || chartColors.primary,
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false
    }))
  }
}

export const createLineChartData = (labels, datasets) => {
  return {
    labels,
    datasets: datasets.map((dataset) => ({
      ...dataset,
      borderWidth: 2,
      fill: dataset.fill !== undefined ? dataset.fill : false,
      tension: dataset.tension || 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: dataset.borderColor || chartColors.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }))
  }
}
