// ============================================================
//  E-Wallet — Controller : login.js
//  Authentification — utilise callback style
// ============================================================
import { findUserByMail } from "../Models/database.js";
import Session from "../Models/session.js";

document.addEventListener("DOMContentLoaded", () => {
  const mailInput   = document.getElementById("mail");
  const passInput   = document.getElementById("password");
  const submitBtn   = document.getElementById("submitbtn");
  const resultEl    = document.getElementById("result");
  const displayEye  = document.getElementById("display");

  // ── Toggle visibilité mot de passe ──────────────────────
  if (displayEye) {
    displayEye.addEventListener("click", () => {
      if (passInput.type === "password") {
        passInput.type = "text";
        displayEye.textContent = "🙈";
      } else {
        passInput.type = "password";
        displayEye.textContent = "👁";
      }
    });
  }

  // ── Soumission du formulaire ─────────────────────────────
  submitBtn.addEventListener("click", () => {
    const mail     = mailInput.value.trim();
    const password = passInput.value.trim();

    // Validation côté client
    if (!mail || !password) {
      showResult("Veuillez remplir tous les champs.", "error");
      return;
    }

    showResult("Connexion en cours…", "info");
    submitBtn.disabled = true;

    // ── CALLBACK STYLE ───────────────────────────────────
    findUserByMail(mail, password, (err, user) => {
      submitBtn.disabled = false;

      if (err) {
        showResult("❌ " + err.message, "error");
        return;
      }

      // Succès → sauvegarder session
      Session.set(user);
      showResult("✅ Connexion réussie ! Redirection…", "success");

      setTimeout(() => {
        window.location.href = "/src/Views/dashboard.html";
      }, 1000);
    });
  });

  // ── Helper affichage message ─────────────────────────────
  function showResult(msg, type) {
    resultEl.textContent = msg;
    resultEl.className   = "result-msg " + type;
  }
});
