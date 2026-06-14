import { useEffect, useRef, useState } from "react";

/**
 * Inline confirmation button — replaces window.confirm().
 * First click swaps the label to a "Confirm?" state for `window` ms;
 * a second click within that window triggers onConfirm.
 */
const ConfirmButton = ({
  onConfirm,
  label = "Delete",
  confirmLabel = "Confirm?",
  color = "red",
  style,
  window: timeoutMs = 3000,
  title,
}) => {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const colorVar = color === "red" ? "var(--red)" : color === "accent" ? "var(--accent)" : "var(--yellow)";
  const softVar = color === "red" ? "var(--red-soft)" : color === "accent" ? "var(--accent-soft)" : "var(--yellow-soft)";

  const handleClick = (e) => {
    e.stopPropagation();
    if (armed) {
      clearTimeout(timer.current);
      setArmed(false);
      onConfirm();
    } else {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), timeoutMs);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title || label}
      style={{
        padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: armed ? 700 : 500,
        cursor: "pointer", whiteSpace: "nowrap",
        background: armed ? colorVar : softVar,
        border: `1px solid ${armed ? colorVar : colorVar + "22"}`,
        color: armed ? "#fff" : colorVar,
        transition: "background 0.12s, color 0.12s",
        ...style,
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
};

export default ConfirmButton;
