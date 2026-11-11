import "./style.css";
import {
  SIZES,
  CATEGORIES,
  today,
  emptyState,
  sampleState,
  summary,
  transact,
  money,
  whole,
} from "./domain.js";
import {
  createRepository,
  STORAGE_KEY,
  getAccounts,
  saveAccount,
} from "./storage.js";

const root = document.querySelector("#app");
const pages = {
  dashboard: "Dashboard",
  production: "Egg Production",
  inventory: "Inventory & Packing",
  sales: "Sales",
  expenses: "Expenses",
};
const icons = {
  dashboard:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  production: '<path d="M19 14c0 4-3 7-7 7s-7-3-7-7S9 3 12 3s7 7 7 11Z"/>',
  inventory:
    '<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4"/>',
  sales: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h3"/>',
  expenses:
    '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18m-6 5h3M7 5V3h10v2"/>',
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const fmt = new Intl.NumberFormat("en-PH");
const php = (cents) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    cents / 100,
  );
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let repository;
let state;
let storageError = "";
let notice = null;
let page = "dashboard";
// Demo authentication state. Accounts are stored in localStorage.
let mockLoggedIn = false;
let authMode = "login";
try {
  repository = createRepository(window.localStorage);
  state = repository.load();
  repository.save(state);
} catch {
  state = emptyState();
  storageError =
    "Saved demo data could not be loaded or browser storage is unavailable. Existing data has not been overwritten. Reload, or use a demo reset to replace it.";
}

const field = (label, name, type = "number", attrs = "", value = "") =>
  `<label>${label}<input name="${name}" type="${type}" ${attrs} value="${esc(value)}" required></label>`;
const options = (values) =>
  values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
const select = (label, name, values) =>
  `<label>${label}<select name="${name}">${options(values)}</select></label>`;
const dateField = () => field("Date", "date", "date", "", today());
const feedback = () =>
  '<p class="form-feedback" role="alert" tabindex="-1"></p>';
