const cn = (...classes) => classes.filter(Boolean).join(" ");

const Input = ({
  label,
  error,
  hint,
  className = "",
  inputClassName = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 text-sm text-primary bg-elevated",
          "border border-border rounded border-l-2 border-l-border",
          "font-sans outline-none transition-colors duration-150",
          "placeholder:text-muted",
          "focus:border-accent focus:border-l-accent",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          error && "border-red border-l-red",
          inputClassName,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
};

export default Input;
