// ============================================================
//  E-Wallet — Model : database.js
//  Données & méthodes métier (callbacks + async/await)
// ============================================================

const database = {
  users: [
    {
      id: "1",
      name: "Ali",
      email: "Ali@example.com",
      password: "1232",
      wallet: {
        balance: 12457,
        currency: "MAD",
        cards: [
          { numcards: "124847", type: "visa",       balance: 14712, expiry: "14-08-27", vcc: "147" },
          { numcards: "124478", type: "mastercard", balance: 1470,  expiry: "14-08-28", vcc: "257" },
        ],
        transactions: [
          { id: "t1", type: "credit", amount: 140,  date: "14-08-25", from: "Ahmed",  to: "124847" },
          { id: "t2", type: "debit",  amount: 200,  date: "13-08-25", from: "124847", to: "Amazon" },
          { id: "t3", type: "credit", amount: 250,  date: "12-08-25", from: "Ahmed",  to: "124478" },
          { id: "t4", type: "debit",  amount: 80,   date: "11-08-25", from: "124478", to: "Netflix" },
        ],
      },
    },
  ],
};

/* ──────────────────────────────────────────────────────────
   Authentification (callback style)
────────────────────────────────────────────────────────── */
export function findUserByMail(mail, password, callback) {
  setTimeout(() => {
    const user = database.users.find(
      (u) => u.email === mail && u.password === password
    );
    if (user) {
      callback(null, user);
    } else {
      callback(new Error("Email ou mot de passe incorrect."), null);
    }
  }, 500); // simule latence réseau
}

/* ──────────────────────────────────────────────────────────
   Récupérer un user par ID (async/await)
────────────────────────────────────────────────────────── */
export async function getUserById(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = database.users.find((u) => u.id === id);
      user ? resolve(user) : reject(new Error("Utilisateur introuvable."));
    }, 300);
  });
}

/* ──────────────────────────────────────────────────────────
   CRÉDIT — ajouter de l'argent au solde (async/await)
────────────────────────────────────────────────────────── */
export async function creditWallet(userId, amount, from) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!amount || amount <= 0) {
        return reject(new Error("Montant invalide pour le crédit."));
      }
      const user = database.users.find((u) => u.id === userId);
      if (!user) return reject(new Error("Utilisateur introuvable."));

      user.wallet.balance += Number(amount);

      const tx = {
        id: "t" + Date.now(),
        type: "credit",
        amount: Number(amount),
        date: new Date().toLocaleDateString("fr-FR"),
        from: from || "Externe",
        to: user.wallet.cards[0]?.numcards || "wallet",
      };
      user.wallet.transactions.unshift(tx);
      resolve({ user, transaction: tx });
    }, 600);
  });
}

/* ──────────────────────────────────────────────────────────
   DÉBIT — retirer de l'argent du solde (async/await)
────────────────────────────────────────────────────────── */
export async function debitWallet(userId, amount, to) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!amount || amount <= 0) {
        return reject(new Error("Montant invalide pour le débit."));
      }
      const user = database.users.find((u) => u.id === userId);
      if (!user) return reject(new Error("Utilisateur introuvable."));
      if (user.wallet.balance < Number(amount)) {
        return reject(new Error("Solde insuffisant."));
      }

      user.wallet.balance -= Number(amount);

      const tx = {
        id: "t" + Date.now(),
        type: "debit",
        amount: Number(amount),
        date: new Date().toLocaleDateString("fr-FR"),
        from: user.wallet.cards[0]?.numcards || "wallet",
        to: to || "Externe",
      };
      user.wallet.transactions.unshift(tx);
      resolve({ user, transaction: tx });
    }, 600);
  });
}

/* ──────────────────────────────────────────────────────────
   Statistiques (callback style)
────────────────────────────────────────────────────────── */
export function getStats(userId, callback) {
  setTimeout(() => {
    const user = database.users.find((u) => u.id === userId);
    if (!user) return callback(new Error("Utilisateur introuvable."), null);

    const income = user.wallet.transactions
      .filter((t) => t.type === "credit")
      .reduce((s, t) => s + t.amount, 0);

    const expenses = user.wallet.transactions
      .filter((t) => t.type === "debit")
      .reduce((s, t) => s + t.amount, 0);

    callback(null, {
      balance: user.wallet.balance,
      income,
      expenses,
      activeCards: user.wallet.cards.length,
    });
  }, 300);
}

export default database;
