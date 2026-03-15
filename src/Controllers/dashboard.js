// ============================================================
//  E-Wallet — Controller : dashboard.js
//  Dashboard principal — Crédit / Débit / Stats
//  Utilise async/await ET callbacks selon les fonctions
// ============================================================
import { getUserById, creditWallet, debitWallet, getStats } from "../Models/database.js";
import Session from "../Models/session.js";

// ── Guard : vérifier session ────────────────────────────────
const session = Session.get();
if (!session) {
  window.location.href = "/src/Views/login.html";
}

document.addEventListener("DOMContentLoaded", async () => {

  // ── 1. Charger l'utilisateur ──────────────────────────────
  let currentUser;
  try {
    currentUser = await getUserById(session.id);
  } catch (err) {
    alert("Erreur : " + err.message);
    Session.clear();
    window.location.href = "/src/Views/login.html";
    return;
  }

  // ── 2. Afficher les infos de base ─────────────────────────
  renderGreeting(currentUser);
  renderDate();
  renderCards(currentUser);

  // ── 3. Stats (callback style) ─────────────────────────────
  loadStats(currentUser.id);

  // ── 4. Transactions récentes ──────────────────────────────
  renderTransactions(currentUser.wallet.transactions);

  // ── 5. Navigation sidebar ─────────────────────────────────
  setupSidebarNav();

  // ── 6. Quick actions ──────────────────────────────────────
  setupQuickActions();

  // ── 7. Formulaires Crédit / Débit ────────────────────────
  setupCreditForm(currentUser);
  setupDebitForm(currentUser);

  // ── 8. Déconnexion ────────────────────────────────────────
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Session.clear();
      window.location.href = "/src/Views/login.html";
    });
  }
});

/* ══════════════════════════════════════════════════════════
   RENDUS DOM
══════════════════════════════════════════════════════════ */

function renderGreeting(user) {
  const el = document.getElementById("greetingName");
  if (el) el.textContent = user.name;
}

function renderDate() {
  const el = document.getElementById("currentDate");
  if (el) {
    el.textContent = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }
}

