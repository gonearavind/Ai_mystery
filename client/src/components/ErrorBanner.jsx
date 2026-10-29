import { AlertTriangle, X, RefreshCw } from 'lucide-react'

export const ErrorBanner = ({ message, onRetry, onDismiss }) => (
  <div role="alert" aria-live="assertive" className="glass-card border-crimson/30 bg-crimson/8 p-4 flex items-start gap-3">
    <AlertTriangle className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-ghost">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 flex items-center gap-1.5 text-xs text-amber hover:text-amber-light font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      )}
    </div>
    {onDismiss && (
      <button onClick={onDismiss} className="text-muted hover:text-ghost transition-colors p-1 -mr-1" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
)
export default ErrorBanner
