/**
 * Shared design system for AI-generated prototypes.
 * Keeps scaffolds and AI output visually consistent and production-grade.
 */

import { DEFAULT_THEME, buildThemeStylePrompt } from "./prototypeTheme.mjs";

export const PRODUCT_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1576566584868-9eaeaba36263?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3f990?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622445275463-afa2ab1c20f0?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=480&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3f990?w=480&h=600&fit=crop&q=80",
];

export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&q=80";

export const productImageUrl = (seed = 0) =>
  PRODUCT_IMAGE_URLS[Math.abs(Number(seed) || 0) % PRODUCT_IMAGE_URLS.length];

export const DESIGN_TOKENS_CSS = `
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-soft: #eff6ff;
  --color-surface: #ffffff;
  --color-surface-muted: #f8fafc;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-success: #047857;
  --color-warning: #b45309;
  --color-danger: #dc2626;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 20px 40px rgba(15, 23, 42, 0.12);
}`;

export const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />`;

const SCREEN_TYPE_GUIDANCE = {
  home: `Storefront home: full-width hero banner with lifestyle image, prominent search with icon, category chips, 4-6 product cards with REAL <img> photos, trust badges, newsletter strip.`,
  catalog: `Catalog: sticky filter sidebar with accordion sections, active filter count badge, sort dropdown, results count, responsive product grid with images, ratings stars, quick-add buttons.`,
  pdp: `Product detail: large image gallery with thumbnails, breadcrumb, star rating + review count, price with compare-at, variant swatches, quantity stepper, sticky add-to-cart bar.`,
  checkout: `Checkout: branded header, multi-step stepper with checkmarks, address form with validation hints, payment method cards, order summary sidebar.`,
  account: `Account hub: avatar header, tabbed navigation, profile form with labels, address cards, security section with 2FA toggle, activity history.`,
  inventory: `Admin inventory: KPI stat cards, alert sidebar with severity colors, searchable sortable data table, inline edit, bulk actions toolbar.`,
  "admin-wizard": `Wizard step 1: clean card layout, progress stepper, grouped form sections, drag-drop upload zone, helper text, save draft + continue CTAs.`,
  "admin-wizard-advanced": `Advanced wizard step: attribute chips, auto-generated matrix table, bulk apply, stock/price inputs per row, category tree selector.`,
  auth: `Auth (FULLSCREEN — no sidebar, no top nav): split viewport with brand hero left + form card right, login/register segment control, social auth buttons, forgot password link, OTP option.`,
  dashboard: `Dashboard: page header with title + date range filter, KPI stat cards row, chart or trend area, recent activity feed or summary table, quick-action buttons.`,
  form: `Form screen: clear page title, grouped form sections with labels and helper text, validation hints, required field markers, primary submit + secondary cancel CTAs.`,
  wizard: `Multi-step wizard: horizontal stepper with current step highlighted, focused form card for this step only, back/continue navigation, progress indicator.`,
  list: `List/table screen: search bar + filter chips, sortable data table or card list, status pills, row actions, pagination controls, bulk select checkbox.`,
  detail: `Detail view: breadcrumb or back link, header with entity name + status badge, tabbed sections or two-column layout, related records sidebar, action buttons.`,
  report: `Report/analytics: filter toolbar (date range, category), KPI summary row, chart placeholders or data visualization area, export button, drill-down table.`,
  onboarding: `Onboarding: welcome hero, 3-4 step checklist or progress tracker, illustrated cards explaining key features, get-started CTA, skip option.`,
  settings: `Settings: left tab navigation or section accordion, grouped preference controls, toggle switches, save/cancel footer, confirmation toasts.`,
  generic: `Professional app screen: page header with title + primary actions, KPI stat cards row, card-based content areas or data table, realistic domain-specific sample data, clear hierarchy.`,
};

const DOMAIN_GUIDANCE = {
  ecommerce: "Build a polished online store — product imagery, cart, checkout, and admin inventory flows.",
  healthcare: "Build a clinical/healthcare app — patient records, appointments, provider dashboards, intake forms. Use medical terminology and HIPAA-appropriate UI patterns.",
  hr: "Build an HR/people-ops app — employee directory, leave requests, onboarding checklists, payroll summaries, org charts.",
  finance: "Build a finance app — account balances, transaction history, invoices, approval workflows, audit trails.",
  education: "Build an education/LMS app — course catalog, enrollment, progress tracking, assignments, grade books.",
  logistics: "Build a logistics app — shipment tracking, fleet maps, warehouse inventory, dispatch queues, delivery status.",
  crm: "Build a CRM app — lead pipeline, contact profiles, activity timelines, deal stages, support tickets.",
  project: "Build a project management app — kanban boards, sprint backlogs, task cards, milestone timelines, team assignments.",
  general: "Build a professional app tailored to the product brief and user stories — use domain-appropriate labels, data, and workflows.",
};

export const SHELL_ARCHITECTURE_PROMPT = `
APP SHELL ARCHITECTURE (critical — do NOT put everything in one sidebar):
- The prototype has SEPARATE experiences switched via top role bar: End-User App | Admin Console | Sign In
- END-USER screens (role=customer): render content ONLY — the shell provides a modern top navbar (logo, nav links, search). Never add a sidebar.
- ADMIN screens (role=admin): render content ONLY — the shell provides admin sidebar + top bar. Never add end-user nav.
- AUTH screens (role=public): FULL viewport login page — no sidebar, no app chrome. Split hero + form layout.
- Each screen is ONE <section data-screen="ID" data-role="customer|admin|public"> — never include outer shell HTML`;

export const getScreenTypeGuidance = (screenType) =>
  SCREEN_TYPE_GUIDANCE[screenType] || SCREEN_TYPE_GUIDANCE.generic;

export const DESIGN_SYSTEM_CLASSES = [
  "app-shell", "sidebar", "brand", "nav-btn", "content", "screen",
  "storefront-hero", "hero-banner", "hero-content", "search-panel", "search-input",
  "chip", "category-pill", "product-grid", "product-card", "product-image",
  "badge", "price", "btn", "btn-primary", "btn-ghost", "btn-sm", "btn-block",
  "catalog-layout", "filter-panel", "filter-group", "swatch",
  "pdp-layout", "pdp-gallery", "pdp-main-image", "pdp-thumbs", "thumb",
  "variant-pills", "variant", "price-lg", "strike",
  "wizard-steps", "step", "checkout-grid", "checkout-form", "order-summary",
  "data-table", "table-wrap", "status-pill", "alert",
  "account-layout", "account-nav", "account-tab", "account-panel",
  "form-grid", "form-group", "text-input", "select-input",
  "stat-grid", "stat-card", "kpi-value", "kpi-label",
  "upload-zone", "image-grid", "screen-toolbar", "section-head", "eyebrow", "lead", "meta",
];

export const getDesignSystemPrompt = (screenType = "generic", screenRole = "customer", domain = "general", theme = null) => {
  const domainGuide = DOMAIN_GUIDANCE[domain] || DOMAIN_GUIDANCE.general;
  const activeTheme = theme || DEFAULT_THEME;
  const imageGuide = domain === "ecommerce"
    ? "- Images: use real product photos via <img src=\"https://images.unsplash.com/photo-...\" alt=\"...\" loading=\"lazy\" />. NEVER use empty div placeholders."
    : "- Images: use relevant <img> (Unsplash for photos) or inline SVG icons where appropriate. NEVER use gray empty placeholder divs.";

  return `
