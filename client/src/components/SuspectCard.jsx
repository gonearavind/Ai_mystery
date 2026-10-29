import { User, Shield } from 'lucide-react'

const INITIALS = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const COLORS = ['from-amber/30 to-amber-dark/20', 'from-purple-600/30 to-purple-800/20', 'from-blue-600/30 to-blue-800/20', 'from-emerald/30 to-emerald-dark/20', 'from-crimson/30 to-crimson-dark/20']

export const SuspectCard = ({ suspect, selectable = false, selected = false, onSelect }) => {
  const colorIdx = suspect.id ? parseInt(suspect.id.replace('s','')) - 1 : 0
  const color = COLORS[colorIdx % COLORS.length]
  const handleClick = () => selectable && onSelect && onSelect(suspect)
  const handleKey = (e) => { if (selectable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleClick() } }
  return (
    <div
      role={selectable ? 'radio' : 'article'}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
      className={`glass-card p-5 space-y-4 transition-all duration-200 ${
        selectable ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'border-amber/60 shadow-amber-glow ring-1 ring-amber/40'
          : selectable ? 'hover:border-amber/30 hover:shadow-card-hover' : 'hover:border-white/12'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 border border-white/10`}>
          <span className="font-serif font-bold text-ghost text-sm">{INITIALS(suspect.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-semibold text-ghost truncate">{suspect.name}</h3>
            {selected && <Shield className="w-4 h-4 text-amber shrink-0" aria-label="Selected" />}
          </div>
          <span className="text-xs font-mono text-amber mt-0.5 block uppercase tracking-wider">{suspect.role}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed">{suspect.description}</p>

      {/* Divider row */}
      <div className="border-t border-white/6 pt-3 space-y-2">
        <div>
          <span className="section-label block mb-0.5">Connection</span>
          <p className="text-xs text-ghost/80">{suspect.relationship}</p>
        </div>
        <div>
          <span className="section-label block mb-0.5">Alibi</span>
          <p className="text-xs text-muted italic">"{suspect.alibi}"</p>
        </div>
      </div>

      {/* Selection indicator */}
      {selectable && (
        <div className={`w-full h-0.5 rounded-full transition-all duration-300 ${
          selected ? 'bg-gradient-to-r from-amber to-amber-light' : 'bg-transparent'
        }`} />
      )}
    </div>
  )
}
export default SuspectCard
