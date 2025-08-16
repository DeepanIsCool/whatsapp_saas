"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  uuid: string;
  token: string;
  username: string;
  whatsappId: string | null;
  whatsappAccessToken: string | null;
  whatsappVerifyToken: string | null;
  whatsappApiUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("https://ai.rajatkhandelwal.com/wa/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store authentication data
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.username);

        // Create user object with the data we have
        const userData = {
          id: 0, // We don't get this from login API
          email,
          uuid: "", // We don't get this from login API
          token: data.token,
          username: data.username,
          whatsappId: null,
          whatsappAccessToken: null,
          whatsappVerifyToken: null,
          whatsappApiUrl: null,
          createdAt: "",
          updatedAt: "",
        };

        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error occurred" };
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userData");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("teamId");
    localStorage.removeItem("teamName");
    localStorage.removeItem("token"); // In case onboarding uses this key
    setUser(null);
  };

  const refreshUser = () => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error refreshing user data:", error);
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
