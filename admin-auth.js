const ZEN_TOKEN_KEY = 'zen_github_token';

function hasGithubToken() {
  return Boolean(localStorage.getItem(ZEN_TOKEN_KEY));
}

function getGithubToken() {
  return localStorage.getItem(ZEN_TOKEN_KEY) || '';
}

function saveGithubToken(token) {
  localStorage.setItem(ZEN_TOKEN_KEY, token.trim());
}

function clearGithubToken() {
  localStorage.removeItem(ZEN_TOKEN_KEY);
}

function logoutAdmin() {
  clearGithubToken();
}

function requireAdmin() {
  if (!hasGithubToken()) {
    window.location.href = 'admin.html';
    return false;
  }
  return true;
}

async function verifyGithubToken(token) {
  const trimmed = (token || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Pega el token de GitHub.' };
  }

  const headers = {
    Authorization: `Bearer ${trimmed}`,
    Accept: 'application/vnd.github+json',
  };

  const userResponse = await fetch('https://api.github.com/user', { headers });
  if (!userResponse.ok) {
    return { ok: false, error: 'Token inválido o caducado. Crea uno nuevo en GitHub.' };
  }

  const repoResponse = await fetch(
    `https://api.github.com/repos/${ZEN_ADMIN.githubRepo}`,
    { headers }
  );
  if (!repoResponse.ok) {
    return {
      ok: false,
      error: `El token no puede acceder al repositorio ${ZEN_ADMIN.githubRepo}.`,
    };
  }

  saveGithubToken(trimmed);
  return { ok: true };
}

async function verifyStoredToken() {
  if (!hasGithubToken()) return false;
  const result = await verifyGithubToken(getGithubToken());
  if (!result.ok) clearGithubToken();
  return result.ok;
}
