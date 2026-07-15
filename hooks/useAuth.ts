import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenManager } from '@/lib/auth/tokens';
import { AuthAPI } from '@/lib/api/auth';
import { clearSession } from '@/lib/auth/session';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!TokenManager.isAuthenticated()) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }
      try {
        await AuthAPI.getMe();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        await clearSession();
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void verify();
    return () => { cancelled = true };
  }, []);

  const logout = async () => {
    const { clearSession } = await import('@/lib/auth/session')
    await clearSession()
    setIsAuthenticated(false)
    router.push('/login')
    router.refresh()
  }

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}
