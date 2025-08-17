"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Team } from "@/types/auth";
import { ChevronDown, Search, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const { authData, logout, switchTeam } = useAuth(false); // Don't redirect from sidebar
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authData.username) {
      setUser({
        username: authData.username,
        email: authData.email,
      });
    }
  }, [authData]);

  // Fetch user teams
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!authData.username || !authData.token) return;

      try {
        const response = await fetch(
          `https://ai.rajatkhandelwal.com/wa/${authData.username}/getuserinfo/`,
          {
            headers: {
              Authorization: `Bearer ${authData.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          if (userData.teams) {
            setTeams(userData.teams);
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchUserTeams();
  }, [authData.username, authData.token]);

  const filteredTeams = teams.filter(
    (team) =>
      team.teamName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
      team.ownerUsername.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  const menuItems = [
    { icon: "💬", label: "Chats", href: "/live_chat" },
    { icon: "🔍", label: "Templates", href: "/template_builder" },
  ];

  return (
    <div
      className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Button at Top */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
        {!isCollapsed && (
          <div className="ml-3">
            <h1 className="font-semibold text-sidebar-foreground">
              WhatsApp SaaS
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              AI-Powered Platform
            </p>
          </div>
        )}
      </div>

      {/* Team Switcher */}
      {teams.length > 0 && (
        <div className="p-4 border-b border-sidebar-border">
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate">
                        {authData.teamName || "Select Team"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {authData.ownerUsername
                          ? `Owner: ${authData.ownerUsername}`
                          : "No team selected"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for a team..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto">
                  {filteredTeams.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No teams found
                    </div>
                  ) : (
                    filteredTeams.map((team) => (
                      <DropdownMenuItem
                        key={team.teamId}
                        onClick={() => switchTeam(team)}
                        className={`flex items-center gap-3 p-3 cursor-pointer ${
                          authData.teamId === team.teamId.toString()
                            ? "bg-sidebar-accent"
                            : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                            {team.teamName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">
                            {team.teamName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Owner: {team.ownerUsername} • {team.role}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 p-1 text-sidebar-foreground hover:bg-sidebar-accent"
                  title={authData.teamName || "Select Team"}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for a team..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto">
                  {filteredTeams.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No teams found
                    </div>
                  ) : (
                    filteredTeams.map((team) => (
                      <DropdownMenuItem
                        key={team.teamId}
                        onClick={() => switchTeam(team)}
                        className={`flex items-center gap-3 p-3 cursor-pointer ${
                          authData.teamId === team.teamId.toString()
                            ? "bg-sidebar-accent"
                            : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                            {team.teamName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">
                            {team.teamName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Owner: {team.ownerUsername} • {team.role}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isCollapsed ? "px-2" : "px-3"
                } ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => router.push(item.href)}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                isCollapsed ? "px-2" : "px-3"
              } text-sidebar-foreground hover:bg-sidebar-accent`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>WhatsApp Config</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
