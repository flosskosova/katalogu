const REPO_HOSTS = new Set([
  "github.com",
  "www.github.com",
  "gitlab.com",
  "www.gitlab.com",
]);

export function isAllowedRepositoryUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (REPO_HOSTS.has(host)) return true;
    /** Self-managed GitLab (e.g. gitlab.example.org) */
    if (host.endsWith(".gitlab.com") || host.includes("gitlab.")) return true;
    return false;
  } catch {
    return false;
  }
}

export function isOptionalHttpsUrl(urlString: string): boolean {
  const s = urlString.trim();
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

export function clampLen(s: string, min: number, max: number): boolean {
  const t = s.trim();
  return t.length >= min && t.length <= max;
}
