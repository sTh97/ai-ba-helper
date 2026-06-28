import { createContext, useCallback, useContext, useState } from "react";
import { Check, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { color: "var(--green)", soft: "var(--green-soft)", Icon: Check },
  error: { color: "var(--red)", soft: "var(--red-soft)", Icon: X },
  info: { color: "var(--accent)", soft: "var(--accent-soft)", Icon: Info },
};

const DURATION = 2800;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), DURATION);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 2000,
        display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const v = VARIANTS[t.type] || VARIANTS.info;
          const Icon = v.Icon;
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                pointerEvents: "auto", cursor: "pointer", position: "relative",
                minWidth: 240, maxWidth: 360, overflow: "hidden",
                padding: "12px 16px 13px", borderRadius: "var(--radius)",
                background: "var(--bg-overlay)", border: `1px solid ${v.color}`,
                display: "flex", alignItems: "center", gap: 10,
                animation: "ba-toast-in 0.2s ease-out",
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 99, flexShrink: 0,
                background: v.soft, color: v.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={12} strokeWidth={1.75} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {t.message}
              </span>
              <span style={{
                position: "absolute", left: 0, bottom: 0, height: 2, width: "100%",
                background: v.color, transformOrigin: "left",
                animation: `ba-toast-progress ${DURATION}ms linear forwards`,
              }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
};
