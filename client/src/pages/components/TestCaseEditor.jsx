import { useState } from "react";

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

  const allTests = [
    ...(aiResult.happyTests || []).map((t, i) => ({ text: t, type: "positive", key: "happyTests", idx: i })),
    ...(aiResult.negativeTests || []).map((t, i) => ({ text: t, type: "negative", key: "negativeTests", idx: i })),
  ];

  const displayTitle = title || (storyIndex != null ? `User Story ${storyIndex + 1}` : "AI Enhanced Output");

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderLeft: "3px solid var(--accent)",
      borderRadius: "var(--radius-lg)", marginTop: 20, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--bg-elevated)",
      }}>
        <span style={{ fontSize: 14 }}>✨</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          {displayTitle}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, padding: "2px 8px",
          background: "var(--accent-soft)", borderRadius: 99, color: "var(--accent)", fontWeight: 500,
        }}>Review & Edit</span>
      </div>

      <div style={{ padding: "20px" }}>
        <Section title="Feature" icon="🏷️">
          <input
            style={inputStyle}
            placeholder="Feature / module this story belongs to (e.g. Leave Management)"
            value={aiResult.feature || ""}
            onChange={(e) => setAiResult({ ...aiResult, feature: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="User Story" icon="📝">
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={aiResult.correctedText}
            onChange={(e) => setAiResult({ ...aiResult, correctedText: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="Acceptance Criteria" icon="✅">
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
                >✕</button>
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

        <Section title="Test Cases" icon="🧪">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {allTests.map((tc) => (
              <div key={`${tc.key}-${tc.idx}`} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{
                  marginTop: 8, fontSize: 10, fontWeight: 600, padding: "3px 7px",
                  borderRadius: 99, flexShrink: 0, letterSpacing: "0.3px",
                  background: tc.type === "positive" ? "var(--green-soft)" : "var(--red-soft)",
                  color: tc.type === "positive" ? "var(--green)" : "var(--red)",
                }}>
                  {tc.type === "positive" ? "POS" : "NEG"}
                </span>
                <textarea
                  style={{ ...inputStyle, flex: 1, minHeight: 40 }}
                  value={tc.text}
                  onChange={(e) => updateList(tc.key, tc.idx, e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = tc.type === "positive" ? "var(--green)" : "var(--red)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={() => deleteItem(tc.key, tc.idx)}
                  style={{ marginTop: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
                >✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => addTestCase("positive")}
                style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "var(--green-soft)", border: "1px dashed var(--green)44",
                  color: "var(--green)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >+ Positive Test</button>
              <button
                onClick={() => addTestCase("negative")}
                style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "var(--red-soft)", border: "1px dashed var(--red)44",
                  color: "var(--red)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >+ Negative Test</button>
            </div>
          </div>
        </Section>

        <Section title="Field Level Description" icon="🗂️">
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
                >✕</button>
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

        <Section title="Business Rules" icon="📐">
          <ListEditor
            items={aiResult.businessRules}
            onChange={(i, v) => updateSafeList("businessRules", i, v)}
            onRemove={(i) => removeSafeListItem("businessRules", i)}
            onAdd={() => addSafeListItem("businessRules")}
            addLabel="+ Add Business Rule"
            placeholder="e.g. A user can only have one active leave request at a time"
          />
        </Section>

        <Section title="Validation" icon="🔎">
          <ListEditor
            items={aiResult.validations}
            onChange={(i, v) => updateSafeList("validations", i, v)}
            onRemove={(i) => removeSafeListItem("validations", i)}
            onAdd={() => addSafeListItem("validations")}
            addLabel="+ Add Validation"
            placeholder="e.g. Email must be a valid format and is required"
          />
        </Section>

        <Section title="Edge Cases" icon="⚠️">
          <ListEditor
            items={aiResult.edgeCases}
            onChange={(i, v) => updateSafeList("edgeCases", i, v)}
            onRemove={(i) => removeSafeListItem("edgeCases", i)}
            onAdd={() => addSafeListItem("edgeCases")}
            addLabel="+ Add Edge Case"
            placeholder="e.g. Request spanning two calendar years"
          />
        </Section>

        <Section title="Constraints" icon="⛓️">
          <ListEditor
            items={aiResult.constraints}
            onChange={(i, v) => updateSafeList("constraints", i, v)}
            onRemove={(i) => removeSafeListItem("constraints", i)}
            onAdd={() => addSafeListItem("constraints")}
            addLabel="+ Add Constraint"
            placeholder="e.g. Must comply with regional labor regulations"
          />
        </Section>

        <Section title="Dependencies" icon="🔗">
          <ListEditor
            items={aiResult.dependencies}
            onChange={(i, v) => updateSafeList("dependencies", i, v)}
            onRemove={(i) => removeSafeListItem("dependencies", i)}
            onAdd={() => addSafeListItem("dependencies")}
            addLabel="+ Add Dependency"
            placeholder="e.g. Depends on the Authentication service / Story #12"
          />
        </Section>

        <Section title="Business Impact" icon="📈">
          <textarea
            style={{ ...inputStyle, minHeight: 64 }}
            placeholder="Describe the business value / impact of this story…"
            value={aiResult.businessImpact || ""}
            onChange={(e) => setAiResult({ ...aiResult, businessImpact: e.target.value })}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Section>

        <Section title="Definition of Ready (DoR)" icon="🟢">
          <ListEditor
            items={aiResult.definitionOfReady}
            onChange={(i, v) => updateSafeList("definitionOfReady", i, v)}
            onRemove={(i) => removeSafeListItem("definitionOfReady", i)}
            onAdd={() => addSafeListItem("definitionOfReady")}
            addLabel="+ Add DoR Item"
            placeholder="e.g. Acceptance criteria reviewed and approved by PO"
          />
        </Section>

        <Section title="Definition of Done (DoD)" icon="🏁">
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
        >✕</button>
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

const Section = ({ title, icon, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

export default TestCaseEditor;
