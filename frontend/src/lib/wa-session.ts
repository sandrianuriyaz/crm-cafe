// Token + link wa.me dioper dari halaman login ke /wa-login lewat sessionStorage.
const TOKEN_KEY = "wa_login_token";
const URL_KEY = "wa_login_url";

export function saveWaSession(token: string, waUrl: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(URL_KEY, waUrl);
}

export function readWaSession(): { token: string; waUrl: string } | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  const waUrl = sessionStorage.getItem(URL_KEY);
  if (!token || !waUrl) return null;
  return { token, waUrl };
}

export function clearWaSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(URL_KEY);
}
