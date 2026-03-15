// ============================================================
//  E-Wallet — Controller : index.js
//  Page d'accueil — navigation vers login / signin
// ============================================================
import Session from "../Models/session.js";

document.addEventListener("DOMContentLoaded", () => {
  // Si déjà connecté → dashboard direct
  if (Session.isLoggedIn()) {
    window.location.href = "/src/Views/dashboard.html";
    return;
  }

  const loginBtn  = document.getElementById("Loginbtn");
  const signinBtn = document.getElementById("Signinbtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/src/Views/login.html";
    });
  }

  if (signinBtn) {
    signinBtn.addEventListener("click", () => {
      // Pour l'instant → même page login
      window.location.href = "/src/Views/login.html";
    });
  }
});
