export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private static readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** JWT exp claim — true if missing, malformed, or past expiry. */
  static isAccessTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { exp?: number };
      if (typeof payload.exp !== 'number') return false;
      return payload.exp * 1000 < Date.now() - 5_000;
    } catch {
      return true;
    }
  }

  /** Prefer localStorage; fall back to middleware cookie and sync back. */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (stored) {
      if (this.isAccessTokenExpired(stored)) {
        this.clearTokens();
        return null;
      }
      return stored;
    }

    const fromCookie = this.readCookie(this.ACCESS_TOKEN_KEY);
    if (fromCookie) {
      if (this.isAccessTokenExpired(fromCookie)) {
        this.clearTokens();
        return null;
      }
      localStorage.setItem(this.ACCESS_TOKEN_KEY, fromCookie);
      const refresh = this.readCookie(this.REFRESH_TOKEN_KEY);
      if (refresh) localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
      return fromCookie;
    }

    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (stored) return stored;

    return this.readCookie(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
