const variants = {
  easy:    'bg-emerald/15 text-emerald border border-emerald/25',
  medium:  'bg-amber/15 text-amber border border-amber/25',
  hard:    'bg-crimson/15 text-crimson border border-crimson/25',
  amber:   'bg-amber/15 text-amber border border-amber/25',
  crimson: 'bg-crimson/15 text-crimson border border-crimson/25',
  emerald: 'bg-emerald/15 text-emerald border border-emerald/25',
  ghost:   'bg-white/8 text-ghost border border-white/10',
};
export const Badge = ({ children, variant = 'ghost', className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider ${variants[variant] || variants.ghost} ${className}`}>
    {children}
  </span>
);
export default Badge;
