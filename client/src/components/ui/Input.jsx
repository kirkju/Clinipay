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
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`
            w-full px-4 py-3 sm:py-2.5
            bg-white border rounded-lg
            text-slate-800 text-base sm:text-sm
            placeholder:text-slate-400
            transition-all duration-200
            hover:border-slate-300
            focus:outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/25
            disabled:bg-slate-50 disabled:text-slate-400
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-error-500 focus:ring-error-500/25 focus:border-error-500' : 'border-slate-200'}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-error-500 text-xs mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
