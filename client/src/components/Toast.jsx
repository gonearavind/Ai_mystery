import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = { success: <CheckCircle className="w-4 h-4 text-emerald" />, error: <AlertCircle className="w-4 h-4 text-crimson" />, info: <Info className="w-4 h-4 text-amber" /> }
const BORDERS = { success: 'border-emerald/30', error: 'border-crimson/30', info: 'border-amber/30' }

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-[340px] w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`glass-card border ${BORDERS[t.type] || BORDERS.info} p-4 flex items-start gap-3 pointer-events-auto animate-slide-in-right shadow-card`}>
            <div className="shrink-0 mt-0.5">{ICONS[t.type]}</div>
            <p className="text-sm text-ghost flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-muted hover:text-ghost transition-colors -mr-1 shrink-0" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)
export default ToastProvider
