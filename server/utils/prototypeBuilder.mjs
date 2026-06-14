import {
  DESIGN_TOKENS_CSS,
  FONT_LINKS,
  getDesignSystemPrompt,
  productImageUrl,
  scopeScreenCss,
  HERO_IMAGE_URL,
} from "./prototypeDesignSystem.mjs";
import {
  DEFAULT_THEME,
  buildThemeFontLinks,
  buildThemeTokensCss,
} from "./prototypeTheme.mjs";
import {
  annotateScreenWithRole,
  buildMultiShellHtml,
  detectScreenRole,
  groupScreensByRole,
  ROLES,
  SHELL_CSS,
  SHELL_JS,
} from "./prototypeShell.mjs";

export { detectScreenRole };

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const truncate = (value, max = 180) => {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

export const sanitizePrototypeCode = (code) => {
  if (!code || typeof code !== "string") return "";

  let result = code.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = result
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
    if (next === result) break;
    result = next;
  }

  return result;
};

const extractScreenTitle = (text, index) => {
  const wantMatch = String(text).match(/i want\s+(.+?)(?:\s+so that\b|$)/i);
  if (wantMatch?.[1]) return truncate(wantMatch[1], 48);
  const roleMatch = String(text).match(/^as an?\s+([^,]+)/i);
  if (roleMatch?.[1]) return truncate(`${roleMatch[1].trim()} workspace`, 48);
  return `Screen ${index + 1}`;
};

export const isValidStructure = (structure) =>
  Array.isArray(structure?.screens)
  && structure.screens.length > 0
  && structure.screens.every((screen) => screen?.id && screen?.title);

const MAX_FALLBACK_SCREENS = 10;

export const getTargetScreenCount = (storyCount) => {
  if (storyCount <= 10) return storyCount;
  return Math.min(MAX_FALLBACK_SCREENS, Math.max(7, Math.ceil(storyCount / 3)));
};

export const buildGroupedStructureFromStories = (stories, projectName, maxScreens = MAX_FALLBACK_SCREENS) => {
  const targetScreens = getTargetScreenCount(stories.length);
  const perScreen = Math.ceil(stories.length / targetScreens);
  const screens = [];

  for (let i = 0; i < stories.length; i += perScreen) {
    const group = stories.slice(i, i + perScreen);
    const lead = group[0];
    const text = lead.correctedText || lead.originalText || "";
    const storyIds = group.map((s) => s._id?.toString?.()).filter(Boolean);
    const titles = group.map((s) => truncate(s.correctedText || s.originalText, 100));

    screens.push({
      id: `screen-group-${i / perScreen + 1}`,
      title: extractScreenTitle(text, i / perScreen),
      description: `Covers ${group.length} related user ${group.length === 1 ? "story" : "stories"}.`,
      mappedStoryIds: storyIds,
      mappedStoryTitles: titles,
      features: titles.slice(0, 4),
    });
  }

  return {
    appName: projectName,
    summary: `Prototype for ${projectName} — ${stories.length} user stories grouped into ${screens.length} screens.`,
    userFlow: `Users navigate ${screens.length} grouped feature areas. Each screen implements multiple related user stories.`,
    navigation: screens.map((screen) => ({
      id: `nav-${screen.id}`,
      label: screen.title,
      screenId: screen.id,
    })),
    screens,
  };
};

const DEFAULT_ECOMMERCE_SCREENS = [
  { id: "screen-home", title: "Storefront Home & Discovery", screenType: "home", description: "Homepage with featured/new arrivals, category navigation, and advanced search with auto-suggestions and recent history." },
  { id: "screen-catalog", title: "Product Catalog & Filtering", screenType: "catalog", description: "Grid-based gallery with filter sidebar (size, color, price, rating) and sorting options." },
  { id: "screen-pdp", title: "Product Detail Page (PDP)", screenType: "pdp", description: "High-impact imagery with variant selectors and real-time stock validation." },
  { id: "screen-checkout", title: "Checkout Wizard", screenType: "checkout", description: "Multi-step flow: Shipping → Payment → Review with stock-check validation." },
  { id: "screen-account-hub", title: "User Account Hub", screenType: "account", description: "Profile, address book, security settings, and authentication (login/register/OTP)." },
  { id: "screen-inventory-dash", title: "Inventory Dashboard", screenType: "inventory", description: "Variant-level stock tracking, low-stock alerts, and manual stock overrides." },
  { id: "screen-product-wizard-basic", title: "Admin Product Manager: Basic Info", screenType: "admin-wizard", description: "Product name, description, and image upload." },
  { id: "screen-product-wizard-advanced", title: "Admin Product Manager: Attributes & Variants", screenType: "admin-wizard-advanced", description: "Sizes, colors, categories, SKU mapping, and pricing." },
];

const STORY_SCREEN_KEYWORDS = {
  "screen-home": [/search|keyword|auto-suggest|recent search|featured|new arrival|homepage|discover|category navig|navigate via categor/i],
  "screen-catalog": [/filter|sort|price|popularity|rating|catalog|gallery|latest arrival/i],
  "screen-pdp": [/variant|size|color|product detail|imagery|pdp|out of stock(?!.*checkout)/i],
  "screen-checkout": [/checkout|shipping|payment|order confirm|reduce stock|prevent.*checkout/i],
  "screen-account-hub": [/profile|address|password|otp|register|login|account|reset.*password|personal detail/i],
  "screen-inventory-dash": [/inventory|stock level|low stock|override|variant level|replenish|cancellation|return/i],
  "screen-product-wizard-basic": [/create.*product|product with a name|description.*image|upload/i],
  "screen-product-wizard-advanced": [/attribute|sku|discount|pricing|category hierarchy|fabric|fit|variants including/i],
};

export const shortNavLabel = (screen) => {
  // Prefer the screen's own title so nav reflects the actual app (e.g. "Collection
  // Page", "Cart Drawer") instead of collapsing distinct screens to the same type label.
  const title = String(screen?.title || "").trim();
  if (title) return title.length <= 28 ? title : truncate(title, 28);

  const type = screen?.screenType || detectScreenType(screen);
  const labels = {
    home: "Home",
    catalog: "Catalog",
    pdp: "Product Detail",
    checkout: "Checkout",
    account: "Account",
    inventory: "Inventory",
    "admin-wizard": "Add Product",
    "admin-wizard-advanced": "Variants & SKUs",
    auth: "Sign In",
    dashboard: "Dashboard",
    form: "Form",
    wizard: "Wizard",
    list: "List",
    detail: "Detail",
    report: "Reports",
    onboarding: "Onboarding",
    settings: "Settings",
  };
  return labels[type] || "Screen";
};

export const parseScreensFromPrompt = (prompt = "") => {
  const text = String(prompt || "").trim();
  if (!text) return [];

  const screens = [];
  let inSection = false;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (/screen priorities/i.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection && /^(user story alignment|must include|avoid|ui style|target users|vision)/i.test(trimmed)) {
      break;
    }
    if (!inSection) continue;

    const match = trimmed.match(/^\d+\.\s*([^:]+):\s*(.+)/);
    if (match) {
      screens.push({ title: match[1].trim(), description: match[2].trim() });
    }
  }

  return screens;
};

