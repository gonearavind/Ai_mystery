import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCase, accuseCase } from '../api/cases'
import { getErrorMessage } from '../api/axiosInstance'
import { SuspectCard } from '../components/SuspectCard'
import { Loader, InlineLoader } from '../components/Loader'
import { ErrorBanner } from '../components/ErrorBanner'
import { useToast } from '../components/Toast'
import { Users, FileText, AlertTriangle, ChevronRight, Scale, ArrowLeft } from 'lucide-react'
import SectionTitle from '../components/ui/SectionTitle'
import Badge from '../components/ui/Badge'

export const Accusation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [caseData, setCaseData] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [selectedSuspectId, setSelectedSuspectId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch case data
  const loadCase = useCallback(async () => {
    try {
      setInitialLoading(true)
      setFetchError(null)
      const data = await getCase(id)

      if (data.status === 'completed') {
        navigate(`/case/${id}/result`, { replace: true })
        return
      }

      setCaseData(data)
    } catch (err) {
      setFetchError(getErrorMessage(err, 'Failed to retrieve case records for accusation.'))
    } finally {
      setInitialLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadCase()
  }, [loadCase])

  const handleSelectSuspect = (suspect) => {
    setSelectedSuspectId(suspect.id)
  }

  const handleOpenConfirm = () => {
    if (!selectedSuspectId) return
    setShowConfirmModal(true)
  }

  const handleCloseConfirm = () => {
    if (submitting) return
    setShowConfirmModal(false)
  }

  const handleFinalSubmit = async () => {
    if (!selectedSuspectId || submitting) return

    try {
      setSubmitting(true)
      await accuseCase(id, selectedSuspectId)
      addToast('Accusation recorded. Unveiling the truth...', 'success')
      navigate(`/case/${id}/result`, { replace: true })
    } catch (err) {
      setSubmitting(false)
      setShowConfirmModal(false)
      const msg = getErrorMessage(err, 'Failed to submit accusation. Please try again.')
      addToast(msg, 'error')
    }
  }

  if (initialLoading) {
    return <Loader message="Accessing accusation chamber..." subtitle="Securing testimonies and final statements..." />
  }

  if (fetchError || !caseData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <ErrorBanner message={fetchError || 'Unable to load accusation room.'} onRetry={loadCase} />
        <div className="text-center">
          <Link to={`/case/${id}`} className="btn-ghost inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Return to Investigation Room
          </Link>
        </div>
      </div>
    )
  }

  const { title, suspects = [], clues = [] } = caseData
  const discoveredClues = clues.filter((c) => c.discovered)
  const selectedSuspect = suspects.find((s) => s.id === selectedSuspectId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <Link
          to={`/case/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-amber hover:text-amber-light transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Crime Scene Investigation
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">Final Phase</span>
              <Badge variant="crimson">Irreversible Decision</Badge>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-ghost">
              Formal Accusation
            </h1>
            <p className="text-sm text-muted mt-1">
              Case Dossier: <span className="text-ghost font-serif">{title}</span>
            </p>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-surface-elevated/80 border border-white/6 rounded-xl p-4 text-sm text-muted space-y-1">
          <p className="text-ghost font-serif font-semibold">
            Who committed the crime?
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Select one suspect below and present your accusation. Make sure your conclusion
            aligns with the discovered evidence and timeline. Once submitted, the official case verdict will be delivered.
          </p>
        </div>
      </div>

      {/* Suspect Selection Grid */}
      <section className="space-y-4">
        <SectionTitle
          icon={<Users className="w-5 h-5" />}
          title={`Select Culprit (${suspects.length} Suspects)`}
          subtitle="Click to designate the prime suspect"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suspects.map((suspect) => (
            <SuspectCard
              key={suspect.id}
              suspect={suspect}
              selectable={true}
              selected={selectedSuspectId === suspect.id}
              onSelect={handleSelectSuspect}
            />
          ))}
        </div>
      </section>

      {/* Discovered Clues Summary */}
      <section aria-labelledby="clues-summary-heading" className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/6 pb-3">
          <SectionTitle
            icon={<FileText className="w-5 h-5" />}
            title={`Discovered Evidence Summary (${discoveredClues.length} revealed)`}
            subtitle="Review your leads before pointing fingers"
          />
          <Link
            to={`/case/${id}`}
            className="text-xs text-amber hover:text-amber-light font-mono transition-colors"
          >
            Search for more clues →
          </Link>
        </div>

        {discoveredClues.length === 0 ? (
          <p className="text-sm text-muted italic py-2">
            You haven't uncovered any physical clues yet! Returning to the scene to examine evidence will significantly improve your chances.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discoveredClues.map((clue) => (
              <div
                key={clue.id}
                className="p-3.5 rounded-xl bg-surface-elevated/70 border border-white/6 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-muted font-mono">
                  <span className="text-amber uppercase font-semibold">{clue.id}</span>
                  <span className="italic">{clue.location}</span>
                </div>
                <div className="font-serif font-semibold text-ghost text-sm">
                  {clue.title}
                </div>
                <p className="text-muted leading-relaxed line-clamp-2">
                  {clue.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky Bottom Accusation Bar */}
      <div className="sticky bottom-6 z-30 glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-crimson/30 shadow-card-hover">
        <div className="text-center sm:text-left">
          <span className="section-label block">Target of Accusation</span>
          <span className="text-lg font-serif font-bold text-ghost">
            {selectedSuspect ? selectedSuspect.name : 'No suspect selected yet'}
          </span>
          {selectedSuspect && (
            <span className="text-xs text-amber font-mono ml-2 uppercase">({selectedSuspect.role})</span>
          )}
        </div>

        <button
          type="button"
          disabled={!selectedSuspectId || submitting}
          onClick={handleOpenConfirm}
          className="btn-danger w-full sm:w-auto flex items-center justify-center gap-2 text-base"
        >
          <span>Submit Accusation</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-bg/85 backdrop-blur-md animate-fade-in"
        >
          <div className="glass-card border-crimson/50 max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl text-ghost animate-bounce-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 id="confirm-modal-title" className="font-serif text-xl font-bold text-ghost">
                  Confirm Accusation
                </h3>
                <span className="section-label text-crimson">Final & Binding</span>
              </div>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              Are you confident that{' '}
              <strong className="text-amber font-serif text-base">
                {selectedSuspect?.name}
              </strong>{' '}
              is the true culprit? Once submitted, the case file will close permanently and the truth will be revealed.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleCloseConfirm}
                className="btn-ghost w-full sm:w-auto text-sm"
              >
                Review Evidence
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="btn-danger w-full sm:w-auto text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <InlineLoader size="sm" />
                    <span>Delivering Verdict...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Accuse</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accusation
