/**
 * Role-based app shells for stakeholder-ready prototypes.
 * Customer, admin, and auth each get their own navigation pattern.
 */

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  PUBLIC: "public",
};

export const detectScreenRole = (screen) => {
  const key = `${screen?.id || ""} ${screen?.title || ""}`.toLowerCase();
  const type = screen?.screenType || "";

  if (type === "auth" || /auth.suite|sign.in|sign.up|login|register|otp/.test(key)) {
    if (!/account.hub|profile|security/.test(key)) return ROLES.PUBLIC;
  }
  if (
    type === "inventory"
    || type === "admin-wizard"
    || type === "admin-wizard-advanced"
    || /inventory|admin panel|product manager|product wizard|sku matrix|stock dashboard/.test(key)
  ) {
    return ROLES.ADMIN;
  }
  if (/wizard|admin|backend|dashboard/.test(key) && !/checkout|account/.test(key)) {
    return ROLES.ADMIN;
  }
  return ROLES.CUSTOMER;
};

export const groupScreensByRole = (screens = []) => {
  const groups = { customer: [], admin: [], public: [] };
  for (const screen of screens) {
    const role = screen.role || detectScreenRole(screen);
    groups[role]?.push(screen);
  }
  return groups;
};

export const buildRoleSwitcher = (rolesPresent, defaultRole) => {
  const tabs = [
    { id: ROLES.CUSTOMER, label: "App", icon: "store" },
    { id: ROLES.ADMIN, label: "Admin", icon: "settings" },
    { id: ROLES.PUBLIC, label: "Sign In", icon: "user" },
  ].filter((t) => rolesPresent.includes(t.id));

  if (tabs.length <= 1) return "";

  const buttons = tabs
    .map(
      (t) =>
        `<button type="button" class="role-btn${t.id === defaultRole ? " active" : ""}" data-role="${t.id}" aria-pressed="${t.id === defaultRole}">${escapeHtml(t.label)}</button>`
    )
    .join("");

  return `<div class="proto-bar" role="banner">
  <div class="proto-bar-inner">
    <div class="proto-brand"><span class="proto-dot"></span> Interactive Prototype</div>
    <div class="role-switcher" role="tablist" aria-label="Switch app experience">${buttons}</div>
  </div>
</div>`;
};

const navIcon = (name) => {
  const icons = {
    home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    catalog: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    cart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  };
  return icons[name] || "";
};

export const buildCustomerTopNav = (appName, navItems = []) => {
  const links = navItems
    .map(
      (item, i) =>
        `<button type="button" class="topnav-link${i === 0 ? " active" : ""}" data-target="${escapeHtml(item.screenId)}">${escapeHtml(item.label)}</button>`
    )
    .join("");

  return `<header class="store-topbar">
  <div class="topbar-inner">
    <div class="topbar-left">
      <div class="store-logo">${escapeHtml(appName)}</div>
      <nav class="topnav" aria-label="Store navigation">${links}</nav>
    </div>
    <div class="topbar-right">
      <button type="button" class="icon-btn" aria-label="Search">${navIcon("search")}</button>
      <button type="button" class="icon-btn cart-btn" aria-label="Cart">${navIcon("cart")}<span class="cart-badge">2</span></button>
      <button type="button" class="icon-btn" aria-label="Account">${navIcon("user")}</button>
    </div>
  </div>
</header>`;
};

export const buildAdminSidebar = (appName, navItems = []) => {
  const links = navItems
    .map(
      (item, i) =>
        `<button type="button" class="admin-nav-btn${i === 0 ? " active" : ""}" data-target="${escapeHtml(item.screenId)}">
      <span class="admin-nav-icon">${navIcon(item.icon || "catalog")}</span>
      <span>${escapeHtml(item.label)}</span>
    </button>`
    )
    .join("");

  return `<aside class="admin-sidebar">
  <div class="admin-brand">
    <span class="admin-badge">Admin</span>
    <div class="admin-brand-name">${escapeHtml(appName)}</div>
  </div>
  <nav class="admin-nav" aria-label="Admin navigation">${links}</nav>
  <div class="admin-sidebar-footer">
    <div class="admin-user">
      <div class="admin-avatar">A</div>
      <div><strong>Admin User</strong><span class="meta">admin@store.com</span></div>
    </div>
  </div>
</aside>`;
};

export const buildAdminTopbar = () => `<header class="admin-topbar">
  <div class="admin-topbar-title">Dashboard</div>
  <div class="admin-topbar-actions">
    <button type="button" class="btn btn-ghost btn-sm">Notifications</button>
    <button type="button" class="btn btn-primary btn-sm">+ New</button>
  </div>
</header>`;

