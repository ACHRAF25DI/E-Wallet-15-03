// ============================================================
//  E-Wallet — Model : session.js
//  Gestion de la session utilisateur (localStorage)
// ============================================================

export const Session = {
  /** Sauvegarder l'utilisateur connecté */
  set(user) {
    // On ne stocke que les infos légères (sans mdp)
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    localStorage.setItem("ewallet_session", JSON.stringify(payload));
  },

  /** Récupérer l'utilisateur connecté */
  get() {
    const raw = localStorage.getItem("ewallet_session");
    return raw ? JSON.parse(raw) : null;
  },

  /** Vérifier si une session existe */
  isLoggedIn() {
    return !!this.get();
  },

  /** Supprimer la session (déconnexion) */
  clear() {
    localStorage.removeItem("ewallet_session");
  },
};

export default Session;
