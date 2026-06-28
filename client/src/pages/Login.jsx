import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import LogoMark from "../components/LogoMark";
import { APP_VERSION_LABEL } from "../constants/appInfo";

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
    <div className="min-h-screen flex bg-base">
      {!isMobile && (
        <div className="w-[40%] max-w-[520px] relative overflow-hidden bg-surface border-r border-border flex flex-col justify-between p-11">
          <div className="flex items-center gap-3">
            <LogoMark size={34} />
            <span className="font-display font-extrabold text-[17px] text-primary tracking-tight">
              Requify
            </span>
          </div>

          <div>
            <h1 className="font-display font-extrabold text-[30px] leading-tight text-primary m-0 tracking-tight">
              Structured intelligence<br />for business analysis.
            </h1>
            <p className="text-secondary text-sm mt-4 leading-relaxed max-w-[360px]">
              AI-powered business analysis. From brief to specification — user stories, test cases,
              architecture, and collateral, all in one workspace.
            </p>
          </div>

          <div className="font-mono text-[11px] text-muted">
            {APP_VERSION_LABEL}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="ba-page w-full max-w-[380px]">
          {isMobile && (
            <div className="flex items-center gap-2.5 justify-center mb-6">
              <LogoMark size={34} />
              <span className="font-display font-extrabold text-[17px] text-primary">
                Requify
              </span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="font-display font-extrabold text-[22px] text-primary m-0">
              Sign in
            </h2>
            <p className="text-muted text-[13px] mt-1.5">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={onKeyDown} className="flex flex-col gap-3.5">
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="px-3.5 py-2.5 rounded bg-red-soft border border-red text-red text-[13px]">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} loading={submitting} className="w-full mt-1">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <div className="text-center text-[11px] text-muted">
              <span className="font-mono">Ctrl + Enter</span> to submit
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