const titleToScreenMeta = (title, description) => {
  const key = title.toLowerCase();
  let screenType = detectScreenType({ id: "", title });
  let id = `screen-${key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36)}`;

  if (/home|discovery/.test(key)) { id = "screen-home"; screenType = "home"; }
  else if (/catalog|filter/.test(key)) { id = "screen-catalog"; screenType = "catalog"; }
  else if (/pdp|detail page/.test(key)) { id = "screen-pdp"; screenType = "pdp"; }
  else if (/checkout/.test(key)) { id = "screen-checkout"; screenType = "checkout"; }
  else if (/account|hub/.test(key)) { id = "screen-account-hub"; screenType = "account"; }
  else if (/inventory/.test(key)) { id = "screen-inventory-dash"; screenType = "inventory"; }
  else if (/admin product|product manager/.test(key)) { id = "screen-product-wizard-basic"; screenType = "admin-wizard"; }

  return { id, title, description, screenType };
};

const expandAdminWizardScreens = (parsedScreens) => {
  const expanded = [];
  for (const screen of parsedScreens) {
    if (/admin product manager|product manager/i.test(screen.title) && !/basic|advanced|attributes/i.test(screen.title)) {
      expanded.push({
        id: "screen-product-wizard-basic",
        title: "Admin Product Manager: Basic Info",
        description: "First wizard step: product name, description, and image upload.",
        screenType: "admin-wizard",
      });
      expanded.push({
        id: "screen-product-wizard-advanced",
        title: "Admin Product Manager: Attributes & Variants",
        description: "Wizard steps for sizes, colors, categories, SKU mapping, and pricing.",
        screenType: "admin-wizard-advanced",
      });
    } else {
      expanded.push(titleToScreenMeta(screen.title, screen.description));
    }
  }
  return expanded;
};

const scoreStoryForScreen = (storyText, screenId) => {
  const patterns = STORY_SCREEN_KEYWORDS[screenId] || [];
  const text = String(storyText || "").toLowerCase();
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
};

const mapStoriesToScreens = (screens, stories) => {
  const assignments = new Map(screens.map((s) => [s.id, []]));

  for (const story of stories) {
    const text = story.correctedText || story.originalText || "";
    let bestScreen = screens[0]?.id;
    let bestScore = -1;

    for (const screen of screens) {
      const score = scoreStoryForScreen(text, screen.id);
      if (score > bestScore) {
        bestScore = score;
        bestScreen = screen.id;
      }
    }

    if (bestScreen) assignments.get(bestScreen).push(story);
  }

  return screens.map((screen) => {
    const mapped = assignments.get(screen.id) || [];
    const storyIds = mapped.map((s) => s._id?.toString?.()).filter(Boolean);
    const criteria = mapped.flatMap((s) => (s.acceptanceCriteria || []).slice(0, 2).map((c) => truncate(c, 80)));

    return {
      ...screen,
      mappedStoryIds: storyIds,
      mappedStoryTitles: mapped.map((s) => truncate(s.correctedText || s.originalText, 140)),
      features: criteria.length
        ? criteria.slice(0, 5)
        : mapped.slice(0, 3).map((s) => {
            const t = s.correctedText || s.originalText || "";
            const want = t.match(/i want\s+(.+?)(?:\s+so that\b|$)/i);
            return truncate(want?.[1] || t, 70);
          }),
    };
  });
};

export const isStoryDerivedStructure = (structure) =>
  (structure?.screens || []).some(
    (s) =>
      /screen-group-/i.test(s.id || "")
      || /^to\s+/i.test(s.title || "")
      || /covers \d+ related user stories/i.test(s.description || "")
  );

export const isEcommerceBrief = (prompt = "") => {
  const text = String(prompt || "").toLowerCase();
  return /e-?commerce\s+(store|platform|site|app)|online\s+store|t-?shirt\s+(store|shop|ecommerce)|shopify|storefront\s+(home|app)/i.test(text)
    || (
      /storefront|online\s+shop|shopping\s+cart/i.test(text)
      && /product\s+catalog|checkout|inventory/i.test(text)
    );
};

export const inferApplicationDomain = (prototypePrompt = "", stories = [], projectName = "") => {
  const combined = [
    prototypePrompt,
    projectName,
    ...(stories || []).map((s) => s.correctedText || s.originalText || ""),
  ].join(" ").toLowerCase();

  const domains = [
    { id: "ecommerce", patterns: [/e-?commerce|storefront|product catalog|shopping cart|add to cart|checkout wizard/i] },
    { id: "healthcare", patterns: [/patient|clinic|hospital|medical|healthcare|appointment|doctor|prescription/i] },
    { id: "hr", patterns: [/employee|onboarding|payroll|leave request|\bhr\b|human resource|timesheet/i] },
    { id: "finance", patterns: [/banking|finance|loan|transaction|invoice|ledger|accounting/i] },
    { id: "education", patterns: [/student|course|learning|enrollment|education|school|curriculum/i] },
    { id: "logistics", patterns: [/fleet|shipment|delivery|warehouse|logistics|dispatch|route/i] },
    { id: "crm", patterns: [/\bcrm\b|lead|customer support|help desk|ticket|sales pipeline/i] },
    { id: "project", patterns: [/project management|kanban|sprint|backlog|task board|milestone/i] },
  ];

  for (const { id, patterns } of domains) {
    if (patterns.some((p) => p.test(combined))) return id;
  }
  return "general";
};

export const buildStructureFromPrompt = (prototypePrompt, stories, projectName) => {
  let screenDefs = parseScreensFromPrompt(prototypePrompt);

  if (screenDefs.length === 0 && isEcommerceBrief(prototypePrompt)) {
    screenDefs = DEFAULT_ECOMMERCE_SCREENS.map(({ title, description }) => ({ title, description }));
  }

  if (screenDefs.length === 0) return null;

  const expanded = expandAdminWizardScreens(screenDefs);
  const screens = mapStoriesToScreens(expanded, stories);
  const domain = inferApplicationDomain(prototypePrompt, stories, projectName);

  const appName = domain === "ecommerce" && /t-?shirt/i.test(prototypePrompt)
    ? "Tshirt Ecommerce"
    : projectName;

  const userFlow = domain === "ecommerce"
    ? "Customer: Home → Catalog → Product Detail → Checkout → Account. Admin: Inventory → Product Manager wizard."
    : `Users navigate ${screens.length} purpose-built screens mapped from the product brief and user stories.`;

  return {
    appName,
    summary: `Interactive prototype with ${screens.length} screens mapped from the product brief and ${stories.length} user stories.`,
    userFlow,
    screens,
    navigation: screens.map((screen) => ({
      id: `nav-${screen.id}`,
      label: shortNavLabel(screen),
      screenId: screen.id,
      section: isAdminScreen(screen) ? "admin" : "storefront",
    })),
  };
};

