/**
 * Cookie utility functions for managing authentication and user data
 */

// Cookie configuration constants
const COOKIE_CONFIG = {
  // Authentication cookies
  AUTH_TOKEN: {
    name: 'auth_token',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  USERNAME: {
    name: 'username',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  USER_EMAIL: {
    name: 'user_email',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  USER_ID: {
    name: 'user_id',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Team cookies
  TEAM_ID: {
    name: 'team_id',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  TEAM_NAME: {
    name: 'team_name',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

/**
 * Set a cookie with the specified name, value, and options
 */
export function setCookie(name: string, value: string, maxAge: number = 60 * 60 * 24 * 30): void {
  if (typeof document !== 'undefined') {
    const cookieString = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
    document.cookie = cookieString;
  }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
}

/**
 * Set authentication token in cookie
 */
export function setAuthToken(token: string): void {
  setCookie(COOKIE_CONFIG.AUTH_TOKEN.name, token, COOKIE_CONFIG.AUTH_TOKEN.maxAge);
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
  return getCookie(COOKIE_CONFIG.AUTH_TOKEN.name);
}

/**
 * Set username in cookie
 */
export function setUsername(username: string): void {
  setCookie(COOKIE_CONFIG.USERNAME.name, username, COOKIE_CONFIG.USERNAME.maxAge);
}

/**
 * Get username from cookie
 */
export function getUsername(): string | null {
  return getCookie(COOKIE_CONFIG.USERNAME.name);
}

/**
 * Set user email in cookie
 */
export function setUserEmail(email: string): void {
  setCookie(COOKIE_CONFIG.USER_EMAIL.name, email, COOKIE_CONFIG.USER_EMAIL.maxAge);
}

/**
 * Get user email from cookie
 */
export function getUserEmail(): string | null {
  return getCookie(COOKIE_CONFIG.USER_EMAIL.name);
}

/**
 * Set user ID in cookie
 */
export function setUserId(userId: string): void {
  setCookie(COOKIE_CONFIG.USER_ID.name, userId, COOKIE_CONFIG.USER_ID.maxAge);
}

/**
 * Get user ID from cookie
 */
export function getUserId(): string | null {
  return getCookie(COOKIE_CONFIG.USER_ID.name);
}

/**
 * Set team ID in cookie
 */
export function setTeamId(teamId: string): void {
  setCookie(COOKIE_CONFIG.TEAM_ID.name, teamId, COOKIE_CONFIG.TEAM_ID.maxAge);
}

/**
 * Get team ID from cookie
 */
export function getTeamId(): string | null {
  return getCookie(COOKIE_CONFIG.TEAM_ID.name);
}

/**
 * Set team name in cookie
 */
export function setTeamName(teamName: string): void {
  setCookie(COOKIE_CONFIG.TEAM_NAME.name, teamName, COOKIE_CONFIG.TEAM_NAME.maxAge);
}

/**
 * Get team name from cookie
 */
export function getTeamName(): string | null {
  return getCookie(COOKIE_CONFIG.TEAM_NAME.name);
}

/**
 * Set all authentication data in cookies
 */
export function setAuthData(data: {
  token: string;
  username: string;
  email: string;
  userId?: string;
  teamId?: string;
  teamName?: string;
}): void {
  setAuthToken(data.token);
  setUsername(data.username);
  setUserEmail(data.email);
  
  if (data.userId) {
    setUserId(data.userId);
  }
  
  if (data.teamId) {
    setTeamId(data.teamId);
  }
  
  if (data.teamName) {
    setTeamName(data.teamName);
  }
}

/**
 * Get all authentication data from cookies
 */
export function getAuthData(): {
  token: string | null;
  username: string | null;
  email: string | null;
  userId: string | null;
  teamId: string | null;
  teamName: string | null;
} {
  return {
    token: getAuthToken(),
    username: getUsername(),
    email: getUserEmail(),
    userId: getUserId(),
    teamId: getTeamId(),
    teamName: getTeamName(),
  };
}

/**
 * Clear all authentication cookies
 */
export function clearAuthData(): void {
  deleteCookie(COOKIE_CONFIG.AUTH_TOKEN.name);
  deleteCookie(COOKIE_CONFIG.USERNAME.name);
  deleteCookie(COOKIE_CONFIG.USER_EMAIL.name);
  deleteCookie(COOKIE_CONFIG.USER_ID.name);
  deleteCookie(COOKIE_CONFIG.TEAM_ID.name);
  deleteCookie(COOKIE_CONFIG.TEAM_NAME.name);
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return token !== null && token.length > 0;
}