export const SHELL_CSS = `
.proto-bar { background: #0f172a; color: #e2e8f0; border-bottom: 1px solid #1e293b; position: sticky; top: 0; z-index: 100; }
.proto-bar-inner { max-width: 1400px; margin: 0 auto; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.proto-brand { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #94a3b8; }
.proto-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
.role-switcher { display: flex; gap: 4px; background: #1e293b; padding: 4px; border-radius: 10px; }
.role-btn { border: 0; background: transparent; color: #94a3b8; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.role-btn:hover { color: #fff; }
.role-btn.active { background: #2563eb; color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.35); }

.shell { display: none; flex: 1; flex-direction: column; min-height: calc(100vh - 49px); }
.shell.active { display: flex; }
.shell-public.active { display: block; }

/* Customer storefront shell */
.shell-customer { background: #fff; }
.store-topbar { background: #fff; border-bottom: 1px solid var(--color-border, #e5e7eb); position: sticky; top: 49px; z-index: 50; }
.topbar-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.topbar-left { display: flex; align-items: center; gap: 32px; }
.store-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: #111827; }
.topnav { display: flex; gap: 4px; }
.topnav-link { border: 0; background: transparent; padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.15s; }
.topnav-link:hover { background: #f3f4f6; color: #111827; }
.topnav-link.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.icon-btn { border: 0; background: #f9fafb; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; position: relative; transition: background 0.15s; }
.icon-btn:hover { background: #f3f4f6; }
.cart-badge { position: absolute; top: 4px; right: 4px; background: #2563eb; color: #fff; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

.customer-viewport { flex: 1; background: #f8fafc; padding: 24px; max-width: 1280px; width: 100%; margin: 0 auto; }
.shell-customer .screen { border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(15,23,42,0.06); }

/* Admin shell */
.shell-admin { flex-direction: row; background: #f1f5f9; }
.admin-sidebar { width: 260px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; flex-shrink: 0; }
.admin-brand { padding: 24px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.admin-badge { display: inline-block; background: #7c3aed; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.admin-brand-name { font-size: 16px; font-weight: 800; color: #111827; }
.admin-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.admin-nav-btn { border: 0; background: transparent; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #4b5563; cursor: pointer; text-align: left; transition: all 0.15s; width: 100%; }
.admin-nav-btn:hover { background: #f9fafb; color: #111827; }
.admin-nav-btn.active { background: #f5f3ff; color: #7c3aed; font-weight: 600; }
.admin-nav-icon { display: flex; opacity: 0.7; }
.admin-nav-btn.active .admin-nav-icon { opacity: 1; }
.admin-sidebar-footer { padding: 16px; border-top: 1px solid #f3f4f6; }
.admin-user { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.admin-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.admin-topbar { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
.admin-topbar-title { font-size: 18px; font-weight: 700; }
.admin-viewport { flex: 1; padding: 24px; overflow: auto; }
.shell-admin .screen { border-left: 4px solid #7c3aed; }

/* Auth shell — fullscreen, no app chrome */
.shell-public { background: #f8fafc; }
.shell-public .screen { display: none; min-height: calc(100vh - 49px); padding: 0; margin: 0; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.shell-public .screen.active { display: flex; align-items: stretch; }
.screen-auth-full { width: 100%; }
.auth-page { display: grid; grid-template-columns: 1.1fr 0.9fr; width: 100%; min-height: calc(100vh - 49px); }
.auth-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); color: #fff; padding: 60px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
.auth-hero::after { content: ""; position: absolute; inset: 0; background: url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80") center/cover; opacity: 0.15; }
.auth-hero > * { position: relative; z-index: 1; }
.auth-hero h1 { font-size: 36px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.03em; }
.auth-hero p { font-size: 16px; line-height: 1.6; opacity: 0.9; max-width: 400px; margin: 0 0 32px; }
.auth-features { display: flex; flex-direction: column; gap: 12px; }
.auth-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; opacity: 0.95; }
.auth-form-wrap { display: flex; align-items: center; justify-content: center; padding: 40px; background: #fff; }
.auth-form-card { width: 100%; max-width: 400px; }
.auth-form-card h2 { margin: 0 0 8px; font-size: 26px; font-weight: 800; }
.auth-subtitle { color: #6b7280; font-size: 14px; margin: 0 0 28px; }
.auth-segment { display: flex; background: #f3f4f6; padding: 4px; border-radius: 10px; margin-bottom: 24px; }
.auth-segment button { flex: 1; border: 0; background: transparent; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 14px; color: #6b7280; cursor: pointer; }
.auth-segment button.active { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.auth-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; color: #9ca3af; font-size: 12px; font-weight: 600; }
.auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #e5e7eb; }
.social-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.social-btn { border: 1px solid #e5e7eb; background: #fff; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }

#app { display: flex; flex-direction: column; min-height: 100vh; }
.screen { display: none; }
.screen.active { display: block; }

@media (max-width: 900px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-hero { padding: 40px 24px; min-height: 200px; }
  .topnav { display: none; }
  .admin-sidebar { width: 72px; }
  .admin-nav-btn span:not(.admin-nav-icon) { display: none; }
  .admin-brand-name, .admin-sidebar-footer { display: none; }
}
`;