export const buildInitialStructure = (stories, projectName, prototypePrompt = "") => {
  const fromPrompt = buildStructureFromPrompt(prototypePrompt, stories, projectName);
  if (fromPrompt) return fromPrompt;
  return buildStructureFromStories(stories, projectName);
};

export const buildStructureFromStories = (stories, projectName) => {
  if (stories.length > 10) {
    return buildGroupedStructureFromStories(stories, projectName);
  }

  const screens = stories.map((story, index) => {
    const text = story.correctedText || story.originalText || "";
    const storyId = story._id?.toString?.() || String(index + 1);
    const criteria = (story.acceptanceCriteria || []).slice(0, 5).map((item) => truncate(item, 100));

    return {
      id: `screen-${storyId}`,
      title: extractScreenTitle(text, index),
      description: truncate(text, 220),
      mappedStoryIds: [storyId],
      mappedStoryTitles: [truncate(text, 140)],
      features: criteria.length > 0 ? criteria : [truncate(text, 100)],
    };
  });

  return {
    appName: projectName,
    summary: `Prototype for ${projectName} based on ${stories.length} user ${stories.length === 1 ? "story" : "stories"}.`,
    userFlow: `Users move through ${screens.length} screens in the sidebar. Each screen implements a mapped user story from the project.`,
    navigation: screens.map((screen) => ({
      id: `nav-${screen.id}`,
      label: screen.title,
      screenId: screen.id,
    })),
    screens,
  };
};

export const buildFullDocument = (html, css, js, title = "Application Prototype", theme = null) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  ${theme ? buildThemeFontLinks(theme) : FONT_LINKS}
  <style>${css || ""}</style>
</head>
<body>
  ${html || ""}
  <script>${js || ""}<\/script>
</body>
</html>`;

export { getDesignSystemPrompt };

const SAFE_NAV_PATCH = `
document.querySelectorAll('a[href="#"], a[href=""]').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});
document.querySelectorAll('.screen, [data-screen]').forEach((el, index) => {
  if (!el.classList.contains('screen') && el.tagName === 'SECTION') {
    el.classList.add('screen');
  }
  if (index === 0 && !document.querySelector('.screen.active, [data-screen].active')) {
    el.classList.add('active');
  }
});
`;

export const isValidPrototype = (html, structure) => {
  if (!html || typeof html !== "string") return false;

  const sanitized = sanitizePrototypeCode(html);
  const trimmed = sanitized.trim();

  if (trimmed.length < 80) return false;
  if (/\\["']/.test(trimmed)) return false;
  if (!trimmed.includes("data-screen") && !trimmed.includes('id="app"')) return false;

  const expectedScreens = structure?.screens?.length || 0;
  if (expectedScreens > 0) {
    const foundScreens = (trimmed.match(/data-screen=/g) || []).length;
    const minimumScreens = Math.min(
      expectedScreens,
      Math.max(1, Math.ceil(expectedScreens * 0.4))
    );
    if (foundScreens < minimumScreens) return false;
  }

  return true;
};

export const isAdminScreen = (screen) => detectScreenRole(screen) === ROLES.ADMIN;

export const detectScreenType = (screen) => {
  const key = `${screen?.id || ""} ${screen?.title || ""} ${screen?.description || ""}`.toLowerCase();
  // Ecommerce-specific types take priority so "Product Detail Page" / "Collection Page"
  // don't get swallowed by the generic detail/list checks below.
  if (/pdp|product.detail|\bpdp\b|detail page/.test(key)) return "pdp";
  if (/checkout|payment|cart|bag|basket/.test(key)) return "checkout";
  if (/catalog|collection|shop|browse|listing|gallery|products page/.test(key)) return "catalog";
  if (/inventory|stock/.test(key)) return "inventory";
  if (/onboarding|getting.started|welcome flow/.test(key)) return "onboarding";
  if (/settings|preferences|configuration/.test(key)) return "settings";
  if (/report|analytics|insights|metrics/.test(key)) return "report";
  if (/auth.suite|login|register|otp|sign.in|sign.up/.test(key) && !/account.hub|profile/.test(key)) return "auth";
  if (/account|profile|address|security/.test(key)) return "account";
  if (/wizard.*advanced|attributes|variants|sku|pricing/.test(key)) return "admin-wizard-advanced";
  if (/form|submit|request|application|intake/.test(key)) return "form";
  if (/list|records|directory|registry|management/.test(key)) return "list";
  if (/detail|view profile|single view/.test(key)) return "detail";
  if (/wizard|multi-step|stepper/.test(key)) return "wizard";
  if (/dashboard/.test(key) && !/inventory|admin/.test(key)) return "dashboard";
  if (/home|discovery|landing|storefront/.test(key)) return "home";
  if (/wizard|admin|product.manager|create product/.test(key)) return "admin-wizard";
  return "generic";
};

export const normalizeNavigation = (structure, screens = []) => {
  const raw = structure?.navigation;
  if (Array.isArray(raw)) {
    const objectNav = raw.filter((item) => item && typeof item === "object" && item.screenId);
    if (objectNav.length > 0) {
      return objectNav.map((item) => {
        const screen = screens.find((s) => s.id === item.screenId) || { id: item.screenId };
        const role = screen.role || detectScreenRole(screen);
        return {
          id: item.id || `nav-${item.screenId}`,
          label: shortNavLabel(screen),
          screenId: item.screenId,
          role,
          section: role === ROLES.ADMIN ? "admin" : role === ROLES.PUBLIC ? "public" : "storefront",
        };
      });
    }
  }

  return screens.map((screen) => {
    const role = screen.role || detectScreenRole(screen);
    return {
      id: `nav-${screen.id}`,
      label: shortNavLabel(screen),
      screenId: screen.id,
      role,
      section: role === ROLES.ADMIN ? "admin" : role === ROLES.PUBLIC ? "public" : "storefront",
    };
  });
};

const findAiScreenMatch = (aiScreens, baseScreen) => {
  const byId = aiScreens.find((s) => s.id === baseScreen.id);
  if (byId) return byId;
  const baseKey = (baseScreen.title || "").toLowerCase();
  return aiScreens.find((s) => {
    const key = (s.title || "").toLowerCase();
    return key && (key.includes(baseKey.slice(0, 12)) || baseKey.includes(key.slice(0, 12)));
  });
};

export const normalizeStructureAfterAI = (aiStructure, baseline, stories = []) => {
  const baselineScreens = baseline?.screens || [];
  const aiScreens = Array.isArray(aiStructure?.screens) ? aiStructure.screens : [];
  const baselineIsPromptDriven = baselineScreens.length > 0 && !isStoryDerivedStructure(baseline);
  const aiIsGood = aiScreens.length > 0 && !isStoryDerivedStructure(aiStructure);

  const templateScreens = baselineIsPromptDriven
    ? baselineScreens
    : aiIsGood
      ? aiScreens.map((s) => ({
          ...s,
          screenType: s.screenType || detectScreenType(s),
        }))
      : baselineScreens;

  const templates = (templateScreens.length ? templateScreens : baselineScreens).map((base) => ({
    id: base.id,
    title: base.title,
    description: base.description || findAiScreenMatch(aiScreens, base)?.description || "",
    screenType: base.screenType || detectScreenType(base),
  }));

  const mergedScreens = mapStoriesToScreens(templates, stories);

  const structure = {
    appName: baseline.appName || aiStructure?.appName,
    summary: baseline.summary || aiStructure?.summary,
    userFlow: baseline.userFlow || aiStructure?.userFlow,
    screens: mergedScreens,
  };
  structure.navigation = normalizeNavigation(structure, mergedScreens);
  return structure;
};

const productCard = (name, price, badge = "", stock = "", imageSeed = 0) => {
  const imgUrl = productImageUrl(imageSeed);
  return `<article class="product-card">
    <div class="product-image">
      <img src="${imgUrl}" alt="${escapeHtml(name)}" loading="lazy" />
    </div>
    ${badge ? `<span class="badge">${escapeHtml(badge)}</span>` : ""}
    <h4>${escapeHtml(name)}</h4>
    <p class="price">${escapeHtml(price)}</p>
    ${stock ? `<p class="stock-hint">${escapeHtml(stock)}</p>` : ""}
    <button type="button" class="btn btn-primary btn-sm">View</button>
  </article>`;
};

const buildHomeScreen = (screen, index) => `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <div class="hero-banner" style="background-image:url('${HERO_IMAGE_URL}')">
    <div class="hero-content">
      <p class="eyebrow">New Season Collection</p>
      <h1>${escapeHtml(screen.title || "Storefront Home")}</h1>
      <p class="lead">${escapeHtml(screen.description || "Discover premium tees with fast search and curated categories.")}</p>
      <div class="hero-trust">
        <span>Free shipping over $50</span>
        <span>Easy 30-day returns</span>
        <span>Secure checkout</span>
      </div>
    </div>
  </div>
  <div class="search-panel search-panel-elevated">
    <div class="search-row">
      <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <label class="sr-only" for="search-${escapeHtml(screen.id)}">Search products</label>
      <input id="search-${escapeHtml(screen.id)}" type="search" class="search-input" placeholder="Search tees, colors, styles…" />
      <button type="button" class="btn btn-primary">Search</button>
    </div>
    <div class="search-suggestions">
      <span class="chip">Vintage Logo</span>
      <span class="chip">Oversized Fit</span>
      <span class="chip">Organic Cotton</span>
    </div>
    <p class="meta">Recent: <span>black crew neck</span> · <span>graphic tee XL</span></p>
  </div>
  <div class="category-row">
    <button type="button" class="category-pill active">All</button>
    <button type="button" class="category-pill">New Arrivals</button>
    <button type="button" class="category-pill">Basics</button>
    <button type="button" class="category-pill">Graphic</button>
    <button type="button" class="category-pill">Limited</button>
  </div>
  <div class="section-block">
    <div class="section-head"><h3>Featured & New Arrivals</h3><button type="button" class="btn btn-ghost">View catalog</button></div>
    <div class="product-grid">
      ${productCard("Minimal Black Tee", "$24.00", "New", "12 colors", 0)}
      ${productCard("Sunset Gradient Tee", "$29.00", "Trending", "", 1)}
      ${productCard("Vintage Logo Tee", "$32.00", "", "Only 2 left in Red/XL", 2)}
      ${productCard("Organic Crew Neck", "$27.00", "", "", 3)}
    </div>
  </div>
