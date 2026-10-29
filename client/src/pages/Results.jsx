import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getResult } from '../api/cases'
import { getErrorMessage } from '../api/axiosInstance'
import { ClueCard } from '../components/ClueCard'
import { Loader } from '../components/Loader'
import { ErrorBanner } from '../components/ErrorBanner'
import { Trophy, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, Plus, FileText, CheckCircle2, XCircle } from 'lucide-react'
import Badge from '../components/ui/Badge'
import SectionTitle from '../components/ui/SectionTitle'

export const Results = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadResult = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getResult(id)
      setResult(data)
    } catch (err) {
      // If 409 status, case has not been accused yet -> redirect to investigation room
      if (err?.response?.status === 409) {
        navigate(`/case/${id}`, { replace: true })
        return
      }
      setError(getErrorMessage(err, 'Failed to fetch the final investigation report.'))
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  if (loading) {
    return <Loader message="Compiling official case dossier..." subtitle="Synthesizing forensic findings and verdict..." />
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <ErrorBanner message={error || 'Unable to display case results.'} onRetry={loadResult} />
        <div className="text-center">
          <Link to="/" className="btn-ghost inline-flex text-sm">
            ← Return to Headquarters
          </Link>
        </div>
      </div>
    )
  }

  const {
    correct,
    culprit,
    accusedSuspectId,
    explanation,
    motive,
    clues = [],
    score = { base: 0, cluePoints: 0, hintPenalty: 0, total: 0 },
    difficulty = 'medium',
  } = result

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10 animate-fade-in">
      {/* Top Verdict Banner */}
      <div
        role="status"
        aria-label={correct ? 'Case Solved' : 'Culprit Escaped'}
        className={`glass-card p-8 sm:p-12 text-center relative overflow-hidden ${
          correct
            ? 'border-emerald/40 shadow-emerald-glow'
            : 'border-crimson/40 shadow-crimson-glow'
        }`}
      >
        <div className={`ambient-glow w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          correct ? 'bg-emerald/15' : 'bg-crimson/15'
        }`} aria-hidden />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mx-auto bg-surface-elevated/80 border border-white/10 shadow-lg">
            {correct ? (
              <Trophy className="w-10 h-10 text-emerald animate-bounce-in" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-crimson animate-bounce-in" />
            )}
          </div>

          <div className="space-y-2">
            <span className="section-label">Official Investigation Verdict</span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black text-ghost uppercase tracking-tight">
              {correct ? 'Case Solved: Justice Served' : 'Culprit Escaped: Wrong Accusation'}
            </h1>
          </div>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-muted font-serif leading-relaxed">
            {correct
              ? 'Your sharp intellect connected the evidence and successfully apprehended the true culprit.'
              : 'Your accusation fell on an innocent person. The true culprit slipped through the cracks.'}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Badge variant={correct ? 'emerald' : 'crimson'}>
              {correct ? 'Conviction Confirmed' : 'Wrong Accusation'}
            </Badge>
            <Badge variant="ghost">Difficulty: {difficulty}</Badge>
            <span className="text-xs font-mono bg-amber/15 text-amber border border-amber/25 px-3 py-1 rounded-full font-bold">
              Total Score: {score.total} pts
            </span>
          </div>
        </div>
      </div>

      {/* Culprit & Accused Summary Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Accusation */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Your Accusation</span>
            {correct ? (
              <Badge variant="emerald"><ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Accurate</Badge>
            ) : (
              <Badge variant="crimson"><ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Misidentified</Badge>
            )}
          </div>
          <h3 className="font-serif text-2xl font-bold text-ghost">
            Suspect #{accusedSuspectId?.toUpperCase()}
          </h3>
          <p className="text-sm text-muted">
            {correct ? (
              <span className="text-emerald font-medium">
                ✓ Identified the guilty party with precision.
              </span>
            ) : (
              <span className="text-crimson font-medium">
                ✕ Was not the mastermind behind this crime.
              </span>
            )}
          </p>
        </div>

        {/* The True Culprit */}
        <div className="glass-card p-6 space-y-3 border-amber/30">
          <div className="flex items-center justify-between">
            <span className="section-label">True Culprit</span>
            <span className="text-xs font-mono text-amber">{culprit?.id?.toUpperCase()}</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-amber">
            {culprit?.name || 'Unknown Culprit'}
          </h3>
          {motive && (
            <div className="text-sm text-muted">
              <span className="text-ghost font-medium">Motive: </span>
              <span className="italic">"{motive}"</span>
            </div>
          )}
        </div>
      </section>

      {/* Full Detective Explanation */}
      <section aria-labelledby="explanation-heading" className="glass-card p-6 sm:p-8 space-y-4">
        <SectionTitle
          icon={<FileText className="w-5 h-5" />}
          title="Official Case Explanation & Chain of Logic"
          subtitle="How the clues piece together the true sequence of events"
        />
        <div className="border-t border-white/6 pt-4 text-ghost/90 font-serif leading-relaxed text-base sm:text-lg whitespace-pre-line">
          {explanation}
        </div>
      </section>

      {/* Score Breakdown Table */}
      <section aria-labelledby="score-breakdown-heading" className="glass-card p-6 sm:p-8 space-y-5">
        <SectionTitle
          icon={<Trophy className="w-5 h-5" />}
          title="Final Score Calculation"
          subtitle="Point breakdown based on deduction accuracy and resources used"
        />

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-sm font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-muted uppercase text-xs">
                <th className="pb-3 font-semibold">Scoring Factor</th>
                <th className="pb-3 font-semibold">Calculation</th>
                <th className="pb-3 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              <tr>
                <td className="py-3 font-sans text-ghost font-medium">
                  Culprit Identification (Base)
                </td>
                <td className="py-3 text-muted">
                  {correct ? `Correct guess on ${difficulty}` : 'Incorrect deduction'}
                </td>
                <td className={`py-3 text-right font-bold ${correct ? 'text-emerald' : 'text-muted'}`}>
                  +{score.base}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans text-ghost font-medium">
                  Physical Evidence Uncovered
                </td>
                <td className="py-3 text-muted">
                  +5 pts per discovered clue
                </td>
                <td className="py-3 text-right font-bold text-amber">
                  +{score.cluePoints}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-sans text-ghost font-medium">
                  Informant Hints Used
                </td>
                <td className="py-3 text-muted">
                  −10 pts per requested hint
                </td>
                <td className="py-3 text-right font-bold text-crimson">
                  {score.hintPenalty}
                </td>
              </tr>
              <tr className="border-t-2 border-white/15">
                <td className="py-4 font-sans font-bold text-base text-ghost">
                  Total Final Score
                </td>
                <td className="py-4 text-xs text-muted font-sans italic">
                  Max(0, Base + Clues + Hints)
                </td>
                <td className="py-4 text-right text-2xl font-bold text-emerald font-mono">
                  {score.total} <span className="text-xs text-muted">pts</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Complete Evidence Archive (All Clues) */}
      <section aria-labelledby="all-clues-heading" className="space-y-4">
        <SectionTitle
          icon={<Sparkles className="w-5 h-5" />}
          title={`Complete Evidence Dossier (${clues.length} Total Clues)`}
          subtitle="Declassified archive revealing incriminating leads and red herrings"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clues.map((clue) => (
            <ClueCard
              key={clue.id}
              clue={{
                ...clue,
                discovered: true, // Show all clues in the results page
              }}
              showMetadata={true}
            />
          ))}
        </div>
      </section>

      {/* Bottom Action: Play Again */}
      <div className="pt-4 pb-12 text-center">
        <Link
          to="/create"
          className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4 shadow-amber-glow"
        >
          <Plus className="w-5 h-5" /> Commission Another Mystery
        </Link>
      </div>
    </div>
  )
}

export default Results
