import { useCallback, useMemo, useState } from 'react'
import { DialogContext } from './dialogContext'

const dialogDefaults = {
  alert: {
    title: 'Notice',
    confirmText: 'OK',
    variant: 'primary'
  },
  confirm: {
    title: 'Confirm Action',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'primary'
  },
  prompt: {
    title: 'Enter Value',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'primary',
    inputPlaceholder: ''
  }
}

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null)
  const [promptValue, setPromptValue] = useState('')

  const openDialog = useCallback((type, options = {}) => new Promise(resolve => {
    const nextDialog = {
      ...dialogDefaults[type],
      ...options,
      type,
      resolve
    }
    setPromptValue(options.defaultValue || '')
    setDialog(nextDialog)
  }), [])

  const closeDialog = useCallback((result) => {
    if (!dialog) return
    dialog.resolve(result)
    setDialog(null)
    setPromptValue('')
  }, [dialog])

  const showAlert = useCallback((message, options = {}) => (
    openDialog('alert', { ...options, message })
  ), [openDialog])

  const showConfirm = useCallback((message, options = {}) => (
    openDialog('confirm', { ...options, message })
  ), [openDialog])

  const showPrompt = useCallback((message, options = {}) => (
    openDialog('prompt', { ...options, message })
  ), [openDialog])

  const contextValue = useMemo(() => ({
    showAlert,
    showConfirm,
    showPrompt
  }), [showAlert, showConfirm, showPrompt])

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialog && (
        <div className="custom-dialog-overlay" onClick={() => closeDialog(dialog.type === 'alert' ? undefined : false)}>
          <div className="custom-dialog-card" onClick={e => e.stopPropagation()}>
            <div className="custom-dialog-header">
              <div className={`custom-dialog-icon-container ${dialog.variant || 'primary'}`}>
                {dialog.variant === 'danger' && (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {dialog.variant === 'warning' && (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {dialog.variant === 'success' && (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {(dialog.variant === 'primary' || !dialog.variant) && (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                )}
              </div>
              <div className="custom-dialog-header-text">
                <h5 className="custom-dialog-title">{dialog.title}</h5>
                {dialog.subtitle && <div className="custom-dialog-subtitle">{dialog.subtitle}</div>}
              </div>
            </div>
            <div className="custom-dialog-body">
              <p>{dialog.message}</p>
              {dialog.type === 'prompt' && (
                <input
                  autoFocus
                  className="custom-dialog-input"
                  placeholder={dialog.inputPlaceholder}
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') closeDialog(promptValue)
                  }}
                />
              )}
            </div>
            <div className="custom-dialog-footer">
              {dialog.type !== 'alert' && (
                <button
                  type="button"
                  className="custom-dialog-btn custom-dialog-btn-cancel"
                  onClick={() => closeDialog(dialog.type === 'prompt' ? null : false)}
                >
                  {dialog.cancelText || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                className={`custom-dialog-btn custom-dialog-btn-confirm ${dialog.variant || 'primary'}`}
                onClick={() => closeDialog(dialog.type === 'prompt' ? promptValue : true)}
              >
                {dialog.confirmText || 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
