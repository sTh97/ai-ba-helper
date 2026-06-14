const COLORS = {
  accent: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  green: { fg: "var(--green)", bg: "var(--green-soft)" },
  yellow: { fg: "var(--yellow)", bg: "var(--yellow-soft)" },
  red: { fg: "var(--red)", bg: "var(--red-soft)" },
  purple: { fg: "var(--purple)", bg: "var(--purple-soft)" },
  ai: { fg: "var(--ai-accent)", bg: "var(--ai-soft)" },
  muted: { fg: "var(--text-muted)", bg: "var(--bg-elevated)" },
};

const Badge = ({ children, color = "muted", style, mono = false }) => {
  const c = COLORS[color] || COLORS.muted;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, lineHeight: 1.4,
      letterSpacing: "0.5px", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 99,
      color: c.fg, background: c.bg,
      fontFamily: mono ? "var(--mono)" : "inherit",
      ...style,
    }}>
      {children}
    </span>
  );
};

export default Badge;
