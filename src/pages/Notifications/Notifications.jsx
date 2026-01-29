import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { notificationsService } from '../../services/apiServices'
import Loading from '../../components/Common/Loading'
import { Bell, CheckCircle, Clock, ExternalLink } from 'lucide-react'

const Notifications = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // all, unread, read
  const pageSize = 20
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['notifications', page, filter],
    () => {
      const params = { page, pageSize }
      if (filter === 'unread') {
        params.isRead = false
      } else if (filter === 'read') {
        params.isRead = true
      }
      return notificationsService.getUserNotifications(params)
    },
    { keepPreviousData: true }
  )

  const markAsReadMutation = useMutation(
    (id) => notificationsService.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('dashboard') // Refresh dashboard unread count
      }
    }
  )

  const markAllAsReadMutation = useMutation(
    () => notificationsService.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('dashboard')
      }
    }
  )

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Error loading notifications</p>
            <p className="empty-state-subtext">{error?.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    )
  }

  const notifications = data?.data?.notifications || data?.notifications || []
  const totalCount = data?.data?.totalCount || data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / pageSize)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    if (window.confirm('Mark all notifications as read?')) {
      markAllAsReadMutation.mutate()
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isLoading}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('read')}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="card"
              style={{
                borderLeft: `4px solid ${notification.isRead ? 'var(--border-color)' : 'var(--primary)'}`,
                backgroundColor: notification.isRead ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: notification.isRead ? 'var(--border-color)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={20} color={notification.isRead ? 'var(--text-muted)' : 'white'} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: notification.isRead ? 'normal' : 'bold', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        marginBottom: '0.25rem'
                      }}>
                        {notification.title}
                      </h3>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.875rem',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {notification.message || notification.content}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isLoading}
                        style={{ marginLeft: '1rem' }}
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {notification.createdAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                    {notification.type && (
                      <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                        {notification.type}
                      </span>
                    )}
                    {(notification.actionUrl || notification.action_url) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => {
                          const url = notification.actionUrl || notification.action_url
                          if (url?.startsWith('http')) window.open(url, '_blank')
                          else if (url) navigate(url.startsWith('/') ? url : `/${url}`)
                        }}
                      >
                        <ExternalLink size={12} style={{ marginRight: '0.25rem' }} />
                        {notification.actionText || notification.action_text || 'View'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <p className="empty-state-text">No notifications found</p>
            <p className="empty-state-subtext">
              {filter === 'unread' 
                ? 'You have no unread notifications' 
                : filter === 'read'
                ? 'You have no read notifications'
                : 'No notifications available'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Notifications