export const SHELL_JS = `
(function() {
  const roleBtns = document.querySelectorAll('.role-btn');
  const shells = document.querySelectorAll('.shell');

  function screensInShell(shell) {
    return shell ? Array.from(shell.querySelectorAll('.screen')) : [];
  }

  function activateScreen(screenId, shell) {
    if (!shell) return;
    screensInShell(shell).forEach((s) => {
      s.classList.toggle('active', s.getAttribute('data-screen') === screenId);
    });
    shell.querySelectorAll('[data-target]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === screenId);
    });
  }

  function setRole(role) {
    shells.forEach((s) => s.classList.toggle('active', s.getAttribute('data-shell') === role));
    roleBtns.forEach((b) => {
      const on = b.getAttribute('data-role') === role;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const shell = document.querySelector('[data-shell="' + role + '"]');
    const first = screensInShell(shell)[0];
    if (first) activateScreen(first.getAttribute('data-screen'), shell);
  }

  roleBtns.forEach((btn) => {
    btn.addEventListener('click', () => setRole(btn.getAttribute('data-role')));
  });

  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const shell = btn.closest('.shell');
      activateScreen(target, shell);
    });
  });

  const defaultRoleBtn = document.querySelector('.role-btn.active') || roleBtns[0];
  if (defaultRoleBtn) {
    setRole(defaultRoleBtn.getAttribute('data-role'));
  } else {
    const firstShell = shells[0];
    if (firstShell) {
      firstShell.classList.add('active');
      const first = screensInShell(firstShell)[0];
      if (first) activateScreen(first.getAttribute('data-screen'), firstShell);
    }
  }
})();
`;

export const buildMultiShellHtml = ({ appName, screensHtml, groups, navByRole }) => {
  const rolesPresent = Object.keys(groups).filter((r) => groups[r].length > 0);
  const defaultRole = rolesPresent.includes(ROLES.CUSTOMER)
    ? ROLES.CUSTOMER
    : rolesPresent[0] || ROLES.CUSTOMER;

  const roleSwitcher = buildRoleSwitcher(rolesPresent, defaultRole);

  const customerScreens = groups.customer
    .map((s) => extractScreenFromBundle(screensHtml, s.id))
    .join("");
  const adminScreens = groups.admin
    .map((s) => extractScreenFromBundle(screensHtml, s.id))
    .join("");
  const publicScreens = groups.public
    .map((s) => extractScreenFromBundle(screensHtml, s.id))
    .join("");

  const parts = [`<div id="app">`, roleSwitcher];

  if (groups.customer.length) {
    parts.push(`<div class="shell shell-customer" data-shell="${ROLES.CUSTOMER}">
      ${buildCustomerTopNav(appName, navByRole.customer)}
      <main class="customer-viewport">${customerScreens}</main>
    </div>`);
  }

  if (groups.admin.length) {
    parts.push(`<div class="shell shell-admin" data-shell="${ROLES.ADMIN}">
      ${buildAdminSidebar(appName, navByRole.admin)}
      <div class="admin-main">
        ${buildAdminTopbar()}
        <main class="admin-viewport">${adminScreens}</main>
      </div>
    </div>`);
  }

  if (groups.public.length) {
    parts.push(`<div class="shell shell-public" data-shell="${ROLES.PUBLIC}">
      ${publicScreens}
    </div>`);
  }

  if (!rolesPresent.length) {
    parts.push(`<div class="shell active" data-shell="empty"><main class="customer-viewport"><section class="screen active"><h2>Prototype</h2><p>No screens mapped yet.</p></section></main></div>`);
  }

  parts.push("</div>");
  return parts.join("\n");
};

const extractScreenFromBundle = (allScreensHtml, screenId) => {
  const escaped = screenId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<section[^>]*data-screen="${escaped}"[^>]*>[\\s\\S]*?<\\/section>`, "i");
  const match = String(allScreensHtml).match(pattern);
  return match ? match[0] : "";
};

export const annotateScreenWithRole = (screenHtml, role) => {
  if (!screenHtml || !role) return screenHtml;
  if (screenHtml.includes("data-role=")) return screenHtml;
  return screenHtml.replace(/<section([^>]*)>/i, `<section$1 data-role="${role}">`);
};
