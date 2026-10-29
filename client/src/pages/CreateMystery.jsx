import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCase } from '../api/cases'
import { getErrorMessage } from '../api/axiosInstance'
import { ErrorBanner } from '../components/ErrorBanner'
import { Loader } from '../components/Loader'
import { Sparkles } from 'lucide-react'
import Badge from '../components/ui/Badge'

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   suspects: 3, clues: 5, hints: 2, basePoints: 100, color: 'emerald', accent: 'border-emerald/40 hover:shadow-emerald-glow', selected: 'border-emerald shadow-emerald-glow ring-1 ring-emerald/50', desc: 'Compact crime scene, ideal for a quick deduction.' },
  { id: 'medium', label: 'Medium', suspects: 4, clues: 7, hints: 3, basePoints: 150, color: 'amber',   accent: 'border-amber/40  hover:shadow-amber-glow',   selected: 'border-amber  shadow-amber-glow  ring-1 ring-amber/50',   desc: 'Complex motives, multiple leads, and red herrings.' },
  { id: 'hard',   label: 'Hard',   suspects: 5, clues: 9, hints: 3, basePoints: 200, color: 'crimson', accent: 'border-crimson/40 hover:shadow-crimson-glow', selected: 'border-crimson shadow-crimson-glow ring-1 ring-crimson/50', desc: 'Intricate alibis, subtle connections, high stakes.' },
]

const SAMPLE_PREMISES = [
  "A jewel theft at a mountain ski lodge",
  "A priceless violin stolen backstage at a gala concert",
  "The head chef poisoned before a Michelin review",
  "A locked-room murder aboard a vintage steam train",
  "A Renaissance painting stolen from a penthouse gallery",
]

export const CreateMystery = () => {
  const navigate = useNavigate()
  const [premise, setPremise]           = useState('')
  const [difficulty, setDifficulty]     = useState('medium')
  const [clientError, setClientError]   = useState('')
  const [apiError, setApiError]         = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [isTakingLonger, setIsTakingLonger] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isLoading) {
      setIsTakingLonger(false)
      timerRef.current = setTimeout(() => setIsTakingLonger(true), 20000)
    } else {
      clearTimeout(timerRef.current)
      setIsTakingLonger(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [isLoading])

  const handleRandomPremise = () => {
    const p = SAMPLE_PREMISES[Math.floor(Math.random() * SAMPLE_PREMISES.length)]
    setPremise(p)
    setClientError('')
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setClientError('')
    setApiError('')
    const trimmed = premise.trim()
    if (trimmed.length < 10) { setClientError('Premise must be at least 10 characters.'); return }
    if (trimmed.length > 500) { setClientError('Premise cannot exceed 500 characters.'); return }
    try {
      setIsLoading(true)
      const data = await createCase(trimmed, difficulty)
      if (data?.id) navigate(`/case/${data.id}`)
      else throw new Error('Received invalid case data.')
    } catch (err) {
      setIsLoading(false)
      setApiError(getErrorMessage(err, 'Mystery generation failed. Please try again.'))
    }
  }

  if (isLoading) {
    return <Loader message="Building your mystery..." subtitle={isTakingLonger ? 'Taking a little longer — validating evidence integrity...' : undefined} />
  }

  const charColor = premise.length > 500 || (premise.length > 0 && premise.length < 10) ? 'text-crimson' : 'text-muted'

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="section-label">New Investigation</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ghost">Commission a Case</h1>
        <p className="text-muted text-base">Describe the incident and set the parameters. Gemini will construct a fair, solvable mystery.</p>
      </div>

      {apiError && (
        <ErrorBanner message={apiError} onRetry={handleSubmit} onDismiss={() => setApiError('')} />
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-8">
        {/* Premise */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="premise" className="font-serif font-semibold text-ghost">Case Premise</label>
            <button type="button" onClick={handleRandomPremise} className="flex items-center gap-1.5 text-xs text-amber hover:text-amber-light font-semibold transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Surprise Me
            </button>
          </div>
          <textarea
            id="premise"
            rows={4}
            value={premise}
            onChange={e => { setPremise(e.target.value); if (clientError) setClientError('') }}
            placeholder="e.g. A priceless diamond necklace vanishes from a locked hotel safe during a masquerade ball..."
            className={`w-full rounded-xl bg-surface-elevated border p-4 text-ghost placeholder:text-muted/50 focus:outline-none transition-all duration-200 text-sm resize-none font-sans ${
              clientError ? 'border-crimson/60 focus:border-crimson focus:shadow-crimson-glow' : 'border-white/10 focus:border-amber/50 focus:shadow-amber-glow'
            }`}
          />
          <div className="flex items-center justify-between">
            <div aria-live="polite">
              {clientError && <span className="text-xs text-crimson">{clientError}</span>}
            </div>
            <span className={`text-xs font-mono ml-auto ${charColor}`}>{premise.length}/500</span>
          </div>

          {/* Sample chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {SAMPLE_PREMISES.slice(0, 3).map(p => (
              <button key={p} type="button" onClick={() => { setPremise(p); setClientError('') }}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted hover:border-amber/30 hover:text-amber transition-all">
                {p.length > 38 ? p.slice(0, 38) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <label className="font-serif font-semibold text-ghost block">Difficulty</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => {
              const isSelected = difficulty === d.id
              return (
                <button key={d.id} type="button" onClick={() => setDifficulty(d.id)}
                  className={`glass-card p-5 text-left space-y-3 border transition-all duration-200 ${
                    isSelected ? d.selected : `border-white/8 ${d.accent}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-ghost">{d.label}</span>
                    <Badge variant={d.color}>+{d.basePoints}</Badge>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{d.desc}</p>
                  <div className="border-t border-white/6 pt-3 text-xs font-mono text-muted space-y-1">
                    <div>👥 {d.suspects} Suspects</div>
                    <div>🔍 {d.clues} Clues</div>
                    <div>💡 {d.hints} Hints</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base">
          Generate Mystery ⚡
        </button>
      </form>
    </div>
  )
}
export default CreateMystery
