/**
 * Chart.js registration - imports chart.js and registers components.
 * Import this only when rendering charts (e.g. via LazyChart).
 * For data helpers, import from chartHelpers.js instead.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export { defaultChartOptions, chartColors, createBarChartData, createLineChartData, createPieChartData, createGradient, gradientColors } from './chartHelpers'
export default ChartJS