</section>`;

const buildCatalogScreen = (screen, index) => `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <header class="screen-toolbar">
    <div><h2>${escapeHtml(screen.title || "Product Catalog")}</h2><p>${escapeHtml(screen.description || "")}</p></div>
    <div class="sort-row">
      <label>Sort by</label>
      <select class="select-input"><option>Latest</option><option>Price: Low to High</option><option>Popularity</option><option>Rating</option></select>
    </div>
  </header>
  <div class="catalog-layout">
    <aside class="filter-panel">
      <h3>Filters</h3>
      <div class="filter-group"><h4>Size</h4><label><input type="checkbox" checked /> S</label><label><input type="checkbox" /> M</label><label><input type="checkbox" /> L</label><label><input type="checkbox" /> XL</label></div>
      <div class="filter-group"><h4>Color</h4><div class="swatches"><span class="swatch black"></span><span class="swatch white"></span><span class="swatch red"></span><span class="swatch blue"></span></div></div>
      <div class="filter-group"><h4>Price</h4><input type="range" min="10" max="80" value="45" class="range-input" /><p class="meta">$10 – $80</p></div>
      <div class="filter-group"><h4>Rating</h4><label><input type="checkbox" /> 4★ & up</label></div>
      <button type="button" class="btn btn-primary btn-block">Apply filters</button>
    </aside>
    <p class="results-meta">Showing <strong>24</strong> products · Filters: Size M, Color Black</p>
    <div class="product-grid catalog-grid">
      ${productCard("Classic Fit Tee", "$22.00", "", "", 4)}
      ${productCard("Relaxed Oversized Tee", "$28.00", "Popular", "", 5)}
      ${productCard("Performance Dry Tee", "$34.00", "", "", 6)}
      ${productCard("Striped Pocket Tee", "$26.00", "", "", 7)}
      ${productCard("Heritage Logo Tee", "$30.00", "", "", 0)}
      ${productCard("Soft Blend V-Neck", "$24.00", "", "", 1)}
    </div>
  </div>
</section>`;

const buildPdpScreen = (screen, index) => {
  const mainImg = productImageUrl(2);
  const thumb1 = productImageUrl(2);
  const thumb2 = productImageUrl(0);
  const thumb3 = productImageUrl(4);
  return `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <nav class="breadcrumb"><span>Home</span> / <span>Men</span> / <span>Tees</span> / <strong>Minimal Black Tee</strong></nav>
  <div class="pdp-layout">
    <div class="pdp-gallery">
      <div class="pdp-main-image"><img src="${mainImg}" alt="Minimal Black Tee" /></div>
      <div class="pdp-thumbs">
        <button type="button" class="thumb active"><img src="${thumb1}" alt="" /></button>
        <button type="button" class="thumb"><img src="${thumb2}" alt="" /></button>
        <button type="button" class="thumb"><img src="${thumb3}" alt="" /></button>
      </div>
    </div>
    <div class="pdp-details">
      <p class="eyebrow">Premium Cotton · SKU TE-2041</p>
      <h2>Minimal Black Tee</h2>
      <p class="price-lg">$24.00 <span class="strike">$29.00</span></p>
      <p class="stock-ok">✓ In stock — Only 2 left in Red / XL</p>
      <div class="variant-group"><h4>Color</h4><div class="variant-pills"><button type="button" class="variant active">Black</button><button type="button" class="variant">White</button><button type="button" class="variant disabled">Red</button></div></div>
      <div class="variant-group"><h4>Size</h4><div class="variant-pills"><button type="button" class="variant">S</button><button type="button" class="variant active">M</button><button type="button" class="variant">L</button><button type="button" class="variant disabled">XL</button></div></div>
      <p class="stock-warn">Red / XL is out of stock — select another variant</p>
      <div class="pdp-actions"><button type="button" class="btn btn-primary">Add to cart</button><button type="button" class="btn btn-ghost">Save</button></div>
      <p class="meta">${escapeHtml(screen.description || "High-impact imagery with real-time variant stock validation.")}</p>
    </div>
  </div>
