// recuperation des elements DOM
const loginBtn  = document.getElementById("Loginbtn");
//const signinBtn = document.getElementById("Signinbtn");

// bouton Login
loginBtn.addEventListener("click", handleLogin);

function handleLogin() {
    loginBtn.textContent = "loading...";
    setTimeout(() => {
        document.location = "login.html";
    }, 2000);
}