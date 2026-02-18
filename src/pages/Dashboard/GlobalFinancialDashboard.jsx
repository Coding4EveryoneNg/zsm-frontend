import React from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, ArrowLeft } from 'lucide-react'
import logger from '../../utils/logger'
import toast from 'react-hot-toast'
import { formatDecimal } from '../../utils/safeUtils'

const GlobalFinancialDashboard = () => {
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery(
    'globalFinancialSummary',
    () => dashboardService.getGlobalFinancialSummary(),
    {
      refetchInterval: 300000, // 5 minutes
      refetchOnError: false,
      retry: 1,
      onError: (err) => {
        logger.error('Failed to fetch global financial summary:', err)
      }
    }
  )

  const handleRefresh = () => {
    refetch()
    toast.success('Financial data refreshed')
  }

  if (isLoading) return <Loading />

  // Handle both camelCase and PascalCase property names from API
  const financialData = data?.data || {}
  
  // Map API response to component-friendly format (handle both naming conventions)
  const mappedData = {
    totalRevenue: financialData.totalGlobalRevenue || financialData.TotalGlobalRevenue || 0,
    totalPendingPayments: financialData.totalGlobalPendingPayments || financialData.TotalGlobalPendingPayments || 0,
    totalOverduePayments: financialData.totalGlobalOverduePayments || financialData.TotalGlobalOverduePayments || 0,
    totalPaidPayments: financialData.totalGlobalRevenue || financialData.TotalGlobalRevenue || 0, // Use revenue as paid
    totalTransactions: financialData.totalGlobalTransactions || financialData.TotalGlobalTransactions || 0,
    averageTransactionAmount: financialData.averageGlobalTransactionValue || financialData.AverageGlobalTransactionValue || 0,
    revenueGrowthPercentage: financialData.globalRevenueGrowthPercentage || financialData.GlobalRevenueGrowthPercentage || 0,
    paymentCollectionRate: financialData.globalPaymentCollectionRate || financialData.GlobalPaymentCollectionRate || 0,
    revenueByTenant: financialData.revenueByTenant || financialData.RevenueByTenant || [],
    topPerformingTenants: financialData.topPerformingTenants || financialData.TopPerformingTenants || []
  }
  

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/dashboard/superadmin')}
            style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Global Financial Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            System-wide Financial Analytics & Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge badge-success">SuperAdmin View</span>
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>
            Error loading financial data: {error?.message || 'Please refresh the page'}
          </p>
        </div>
      )}

      {/* Global Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalRevenue ?? 0)}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Total Revenue</p>
            </div>
            <DollarSign size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalPendingPayments ?? 0)}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Pending Payments</p>
            </div>
            <TrendingUp size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalOverduePayments ?? 0)}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Overdue Payments</p>
            </div>
            <TrendingDown size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalPaidPayments ?? 0)}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>Paid Payments</p>
            </div>
            <DollarSign size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Additional Financial Metrics */}
      {(mappedData.totalTransactions > 0 || mappedData.averageTransactionAmount > 0 || mappedData.revenueGrowthPercentage !== 0 || mappedData.paymentCollectionRate > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {mappedData.totalTransactions > 0 && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {mappedData.totalTransactions || 0}
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Transactions</p>
              </div>
            </div>
          )}
          {mappedData.averageTransactionAmount > 0 && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ${formatDecimal(mappedData.averageTransactionAmount ?? 0)}
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Average Transaction</p>
              </div>
            </div>
          )}
          {mappedData.revenueGrowthPercentage !== 0 && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {formatDecimal(mappedData.revenueGrowthPercentage)}%
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Revenue Growth</p>
              </div>
            </div>
          )}
          {mappedData.paymentCollectionRate > 0 && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {formatDecimal(mappedData.paymentCollectionRate)}%
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Collection Rate</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue by Tenant */}
      {mappedData.revenueByTenant && mappedData.revenueByTenant.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Revenue by Tenant</h2>
          </div>
          <div className="card-body">
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Revenue</th>
                    <th>Schools</th>
                    <th>Students</th>
                    <th>Revenue/Student</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.revenueByTenant.map((item, index) => (
                    <tr key={item.tenantId || item.tenantName || item.TenantName || index}>
                      <td><strong>{item.tenantName || item.TenantName || 'N/A'}</strong></td>
                      <td>${formatDecimal(item.revenue ?? item.Revenue)}</td>
                      <td>{item.schoolCount || item.SchoolCount || 0}</td>
                      <td>{item.studentCount || item.StudentCount || 0}</td>
                      <td>${formatDecimal(item.revenuePerStudent ?? item.RevenuePerStudent)}</td>
                      <td>{formatDecimal(item.percentage ?? item.Percentage)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top Performing Tenants */}
      {mappedData.topPerformingTenants && mappedData.topPerformingTenants.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Top Performing Tenants</h2>
          </div>
          <div className="card-body">
            <div className="table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Tenant</th>
                    <th>Revenue</th>
                    <th>Growth</th>
                    <th>Collection Rate</th>
                    <th>Schools</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.topPerformingTenants.map((item, index) => (
                    <tr key={item.tenantId || item.tenantName || item.TenantName || index}>
                      <td><span className="badge badge-primary">{index + 1}</span></td>
                      <td><strong>{item.tenantName || item.TenantName || 'N/A'}</strong></td>
                      <td>${formatDecimal(item.revenue ?? item.Revenue)}</td>
                      <td>
                        <span className={`badge ${(item.growthPercentage || item.GrowthPercentage || 0) >= 0 ? 'badge-success' : 'badge-danger'}`}>
                          {formatDecimal(item.growthPercentage ?? item.GrowthPercentage)}%
                        </span>
                      </td>
                      <td>{formatDecimal(item.collectionRate ?? item.CollectionRate)}%</td>
                      <td>{item.schoolCount || item.SchoolCount || 0}</td>
                      <td>{item.studentCount || item.StudentCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Summary Statistics</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--success-light)', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalRevenue ?? 0)}
              </h4>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Revenue</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--warning-light)', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalPendingPayments ?? 0)}
              </h4>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pending Payments</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--danger-light)', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                ${formatDecimal(mappedData.totalOverduePayments ?? 0)}
              </h4>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Overdue Payments</p>
            </div>
            {mappedData.totalTransactions > 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--info-light)', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info)', marginBottom: '0.5rem' }}>
                  {mappedData.totalTransactions || 0}
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Total Transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalFinancialDashboard

