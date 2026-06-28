import { X } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Modal = ({
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-md",
  className = "",
}) => (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/55 backdrop-blur-sm"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? "modal-title" : undefined}
  >
    <div
      className={cn(
        "w-full bg-surface border border-border rounded-lg p-6 shadow-2xl",
        maxWidth,
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {(title || onClose) && (
        <div className="flex items-center justify-between mb-5">
          {title && (
            <h2 id="modal-title" className="m-0 text-sm font-semibold text-primary">
              {title}
            </h2>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 text-muted bg-transparent border-none cursor-pointer rounded hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
      {children}
      {footer && <div className="flex gap-2.5 mt-4">{footer}</div>}
    </div>
  </div>
);

export default Modal;
