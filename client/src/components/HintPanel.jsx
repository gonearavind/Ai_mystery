import { Lightbulb, AlertTriangle } from 'lucide-react'
import { InlineLoader } from './Loader'

export const HintPanel = ({ hints = [], hintsUsed = 0, hintsTotal = 0, onRequestHint, requesting = false }) => {
  const remaining = hintsTotal - hintsUsed
  const canRequest = remaining > 0 && !requesting
  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber" />
          <h3 className="font-serif font-semibold text-ghost">Informant Hints</h3>
          <span className="text-xs font-mono text-muted bg-white/5 px-2 py-0.5 rounded-full">{hintsUsed}/{hintsTotal} used</span>
        </div>
        <button
          onClick={onRequestHint}
          disabled={!canRequest}
          className="btn-ghost text-sm flex items-center gap-2"
          aria-label={`Request hint. ${remaining} remaining. Costs 10 points.`}
        >
          {requesting
            ? <><InlineLoader size="sm" /> Contacting...</>
            : remaining > 0
              ? <><Lightbulb className="w-4 h-4" /> Request Hint<span className="text-xs text-crimson font-mono">−10 pts</span></>
              : 'No hints left'
          }
        </button>
      </div>

      {remaining > 0 && !requesting && (
        <div className="flex items-center gap-2 text-xs text-amber/80 bg-amber/6 border border-amber/15 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Each hint costs <strong className="text-crimson">−10 pts</strong>. {remaining} hint{remaining !== 1 ? 's' : ''} remaining.
        </div>
      )}

      {hints.length === 0 && (
        <p className="text-sm text-muted italic text-center py-4">No hints revealed yet. Each hint costs 10 points.</p>
      )}

      <div className="space-y-3">
        {hints.map((hint) => (
          <div key={hint.index} className="flex gap-3 bg-amber/5 border border-amber/15 rounded-xl p-4 animate-fade-up">
            <div className="shrink-0 w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-amber">{hint.index}</span>
            </div>
            <p className="text-sm text-ghost/90 leading-relaxed italic">"{hint.text}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}
export default HintPanel
