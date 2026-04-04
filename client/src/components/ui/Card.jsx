export default function Card({ image, title, children, className = '', onClick }) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
        transition-all duration-200 hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {image && (
        <div className="h-48 bg-gradient-to-br from-primary-light/30 to-primary/20 flex items-center justify-center">
          {typeof image === 'string' ? (
            <img
              src={image}
              alt={title || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            image
          )}
        </div>
      )}
      <div className="p-5">
        {title && (
          <h3 className="text-lg font-semibold text-text-dark mb-2">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
