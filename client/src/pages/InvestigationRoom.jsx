import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCase, discoverClue, requestHint } from '../api/cases'
import { getErrorMessage } from '../api/axiosInstance'
import { SuspectCard } from '../components/SuspectCard'
import { ClueCard } from '../components/ClueCard'
import { HintPanel } from '../components/HintPanel'
import { ProgressBar } from '../components/ProgressBar'
import { InvestigationSkeleton } from '../components/Loader'
import { ErrorBanner } from '../components/ErrorBanner'
import { useToast } from '../components/Toast'
import { FileText, Users, Search, ChevronRight, NotebookPen } from 'lucide-react'
import Badge from '../components/ui/Badge'
import SectionTitle from '../components/ui/SectionTitle'

export const InvestigationRoom = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [caseData, setCaseData]             = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError]     = useState(null)
  const [notFound, setNotFound]             = useState(false)
  const [discoveringId, setDiscoveringId]   = useState(null)
  const [requestingHint, setRequestingHint] = useState(false)
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(`notes_${id}`) || ''
    } catch {
      return ''
    }
  })
  const [showNotes, setShowNotes] = useState(false)

  const handleNotesChange = (e) => {
    const val = e.target.value
    setNotes(val)
    try {
      localStorage.setItem(`notes_${id}`, val)
    } catch {
      // ignore storage failure
    }
  }

  const fetchCaseDetails = useCallback(async () => {
    try {
      setInitialLoading(true)
      setInitialError(null)
      setNotFound(false)
      const data = await getCase(id)
      if (data.status === 'completed') {
        navigate(`/case/${id}/result`, { replace: true })
        return
      }
      setCaseData(data)
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true)
      } else {
        setInitialError(getErrorMessage(err, 'Failed to load investigation room.'))
      }
    } finally {
      setInitialLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchCaseDetails()
  }, [fetchCaseDetails])

  const handleDiscoverClue = async (clueId) => {
    if (!caseData || discoveringId) return
    try {
      setDiscoveringId(clueId)
      const result = await discoverClue(id, clueId)
      setCaseData(prev => !prev ? prev : {
        ...prev,
        clues: prev.clues.map(c => c.id === clueId ? { ...c, ...result.clue, discovered: true } : c),
        progress: result.progress || prev.progress,
        scorePreview: typeof result.scorePreview === 'number' ? result.scorePreview : prev.scorePreview,
      })
      addToast(`Evidence found: "${result.clue?.title || 'New Clue'}" +5 pts`, 'success')
    } catch (err) {
      addToast(getErrorMessage(err, 'Could not examine this location.'), 'error')
    } finally {
      setDiscoveringId(null)
    }
  }

  const handleRequestHint = async () => {
    if (!caseData || requestingHint) return
    try {
      setRequestingHint(true)
      const result = await requestHint(id)
      setCaseData(prev => !prev ? prev : {
        ...prev,
        hints: prev.hints.some(h => h.index === result.hint.index) ? prev.hints : [...prev.hints, result.hint],
        progress: result.progress || prev.progress,
        scorePreview: typeof result.scorePreview === 'number' ? result.scorePreview : prev.scorePreview,
      })
      addToast('Informant contacted. −10 pts', 'info')
    } catch (err) {
      addToast(getErrorMessage(err, 'Could not retrieve hint.'), 'error')
    } finally {
      setRequestingHint(false)
    }
  }

  if (initialLoading) return <InvestigationSkeleton />

  if (notFound) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
      <div className="text-6xl">📁</div>
      <h1 className="font-serif text-3xl font-bold text-ghost">Case File Not Found</h1>
      <p className="text-muted">Case <code className="text-amber font-mono">{id}</code> does not exist in our archives.</p>
      <Link to="/" className="btn-ghost inline-flex items-center justify-center">← Return Home</Link>
    </div>
  )

  if (initialError || !caseData) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
      <ErrorBanner message={initialError || 'Failed to load.'} onRetry={fetchCaseDetails} />
      <Link to="/" className="block text-center text-sm text-amber hover:underline">← Return Home</Link>
    </div>
  )

  const { title, premise, difficulty, story, suspects = [], clues = [], hints = [], progress = {}, scorePreview = 0 } = caseData
  const { cluesDiscovered = 0, cluesTotal = 0, hintsUsed = 0, hintsTotal = 0 } = progress
  const clueProgressFraction = cluesTotal > 0 ? cluesDiscovered / cluesTotal : 0
  const diffMap = { easy: 'easy', medium: 'medium', hard: 'hard' }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Case header */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="section-label">Case #{id.slice(-6).toUpperCase()}</span>
              <Badge variant={diffMap[difficulty] || 'ghost'}>{difficulty}</Badge>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-ghost">{title}</h1>
            <p className="text-sm text-muted">{premise}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowNotes(v => !v)}
              aria-expanded={showNotes}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <NotebookPen className="w-4 h-4" /> {showNotes ? 'Hide Notes' : 'Field Notes'}
            </button>
            <Link to={`/case/${id}/accuse`} className="btn-danger flex items-center gap-2 text-sm">
              Accuse Suspect <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Clues Discovered', val: `${cluesDiscovered} / ${cluesTotal}`, color: 'text-amber' },
            { label: 'Hints Used', val: `${hintsUsed} / ${hintsTotal}`, color: 'text-ghost' },
            { label: 'Score Preview', val: `${scorePreview} pts`, color: 'text-emerald' },
            { label: 'Progress', val: `${Math.round(clueProgressFraction * 100)}%`, color: 'text-amber-light' },
          ].map(s => (
            <div key={s.label} className="bg-surface-elevated/60 border border-white/6 rounded-xl p-4">
              <span className="section-label block mb-1">{s.label}</span>
              <span className={`text-xl sm:text-2xl font-mono font-bold ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Visual Progress Bar */}
        <ProgressBar
          value={clueProgressFraction}
          label="Investigation Progress"
          sublabel={`${cluesDiscovered} of ${cluesTotal} clues revealed`}
        />
      </div>

      {/* Detective Notes Drawer (Collapsible) */}
      {showNotes && (
        <div className="glass-card p-5 space-y-3 border-amber/30 animate-fade-down">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-amber flex items-center gap-2">
              <NotebookPen className="w-4 h-4" /> Confidential Detective Field Notes
            </h3>
            <span className="text-xs text-muted font-mono">Saved locally</span>
          </div>
          <textarea
            rows={4}
            value={notes}
            onChange={handleNotesChange}
            placeholder="Jot down suspect inconsistencies, time alibis, and observations..."
            className="w-full rounded-xl bg-surface-elevated border border-white/10 p-3 text-ghost text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:border-amber/50 focus:shadow-amber-glow resize-none"
          />
        </div>
      )}

      {/* Case Story Panel */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <SectionTitle
          icon={<FileText className="w-5 h-5" />}
          title="The Incident Scene"
          subtitle="Original crime dispatch report"
        />
        <div className="border-t border-white/6 pt-4 text-ghost/90 font-serif leading-relaxed text-base sm:text-lg whitespace-pre-line">
          {story}
        </div>
      </div>

      {/* Suspects Section */}
      <section className="space-y-4">
        <SectionTitle
          icon={<Users className="w-5 h-5" />}
          title={`Persons of Interest (${suspects.length})`}
          subtitle="Review alibis, connections, and backgrounds"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suspects.map((suspect) => (
            <SuspectCard key={suspect.id} suspect={suspect} selectable={false} />
          ))}
        </div>
      </section>

      {/* Scene Evidence & Leads Section */}
      <section className="space-y-4">
        <SectionTitle
          icon={<Search className="w-5 h-5" />}
          title={`Scene Evidence & Leads (${cluesDiscovered}/${cluesTotal})`}
          subtitle="+5 pts for each clue uncovered"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clues.map((clue) => (
            <ClueCard
              key={clue.id}
              clue={clue}
              onDiscover={handleDiscoverClue}
              discovering={discoveringId === clue.id}
            />
          ))}
        </div>
      </section>

      {/* Informant Hints Section */}
      <section>
        <HintPanel
          hints={hints}
          hintsUsed={hintsUsed}
          hintsTotal={hintsTotal}
          onRequestHint={handleRequestHint}
          requesting={requestingHint}
        />
      </section>

      {/* Ready to Accuse Call to Action */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-amber/20">
        <div>
          <h3 className="text-xl font-serif font-bold text-ghost">Ready to Close the File?</h3>
          <p className="text-sm text-muted mt-1">Once you submit your formal accusation, the case file will close permanently.</p>
        </div>
        <Link to={`/case/${id}/accuse`} className="btn-danger flex items-center gap-2 text-base px-8 py-3 w-full sm:w-auto justify-center">
          Accuse Suspect <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default InvestigationRoom
