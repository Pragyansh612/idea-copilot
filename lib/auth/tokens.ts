import { isAccessTokenExpired } from '@/lib/auth/jwt'

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  private static clearAuthCookies(): void {
    if (typeof document === 'undefined') return
    const expire = 'Max-Age=0; path=/'
    document.cookie = `${this.ACCESS_TOKEN_KEY}=; ${expire}`
    document.cookie = `${this.REFRESH_TOKEN_KEY}=; ${expire}`
  }

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

  /** Prefer localStorage; fall back to middleware cookie and sync back. */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (stored) {
      if (isAccessTokenExpired(stored)) {
        this.clearTokens();
        return null;
      }
      return stored;
    }

    const fromCookie = this.readCookie(this.ACCESS_TOKEN_KEY);
    if (fromCookie) {
      if (isAccessTokenExpired(fromCookie)) {
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
      this.clearAuthCookies();
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
