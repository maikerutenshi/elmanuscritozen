const ZEN_SESSION_KEY = 'zen_admin_session';
const ZEN_TOKEN_KEY = 'zen_github_token';

(function migrateTokenFromSession() {
  const legacy = sessionStorage.getItem(ZEN_TOKEN_KEY);
  if (legacy && !localStorage.getItem(ZEN_TOKEN_KEY)) {
    localStorage.setItem(ZEN_TOKEN_KEY, legacy);
  }
  sessionStorage.removeItem(ZEN_TOKEN_KEY);
})();

function isAdminSession() {
  return sessionStorage.getItem(ZEN_SESSION_KEY) === 'ok';
}

function hasGithubToken() {
  return Boolean(localStorage.getItem(ZEN_TOKEN_KEY));
}

function loginAdmin(password) {
  if (password !== ZEN_ADMIN.password) {
    return false;
  }
  sessionStorage.setItem(ZEN_SESSION_KEY, 'ok');
  return true;
}

function saveGithubToken(token) {
  localStorage.setItem(ZEN_TOKEN_KEY, token.trim());
}

function getGithubToken() {
  return localStorage.getItem(ZEN_TOKEN_KEY) || '';
}

function clearGithubToken() {
  localStorage.removeItem(ZEN_TOKEN_KEY);
}

function logoutAdmin() {
  sessionStorage.removeItem(ZEN_SESSION_KEY);
}

function requireAdmin() {
  if (!isAdminSession()) {
    window.location.href = 'admin.html';
    return false;
  }
  return true;
}
