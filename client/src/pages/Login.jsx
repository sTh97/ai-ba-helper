import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderLeft: "2px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const focusOn = (e) => { e.target.style.borderLeftColor = "var(--accent)"; e.target.style.borderColor = "var(--accent)"; e.target.style.borderLeftWidth = "2px"; };
const focusOff = (e) => { e.target.style.borderColor = "var(--border)"; };

const Login = () => {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const isMobile = width < 860;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", background: "var(--bg-base)",
    }}>
      {/* Brand panel */}
      {!isMobile && (
        <div style={{
          width: "40%", maxWidth: 520, position: "relative", overflow: "hidden",
          background: "var(--bg-surface)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "44px 44px 48px",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(79,142,247,0.06) 0, rgba(79,142,247,0.06) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(79,142,247,0.06) 0, rgba(79,142,247,0.06) 1px, transparent 1px, transparent 40px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: "var(--header-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {[0, 1].map((row) =>
                  [0, 1, 2].map((col) => (
                    <rect key={`${row}-${col}`} x={col * 6 + 1} y={row * 8 + 1} width={4} height={6} rx={1}
                      fill={row === 0 && col === 2 ? "#fff" : "rgba(255,255,255,0.45)"} />
                  ))
                )}
              </svg>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
              Requify
            </span>
          </div>

          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1.2,
              color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px",
            }}>
              Structured intelligence<br />for business analysis.
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 16, lineHeight: 1.6, maxWidth: 360 }}>
              AI-powered business analysis. From brief to specification — user stories, test cases,
              architecture, and collateral, all in one workspace.
            </p>
          </div>

          <div className="ba-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            v1.0 · powered by local AI
          </div>
        </div>
      )}

      {/* Form panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="ba-page" style={{ width: "100%", maxWidth: 380 }}>
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: "var(--header-gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  {[0, 1].map((row) =>
                    [0, 1, 2].map((col) => (
                      <rect key={`${row}-${col}`} x={col * 6 + 1} y={row * 8 + 1} width={4} height={6} rx={1}
                        fill={row === 0 && col === 2 ? "#fff" : "rgba(255,255,255,0.45)"} />
                    ))
                  )}
                </svg>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text-primary)" }}>
                Requify
              </span>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
              Sign in
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={onKeyDown} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                required
                style={inputStyle}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                required
                style={inputStyle}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--radius)",
                background: "var(--red-soft)", border: "1px solid var(--red)",
                color: "var(--red)", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4, padding: "11px 20px", borderRadius: "var(--radius)",
                background: "var(--accent)", border: "none", color: "white",
                fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
              <span className="ba-mono">⌘ + Enter</span> to submit
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