</section>`;
};

const buildCheckoutScreen = (screen, index) => `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <h2>${escapeHtml(screen.title || "Checkout")}</h2>
  <div class="wizard-steps">
    <div class="step done"><span>1</span> Shipping</div>
    <div class="step active"><span>2</span> Payment</div>
    <div class="step"><span>3</span> Review</div>
  </div>
  <div class="checkout-grid">
    <form class="checkout-form">
      <h3>Payment method</h3>
      <label class="radio-card active"><input type="radio" name="pay" checked /> Credit / Debit card</label>
      <label class="radio-card"><input type="radio" name="pay" /> PayPal</label>
      <div class="form-row"><input class="text-input" placeholder="Card number" /><input class="text-input" placeholder="MM/YY" /></div>
      <div class="alert info">Stock validated for Red / M — reserved for 10 minutes</div>
      <button type="button" class="btn btn-primary">Continue to review</button>
    </form>
    <aside class="order-summary">
      <h3>Order summary</h3>
      <div class="summary-line"><span>Minimal Black Tee × 1</span><span>$24.00</span></div>
      <div class="summary-line"><span>Shipping</span><span>$5.00</span></div>
      <div class="summary-total"><span>Total</span><span>$29.00</span></div>
    </aside>
  </div>
</section>`;

const buildInventoryScreen = (screen, index) => `<section class="screen screen-admin${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <header class="screen-toolbar admin-toolbar">
    <div><h2>${escapeHtml(screen.title || "Inventory Dashboard")}</h2><p>${escapeHtml(screen.description || "")}</p></div>
    <button type="button" class="btn btn-primary">Export CSV</button>
  </header>
  <div class="stat-grid">
    <div class="stat-card"><span class="kpi-label">Total SKUs</span><span class="kpi-value">148</span></div>
    <div class="stat-card warn"><span class="kpi-label">Low Stock</span><span class="kpi-value">12</span></div>
    <div class="stat-card danger"><span class="kpi-label">Out of Stock</span><span class="kpi-value">3</span></div>
    <div class="stat-card ok"><span class="kpi-label">Healthy</span><span class="kpi-value">133</span></div>
  </div>
  <div class="alert warn">3 variants below reorder threshold — review alerts in the table below</div>
  <div class="table-wrap">
    <table class="data-table">
      <thead><tr><th>SKU</th><th>Product</th><th>Variant</th><th>Stock</th><th>Status</th><th>Override</th></tr></thead>
      <tbody>
        <tr><td>TE-2041-R-XL</td><td>Minimal Black Tee</td><td>Red / XL</td><td class="low">2</td><td><span class="status-pill warn">Low stock</span></td><td><button type="button" class="btn btn-ghost btn-sm">Adjust</button></td></tr>
        <tr><td>TE-1102-W-M</td><td>Classic Fit Tee</td><td>White / M</td><td>48</td><td><span class="status-pill ok">Healthy</span></td><td><button type="button" class="btn btn-ghost btn-sm">Adjust</button></td></tr>
        <tr><td>TE-3300-B-L</td><td>Heritage Logo Tee</td><td>Black / L</td><td class="neg">-1</td><td><span class="status-pill danger">Override</span></td><td><button type="button" class="btn btn-ghost btn-sm">Adjust</button></td></tr>
      </tbody>
    </table>
  </div>
</section>`;

const buildAccountScreen = (screen, index) => `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <div class="account-layout">
    <aside class="account-nav">
      <button type="button" class="account-tab active">Profile</button>
      <button type="button" class="account-tab">Addresses</button>
      <button type="button" class="account-tab">Security</button>
      <button type="button" class="account-tab">OTP Login</button>
    </aside>
    <div class="account-panel">
      <h2>${escapeHtml(screen.title || "Account Hub")}</h2>
      <form class="form-grid">
        <label>Full name<input class="text-input" value="Alex Rivera" /></label>
        <label>Email<input class="text-input" value="alex@example.com" /></label>
        <label>Phone<input class="text-input" value="+1 555 0100" /></label>
        <label>Default address<textarea class="text-input" rows="3">221B Baker Street, London</textarea></label>
      </form>
      <div class="security-block">
        <h3>Security</h3>
        <button type="button" class="btn btn-ghost">Change password</button>
        <button type="button" class="btn btn-primary">Send OTP for verification</button>
      </div>
    </div>
  </div>
</section>`;

const buildAuthScreen = (screen, index) => `<section class="screen screen-auth-full${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}" data-role="public">
  <div class="auth-page">
    <div class="auth-hero">
      <h1>Welcome back</h1>
      <p>Sign in to track orders, save favorites, and get member-only offers.</p>
      <div class="auth-features">
        <div class="auth-feature"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Secure checkout</div>
        <div class="auth-feature"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Order tracking</div>
        <div class="auth-feature"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Exclusive member drops</div>
      </div>
    </div>
    <div class="auth-form-wrap">
      <div class="auth-form-card">
        <h2>Sign in</h2>
        <p class="auth-subtitle">Enter your credentials to access your account</p>
        <div class="auth-segment">
          <button type="button" class="active">Email</button>
          <button type="button">Phone / OTP</button>
        </div>
        <form class="form-grid">
          <label>Email address<input class="text-input" type="email" placeholder="you@example.com" /></label>
          <label>Password<input class="text-input" type="password" placeholder="••••••••" /></label>
          <button type="button" class="btn btn-primary btn-block">Sign In</button>
        </form>
        <div class="auth-divider">or continue with</div>
        <div class="social-btns">
          <button type="button" class="social-btn">Google</button>
          <button type="button" class="social-btn">Apple</button>
        </div>
        <p class="meta" style="text-align:center;margin-top:20px">Don't have an account? <strong>Create one</strong></p>
      </div>
    </div>
  </div>
