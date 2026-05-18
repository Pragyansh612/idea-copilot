import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenManager } from '@/lib/auth/tokens';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(TokenManager.isAuthenticated());
    setIsLoading(false);
  }, []);

  const logout = async () => {
    TokenManager.clearTokens();

    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    setIsAuthenticated(false);
    router.push('/login');
    router.refresh();
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}
