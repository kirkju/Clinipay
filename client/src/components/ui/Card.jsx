export default function Card({ children, className = '', onClick, hover = true }) {
  return (
    <div
      className={`
        group bg-white rounded-2xl
        border border-slate-200
        shadow-card
        ${hover ? 'hover:shadow-card-hover hover:-translate-y-1' : ''}
        transition-all duration-300 ease-out
        overflow-hidden flex flex-col
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