</section>`;

const buildAdminWizardScreen = (screen, index, advanced = false) => `<section class="screen screen-admin${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <header class="screen-toolbar">
    <div><h2>${escapeHtml(screen.title || "Product Manager")}</h2><p>${escapeHtml(screen.description || "Create and publish products with variants.")}</p></div>
    <span class="badge" style="position:static;background:#f3f4f6;color:#6b7280">Draft</span>
  </header>
  <div class="wizard-steps">
    <div class="step${advanced ? " done" : " active"}"><span>1</span> Basic Info</div>
    <div class="step${advanced ? " active" : ""}"><span>2</span> Attributes</div>
    <div class="step${advanced ? " active" : ""}"><span>3</span> Variants & SKU</div>
    <div class="step"><span>4</span> Pricing</div>
  </div>
  ${advanced ? `<div class="wizard-grid">
    <div class="form-grid">
      <label>Sizes<div class="chip-row"><span class="chip active">S</span><span class="chip active">M</span><span class="chip active">L</span><span class="chip">XL</span></div></label>
      <label>Colors<div class="chip-row"><span class="chip active">Black</span><span class="chip active">White</span><span class="chip">Red</span></div></label>
      <label>Category<select class="select-input"><option>Men &gt; Tees &gt; Graphic</option></select></label>
    </div>
    <div class="table-wrap">
      <table class="data-table compact">
        <thead><tr><th>SKU</th><th>Variant</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          <tr><td>TE-NEW-B-M</td><td>Black / M</td><td><input class="text-input sm" value="24.00" /></td><td><input class="text-input sm" value="50" /></td></tr>
          <tr><td>TE-NEW-W-M</td><td>White / M</td><td><input class="text-input sm" value="24.00" /></td><td><input class="text-input sm" value="35" /></td></tr>
        </tbody>
      </table>
    </div>
  </div>` : `<form class="form-grid wizard-form">
    <label>Product name<input class="text-input" placeholder="Heavyweight Oversized Tee — Midnight Black" /></label>
    <label>Description<textarea class="text-input" rows="4" placeholder="Describe fabric, fit, and style details…"></textarea></label>
    <label>Images<div class="upload-zone"><strong>Click to upload</strong> or drag and drop<br/><span class="meta">PNG, JPG or WEBP (max 5MB)</span></div></label>
    <div class="image-grid"><div class="product-image"><img src="${productImageUrl(5)}" alt="Upload preview" /></div></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button type="button" class="btn btn-ghost">Save Draft</button>
      <button type="button" class="btn btn-primary">Continue to Variants →</button>
    </div>
  </form>`}
</section>`;

const buildGenericRichScreen = (screen, index) => {
  const features = (screen.features || []).slice(0, 4);
  const featureCards = features.length > 0
    ? features.map((f) => `<div class="feature-card">${escapeHtml(f)}</div>`).join("")
    : `<div class="feature-card muted">Key capability area for ${escapeHtml(screen.title || "this screen")}</div>`;

  return `<section class="screen${index === 0 ? " active" : ""}" data-screen="${escapeHtml(screen.id)}">
  <header class="screen-toolbar">
    <div><h2>${escapeHtml(screen.title || "Screen")}</h2><p class="meta">${escapeHtml(screen.description || "Purpose-built view for this workflow.")}</p></div>
    <button type="button" class="btn btn-primary">Primary Action</button>
  </header>
  <div class="stat-grid">
    <div class="stat-card"><span class="kpi-label">Total</span><span class="kpi-value">1,248</span></div>
    <div class="stat-card ok"><span class="kpi-label">Active</span><span class="kpi-value">1,102</span></div>
    <div class="stat-card warn"><span class="kpi-label">Pending</span><span class="kpi-value">94</span></div>
    <div class="stat-card danger"><span class="kpi-label">Needs Attention</span><span class="kpi-value">12</span></div>
  </div>
  <div class="feature-grid">${featureCards}</div>
  <div class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>
        <tr><td>Sample Record A</td><td><span class="status-pill ok">Active</span></td><td>Today</td><td><button type="button" class="btn btn-ghost btn-sm">View</button></td></tr>
        <tr><td>Sample Record B</td><td><span class="status-pill warn">Pending</span></td><td>Yesterday</td><td><button type="button" class="btn btn-ghost btn-sm">View</button></td></tr>
        <tr><td>Sample Record C</td><td><span class="status-pill ok">Active</span></td><td>2 days ago</td><td><button type="button" class="btn btn-ghost btn-sm">View</button></td></tr>
      </tbody>
    </table>
  </div>
