const EmptyState = ({ icon, message, hint, actionLabel, onAction }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", textAlign: "center", padding: "48px 24px", gap: 12,
  }}>
    {icon && (
      <div style={{
        width: 48, height: 48, borderRadius: "var(--radius)",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-elevated)", color: "var(--text-muted)",
      }}>
        {icon}
      </div>
    )}
    <div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-secondary)" }}>
        {message}
      </div>
      {hint && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        style={{
          marginTop: 4, padding: "9px 18px", borderRadius: "var(--radius)",
          background: "var(--accent)", border: "none", color: "white",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
