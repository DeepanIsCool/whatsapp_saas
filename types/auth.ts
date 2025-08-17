// Enhanced type definitions for the updated API response

export interface Team {
  teamId: number;
  role: 'ADMIN' | 'MEMBER' | 'OWNER';
  teamName: string;
  ownerUsername: string;
}

export interface UserInfo {
  success: boolean;
  email: string;
  uuid: string;
  whatsappId: string | null;
  whatsappAccessToken: string | null;
  whatsappVerifyToken: string | null;
  whatsappApiUrl: string | null;
  wabaId: string | null;
  teams: Team[];
}

export interface AuthData {
  token: string | null;
  username: string | null;
  email: string | null;
  userId: string | null;
  teamId: string | null;
  teamName: string | null;
  ownerUsername: string | null; // Username of the current team owner
  // Enhanced team support
  teams?: Team[];
  currentTeam?: Team;
}