</section>`;
};

const ECOMMERCE_ONLY_TYPES = new Set([
  "home", "catalog", "pdp", "checkout", "inventory", "admin-wizard", "admin-wizard-advanced",
]);

const buildDomainAwareScreen = (screen, index, domain = "general") => {
  const type = screen.screenType || detectScreenType(screen);
  const useEcommerceScaffold = domain === "ecommerce" && ECOMMERCE_ONLY_TYPES.has(type);

  if (useEcommerceScaffold) {
    switch (type) {
      case "home": return buildHomeScreen(screen, index);
      case "catalog": return buildCatalogScreen(screen, index);
      case "pdp": return buildPdpScreen(screen, index);
      case "checkout": return buildCheckoutScreen(screen, index);
      case "inventory": return buildInventoryScreen(screen, index);
      case "admin-wizard-advanced": return buildAdminWizardScreen(screen, index, true);
      case "admin-wizard": return buildAdminWizardScreen(screen, index, false);
      default: break;
    }
  }

  switch (type) {
    case "auth": return buildAuthScreen(screen, index);
    case "account": return buildAccountScreen(screen, index);
    default: return buildGenericRichScreen(screen, index);
  }
};

const wrapScreenWithRole = (html, screen, index) => {
  const role = screen.role || detectScreenRole(screen);
  let result = html;
  if (!result.includes("data-role=")) {
    result = result.replace(/<section([^>]*)>/i, `<section$1 data-role="${role}">`);
  }
  return result;
};

export const buildRichScreenScaffold = (screen, index = 0, options = {}) => {
  const domain = options.domain || "general";
  const html = buildDomainAwareScreen(screen, index, domain);
  return wrapScreenWithRole(html, screen, index);
};

export const buildScreenScaffold = (screen, index = 0) => buildRichScreenScaffold(screen, index);

export const RICH_PROTOTYPE_CSS = `
${DESIGN_TOKENS_CSS}
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
.icon { flex-shrink: 0; color: var(--color-text-muted); }
.nav-section { margin-bottom: 14px; }
.nav-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0 0 6px 4px; }
.sidebar-admin .nav-btn { background: #1a2332; }
.hero-banner { position: relative; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px; min-height: 220px; background-size: cover; background-position: center; }
.hero-banner::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(17,24,39,0.82) 0%, rgba(17,24,39,0.35) 100%); }
.hero-content { position: relative; z-index: 1; padding: 40px 36px; color: #fff; max-width: 560px; }
.hero-content h1 { margin: 0 0 10px; font-size: 32px; font-weight: 800; letter-spacing: -0.03em; }
.hero-trust { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 18px; font-size: 12px; opacity: 0.9; }
.storefront-hero { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; margin-bottom: 24px; }
.eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #93c5fd; margin: 0 0 8px; font-weight: 600; }
.lead { color: #e5e7eb; line-height: 1.6; margin: 0; }
.search-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; }
.search-panel-elevated { box-shadow: var(--shadow-md); margin-bottom: 20px; }
.search-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.search-row .search-input { flex: 1; margin: 0; }
.search-input, .text-input, .select-input { width: 100%; border: 1px solid #d1d5db; border-radius: var(--radius-sm); padding: 10px 12px; font-size: 14px; transition: border-color 0.15s, box-shadow 0.15s; }
.search-input:focus, .text-input:focus, .select-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.search-suggestions, .chip-row, .category-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip, .category-pill { background: #fff; border: 1px solid #dbeafe; color: #1d4ed8; border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.category-pill { border-color: #e5e7eb; color: #374151; }
.category-pill.active, .chip.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.meta, .results-meta { font-size: 12px; color: var(--color-text-muted); margin: 10px 0 0; }
.breadcrumb { font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; }
.section-block { margin-top: 8px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.product-card { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); transition: box-shadow 0.2s, transform 0.2s; }
.product-card:hover { box-shadow: 0 12px 28px rgba(37, 99, 235, 0.14); transform: translateY(-3px); }
.product-image, .pdp-main-image, .thumb { border-radius: 10px; overflow: hidden; background: #f3f4f6; }
.product-image { aspect-ratio: 4/5; margin-bottom: 10px; }
.product-image img, .pdp-main-image img, .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pdp-main-image { aspect-ratio: 1; }
.thumb { border: 2px solid transparent; padding: 0; background: none; cursor: pointer; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; }
.badge { position: absolute; top: 10px; left: 10px; background: var(--color-primary); color: #fff; font-size: 10px; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; }
.stat-card.warn { border-color: #fde68a; background: #fffbeb; }
.stat-card.danger { border-color: #fecaca; background: #fef2f2; }
.stat-card.ok { border-color: #bbf7d0; background: #f0fdf4; }
.kpi-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 4px; }
.kpi-value { font-size: 24px; font-weight: 800; color: var(--color-text); }
.price { font-weight: 700; margin: 6px 0; }
.stock-hint { font-size: 11px; color: #b45309; margin: 0 0 8px; }
.btn { border: 0; border-radius: 8px; padding: 10px 16px; font-size: 13px; cursor: pointer; font-weight: 600; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-ghost { background: #f3f4f6; color: #374151; }
.btn-sm { padding: 6px 10px; font-size: 12px; }
.btn-block { width: 100%; margin-top: 8px; }
.screen-toolbar { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
.catalog-layout { display: grid; grid-template-columns: 240px 1fr; gap: 20px; }
.filter-panel { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.filter-group { margin-bottom: 14px; }
.filter-group h4 { margin: 0 0 8px; font-size: 13px; }
.filter-group label { display: block; font-size: 13px; margin-bottom: 6px; }
.swatches { display: flex; gap: 8px; }
.swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #d1d5db; }
.swatch.black { background: #111827; } .swatch.white { background: #f9fafb; } .swatch.red { background: #ef4444; } .swatch.blue { background: #3b82f6; }
.pdp-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.pdp-main-image { height: 360px; }
.pdp-thumbs { display: flex; gap: 8px; margin-top: 10px; }
.thumb { width: 64px; height: 64px; cursor: pointer; }
.thumb.active { outline: 2px solid #2563eb; }
.price-lg { font-size: 28px; font-weight: 700; }
.strike { font-size: 16px; color: #9ca3af; text-decoration: line-through; font-weight: 400; }
.stock-ok { color: #047857; font-size: 13px; }
.stock-warn { color: #b45309; font-size: 13px; }
.variant-group h4 { margin: 0 0 8px; font-size: 13px; }
.variant-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.variant { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.variant.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.variant.disabled { opacity: 0.45; cursor: not-allowed; text-decoration: line-through; }
.pdp-actions { display: flex; gap: 10px; margin: 16px 0; }
.wizard-steps { display: flex; gap: 12px; margin: 16px 0 24px; }
.step { flex: 1; background: #f3f4f6; border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 8px; }
.step span { width: 22px; height: 22px; border-radius: 50%; background: #d1d5db; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
.step.active { background: #eff6ff; color: #1d4ed8; }
.step.active span, .step.done span { background: #2563eb; }
.step.done { background: #ecfdf5; color: #047857; }
.checkout-grid, .wizard-grid, .account-layout { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
.checkout-form, .order-summary, .account-panel { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.radio-card { display: block; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
.radio-card.active { border-color: #2563eb; background: #eff6ff; }
.form-row { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin: 10px 0; }
.form-grid { display: grid; gap: 12px; }
.summary-line, .summary-total { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.summary-total { font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px; }
.alert { border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 12px; }
.alert.info { background: #eff6ff; color: #1d4ed8; }
.alert.warn { background: #fffbeb; color: #b45309; }
.table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: left; }
.data-table th { background: #f9fafb; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
.data-table .low { color: #b45309; font-weight: 700; }
.data-table .neg { color: #dc2626; font-weight: 700; }
.status-pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.status-pill.ok { background: #ecfdf5; color: #047857; }
.status-pill.warn { background: #fffbeb; color: #b45309; }
.status-pill.danger { background: #fef2f2; color: #dc2626; }
.screen-admin { border-left: 4px solid #7c3aed; }
.account-nav { display: flex; flex-direction: column; gap: 6px; }
.account-tab { text-align: left; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 10px 12px; cursor: pointer; }
.account-tab.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.upload-zone { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 28px; text-align: center; color: #6b7280; font-size: 13px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.upload-zone:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
.auth-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 420px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border); }
.auth-brand-panel { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #fff; padding: 40px; display: flex; flex-direction: column; justify-content: center; }
.auth-brand-panel h2 { margin: 0 0 12px; font-size: 28px; font-weight: 800; }
.auth-card { padding: 36px; background: var(--color-surface); }
.auth-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
.story-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.story-pill { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 999px; padding: 6px 10px; font-size: 11px; }
.ui-placeholder { border: 1px dashed #cbd5e1; border-radius: 10px; padding: 32px; text-align: center; color: #6b7280; }
.text-input.sm { padding: 6px 8px; font-size: 12px; }
@media (max-width: 900px) {
  .storefront-hero, .catalog-layout, .pdp-layout, .checkout-grid, .wizard-grid, .account-layout, .auth-split { grid-template-columns: 1fr; }
}`;

export const extractScreenHtml = (shellHtml, screenId) => {
  if (!shellHtml || !screenId) return "";

  const escapedId = screenId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<section[^>]*data-screen="${escapedId}"[^>]*>[\\s\\S]*?<\\/section>`,
    "i"
  );
  const match = String(shellHtml).match(pattern);
  return match ? sanitizePrototypeCode(match[0]) : "";
};

export const injectScreenIntoShell = (shellHtml, screenId, screenHtml) => {
  if (!shellHtml || !screenId) return shellHtml || "";

  const sanitized = sanitizePrototypeCode(screenHtml || "");
  const escapedId = screenId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<section[^>]*data-screen="${escapedId}"[^>]*>[\\s\\S]*?<\\/section>`,
    "i"
  );

  if (pattern.test(shellHtml)) {
    return shellHtml.replace(pattern, sanitized);
  }

  const roleMatch = sanitized.match(/data-role="([^"]+)"/);
  const role = roleMatch?.[1] || ROLES.CUSTOMER;
  const shellOpen = shellHtml.indexOf(`data-shell="${role}"`);
  if (shellOpen !== -1) {
    const insertAt = shellHtml.indexOf(">", shellOpen) + 1;
    if (insertAt > 0) {
      return `${shellHtml.slice(0, insertAt)}\n${sanitized}\n${shellHtml.slice(insertAt)}`;
    }
  }

  return shellHtml;
};

export const mergeScreenCss = (baseCss, chunkCss, screenId = "") => {
  const base = String(baseCss || "").trim();
  let extra = String(chunkCss || "").trim();
  if (!extra) return base;
  if (screenId) extra = scopeScreenCss(screenId, extra);
  if (!base) return extra;
  if (base.includes(extra)) return base;
  return `${base}\n\n/* screen: ${screenId || "chunk"} */\n${extra}`;
};

export const assemblePrototypeFromChunks = (structure, screenChunks = [], shellPrototype = null, theme = null) => {
  const activeTheme = theme || structure?.theme || null;
  const shell = shellPrototype || buildScaffoldFromStructure(structure, { theme: activeTheme });
  let html = shell.html || "";
  let css = shell.css || "";
  let js = shell.js || "";

  const chunkMap = new Map(
    screenChunks.map((c) => [c.screenId, c])
  );

  for (const screen of structure.screens || []) {
    const chunk = chunkMap.get(screen.id);
    if (!chunk?.html) continue;
    html = injectScreenIntoShell(html, screen.id, chunk.html);
    css = mergeScreenCss(css, chunk.css, screen.id);
    if (chunk.js?.trim()) {
      js = `${js}\n${sanitizePrototypeCode(chunk.js)}`;
    }
  }

  const fullDocument = buildFullDocument(html, css, js, structure?.appName || "Application Prototype", activeTheme);
  const anyScaffold = screenChunks.some((c) => c.usedScaffold);

  return { html, css, js, fullDocument, usedScaffold: anyScaffold };
};

const buildNavByRole = (navigation = []) => ({
  customer: navigation.filter((n) => (n.role || detectScreenRole({ id: n.screenId, title: n.label })) === ROLES.CUSTOMER),
  admin: navigation.filter((n) => (n.role || detectScreenRole({ id: n.screenId, title: n.label })) === ROLES.ADMIN),
  public: navigation.filter((n) => (n.role || detectScreenRole({ id: n.screenId, title: n.label })) === ROLES.PUBLIC),
});

export const buildScaffoldFromStructure = (structure = {}, options = {}) => {
  const domain = options.domain || "general";
  const theme = options.theme || structure.theme || DEFAULT_THEME;
  const screens = Array.isArray(structure.screens) ? structure.screens : [];
  const screensWithRoles = screens.map((s) => ({
    ...s,
    role: s.role || detectScreenRole(s),
    screenType: s.screenType || detectScreenType(s),
  }));
  const navigation = normalizeNavigation(structure, screensWithRoles);
  const navByRole = buildNavByRole(navigation);
  const groups = groupScreensByRole(screensWithRoles);
  const screensHtml = screensWithRoles
    .map((screen, index) => buildRichScreenScaffold(screen, index, { domain }))
    .join("");
  const appName = structure.appName || "Application Prototype";

  const html = buildMultiShellHtml({
    appName,
    screensHtml,
    groups,
    navByRole,
  });

  const css = `* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-body, Inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: ${theme.surface}; color: var(--color-text, #111827); -webkit-font-smoothing: antialiased; }
.screen { background: var(--color-surface, #fff); border-radius: var(--radius-lg, 16px); padding: 28px; }
.screen-header h2 { margin: 0 0 8px; font-size: 22px; }
.screen-header p { margin: 0 0 20px; color: var(--color-text-muted, #6b7280); line-height: 1.5; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
.feature-card { background: var(--color-surface-muted, #f9fafb); border: 1px solid var(--color-border, #e5e7eb); border-radius: var(--radius-md, 10px); padding: 12px; font-size: 13px; line-height: 1.45; }
.feature-card.muted { color: var(--color-text-muted, #6b7280); }
.mapped-stories h3 { margin: 0 0 8px; font-size: 14px; }
.mapped-stories ul { margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.5; }
${SHELL_CSS}
${RICH_PROTOTYPE_CSS}
${buildThemeTokensCss(theme)}`;

  const js = SHELL_JS;

  return { html, css, js, fullDocument: buildFullDocument(html, css, js, appName, theme) };
};

export const truncateCodeForAI = (code, max = 3500) => {
  const text = String(code || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n/* …truncated for AI context… */`;
};

export const mergeStructures = (structures = [], labels = []) => {
  const screens = [];
  const navigation = [];

  structures.forEach((structure, index) => {
    const label = labels[index] || `Part ${index + 1}`;
    (structure?.screens || []).forEach((screen) => {
      const id = `merge-p${index}-${screen.id || screens.length}`;
      screens.push({
        ...screen,
        id,
        title: screen.title ? `${label} — ${screen.title}` : label,
        sourcePart: label,
      });
      navigation.push({
        id: `nav-${id}`,
        label: screen.title || label,
        screenId: id,
      });
    });
  });

  return {
    appName: "Merged Application",
    summary: `Merged prototype combining ${structures.length} saved parts with ${screens.length} screens.`,
    userFlow: "Users navigate all merged screens from a unified sidebar.",
    navigation,
    screens,
  };
};

export const normalizeSavedPrototype = (proto = {}) => {
  let html = sanitizePrototypeCode(proto.html || "");
  const css = sanitizePrototypeCode(proto.css || "");
  const js = sanitizePrototypeCode(proto.js || "");
  let fullDocument = sanitizePrototypeCode(proto.fullDocument || "");

  if (!html && fullDocument) {
    const bodyMatch = fullDocument.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      html = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").trim();
    }
  }

  if (!fullDocument && html) {
    fullDocument = buildFullDocument(html, css, js);
  }

  return { html, css, js, fullDocument };
};

export const normalizePrototype = (parsed, structure) => {
  const rawHtml = parsed?.prototype?.html || parsed?.html || "";
  const rawCss = parsed?.prototype?.css || parsed?.css || "";
  const rawJs = parsed?.prototype?.js || parsed?.js || "";

  const html = sanitizePrototypeCode(rawHtml);
  const css = sanitizePrototypeCode(rawCss);
  const js = `${sanitizePrototypeCode(rawJs)}\n${SAFE_NAV_PATCH}`;

  if (isValidPrototype(html, structure)) {
    return {
      html,
      css,
      js,
      fullDocument: buildFullDocument(html, css, js),
      usedScaffold: false,
    };
  }

  const scaffold = buildScaffoldFromStructure(structure);
  return { ...scaffold, usedScaffold: true };
};