/* ── Stats via CALLBACK ─────────────────────────────────── */
function loadStats(userId) {
  getStats(userId, (err, stats) => {
    if (err) { console.error(err); return; }

    const fmt = (n) => n.toLocaleString("fr-MA") + " MAD";
    setText("availableBalance", fmt(stats.balance));
    setText("monthlyIncome",    fmt(stats.income));
    setText("monthlyExpenses",  fmt(stats.expenses));
    setText("activeCards",      stats.activeCards + " carte(s)");
  });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Transactions ───────────────────────────────────────── */
function renderTransactions(transactions) {
  const list = document.getElementById("recentTransactionsList");
  if (!list) return;
  list.innerHTML = "";

  if (!transactions.length) {
    list.innerHTML = "<p class='no-data'>Aucune transaction.</p>";
    return;
  }

  transactions.slice(0, 8).forEach((tx) => {
    const div = document.createElement("div");
    div.className = `transaction-item ${tx.type}`;
    const sign  = tx.type === "credit" ? "+" : "-";
    const icon  = tx.type === "credit" ? "fa-arrow-down" : "fa-arrow-up";
    const color = tx.type === "credit" ? "#22c55e" : "#ef4444";

    div.innerHTML = `
      <div class="tx-icon" style="background:${color}20; color:${color}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="tx-info">
        <span class="tx-party">${tx.type === "credit" ? tx.from : tx.to}</span>
        <span class="tx-date">${tx.date}</span>
      </div>
      <span class="tx-amount" style="color:${color}">
        ${sign}${tx.amount.toLocaleString("fr-MA")} MAD
      </span>
    `;
    list.appendChild(div);
  });
}

/* ── Cartes ─────────────────────────────────────────────── */
function renderCards(user) {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  user.wallet.cards.forEach((card, i) => {
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `
      <div class="card-preview ${card.type}">
        <div class="card-chip"></div>
        <div class="card-number">•••• •••• ${card.numcards.slice(-4)}</div>
        <div class="card-holder">${user.name.toUpperCase()}</div>
        <div class="card-expiry">${card.expiry}</div>
        <div class="card-type">${card.type.toUpperCase()}</div>
        <div class="card-balance">${Number(card.balance).toLocaleString("fr-MA")} MAD</div>
      </div>
      <div class="card-actions">
        <button class="card-action" title="Définir par défaut"><i class="fas fa-star"></i></button>
        <button class="card-action" title="Geler la carte"><i class="fas fa-snowflake"></i></button>
        <button class="card-action" title="Supprimer"><i class="fas fa-trash"></i></button>
      </div>
    `;
    grid.appendChild(div);
  });
}

/* ══════════════════════════════════════════════════════════
   CRÉDIT — async/await
══════════════════════════════════════════════════════════ */
function setupCreditForm(user) {
  const form    = document.getElementById("creditForm");
  const btn     = document.getElementById("creditBtn");
  const msg     = document.getElementById("creditMsg");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    const amount = document.getElementById("creditAmount").value;
    const from   = document.getElementById("creditFrom").value.trim() || "Externe";

    setMsg(msg, "Traitement en cours…", "info");
    btn.disabled = true;

    try {
      // ── ASYNC / AWAIT ──────────────────────────────────
      const result = await creditWallet(user.id, amount, from);
      // Mettre à jour la référence locale
      user.wallet = result.user.wallet;

      setMsg(msg, `✅ Crédit de ${Number(amount).toLocaleString("fr-MA")} MAD effectué !`, "success");
      loadStats(user.id);
      renderTransactions(user.wallet.transactions);
      document.getElementById("creditAmount").value = "";
      document.getElementById("creditFrom").value   = "";
    } catch (err) {
      setMsg(msg, "❌ " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
}

/* ══════════════════════════════════════════════════════════
   DÉBIT — async/await
══════════════════════════════════════════════════════════ */
function setupDebitForm(user) {
  const btn = document.getElementById("debitBtn");
  const msg = document.getElementById("debitMsg");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    const amount = document.getElementById("debitAmount").value;
    const to     = document.getElementById("debitTo").value.trim() || "Externe";

    setMsg(msg, "Traitement en cours…", "info");
    btn.disabled = true;

    try {
      // ── ASYNC / AWAIT ──────────────────────────────────
      const result = await debitWallet(user.id, amount, to);
      user.wallet = result.user.wallet;

      setMsg(msg, `✅ Débit de ${Number(amount).toLocaleString("fr-MA")} MAD effectué !`, "success");
      loadStats(user.id);
      renderTransactions(user.wallet.transactions);
      document.getElementById("debitAmount").value = "";
      document.getElementById("debitTo").value     = "";
    } catch (err) {
      setMsg(msg, "❌ " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
}

function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className   = "form-msg " + type;
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION SIDEBAR
══════════════════════════════════════════════════════════ */
function setupSidebarNav() {
  const navLinks = document.querySelectorAll(".sidebar-nav a");
  const sections = document.querySelectorAll(".dashboard-section");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href").slice(1); // retire le #

      sections.forEach((s) => s.classList.remove("active"));
      navLinks.forEach((l) => l.parentElement.classList.remove("active"));

      const targetSection = document.getElementById(target);
      if (targetSection) targetSection.classList.add("active");
      link.parentElement.classList.add("active");
    });
  });
}

/* ══════════════════════════════════════════════════════════
   QUICK ACTIONS
══════════════════════════════════════════════════════════ */
function setupQuickActions() {
  document.getElementById("quickTopup")?.addEventListener("click", () => {
    showSection("credit-section");
  });

  document.getElementById("quickTransfer")?.addEventListener("click", () => {
    showSection("transfer-section");
  });

  document.getElementById("quickRequest")?.addEventListener("click", () => {
    showSection("debit-section");
  });

  document.getElementById("closeTransferBtn")?.addEventListener("click", () => {
    hideSection("transfer-section");
    showSection("overview");
  });

  document.getElementById("closeCreditBtn")?.addEventListener("click", () => {
    hideSection("credit-section");
    showSection("overview");
  });

  document.getElementById("closeDebitBtn")?.addEventListener("click", () => {
    hideSection("debit-section");
    showSection("overview");
  });
}

function showSection(id) {
  document.querySelectorAll(".dashboard-section").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function hideSection(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}
