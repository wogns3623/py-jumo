import { AdminService } from "@/client";
import type { AdminAdminLoginData } from "@/client";
import {
  getTokenCookie,
  removeTokenCookie,
  setTokenCookie,
} from "@/utils/cookies";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  username: string;
  email?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state on app load
  useEffect(() => {
    const token = getTokenCookie();
    if (token) {
      // For JWT tokens, we can decode the username from the token payload
      // or we can set a basic user object and validate on first API call
      try {
        // Decode JWT payload (basic decode without verification for username)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const username = payload.sub;

        if (username) {
          setUser({ username, email: username }); // Using username as email placeholder
          setIsAuthenticated(true);
        } else {
          removeTokenCookie();
        }
      } catch (error) {
        // If token is invalid, clear it
        removeTokenCookie();
      }

      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const login = async (username: string, password: string) => {
    try {
      // Use AdminService to login with form data
      const loginData: AdminAdminLoginData = {
        formData: {
          username,
          password,
          grant_type: "password",
        },
      };

      const response = await AdminService.adminLogin(loginData);
      const token = response.access_token;

      // Store token in cookie for automatic transmission (OpenAPI.TOKEN is already configured in main.tsx)
      setTokenCookie(token);

      // Set user info
      setUser({ username, email: username }); // Using username as email placeholder
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Authentication failed");
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    removeTokenCookie();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
