import Button from "./Button";

const EmptyState = ({ icon, message, hint, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-3">
    {icon && (
      <div className="w-12 h-12 rounded flex items-center justify-center bg-elevated text-muted">
        {icon}
      </div>
    )}
    <div>
      <div className="text-[15px] font-medium text-secondary">{message}</div>
      {hint && <div className="text-[13px] text-muted mt-1">{hint}</div>}
    </div>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="mt-1">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
