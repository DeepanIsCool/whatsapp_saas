import { clearAuthData, getAuthData, isAuthenticated } from '@/lib/cookies';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthData {
  token: string | null;
  username: string | null;
  email: string | null;
  userId: string | null;
  teamId: string | null;
  teamName: string | null;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  authData: AuthData;
  logout: () => void;
}

/**
 * Custom hook for managing authentication state using cookies
 */
export function useAuth(redirectToLogin = true): UseAuthReturn {
  const [authData, setAuthData] = useState<AuthData>({
    token: null,
    username: null,
    email: null,
    userId: null,
    teamId: null,
    teamName: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = getAuthData();
    setAuthData(data);
    setIsLoading(false);

    // Redirect to login if not authenticated and redirectToLogin is true
    if (redirectToLogin && (!data.token || !data.username)) {
      router.push('/login');
    }
  }, [router, redirectToLogin]);

  const logout = () => {
    clearAuthData();
    setAuthData({
      token: null,
      username: null,
      email: null,
      userId: null,
      teamId: null,
      teamName: null,
    });
    router.push('/login');
  };

  return {
    isAuthenticated: isAuthenticated(),
    isLoading,
    authData,
    logout,
  };
}

/**
 * Hook for pages that don't require authentication but need to redirect if already logged in
 */
export function useGuestAuth(): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = getAuthData();
    setIsLoading(false);

    // Redirect to dashboard if already authenticated
    if (data.token && data.username) {
      router.push('/dashboard');
    }
  }, [router]);

  return { isLoading };
}
