import Spinner from './Spinner';

const variants = {
  primary: `
    bg-mint-500 hover:bg-mint-600 active:bg-mint-700
    text-white font-semibold
    shadow-sm hover:shadow-md
    hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2
  `,
  secondary: `
    bg-white hover:bg-slate-50 active:bg-slate-100
    text-forest-500 font-semibold
    border-2 border-mint-500 hover:border-mint-600
    focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2
  `,
  ghost: `
    text-mint-600 hover:text-mint-700 hover:bg-mint-50
    font-medium
  `,
  danger: `
    bg-error-500 hover:bg-error-700 text-white font-semibold
    focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2
  `,
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm sm:text-base',
  lg: 'w-full sm:w-auto px-8 py-3.5 sm:py-3 text-base sm:text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm
        cursor-pointer
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
}
