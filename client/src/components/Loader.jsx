import React from 'react'
import { Search } from 'lucide-react'

const MESSAGES = [
  'Interrogating suspects...',
  'Dusting for fingerprints...',
  'Analysing the evidence...',
  'Checking alibis...',
  'Reading the autopsy report...',
  'Decoding cryptic notes...',
  'Tracing footprints...',
]

export const Loader = ({ message, subtitle }) => {
  const [msgIdx, setMsgIdx] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 2800)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-bg/95 backdrop-blur-sm">
      <div className="text-center space-y-6 px-6 max-w-sm">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-amber/20 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border-2 border-amber/40 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-8 h-8 text-amber animate-float" />
          </div>
        </div>
        <div>
          <p className="font-serif text-xl text-ghost font-semibold" aria-live="polite" key={msgIdx}>
            {message || MESSAGES[msgIdx]}
          </p>
          {subtitle && <p className="text-muted text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="flex justify-center gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber/60" style={{ animation: `float 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export const InlineLoader = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <div className={`${s} border-2 border-current border-t-transparent rounded-full animate-spin`} aria-hidden />
  )
}

export const InvestigationSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-8 w-3/4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    </div>
    <div className="glass-card p-6 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
    </div>
  </div>
)

export default Loader
