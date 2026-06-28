/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        overlay: "var(--bg-overlay)",
        border: "var(--border)",
        "border-bright": "var(--border-bright)",
        accent: "var(--accent)",
        "accent-glow": "var(--accent-glow)",
        "accent-soft": "var(--accent-soft)",
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        red: "var(--red)",
        "red-soft": "var(--red-soft)",
        yellow: "var(--yellow)",
        "yellow-soft": "var(--yellow-soft)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        ai: "var(--ai-accent)",
        "ai-soft": "var(--ai-soft)",
        "ai-border": "var(--ai-border)",
        purple: "var(--purple)",
        "purple-soft": "var(--purple-soft)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
