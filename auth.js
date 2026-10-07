/* ==========================================================
   CampusConnect - auth.js
   Shared helpers for sign up, login and logout.
   All data is stored in the browser with localStorage.

   NOTE: This is for practice only. Real apps never store plain
   passwords in the browser. Passwords are hashed on a server.
   ========================================================== */

/* ---------- Storage keys ---------- */
const USERS_KEY = "campusconnect_users";            // array of all registered users
const SESSION_KEY = "campusconnect_session";        // who is logged in right now
const REMEMBER_KEY = "campusconnect_remembered_email";

/* ---------- Dashboard pages for each role ---------- */
const DASHBOARDS = {
  student: "student-dashboard.html",
  admin: "admin-dashboard.html",
  super: "super-admin.html"
};

/* ==========================================================
   Users
   ========================================================== */

// Read all users. If nothing is saved yet (or the data is broken), return [].
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function findUserByEmail(email) {
  const clean = normalizeEmail(email);
  return getUsers().find((user) => user.email === clean) || null;
}

// Sign up has no Super Admin option, so we create one automatically
// the first time the app runs. Login with:
//   email: superadmin@campus.edu    password: Admin@123
function seedSuperAdmin() {
  if (findUserByEmail("superadmin@campus.edu")) return;

  const users = getUsers();
  users.push({
    id: Date.now(),
    fullName: "Super Administrator",
    email: "superadmin@campus.edu",
    password: "Admin@123",
    role: "super",
    status: "active",
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
}

/* ==========================================================
   Session (who is logged in)
   "Remember me" ON  -> localStorage   (stays after closing the browser)
   "Remember me" OFF -> sessionStorage (cleared when the tab closes)
   ========================================================== */

function setSession(user, remember) {
  const session = {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    level: user.level || null,
    department: user.department || null
  };

  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function redirectForRole(role) {
  window.location.href = DASHBOARDS[role] || "index.html";
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

/* ---------- Protect dashboard pages ----------
   On any dashboard page, load auth.js and then call:
       requireRole("admin");
   - Not logged in      -> sent to login.html
   - Wrong role         -> sent to their own dashboard
   Returns the session so you can show the user's name. */
function requireRole(role) {
  const session = getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  if (session.role !== role) {
    redirectForRole(session.role);
    return null;
  }
  return session;
}

/* ==========================================================
   Form helpers (used by signup.js and login.js)
   Each input has an error element with the id "<inputId>Error".
   ========================================================== */

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId + "Error");

  if (input) input.classList.add("invalid");
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(inputId + "Error");

  if (input) input.classList.remove("invalid");
  if (error) {
    error.textContent = "";
    error.hidden = true;
  }
}

function clearAllErrors(form) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.id) clearError(field.id);
  });
}

// type: "success" (green) or "error" (red)
function showFormMessage(element, text, type) {
  element.textContent = text;
  element.className = "form-message" + (type === "error" ? " form-message-error" : "");
  element.hidden = false;
}

function hideFormMessage(element) {
  element.hidden = true;
  element.textContent = "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Clear a field's error as soon as the user starts fixing it
function clearErrorOnInput(form) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      if (field.id) clearError(field.id);
    });
  });
}

/* ==========================================================
   Run on every page that loads auth.js
   ========================================================== */

seedSuperAdmin();

// Any element with id="logoutBtn" logs the user out
const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      logout();
    }
  });
}