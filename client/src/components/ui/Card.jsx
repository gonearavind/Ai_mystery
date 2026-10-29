export const Card = ({ children, className = '', hover = true, glow = false }) => (
  <div className={`glass-card ${
    hover ? 'hover:shadow-card-hover hover:-translate-y-0.5' : ''
  } ${ glow ? 'shadow-amber-glow' : '' } ${className}`}>
    {children}
  </div>
);
export default Card;
