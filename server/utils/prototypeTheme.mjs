/**
 * Per-project visual design theme.
 *
 * The point of this module is to make every generated prototype look DIFFERENT
 * based on the product brief. Instead of a single hardcoded palette + font,
 * we derive a unique theme (colors, typography, mood, layout personality) from
 * the brief and feed it into both the CSS and the AI prompts.
 */

export const DEFAULT_THEME = {
  styleName: "Modern SaaS",
  mood: "clean, professional, trustworthy",
  primary: "#2563eb",
  accent: "#7c3aed",
  background: "#ffffff",
  surface: "#f8fafc",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  headingFont: "Inter",
  bodyFont: "Inter",
  radius: "12px",
  layout: "card-based dashboard with generous whitespace and subtle shadows",
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const isHex = (v) => typeof v === "string" && HEX.test(v.trim());

const cleanFont = (v, fallback) => {
  const name = String(v || "").trim().replace(/['"]/g, "");
  // allow letters, numbers and spaces only — anything else is suspicious
  if (!name || name.length > 40 || /[^a-zA-Z0-9 ]/.test(name)) return fallback;
  return name;
};

const cleanRadius = (v) => {
  const s = String(v || "").trim();
  return /^\d{1,2}px$|^\d{1,2}(\.\d)?rem$|^0$/.test(s) ? s : DEFAULT_THEME.radius;
};

const cleanText = (v, max = 80) => String(v || "").trim().slice(0, max);

/** Heuristic theme derived from keywords — used when AI theme generation is unavailable. */
export const heuristicTheme = (brief = "", projectName = "") => {
  const text = `${brief} ${projectName}`.toLowerCase();

  const presets = [
    {
      match: /luxury|premium|elegant|editorial|minimalist|fashion|footwear|haute|boutique/,
      theme: {
        styleName: "Minimalist Editorial Luxury",
        mood: "premium, understated, editorial",
        primary: "#111111",
        accent: "#b08d57",
        background: "#ffffff",
        surface: "#f6f5f2",
        text: "#1a1a1a",
        textMuted: "#7d7d7d",
        border: "#e6e4df",
        headingFont: "Playfair Display",
        bodyFont: "Inter",
        radius: "2px",
        layout: "full-bleed editorial layout, asymmetric grids, very generous whitespace",
      },
    },
    {
      match: /health|clinic|patient|medical|wellness|hospital|care/,
      theme: {
        styleName: "Calm Clinical",
        mood: "reassuring, clean, accessible",
        primary: "#0d9488",
        accent: "#2563eb",
        background: "#ffffff",
        surface: "#f0fdfa",
        text: "#0f172a",
        textMuted: "#64748b",
        border: "#d1e7e3",
        headingFont: "Poppins",
        bodyFont: "Inter",
        radius: "14px",
        layout: "spacious cards, soft rounded corners, friendly approachable hierarchy",
      },
    },
    {
      match: /bank|finance|invoice|loan|payment|ledger|accounting|fintech/,
      theme: {
        styleName: "Trusted Fintech",
        mood: "secure, precise, confident",
        primary: "#1e3a8a",
        accent: "#0ea5e9",
        background: "#ffffff",
        surface: "#f1f5f9",
        text: "#0f172a",
        textMuted: "#64748b",
        border: "#e2e8f0",
        headingFont: "Manrope",
        bodyFont: "Inter",
        radius: "8px",
        layout: "data-dense dashboards, structured tables, restrained accents",
      },
    },
    {
      match: /kids|playful|game|fun|social|community|creative|music/,
      theme: {
        styleName: "Playful Vibrant",
        mood: "energetic, friendly, bold",
        primary: "#f97316",
        accent: "#8b5cf6",
        background: "#ffffff",
        surface: "#fff7ed",
        text: "#1f2937",
        textMuted: "#6b7280",
        border: "#fed7aa",
        headingFont: "Poppins",
        bodyFont: "Nunito",
        radius: "20px",
        layout: "rounded chunky cards, vivid accents, large friendly typography",
      },
    },
    {
      match: /eco|sustain|organic|nature|green|outdoor|garden|farm/,
      theme: {
        styleName: "Organic Natural",
        mood: "earthy, calm, grounded",
        primary: "#15803d",
        accent: "#ca8a04",
        background: "#fffdf7",
        surface: "#f3f6ee",
        text: "#1c2517",
        textMuted: "#6b7158",
        border: "#e3e7d6",
        headingFont: "Fraunces",
        bodyFont: "Inter",
        radius: "10px",
        layout: "warm natural tones, soft imagery, relaxed editorial flow",
      },
    },
    {
      match: /dark|gaming|crypto|developer|tech|ai|saas platform|cyber/,
      theme: {
        styleName: "Modern Dark Tech",
        mood: "sleek, high-contrast, cutting-edge",
        primary: "#6366f1",
        accent: "#22d3ee",
        background: "#0b1020",
        surface: "#151b2e",
        text: "#e5e7eb",
        textMuted: "#94a3b8",
        border: "#26304a",
        headingFont: "Space Grotesk",
        bodyFont: "Inter",
        radius: "10px",
        layout: "dark UI, glowing accents, crisp monospace-flavored details",
      },
    },
  ];

  const found = presets.find((p) => p.match.test(text));
  return found ? { ...found.theme } : { ...DEFAULT_THEME };
};

/** Validate + sanitize a (possibly AI-produced) theme object, filling gaps from a fallback. */
export const normalizeTheme = (raw = {}, fallback = DEFAULT_THEME) => {
  const fb = fallback || DEFAULT_THEME;
  return {
    styleName: cleanText(raw.styleName, 60) || fb.styleName,
    mood: cleanText(raw.mood, 80) || fb.mood,
    primary: isHex(raw.primary) ? raw.primary.trim() : fb.primary,
    accent: isHex(raw.accent) ? raw.accent.trim() : fb.accent,
    background: isHex(raw.background) ? raw.background.trim() : fb.background,
    surface: isHex(raw.surface) ? raw.surface.trim() : fb.surface,
    text: isHex(raw.text) ? raw.text.trim() : fb.text,
    textMuted: isHex(raw.textMuted) ? raw.textMuted.trim() : fb.textMuted,
    border: isHex(raw.border) ? raw.border.trim() : fb.border,
    headingFont: cleanFont(raw.headingFont, fb.headingFont),
    bodyFont: cleanFont(raw.bodyFont, fb.bodyFont),
    radius: cleanRadius(raw.radius || fb.radius),
    layout: cleanText(raw.layout, 160) || fb.layout,
  };
};

const isDark = (hex) => {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

const fontFamilyParam = (name) =>
  `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;500;600;700;800`;

/** Google Fonts <link> tags for the theme's fonts. */
export const buildThemeFontLinks = (theme = DEFAULT_THEME) => {
  const fonts = [...new Set([theme.headingFont, theme.bodyFont].filter(Boolean))];
  const families = fonts.map(fontFamilyParam).join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
};

/** Google Fonts @import (travels with the stylesheet so saved CSS keeps its fonts). */
export const buildThemeFontImport = (theme = DEFAULT_THEME) => {
  const fonts = [...new Set([theme.headingFont, theme.bodyFont].filter(Boolean))];
  const families = fonts.map(fontFamilyParam).join("&");
  return `@import url('https://fonts.googleapis.com/css2?${families}&display=swap');`;
};

const headingFallback = (name) =>
  /playfair|fraunces|merriweather|lora|cormorant|georgia/i.test(name) ? "serif" : "sans-serif";

/**
 * Theme CSS — overrides the default design tokens. Append this AFTER the base
 * design system CSS so the theme's :root variables win, then re-skin core chrome.
 */
export const buildThemeTokensCss = (theme = DEFAULT_THEME) => {
  const dark = isDark(theme.background);
  return `
/* === Project theme: ${theme.styleName} === */
:root {
  --color-primary: ${theme.primary};
  --color-primary-dark: ${theme.primary};
  --color-primary-soft: ${dark ? theme.surface : theme.surface};
  --color-accent: ${theme.accent};
  --color-surface: ${theme.background};
  --color-surface-muted: ${theme.surface};
  --color-border: ${theme.border};
  --color-text: ${theme.text};
  --color-text-muted: ${theme.textMuted};
  --radius-sm: ${theme.radius};
  --radius-md: ${theme.radius};
  --radius-lg: ${theme.radius};
  --font-heading: "${theme.headingFont}", ${headingFallback(theme.headingFont)};
  --font-body: "${theme.bodyFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body { font-family: var(--font-body); background: ${theme.surface}; color: ${theme.text}; }
h1, h2, h3, h4, .store-logo, .admin-brand-name { font-family: var(--font-heading); }
.btn-primary { background: ${theme.primary}; border-color: ${theme.primary}; color: ${dark ? "#0b1020" : "#ffffff"}; }
.btn-primary:hover { filter: brightness(0.92); }
.role-btn.active { background: ${theme.primary}; }
.topnav-link.active { background: ${theme.surface}; color: ${theme.primary}; }
.admin-nav-btn.active { background: ${theme.surface}; color: ${theme.primary}; }
.shell-customer .screen, .admin-viewport .screen { background: ${theme.background}; color: ${theme.text}; }
.badge { background: ${theme.accent}; }`;
};

/** Compact natural-language style guidance injected into AI screen prompts. */
export const buildThemeStylePrompt = (theme = DEFAULT_THEME) => `
PROJECT VISUAL THEME — "${theme.styleName}" (${theme.mood}). Build the UI to express THIS identity, not a generic template:
- Palette: primary ${theme.primary}, accent ${theme.accent}, background ${theme.background}, surface ${theme.surface}, text ${theme.text}, muted ${theme.textMuted}, border ${theme.border}. Use these EXACT colors.
- Typography: headings in "${theme.headingFont}", body in "${theme.bodyFont}". Apply via font-family in your CSS (the fonts are already loaded).
- Corner radius: ${theme.radius} on cards/buttons/inputs. ${isDark(theme.background) ? "This is a DARK theme — use light text on dark surfaces." : "This is a LIGHT theme."}
- Layout personality: ${theme.layout}.
- Match the brief's described aesthetic exactly. Two different briefs MUST produce visibly different designs — do NOT default to a blue-and-Inter SaaS look.`;
