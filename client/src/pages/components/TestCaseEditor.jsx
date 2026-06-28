import { useState } from "react";
import { Sparkle, X } from "lucide-react";

const countOf = (v) => (Array.isArray(v) ? v.length : v ? 1 : 0);

const SectionIcons = {
  feature: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  story: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  criteria: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  test: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V2"/><path d="M7 2h10"/>
    </svg>
  ),
  fields: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  rules: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  validation: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  edge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  constraints: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  deps: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  impact: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  dor: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  dod: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

const inputStyle = {
  width: "100%", padding: "8px 12px",
  background: "var(--bg-base)", border: "1px solid var(--border)",
  borderRadius: 7, color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", resize: "vertical",
  boxSizing: "border-box",
};

const TestCaseEditor = ({
  aiResult,
  setAiResult,
  handleAccept,
  handleDiscard,
  storyIndex,
  title,
  showActions = true,
  acceptLabel = "Accept & Save",
}) => {
  const updateList = (listName, index, value) => {
    const updated = [...aiResult[listName]];
    updated[index] = value;
    setAiResult({ ...aiResult, [listName]: updated });
  };

  const deleteItem = (listName, index) => {
    const updated = aiResult[listName].filter((_, i) => i !== index);
    setAiResult({ ...aiResult, [listName]: updated });
  };

  const addTestCase = (type) => {
    const key = type === "positive" ? "happyTests" : "negativeTests";
    setAiResult({ ...aiResult, [key]: [...(aiResult[key] || []), ""] });
  };

  const updateSafeList = (listName, index, value) => {
    const list = [...(aiResult[listName] || [])];
    list[index] = value;
    setAiResult({ ...aiResult, [listName]: list });
  };

  const removeSafeListItem = (listName, index) => {
    setAiResult({ ...aiResult, [listName]: (aiResult[listName] || []).filter((_, i) => i !== index) });
  };

  const addSafeListItem = (listName) => {
    setAiResult({ ...aiResult, [listName]: [...(aiResult[listName] || []), ""] });
  };

  const updateField = (index, key, value) => {
    const list = (aiResult.fields || []).map((f, i) => (i === index ? { ...f, [key]: value } : f));
    setAiResult({ ...aiResult, fields: list });
  };

  const addField = () => {
    setAiResult({ ...aiResult, fields: [...(aiResult.fields || []), { name: "", type: "text", description: "" }] });
  };

  const removeField = (index) => {
    setAiResult({ ...aiResult, fields: (aiResult.fields || []).filter((_, i) => i !== index) });
  };

  const renderTests = (type) => {
    const key = type === "positive" ? "happyTests" : "negativeTests";
    const items = aiResult[key] || [];
    const color = type === "positive" ? "var(--green)" : "var(--red)";
    const soft = type === "positive" ? "var(--green-soft)" : "var(--red-soft)";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((text, idx) => (
          <div key={idx} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{
              marginTop: 8, fontSize: 10, fontWeight: 600, padding: "3px 7px",
              borderRadius: 99, flexShrink: 0, letterSpacing: "0.3px",
              background: soft, color,
            }}>
              {type === "positive" ? "POS" : "NEG"}
            </span>
            <textarea
              style={{ ...inputStyle, flex: 1, minHeight: 40 }}
              value={text}
              onChange={(e) => updateList(key, idx, e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = color)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={() => deleteItem(key, idx)}
              style={{ marginTop: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
            > <X size={14} strokeWidth={1.75} /></button>
          </div>
        ))}
        <button
          onClick={() => addTestCase(type)}
          style={{
            marginTop: 4, padding: "7px 12px", borderRadius: 7,
            background: soft, border: `1px dashed ${color}44`,
            color, fontSize: 12, fontWeight: 500, cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >+ {type === "positive" ? "Positive" : "Negative"} Test</button>
      </div>
    );
  };

  const displayTitle = title || (storyIndex != null ? `User Story ${storyIndex + 1}` : "AI Enhanced Output");

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--ai-border)",
      borderLeft: "2px solid var(--ai-border)",
      borderRadius: "var(--radius-lg)", marginTop: 20, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--ai-border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--ai-soft)",
      }}>
        <Sparkle size={13} strokeWidth={1.75} className="text-ai" />
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          {displayTitle}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, padding: "2px 8px",
          background: "var(--ai-soft)", borderRadius: 99, color: "var(--ai-accent)", fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}><Sparkle size={11} strokeWidth={1.75} aria-hidden /> AI Generated</span>
      </div>

      <div style={{ padding: "20px" }}>
        <Section title="Feature" icon={SectionIcons.feature} count={countOf(aiResult.feature)}>
          <input
            style={inputStyle}
            placeholder="Feature / module this story belongs to (e.g. Leave Management)"
            value={aiResult.feature || ""}
            onChange={(e) => setAiResult({ ...aiResult, feature: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="Corrected Text" icon={SectionIcons.story} defaultOpen count={countOf(aiResult.correctedText)}>
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={aiResult.correctedText}
            onChange={(e) => setAiResult({ ...aiResult, correctedText: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="Acceptance Criteria" icon={SectionIcons.criteria} defaultOpen count={countOf(aiResult.acceptanceCriteria)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(aiResult.acceptanceCriteria || []).map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 9, flexShrink: 0, minWidth: 20, textAlign: "right" }}>
                  {index + 1}.
                </span>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={item}
                  onChange={(e) => updateList("acceptanceCriteria", index, e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={() => deleteItem("acceptanceCriteria", index)}
                  style={{ marginTop: 6, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}
                > <X size={14} strokeWidth={1.75} /></button>
              </div>
            ))}
            <button
              onClick={() => setAiResult({ ...aiResult, acceptanceCriteria: [...(aiResult.acceptanceCriteria || []), ""] })}
              style={{
                marginTop: 4, padding: "7px 12px", borderRadius: 7,
                background: "var(--accent-soft)", border: "1px dashed var(--accent)44",
                color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >+ Add Criteria</button>
          </div>
        </Section>

        <Section title="Happy Tests" icon={SectionIcons.test} defaultOpen count={(aiResult.happyTests || []).length}>
          {renderTests("positive")}
        </Section>

        <Section title="Negative Tests" icon={SectionIcons.test} count={(aiResult.negativeTests || []).length}>
          {renderTests("negative")}
        </Section>

        <Section title="Field Level Description" icon={SectionIcons.fields} count={countOf(aiResult.fields)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(aiResult.fields || []).length > 0 && (
              <div style={{ display: "flex", gap: 6, padding: "0 2px" }}>
                <span style={{ flex: "0 0 30%", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Field</span>
                <span style={{ flex: "0 0 22%", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Type</span>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>Description</span>
                <span style={{ width: 22 }} />
              </div>
            )}
            {(aiResult.fields || []).map((field, index) => (
              <div key={index} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <input
                  style={{ ...inputStyle, flex: "0 0 30%" }}
                  placeholder="Field name"
                  value={field.name || ""}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <input
                  style={{ ...inputStyle, flex: "0 0 22%" }}
                  placeholder="type"
                  list="field-type-options"
                  value={field.type || ""}
                  onChange={(e) => updateField(index, "type", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Description"
                  value={field.description || ""}
                  onChange={(e) => updateField(index, "description", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={() => removeField(index)}
                  style={{ marginTop: 6, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}
                > <X size={14} strokeWidth={1.75} /></button>
              </div>
            ))}
            <datalist id="field-type-options">
              {["text", "email", "number", "date", "datetime", "dropdown", "checkbox", "radio", "textarea", "file", "currency", "boolean", "phone", "url", "password"].map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <button
              onClick={addField}
              style={{
                marginTop: 4, padding: "7px 12px", borderRadius: 7,
                background: "var(--accent-soft)", border: "1px dashed var(--accent)44",
                color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >+ Add Field</button>
          </div>
        </Section>

        <Section title="Business Rules" icon={SectionIcons.rules} count={countOf(aiResult.businessRules)}>
          <ListEditor
            items={aiResult.businessRules}
            onChange={(i, v) => updateSafeList("businessRules", i, v)}
            onRemove={(i) => removeSafeListItem("businessRules", i)}
            onAdd={() => addSafeListItem("businessRules")}
            addLabel="+ Add Business Rule"
            placeholder="e.g. A user can only have one active leave request at a time"
          />
        </Section>

        <Section title="Validation" icon={SectionIcons.validation} count={countOf(aiResult.validations)}>
          <ListEditor
            items={aiResult.validations}
            onChange={(i, v) => updateSafeList("validations", i, v)}
            onRemove={(i) => removeSafeListItem("validations", i)}
            onAdd={() => addSafeListItem("validations")}
            addLabel="+ Add Validation"
            placeholder="e.g. Email must be a valid format and is required"
          />
        </Section>

        <Section title="Edge Cases" icon={SectionIcons.edge} count={countOf(aiResult.edgeCases)}>
          <ListEditor
            items={aiResult.edgeCases}
            onChange={(i, v) => updateSafeList("edgeCases", i, v)}
            onRemove={(i) => removeSafeListItem("edgeCases", i)}
            onAdd={() => addSafeListItem("edgeCases")}
            addLabel="+ Add Edge Case"
            placeholder="e.g. Request spanning two calendar years"
          />
        </Section>

        <Section title="Constraints" icon={SectionIcons.constraints} count={countOf(aiResult.constraints)}>
          <ListEditor
            items={aiResult.constraints}
            onChange={(i, v) => updateSafeList("constraints", i, v)}
            onRemove={(i) => removeSafeListItem("constraints", i)}
            onAdd={() => addSafeListItem("constraints")}
            addLabel="+ Add Constraint"
            placeholder="e.g. Must comply with regional labor regulations"
          />
        </Section>

        <Section title="Dependencies" icon={SectionIcons.deps} count={countOf(aiResult.dependencies)}>
          <ListEditor
            items={aiResult.dependencies}
            onChange={(i, v) => updateSafeList("dependencies", i, v)}
            onRemove={(i) => removeSafeListItem("dependencies", i)}
            onAdd={() => addSafeListItem("dependencies")}
            addLabel="+ Add Dependency"
            placeholder="e.g. Depends on the Authentication service / Story #12"
          />
        </Section>

        <Section title="Business Impact" icon={SectionIcons.impact} count={countOf(aiResult.businessImpact)}>
          <textarea
            style={{ ...inputStyle, minHeight: 64 }}
            placeholder="Describe the business value / impact of this story…"
            value={aiResult.businessImpact || ""}
            onChange={(e) => setAiResult({ ...aiResult, businessImpact: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="Definition of Ready (DoR)" icon={SectionIcons.dor} count={countOf(aiResult.definitionOfReady)}>
          <ListEditor
            items={aiResult.definitionOfReady}
            onChange={(i, v) => updateSafeList("definitionOfReady", i, v)}
            onRemove={(i) => removeSafeListItem("definitionOfReady", i)}
            onAdd={() => addSafeListItem("definitionOfReady")}
            addLabel="+ Add DoR Item"
            placeholder="e.g. Acceptance criteria reviewed and approved by PO"
          />
        </Section>

        <Section title="Definition of Done (DoD)" icon={SectionIcons.dod} count={countOf(aiResult.definitionOfDone)}>
          <ListEditor
            items={aiResult.definitionOfDone}
            onChange={(i, v) => updateSafeList("definitionOfDone", i, v)}
            onRemove={(i) => removeSafeListItem("definitionOfDone", i)}
            onAdd={() => addSafeListItem("definitionOfDone")}
            addLabel="+ Add DoD Item"
            placeholder="e.g. Code merged, tests passing, and deployed to staging"
          />
        </Section>

        {showActions && (
          <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <button
              onClick={handleAccept}
              style={{
                padding: "9px 22px", borderRadius: "var(--radius)",
                background: "var(--green)", border: "none", color: "#0a0b0f",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >{acceptLabel}</button>
            <button
              onClick={handleDiscard}
              style={{
                padding: "9px 16px", borderRadius: "var(--radius)",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer",
              }}
            >Discard</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ListEditor = ({ items, onChange, onRemove, onAdd, addLabel, placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {(items || []).map((item, index) => (
      <div key={index} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 9, flexShrink: 0, minWidth: 20, textAlign: "right" }}>
          {index + 1}.
        </span>
        <textarea
          style={{ ...inputStyle, flex: 1, minHeight: 38 }}
          value={item}
          placeholder={placeholder}
          onChange={(e) => onChange(index, e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={() => onRemove(index)}
          style={{ marginTop: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}
        > <X size={14} strokeWidth={1.75} /></button>
      </div>
    ))}
    <button
      onClick={onAdd}
      style={{
        marginTop: 4, padding: "7px 12px", borderRadius: 7,
        background: "var(--accent-soft)", border: "1px dashed var(--accent)44",
        color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
        alignSelf: "flex-start",
      }}
    >{addLabel}</button>
  </div>
);

const Section = ({ title, icon, children, count, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", background: "var(--bg-elevated)", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ display: "flex", color: "var(--text-muted)" }}>{icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {title}
        </span>
        {count != null && count > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
            background: "var(--ai-soft)", color: "var(--ai-accent)",
          }}>{count}</span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>▾</span>
      </button>
      <div style={{
        maxHeight: open ? 4000 : 0, overflow: "hidden",
        transition: "max-height 0.18s ease",
      }}>
        <div style={{ padding: open ? "14px 12px" : "0 12px" }}>{children}</div>
      </div>
    </div>
  );
};

export default TestCaseEditor;
