import { Lock, Fingerprint, MapPin } from 'lucide-react'
import { InlineLoader } from './Loader'
import Badge from './ui/Badge'

const TYPE_BADGE = { incriminating: 'crimson', exonerating: 'emerald', red_herring: 'amber', neutral: 'ghost' }

export const ClueCard = ({ clue, onDiscover, discovering = false, showMetadata = false }) => {
  if (!clue.discovered) {
    return (
      <div className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden">
        {/* Blurred hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-surface-card/60 backdrop-blur-[2px] z-10 rounded-2xl">
          <div className="text-center">
            <Lock className="w-8 h-8 text-amber/50 mx-auto mb-2" />
            <p className="text-xs text-muted font-mono">Evidence locked</p>
          </div>
        </div>
        {/* Background content (blurred) */}
        <div className="opacity-20 select-none" aria-hidden>
          <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
          <div className="h-3 bg-white/10 rounded w-full mb-1" />
          <div className="h-3 bg-white/10 rounded w-4/5" />
        </div>
        {/* Footer */}
        <div className="relative z-10 pt-16">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted font-mono">
              <MapPin className="w-3.5 h-3.5" />{clue.location}
            </span>
            <button
              onClick={() => onDiscover && onDiscover(clue.id)}
              disabled={discovering}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 min-h-[36px]"
            >
              {discovering ? <><InlineLoader size="sm" /> Examining...</> : <><Fingerprint className="w-4 h-4" /> Discover</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Discovered
  return (
    <div className="glass-card p-5 space-y-3 border-amber/20 animate-card-flip">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-amber shrink-0" />
          <h4 className="font-serif font-semibold text-ghost text-sm leading-tight">{clue.title}</h4>
        </div>
        {showMetadata && clue.type && (
          <Badge variant={TYPE_BADGE[clue.type] || 'ghost'}>{clue.type?.replace('_', ' ')}</Badge>
        )}
      </div>
      <p className="text-sm text-muted leading-relaxed">{clue.description}</p>
      <div className="flex items-center justify-between pt-1 border-t border-white/6">
        <span className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <MapPin className="w-3.5 h-3.5" />{clue.location}
        </span>
        {showMetadata && clue.pointsTo && (
          <span className="text-xs font-mono text-amber">→ {clue.pointsTo?.toUpperCase()}</span>
        )}
        {!showMetadata && (
          <span className="text-xs font-mono text-emerald font-semibold">+5 pts</span>
        )}
      </div>
    </div>
  )
}
export default ClueCard
