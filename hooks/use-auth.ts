import { clearAuthData, getAuthData, isAuthenticated, setAuthData } from '@/lib/cookies';
import { Team } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthData {
  token: string | null;
  username: string | null;
  email: string | null;
  userId: string | null;
  teamId: string | null;
  teamName: string | null;
  ownerUsername: string | null;
  teams?: Team[];
  currentTeam?: Team;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  authData: AuthData;
  logout: () => void;
  switchTeam: (team: Team) => void;
}

/**
 * Custom hook for managing authentication state using cookies
 */
export function useAuth(redirectToLogin = true): UseAuthReturn {
  const [authData, setAuthDataState] = useState<AuthData>({
    token: null,
    username: null,
    email: null,
    userId: null,
    teamId: null,
    teamName: null,
    ownerUsername: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = getAuthData();
    setAuthDataState(data);
    setIsLoading(false);

    // Redirect to login if not authenticated and redirectToLogin is true
    if (redirectToLogin && (!data.token || !data.username)) {
      router.push('/login');
    }
  }, [router, redirectToLogin]);

  const logout = () => {
    clearAuthData();
    setAuthDataState({
      token: null,
      username: null,
      email: null,
      userId: null,
      teamId: null,
      teamName: null,
      ownerUsername: null,
    });
    router.push('/login');
  };

  const switchTeam = (team: Team) => {
    const currentData = getAuthData();
    if (!currentData.token) return; // Don't switch if no token
    
    const updatedData = {
      token: currentData.token,
      username: currentData.username || '',
      email: currentData.email || '',
      ...(currentData.userId && { userId: currentData.userId }),
      teamId: team.teamId.toString(),
      teamName: team.teamName,
      ownerUsername: team.ownerUsername,
    };
    
    setAuthData(updatedData);
    setAuthDataState({
      ...currentData,
      teamId: team.teamId.toString(),
      teamName: team.teamName,
      ownerUsername: team.ownerUsername,
      currentTeam: team,
    });
  };

  return {
    isAuthenticated: isAuthenticated(),
    isLoading,
    authData,
    logout,
    switchTeam,
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
