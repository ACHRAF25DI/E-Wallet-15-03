import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";

// --- 1. INITIALISATION & SÉCURITÉ ---
const user = JSON.parse(sessionStorage.getItem("currentUser"));

// Guard : Redirection si non connecté
if (!user) {
  alert("Utilisateur non authentifié");
  window.location.href = "/index.html";
}

// --- 2. ÉLÉMENTS DU DOM ---
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");

// Éléments Transfert
const transferBtn = document.getElementById("quickTransfer");
const transferPopup = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const transferForm = document.getElementById("transferForm");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");

// Éléments Rechargement (TP)
const quickTopupBtn = document.getElementById("quickTopup");
const topupPopup = document.getElementById("topupPopup");
const closeTopupBtn = document.getElementById("closeTopupBtn");
const cancelTopupBtn = document.getElementById("cancelTopupBtn");
const topupForm = document.getElementById("topupForm");
const topupSourceCard = document.getElementById("topupSourceCard");


// --- 3. AFFICHAGE (UI) ---
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance.toFixed(2)} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome.toFixed(2)} MAD`,
    monthlyExpenses: `${monthlyExpenses.toFixed(2)} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  greetingName.textContent = dashboardData.userName;
  currentDate.textContent = dashboardData.currentDate;
  solde.textContent = dashboardData.availableBalance;
  incomeElement.textContent = dashboardData.monthlyIncome;
  expensesElement.textContent = dashboardData.monthlyExpenses;
  activecards.textContent = dashboardData.activeCards;

  // Affichage des transactions
  transactionsList.innerHTML = "";
  // On inverse pour voir les plus récentes en haut
  user.wallet.transactions.slice().reverse().forEach(transaction => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
      <div><strong>${transaction.label || transaction.type}</strong> <br> <small>${transaction.date}</small></div>
      <div style="color: ${transaction.type === 'credit' ? 'green' : 'red'}; font-weight: bold;">
        ${transaction.type === 'credit' ? '+' : '-'}${transaction.amount} MAD
      </div>
    `;
    transactionsList.appendChild(transactionItem);
  });
}

// Initialisation des listes déroulantes
function renderOptions() {
  // Bénéficiaires
  const beneficiaries = getbeneficiaries(user.id);
  beneficiarySelect.innerHTML = '<option value="" disabled selected>Choisir un bénéficiaire</option>';
  beneficiaries.forEach((b) => {
    beneficiarySelect.appendChild(new Option(b.name, b.id));
  });

  // Cartes (pour transfert et recharge)
  sourceCard.innerHTML = '<option value="" disabled selected>Sélectionner une carte</option>';
  topupSourceCard.innerHTML = '<option value="" disabled selected>Sélectionner une carte</option>';
  
  user.wallet.cards.forEach((card) => {
    const cardText = `${card.type} ****${card.numcards.slice(-4)}`;
    sourceCard.appendChild(new Option(cardText, card.numcards));
    topupSourceCard.appendChild(new Option(cardText, card.numcards));
  });
}


// --- 4. GESTION DES FENÊTRES (POPUPS) ---
function openPopup(popup) {
  popup.classList.add("active");
  document.body.classList.add("popup-open");
}

function closePopups() {
  transferPopup.classList.remove("active");
  topupPopup.classList.remove("active");
  document.body.classList.remove("popup-open");
}

// Événements d'ouverture/fermeture
transferBtn.addEventListener("click", () => openPopup(transferPopup));
quickTopupBtn.addEventListener("click", () => openPopup(topupPopup));

[closeTransferBtn, cancelTransferBtn, closeTopupBtn, cancelTopupBtn].forEach(btn => {
  if(btn) btn.addEventListener("click", closePopups);
});


// =====================================================================
// --- 5. LOGIQUE MÉTIER AVEC PROMISES (ASYNC / AWAIT) ---
// =====================================================================

// ----- PROMISES GÉNÉRIQUES -----
const checkBalanceAsync = (amount) => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (user.wallet.balance >= amount) resolve("Solde suffisant.");
    else reject("Solde insuffisant pour cette opération.");
  }, 500);
});

// ==========================================
// A. FONCTIONNALITÉ TRANSFERT (Refactorisée)
// ==========================================
const checkBeneficiaryAsync = (numcompte) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const beneficiary = finduserbyaccount(numcompte);
    if (beneficiary) resolve(beneficiary);
    else reject("Bénéficiaire introuvable dans le système.");
  }, 800);
});

async function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const amount = Number(document.getElementById("amount").value);

  try {
    const beneAcc = findbeneficiarieByid(user.id, beneficiaryId).account;
    
    // 1. Vérification du bénéficiaire
    const destinataire = await checkBeneficiaryAsync(beneAcc);
    
    // 2. Vérification du solde
    await checkBalanceAsync(amount);
    
    // 3. Mise à jour des données (Simulation Serveur)
    user.wallet.balance -= amount;
    destinataire.wallet.balance += amount;

    // 4. Enregistrement des transactions
    const dateNow = new Date().toLocaleDateString("fr-FR");
    user.wallet.transactions.push({
      id: Date.now(), type: "debit", amount: amount, date: dateNow, label: `Transfert vers ${destinataire.name}`
    });
    destinataire.wallet.transactions.push({
      id: Date.now() + 1, type: "credit", amount: amount, date: dateNow, label: `Reçu de ${user.name}`
    });

    // 5. Sauvegarde
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    
    alert(`Transfert de ${amount} MAD vers ${destinataire.name} réussi !`);
    transferForm.reset();
    closePopups();
    renderDashboard();

  } catch (error) {
    alert("Échec du transfert : " + error);
  }
}


// ==========================================
// B. FONCTIONNALITÉ RECHARGEMENT (TP AVANCÉ)
// ==========================================

/**
 * Règle de gestion : Vérifie si la carte existe, appartient à l'utilisateur et n'est pas expirée.
 */
const checkCardValidityAsync = (cardNum) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const card = user.wallet.cards.find(c => c.numcards === cardNum);
    if (!card) return reject("Moyen de paiement inexistant ou non associé à ce compte.");
    
    // Simulation : si la date d'expiration simulée est dépassée
    // (Dans un cas réel on comparerait card.expirationDate avec Date.now())
    if (card.status === "expired") return reject("Cette carte est expirée.");

    resolve(card);
  }, 800); // Simulation latence réseau
});

/**
 * Règle de gestion : Vérifie les limites de montant.
 */
const authorizeTopupAsync = (amount) => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (!amount || amount <= 0) reject("Le montant doit être strictement supérieur à zéro.");
    if (amount < 10) reject("Le montant minimum de recharge est de 10 MAD.");
    if (amount > 10000) reject("Le plafond de recharge par opération est de 10 000 MAD.");
    resolve("Autorisation bancaire accordée.");
  }, 1000); // Simulation paiement
});

async function handleTopup(e) {
  e.preventDefault();
  const cardNum = document.getElementById("topupSourceCard").value;
  const amount = Number(document.getElementById("topupAmount").value);

  try {
    // 1. Validation de la carte (Precondition)
    await checkCardValidityAsync(cardNum);

    // 2. Validation du montant et autorisation (Règles de gestion)
    await authorizeTopupAsync(amount);

    // 3. Postcondition : Mise à jour du solde
    user.wallet.balance += amount;

    // 4. Postcondition : Enregistrement de la transaction (RECHARGE)
    user.wallet.transactions.push({
      id: Date.now(),
      type: "credit",
      label: "Recharge par carte bancaire",
      amount: amount,
      date: new Date().toLocaleDateString("fr-FR")
    });

    // 5. Sauvegarde locale (Persistance)
    sessionStorage.setItem("currentUser", JSON.stringify(user));

    // 6. Succès de l'UI
    alert(`Rechargement de ${amount} MAD effectué avec succès !`);
    topupForm.reset();
    closePopups();
    renderDashboard();

  } catch (error) {
    // Postcondition d'échec : Message d'erreur
    alert("Erreur lors du rechargement : " + error);
  }
}

// --- 6. ATTACHEMENT DES ÉVÉNEMENTS SUBMIT ---
transferForm.addEventListener("submit", handleTransfer);
topupForm.addEventListener("submit", handleTopup);

// --- 7. DÉMARRAGE DE L'APPLICATION ---
renderDashboard();
renderOptions();