${SHELL_ARCHITECTURE_PROMPT}

APPLICATION DOMAIN: ${domain}
${domainGuide}

This screen role: ${screenRole} | screen type: ${screenType}
${buildThemeStylePrompt(activeTheme)}

DESIGN SYSTEM:
- Reusable classes available: .btn .btn-primary .btn-ghost, .badge, .chip, .data-table, .wizard-steps .step, .stat-card, .filter-panel, .alert, .form-grid, .feature-card. Use them where helpful, but you may also write your own theme-expressing markup.
- CSS variables available: var(--color-primary), var(--color-accent), var(--color-surface), var(--color-surface-muted), var(--color-border), var(--color-text), var(--color-text-muted), var(--font-heading), var(--font-body), var(--radius-md).
${imageGuide}
- Icons: inline SVG (16-20px) — not emoji for UI chrome
- Spacing: rhythm consistent with the theme's layout personality
- Data: realistic domain-specific names, dates, statuses — not lorem ipsum or raw user story text

SCREEN-SPECIFIC GOAL (${screenType}):
${getScreenTypeGuidance(screenType)}

CSS RULES (you SHOULD write scoped css to express the theme — this is how designs differ):
- Scope EVERY selector under [data-screen="SCREEN_ID"] (replace SCREEN_ID with the actual screen id)
- Use the theme palette and fonts directly (hex values or the CSS variables above)
- NEVER redefine global selectors (.btn, .badge, .step, body, .screen) at GLOBAL scope — only under your screen scope
- Up to ~80 lines of scoped css is fine to achieve a distinctive, polished look`;
};

const GLOBAL_CLASS_PATTERN = /\.(btn|badge|step|btn-primary|btn-ghost|screen|body|nav-btn)\b/g;

export const scopeScreenCss = (screenId, css) => {
  const trimmed = String(css || "").trim();
  if (!trimmed || !screenId) return "";

  if (trimmed.includes(`[data-screen="${screenId}"]`) || trimmed.includes(`[data-screen='${screenId}']`)) {
    return trimmed;
  }

  const scope = `[data-screen="${screenId}"]`;
  const blocks = trimmed.split(/(?=@media)/).map((part) => part.trim()).filter(Boolean);

  return blocks.map((block) => {
    if (block.startsWith("@media")) {
      const mediaEnd = block.indexOf("{");
      if (mediaEnd === -1) return block;
      const query = block.slice(0, mediaEnd + 1);
      const inner = block.slice(mediaEnd + 1, -1).trim();
      const scopedInner = scopeRules(inner, scope);
      return `${query}${scopedInner}}`;
    }
    return scopeRules(block, scope);
  }).join("\n\n");
};

const scopeRules = (css, scope) => {
  return String(css || "").replace(/([^{}]+)\{/g, (match, selectors) => {
    const scoped = selectors
      .split(",")
      .map((sel) => {
        const s = sel.trim();
        if (!s || s.startsWith(scope)) return s;
        if (s.startsWith("@")) return s;
        return `${scope} ${s}`;
      })
      .join(", ");
    return `${scoped}{`;
  });
};

export const hasPlaceholderOnlyImages = (html) => {
  const text = String(html || "");
  const hasImg = /<img\s/i.test(text);
  const hasGradientPlaceholder = /product-image[^>]*>\s*<\/div>|pdp-main-image[^>]*>\s*<\/div>|linear-gradient\(135deg,\s*#e5e7eb/i.test(text);
  const hasAriaHiddenEmpty = /class="product-image"[^>]*aria-hidden[^>]*>\s*<\/div>/i.test(text);
  return (hasGradientPlaceholder || hasAriaHiddenEmpty) && !hasImg;
};

export const hasGlobalCssConflicts = (css) => {
  const trimmed = String(css || "").trim();
  if (!trimmed) return false;
  const globalRedefines = trimmed.match(GLOBAL_CLASS_PATTERN) || [];
  const unscoped = !trimmed.includes("[data-screen");
  return unscoped && globalRedefines.length >= 2;
};

export const isAmateurScreenOutput = (html, css = "") => {
  const trimmed = String(html || "").trim();
  if (trimmed.length < 400) return true;
  if (/No features listed|Covers \d+ related user stories|ui-placeholder/i.test(trimmed)) return true;
  if (/As an?\s+\w+,\s+I want/i.test(trimmed)) return true;
  if ((trimmed.match(/feature-card/g) || []).length >= 2 && !/product-card|data-table|search-input|wizard-steps|stat-card/i.test(trimmed)) {
    return true;
  }
  if (hasPlaceholderOnlyImages(trimmed)) return true;
  if (hasGlobalCssConflicts(css)) return true;
  return false;
};
