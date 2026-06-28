import { Sparkle } from "lucide-react";

const Card = ({ children, variant = "default", padding = "22px 24px", aiLabel = "AI Generated", style }) => {
  const isAi = variant === "ai";
  const base = {
    background: isAi ? "var(--ai-soft)" : "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    position: "relative",
    padding,
    ...style,
  };

  if (isAi) {
    base.borderLeft = "2px solid var(--ai-border)";
    base.border = "1px solid var(--ai-border)";
  }
  if (variant === "elevated") {
    base.background = "var(--bg-elevated)";
  }

  return (
    <div style={base}>
      {isAi && (
        <span style={{
          position: "absolute", top: 12, right: 14, zIndex: 1,
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, color: "var(--ai-accent)",
          letterSpacing: "0.3px",
        }}>
          <Sparkle size={11} strokeWidth={1.75} aria-hidden /> {aiLabel}
        </span>
      )}
      {children}
    </div>
  );
};

export default Card;
