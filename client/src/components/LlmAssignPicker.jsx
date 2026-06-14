import { getTierStyle } from "../context/LLMContext";

const TierBadge = ({ tier, tierLabel }) => {
  const style = getTierStyle(tier);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
      padding: "2px 6px", borderRadius: 99, flexShrink: 0,
      color: style.color,
      background: `color-mix(in srgb, ${style.color} 16%, transparent)`,
      border: `1px solid color-mix(in srgb, ${style.color} 30%, transparent)`,
    }}>
      {tierLabel || style.label}
    </span>
  );
};

const LlmAssignPicker = ({
  models = [],
  selectedIds = [],
  onChange,
  emptyLabel = "All models (no restriction)",
  hint,
}) => {
  const selectedSet = new Set(selectedIds);
  const allSelected = models.length > 0 && models.every((m) => selectedSet.has(m.id));

  const toggle = (id) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((entry) => entry !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  const selectAll = () => onChange(models.map((m) => m.id));
  const clearAll = () => onChange([]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Allowed AI Models</div>
          {hint && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={selectAll} style={actionBtnStyle}>Select all</button>
          <button type="button" onClick={clearAll} style={actionBtnStyle}>Clear</button>
        </div>
      </div>

      {selectedIds.length === 0 && (
        <div style={{
          fontSize: 11, color: "var(--text-muted)", marginBottom: 10,
          padding: "8px 10px", borderRadius: "var(--radius)",
          background: "var(--bg-elevated)", border: "1px dashed var(--border)",
        }}>
          {emptyLabel}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 8,
        maxHeight: 280,
        overflowY: "auto",
        padding: 2,
      }}>
        {models.map((model) => {
          const checked = selectedSet.has(model.id);
          return (
            <label
              key={model.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 12px", borderRadius: "var(--radius)",
                border: `1px solid ${checked ? "color-mix(in srgb, var(--accent) 40%, var(--border))" : "var(--border)"}`,
                background: checked ? "var(--accent-soft)" : "var(--bg-elevated)",
                cursor: "pointer",
                opacity: model.configured === false ? 0.72 : 1,
              }}
            >
              <input
                type="checkbox"
                className="ba-check"
                checked={checked}
                onChange={() => toggle(model.id)}
                style={{ marginTop: 2 }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{model.label}</span>
                  <TierBadge tier={model.tier} tierLabel={model.tierLabel} />
                  {!model.configured && (
                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Not configured</span>
                  )}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.35 }}>
                  {model.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {selectedIds.length > 0 && !allSelected && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          {selectedIds.length} of {models.length} models selected
        </div>
      )}
    </div>
  );
};

const actionBtnStyle = {
  padding: "4px 10px",
  borderRadius: 6,
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
};

export default LlmAssignPicker;
