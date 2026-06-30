import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext'
import './Toast.css'

let idCounter = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = ++idCounter
    const duration = options.duration ?? 5000
    const title = options.title ?? (type === 'success' ? 'Success' : type === 'error' ? 'Something went wrong' : 'Notice')

    setToasts(prev => [...prev, { id, message, type, title, duration }])

    timers.current[id] = setTimeout(() => dismissToast(id), duration)
  }, [dismissToast])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`app-toast ${t.type}`}>
            <div className="app-toast-icon">
              {t.type === 'success' ? (
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              ) : t.type === 'error' ? (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ) : (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              )}
            </div>
            <div className="app-toast-body">
              <div className="app-toast-title">{t.title}</div>
              <div className="app-toast-msg">{t.message}</div>
            </div>
            <button className="app-toast-dismiss" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="app-toast-progress">
              <div className="app-toast-progress-bar" style={{ animationDuration: `${t.duration}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
