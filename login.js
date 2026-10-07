/* ==========================================================
   CampusConnect - login.js
   Needs auth.js loaded first.
   ========================================================== */

const form = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const emailInput = document.getElementById("email");
const rememberCheckbox = document.getElementById("remember");
const forgotLink = document.getElementById("forgotLink");

const ROLE_NAMES = {
  student: "Student",
  admin: "Admin",
  super: "Super Admin"
};

// If someone is already logged in, skip the login page
const activeSession = getSession();
if (activeSession) {
  redirectForRole(activeSession.role);
}

clearErrorOnInput(form);

/* ---------- Prefill the form ----------
   1. From the URL (after signup): login.html?role=admin&email=...
   2. From "Remember me" (the last email that was saved) */
function prefillForm() {
  const params = new URLSearchParams(window.location.search);

  const roleFromUrl = params.get("role");
  if (roleFromUrl && ROLE_NAMES[roleFromUrl]) {
    document.querySelector('input[name="role"][value="' + roleFromUrl + '"]').checked = true;
  }

  const emailFromUrl = params.get("email");
  const rememberedEmail = localStorage.getItem(REMEMBER_KEY);

  if (emailFromUrl) {
    emailInput.value = emailFromUrl;
  } else if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberCheckbox.checked = true;
  }
}

prefillForm();

/* ---------- Validation (empty fields and email format) ---------- */
function validate(email, password) {
  let valid = true;

  if (!email) {
    showError("email", "Email is required.");
    valid = false;
  } else if (!isValidEmail(email)) {
    showError("email", "Please enter a valid email address.");
    valid = false;
  }

  if (!password) {
    showError("password", "Password is required.");
    valid = false;
  }

  return valid;
}

/* ---------- Submit ---------- */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  clearAllErrors(form);
  hideFormMessage(formMessage);

  const email = normalizeEmail(emailInput.value);
  const password = document.getElementById("password").value;
  const selectedRole = document.querySelector('input[name="role"]:checked').value;
  const remember = rememberCheckbox.checked;

  if (!validate(email, password)) return;

  // 1. Find the user and check the password.
  //    We use the same message for both problems so nobody can
  //    guess which emails are registered.
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    showFormMessage(formMessage, "Incorrect email or password.", "error");
    return;
  }

  // 2. The selected role must match the account's role
  if (user.role !== selectedRole) {
    showFormMessage(
      formMessage,
      "This account is registered as " + ROLE_NAMES[user.role] + ". Please choose \"" + ROLE_NAMES[user.role] + "\" above.",
      "error"
    );
    return;
  }

  // 3. Admins must be verified by the Super Admin first
  if (user.role === "admin" && user.status === "pending") {
    showFormMessage(
      formMessage,
      "Your admin account is still awaiting verification. Please check back later.",
      "error"
    );
    return;
  }
  if (user.role === "admin" && user.status === "rejected") {
    showFormMessage(
      formMessage,
      "Your admin request was not approved. Please contact the school administration.",
      "error"
    );
    return;
  }

  // 4. Success: remember the email if asked, save the session, redirect
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }

  setSession(user, remember);

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";
  showFormMessage(formMessage, "Welcome back, " + user.fullName + "! Redirecting...", "success");

  setTimeout(() => {
    redirectForRole(user.role);
  }, 800);
});

/* ---------- Forgot password (demo) ----------
   There is no server to send emails, so we just show a message. */
forgotLink.addEventListener("click", (event) => {
  event.preventDefault();
  hideFormMessage(formMessage);

  const email = normalizeEmail(emailInput.value);
  if (!email || !isValidEmail(email)) {
    showError("email", "Enter your email first, then click \"Forgot password?\".");
    return;
  }

  showFormMessage(
    formMessage,
    "If an account exists for " + email + ", a reset link would be sent. (Demo only, no email is sent.)",
    "success"
  );
});