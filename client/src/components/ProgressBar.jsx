export const ProgressBar = ({ value = 0, label, sublabel }) => (
  <div role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    {(label || sublabel) && (
      <div className="flex items-center justify-between mb-1.5">
        {label && <span className="section-label">{label}</span>}
        {sublabel && <span className="text-xs text-muted font-mono">{sublabel}</span>}
      </div>
    )}
    <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: 'linear-gradient(90deg, #f5b942, #fcd97a)' }}
      />
    </div>
  </div>
)
export default ProgressBar
