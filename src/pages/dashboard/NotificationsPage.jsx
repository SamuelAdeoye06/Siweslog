import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api/axios'
import usePageTitle from '../../hooks/usePageTitle'

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const typeIcon = (type) => {
  if (type.startsWith('log_')) {
    return <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  }
  if (type.includes('supervisor')) {
    return <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
  }
  if (type.includes('school')) {
    return <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  }
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}

const NotificationsPage = () => {
  usePageTitle('Notifications')
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread
  const [deletingId, setDeletingId] = useState(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'unread' ? '/notifications?unreadOnly=true' : '/notifications'
      const res = await API.get(url)
      setNotifications(res.data.notifications)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await API.patch(`/notifications/${notification._id}/read`)
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n))
      } catch (err) {
        console.error(err)
      }
    }
    if (notification.link) navigate(notification.link)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await API.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Notifications</div>
        <div className="dash-page-sub">Recent activity on your account</div>
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">All Activity</div>
          <div className="dash-table-actions">
            <select className="dash-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="unread">Unread Only</option>
            </select>
            {unreadCount > 0 && (
              <button className="dash-action-btn approve" onClick={handleMarkAllRead}>
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <p>{filter === 'unread' ? "You're all caught up — no unread notifications" : 'No notifications yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  background: n.isRead ? 'transparent' : '#F0F6FF',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: '17px', height: '17px', display: 'flex', color: '#2D6BE4' }}>
                    {typeIcon(n.type)}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: n.isRead ? 400 : 600, lineHeight: 1.5, marginBottom: '4px' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2D6BE4', flexShrink: 0, marginTop: '5px' }} />}
                <button
                  onClick={(e) => handleDelete(e, n._id)}
                  disabled={deletingId === n._id}
                  style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
                  title="Delete notification"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
