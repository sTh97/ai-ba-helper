const cn = (...classes) => classes.filter(Boolean).join(" ");

const VARIANTS = {
  default: "bg-accent text-white hover:opacity-90 border-transparent",
  secondary: "bg-elevated text-secondary border-border hover:bg-overlay hover:text-primary",
  ghost: "bg-transparent text-secondary border-transparent hover:bg-elevated hover:text-primary",
  danger: "bg-red-soft text-red border-red/20 hover:bg-red hover:text-white",
  ai: "bg-ai-soft text-ai border-ai-border hover:bg-ai/10",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-sm gap-2",
};

const Button = ({
  children,
  variant = "default",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  icon: Icon,
  iconSize = 14,
  className = "",
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      "inline-flex items-center justify-center font-semibold rounded border",
      "transition-opacity duration-150",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      VARIANTS[variant] || VARIANTS.default,
      SIZES[size] || SIZES.md,
      className,
    )}
    {...props}
  >
    {Icon && <Icon size={iconSize} strokeWidth={1.75} aria-hidden />}
    {children}
  </button>
);

export default Button;
