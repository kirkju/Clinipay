export default function Input({
  label,
  error,
  icon: Icon,
  id,
  className = '',
  type = 'text',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-dark mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`
            w-full rounded-lg border bg-white px-4 py-2.5
            text-text-dark placeholder-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-error focus:ring-error/50 focus:border-error' : 'border-gray-300'}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
