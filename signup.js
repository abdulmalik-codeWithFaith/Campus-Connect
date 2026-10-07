/* ==========================================================
   CampusConnect - signup.js
   Needs auth.js loaded first.
   ========================================================== */

const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

// If someone is already logged in, send them to their dashboard
const existingSession = getSession();
if (existingSession) {
  redirectForRole(existingSession.role);
}

clearErrorOnInput(form);

/* ---------- Read everything from the form ---------- */
function getFormData() {
  return {
    accountType: document.querySelector('input[name="accountType"]:checked').value,
    fullName: document.getElementById("fullName").value.trim(),
    email: normalizeEmail(document.getElementById("email").value),
    password: document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value,
    level: document.getElementById("level").value,
    department: document.getElementById("department").value.trim(),
    adminInfo: document.getElementById("adminInfo").value.trim()
  };
}

/* ---------- Validation ----------
   Returns true if everything is OK. Shows an error under each bad field. */
function validate(data) {
  let valid = true;

  if (data.fullName.length < 3) {
    showError("fullName", "Please enter your full name.");
    valid = false;
  }

  if (!data.email) {
    showError("email", "Email is required.");
    valid = false;
  } else if (!isValidEmail(data.email)) {
    showError("email", "Please enter a valid email address.");
    valid = false;
  } else if (findUserByEmail(data.email)) {
    showError("email", "An account with this email already exists.");
    valid = false;
  }

  if (data.password.length < 8) {
    showError("password", "Password must be at least 8 characters.");
    valid = false;
  }

  if (!data.confirmPassword) {
    showError("confirmPassword", "Please confirm your password.");
    valid = false;
  } else if (data.password !== data.confirmPassword) {
    showError("confirmPassword", "Passwords do not match.");
    valid = false;
  }

  // Only check the fields for the chosen account type
  if (data.accountType === "admin" && data.department.length < 2) {
    showError("department", "Please enter your department or faculty.");
    valid = false;
  }

  return valid;
}

/* ---------- Build the user object and save it ---------- */
function createUser(data) {
  const user = {
    id: Date.now(),
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    role: data.accountType,
    // Students can use the app right away. Admins must be verified first.
    status: data.accountType === "admin" ? "pending" : "active",
    createdAt: new Date().toISOString()
  };

  if (data.accountType === "student") {
    user.level = data.level;
  } else {
    user.department = data.department;
    user.adminInfo = data.adminInfo;
  }

  const users = getUsers();
  users.push(user);
  saveUsers(users);

  return user;
}

/* ---------- Submit ---------- */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  clearAllErrors(form);
  hideFormMessage(formMessage);

  const data = getFormData();
  if (!validate(data)) return;

  const user = createUser(data);

  // Stop double clicks while we redirect
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  if (user.role === "admin") {
    showFormMessage(
      formMessage,
      "Account created! A Super Admin must verify you before you can publish announcements. Redirecting to login...",
      "success"
    );
  } else {
    showFormMessage(formMessage, "Account created! Redirecting to login...", "success");
  }

  // Go to login with the role and email already filled in
  setTimeout(() => {
    window.location.href = "login.html?role=" + user.role + "&email=" + encodeURIComponent(user.email);
  }, 1800);
});