const table = (
  headers,
  rows,
  empty = "No records yet. Your next saved transaction will appear here.",
) =>
  rows.length
    ? `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : `<div class="empty"><p>${empty}</p></div>`;
const events = (type) =>
  state.events
    .filter((e) => e.type === type)
    .slice()
    .reverse();
const number = (value) => fmt.format(value);

function stockTable(t) {
  return table(
    ["Egg size", "Loose eggs", "Full trays", "Ready to pack"],
    SIZES.map((size) => [
      `<strong>${size}</strong>`,
      number(t.stock[size].loose),
      number(t.stock[size].trays),
      `${number(Math.floor(t.stock[size].loose / 30))} trays`,
    ]),
  );
}

function activityText(e) {
  if (e.type === "production")
    return `${number(Object.values(e.quantities).reduce((a, b) => a + b, 0))} eggs recorded`;
  if (e.type === "packing") return `${e.trays} ${e.size} trays packed`;
  if (e.type === "sale")
    return `${e.trays} ${e.size} trays sold · ${php(e.trays * e.priceCents)}`;
  return `${e.category} · ${php(e.amountCents)}`;
}

function dashboard(t) {
  const metrics = [
    ["Eggs Produced", number(t.produced), "produced"],
    ["Loose Eggs", number(t.loose), "loose"],
    ["Available Trays", number(t.trays), "trays"],
    ["Trays Sold", number(t.sold), "sold"],
    ["Sales Revenue", php(t.revenueCents), "revenue"],
    ["Operating Expenses", php(t.expenseCents), "expenses"],
  ];
  return `<section class="metrics" aria-label="Farm totals">${metrics.map(([title, value, key]) => `<article class="metric"><h3>${title}</h3><strong data-metric="${key}">${value}</strong></article>`).join("")}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h2>Financial Overview</h2></div><dl class="financial-summary"><div><dt>Sales Revenue</dt><dd>${php(t.revenueCents)}</dd></div><div><dt>Operating Expenses</dt><dd>${php(t.expenseCents)}</dd></div><div class="financial-net"><dt>Net Result</dt><dd data-metric="net">${php(t.netCents)}</dd></div></dl><p class="financial-note">Revenue less recorded expenses · All dates</p></section>
    <section class="panel"><div class="panel-heading"><h2>Recent Activity</h2></div>${
      state.events.length
        ? `<ol class="activity">${state.events
            .slice(-6)
            .reverse()
            .map(
              (e) =>
                `<li>${icon({ production: "production", packing: "inventory", sale: "sales", expense: "expenses" }[e.type])}<div><strong>${esc(activityText(e))}</strong><small>${esc(e.date)} · ${esc(e.type)}</small></div></li>`,
            )
            .join("")}</ol>`
        : '<div class="empty"><p>No transactions yet.</p></div>'
    }</section></div>
    <section class="panel dashboard-stock"><div class="panel-heading"><h2>Inventory by egg size</h2><a href="#inventory">Manage stock</a></div>${stockTable(t)}</section>`;
}

function production() {
  return `<div class="work-grid"><section class="panel form-panel"><h2>Record egg production</h2><p>New eggs enter loose inventory. Packing is a separate step.</p><form id="production-form" novalidate>${dateField()}<div class="quantity-grid">${SIZES.map((size) => field(`${size} eggs`, size, "number", 'min="0" max="1000000" step="1" inputmode="numeric"', "0")).join("")}</div><div class="calculation"><span>Total production</span><output id="production-total">0 eggs</output></div>${feedback()}<button class="button primary" type="submit">Save production</button></form></section>
    <section class="panel"><div class="panel-heading"><div><h2>Production history</h2><p>All saved production records</p></div><span class="count">${events("production").length} records</span></div>${table(
      ["Date", ...SIZES, "Total"],
      events("production").map((e) => [
        esc(e.date),
        ...SIZES.map((s) => number(e.quantities[s])),
        `<strong>${number(Object.values(e.quantities).reduce((a, b) => a + b, 0))}</strong>`,
      ]),
    )}</section></div>`;
}

function inventory(t) {
  return `<section class="panel inventory-panel"><div class="panel-heading"><div><h2>Available inventory</h2><p>Current loose eggs and packed trays by size.</p></div><span class="count">30 eggs = 1 tray</span></div>${stockTable(t)}</section>
    <div class="work-grid"><section class="panel form-panel"><h2>Pack loose eggs</h2><form id="packing-form" novalidate>${dateField()}${select("Egg size", "size", SIZES)}${field("Number of trays", "trays", "number", 'min="1" max="1000000" step="1"', "1")}<p class="stock-hint" id="packing-stock"></p><div class="calculation"><span>Loose eggs needed</span><output id="packing-total">30 eggs</output></div>${feedback()}<button class="button primary" type="submit">Pack trays</button></form></section>
    <section class="panel"><div class="panel-heading"><div><h2>Packing history</h2><p>Eggs converted into full trays</p></div></div>${table(
      ["Date", "Size", "Trays packed", "Eggs used"],
      events("packing").map((e) => [
        esc(e.date),
        esc(e.size),
        number(e.trays),
        number(e.trays * 30),
      ]),
    )}</section></div>`;
}

function sales() {
  return `<div class="work-grid"><section class="panel form-panel"><h2>Record a tray sale</h2><p>Prices entered here are illustrative demo values.</p><form id="sale-form" novalidate>${dateField()}${select("Egg size", "size", SIZES)}${field("Trays sold", "trays", "number", 'min="1" max="1000000" step="1"', "1")}${field("Price per tray (₱)", "price", "number", 'min="0.01" max="1000000" step="0.01" inputmode="decimal"', "210.00")}<p class="stock-hint" id="sale-stock"></p><div class="calculation"><span>Sale total</span><output id="sale-total">${php(21000)}</output></div>${feedback()}<button class="button primary" type="submit">Save sale</button></form></section>
    <section class="panel"><div class="panel-heading"><div><h2>Sales history</h2><p>Recorded sales deduct available full trays</p></div></div>${table(
      ["Date", "Size", "Trays", "Price / tray", "Total"],
      events("sale").map((e) => [
        esc(e.date),
        esc(e.size),
        number(e.trays),
        php(e.priceCents),
        `<strong>${php(e.trays * e.priceCents)}</strong>`,
      ]),
    )}</section></div>`;
}

function expenses() {
  return `<div class="work-grid"><section class="panel form-panel"><h2>Record an expense</h2><form id="expense-form" novalidate>${dateField()}${select("Category", "category", CATEGORIES)}${field("Description", "description", "text", 'maxlength="200" placeholder="e.g. Feed purchase"')}${field("Amount (₱)", "amount", "number", 'min="0.01" max="1000000" step="0.01" inputmode="decimal"')}${feedback()}<button class="button primary" type="submit">Save expense</button></form></section>
    <section class="panel"><div class="panel-heading"><div><h2>Expense history</h2><p>Costs included in the dashboard net result</p></div></div>${table(
      ["Date", "Category", "Description", "Amount"],
      events("expense").map((e) => [
        esc(e.date),
        esc(e.category),
        esc(e.description),
        `<strong>${php(e.amountCents)}</strong>`,
      ]),
    )}</section></div>`;
}

function render() {
  if (!mockLoggedIn) {
    loginScreen();
    return;
  }
  page = Object.hasOwn(pages, location.hash.slice(1))
    ? location.hash.slice(1)
    : "dashboard";
  const t = summary(state);
  document.title = `${pages[page]} | EggTrack Demo`;
  root.innerHTML = `<a class="skip" href="#main-content">Skip to content</a><aside class="sidebar"><div class="sidebar-header"><a class="brand" href="#dashboard">EggTrack<small>Golden Nest Poultry Farm</small></a><button class="nav-toggle" type="button" data-action="toggle-nav" aria-expanded="false" aria-controls="main-navigation" aria-label="Toggle navigation"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button></div><nav id="main-navigation" aria-label="Main navigation">${Object.entries(
    pages,
  )
    .map(
      ([key, title]) =>
        `<a href="#${key}" ${key === page ? 'aria-current="page"' : ""}>${icon(key)}${title}</a>`,
    )
    .join("")}</nav></aside>
    <div class="workspace"><header class="topbar"><div><h1>${pages[page]}</h1>${page === "dashboard" ? "<p>Overview of farm operations</p>" : ""}</div> <button class="button secondary" type="button" data-action="mock-logout">Sign out</button></header>
    <main id="main-content" tabindex="-1"><div class="demo-banner"><p>Demo mode — Data is stored locally.</p><button type="button" class="text-button" data-action="reset">Reset Demo Data</button></div>
    ${storageError ? `<div class="storage-error" role="alert">${esc(storageError)}</div>` : ""}
    ${notice ? `<div class="notice" role="status">${esc(notice)}</div>` : ""}
    ${{ dashboard, production, inventory, sales, expenses }[page](t)}
    <footer><span>${state.events.length} demo transactions · All dates</span><span>${storageError ? "Storage needs attention" : "Stored on this device"} · No real farm records</span></footer></main></div>
    <dialog id="reset-dialog" aria-labelledby="reset-title"><h2 id="reset-title">Reset demo data</h2><p>This replaces EggTrack demo transactions in this browser only. Choose sample records or an empty workspace for the 95-egg walkthrough.</p><div class="dialog-actions"><button class="button primary" data-reset="sample">Restore sample data</button><button class="button secondary" data-reset="empty">Start empty demo</button><button class="text-button" data-action="cancel-reset">Cancel</button></div><p class="form-feedback" role="alert"></p></dialog>`;
  updateCalculations();
}


// Login and registration screens for the localStorage-only prototype.
function loginScreen() {
  document.title = `${authMode === "login" ? "Login" : "Create Account"} | EggTrack`;
  const isRegister = authMode === "register";
  root.innerHTML = `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <div class="login-brand">
          <a class="login-brand-name" href="#" aria-label="EggTrack home">EggTrack</a>
          <p>Golden Nest Poultry Farm</p>
        </div>

        <div class="login-heading">
          <h1 id="login-title">${isRegister ? "Create Your Account" : "Welcome Back"}</h1>
          <p>${isRegister ? "Register to access the farm dashboard." : "Sign in to access your farm dashboard."}</p>
        </div>

        <form id="${isRegister ? "register-form" : "login-form"}" novalidate>
          ${isRegister ? `
            <label for="register-name">Full Name</label>
            <input id="register-name" name="name" type="text" placeholder="Enter your full name" autocomplete="name" required>
          ` : ""}
          <label for="${isRegister ? "register-email" : "login-email"}">Email</label>
          <input id="${isRegister ? "register-email" : "login-email"}" name="email" type="email" placeholder="Enter your email" autocomplete="email" required>

          <label for="${isRegister ? "register-password" : "login-password"}">Password</label>
          <div class="password-field">
            <input
              id="${isRegister ? "register-password" : "login-password"}"
              name="password"
              type="password"
              placeholder="${isRegister ? "Create a password (at least 6 characters)" : "Enter your password"}"
              autocomplete="${isRegister ? "new-password" : "current-password"}"
              required
            >
            ${isRegister ? "" : '<button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password">Show</button>'}
          </div>
          ${isRegister ? `
            <label for="register-confirm-password">Confirm Password</label>
            <input id="register-confirm-password" name="confirmPassword" type="password" placeholder="Re-enter your password" autocomplete="new-password" required>
          ` : `
            <div class="login-options">
              <span></span>
              <button class="login-link" type="button" data-action="forgot-password">Forgot password?</button>
            </div>
          `}
          <p class="login-feedback" id="login-feedback" role="alert"></p>
          <button class="button primary login-submit" type="submit">${isRegister ? "Create Account" : "Sign In"}</button>
        </form>

        <p class="login-switch">${isRegister ? "Already have an account?" : "Don't have an account?"} <button class="login-link" type="button" data-action="switch-auth">${isRegister ? "Sign in" : "Create account"}</button></p>
        <p class="login-footer">Authorized personnel only</p>
        <p class="login-demo-note">Prototype only: accounts are saved in this browser's localStorage. Do not use real or sensitive passwords.</p>
      </section>
    </main>`;
}

function updateCalculations() {
  const t = summary(state);
  const form = root.querySelector("form");
  if (!form) return;
  const data = Object.fromEntries(new FormData(form));
  if (form.id === "production-form") {
    try {
      root.querySelector("#production-total").textContent =
        `${number(SIZES.reduce((sum, s) => sum + whole(data[s], s), 0))} eggs`;
    } catch {
      root.querySelector("#production-total").textContent = "Check quantities";
    }
  }
  if (form.id === "packing-form") {
    const stock = t.stock[data.size];
    root.querySelector("#packing-stock").textContent =
      `${number(stock.loose)} loose eggs available · Up to ${number(Math.floor(stock.loose / 30))} trays`;
    try {
      root.querySelector("#packing-total").textContent =
        `${number(whole(data.trays, "Trays", 1) * 30)} eggs`;
    } catch {
      root.querySelector("#packing-total").textContent = "Check quantity";
    }
  }
  if (form.id === "sale-form") {
    root.querySelector("#sale-stock").textContent =
      `${number(t.stock[data.size].trays)} ${data.size} trays available`;
    try {
      root.querySelector("#sale-total").textContent = php(
        whole(data.trays, "Trays", 1) * money(data.price),
      );
    } catch {
      root.querySelector("#sale-total").textContent =
        "Check quantity and price";
    }
  }
}

root.addEventListener("input", updateCalculations);
root.addEventListener("change", updateCalculations);
root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;

  // Create a local demo account. Passwords are stored as plain text, for prototype use only.
  if (form.id === "register-form") {
    const data = Object.fromEntries(new FormData(form));
    const feedback = root.querySelector("#login-feedback");
    if (!data.name?.trim() || !data.email?.trim() || !data.password) {
      feedback.textContent = "Complete all fields before creating your account.";
      return;
    }
    if (data.password.length < 6) {
      feedback.textContent = "Your password must be at least 6 characters.";
      return;
    }
    if (data.password !== data.confirmPassword) {
      feedback.textContent = "The passwords do not match.";
      return;
    }
    try {
      saveAccount(window.localStorage, {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        createdAt: new Date().toISOString(),
      });
      authMode = "login";
      loginScreen();
      root.querySelector("#login-feedback").textContent = "Account created. You can now sign in.";
    } catch (error) {
      feedback.textContent = error.message || "Could not save the account in this browser.";
    }
    return;
  }

  // Verify the entered credentials against accounts saved in localStorage.
  if (form.id === "login-form") {
    const data = Object.fromEntries(new FormData(form));
    const feedback = root.querySelector("#login-feedback");
    const email = data.email?.trim().toLowerCase();
    const account = getAccounts(window.localStorage).find(
      (saved) => saved.email === email && saved.password === data.password,
    );
    if (!account) {
      feedback.textContent = "Email or password is incorrect. Create an account first if you are a new user.";
      return;
    }
    mockLoggedIn = true;
    notice = `Welcome, ${account.name}.`;
    render();
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const type = {
    "production-form": "production",
    "packing-form": "packing",
    "sale-form": "sale",
    "expense-form": "expense",
  }[form.id];
  if (!type) return;
  try {
    if (storageError)
      throw new Error(
        "Resolve the storage warning before saving transactions.",
      );
    const next = transact(state, { ...data, type, quantities: data });
    repository.save(next); // Persist first. A failed write must not change visible stock.
    state = next;
    notice = {
      production: "Production saved. Loose inventory updated.",
      packing: "Packing saved. Loose eggs and trays updated.",
      sale: "Sale saved. Tray stock and revenue updated.",
      expense: "Expense saved. Dashboard totals updated.",
    }[type];
    render();
    root.querySelector('[role="status"]')?.scrollIntoView({ block: "nearest" });
  } catch (error) {
    const message = form.querySelector(".form-feedback");
    message.textContent = error.message;
    message.focus();
  }
});

root.addEventListener("click", (event) => {
  if (event.target.closest(".skip")) {
    event.preventDefault();
    root.querySelector("main").focus();
    return;
  }
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.action === "switch-auth") {
    authMode = authMode === "login" ? "register" : "login";
    loginScreen();
    return;
  }
  if (target.dataset.action === "toggle-password") {
    const password = root.querySelector("#login-password");
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    target.textContent = showing ? "Show" : "Hide";
    target.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    return;
  }
  if (target.dataset.action === "forgot-password") {
    root.querySelector("#login-feedback").textContent =
      "Please contact Tech Admin for assistance xd.";
    return;
  }
  if (target.dataset.action === "mock-logout") {
    mockLoggedIn = false;
    notice = null;
    location.hash = "#dashboard";
    loginScreen();
    return;
  }

  if (target.dataset.action === "toggle-nav") {
    const open = root.querySelector(".sidebar").classList.toggle("is-open");
    target.setAttribute("aria-expanded", String(open));
    return;
  }
  const dialog = root.querySelector("#reset-dialog");
  if (target.dataset.action === "reset") dialog.showModal();
  if (target.dataset.action === "cancel-reset") dialog.close();
  if (target.dataset.reset) {
    try {
      const next =
        target.dataset.reset === "sample" ? sampleState() : emptyState();
      if (!repository) repository = createRepository(window.localStorage);
      repository.save(next, { replace: true });
      state = next;
      storageError = "";
      notice =
        target.dataset.reset === "sample"
          ? "Sample demo data restored."
          : "Empty demo ready. Start by recording 95 Large eggs.";
      render();
    } catch {
      dialog.querySelector(".form-feedback").textContent =
        "Could not save the reset. Enable browser storage and try again. Your data has not been replaced.";
    }
  }
});

root.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && root.querySelector(".sidebar.is-open")) {
    root.querySelector(".sidebar").classList.remove("is-open");
    const toggle = root.querySelector(".nav-toggle");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
});

window.addEventListener("hashchange", () => {
  notice = null;
  render();
  root.querySelector("main").focus();
});
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    storageError =
      "Demo data changed in another tab. Reload this page to use the latest records before saving.";
    render();
  }
});
render();
