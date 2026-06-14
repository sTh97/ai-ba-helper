const PageHeader = ({ title, subtitle, actions, style }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 16, marginBottom: 24, flexWrap: "wrap", ...style,
  }}>
    <div style={{ minWidth: 0 }}>
      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 21,
        color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px",
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 5, marginBottom: 0, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
