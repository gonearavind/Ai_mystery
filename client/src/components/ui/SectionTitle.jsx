export const SectionTitle = ({ icon, title, subtitle, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    {icon && <div className="text-amber mt-0.5 shrink-0">{icon}</div>}
    <div>
      <h2 className="font-serif text-xl font-bold text-ghost">{title}</h2>
      {subtitle && <p className="text-muted text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);
export default SectionTitle;
