"use client";

import { MockAuthService, type MockUser } from "@/lib/auth/mock-auth";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface MockAuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    exchange: "okx" | "binance" | "bybit",
    userIndex?: number
  ) => Promise<void>;
  signup: (
    email: string,
    fullName: string,
    exchange: "okx" | "binance" | "bybit"
  ) => Promise<void>;
  logout: () => void;
  getExchangeCredentials: () => any;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const mockAuth = MockAuthService.getInstance();

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = mockAuth.getCurrentMockUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (
    exchange: "okx" | "binance" | "bybit",
    userIndex: number = 0
  ) => {
    setIsLoading(true);
    try {
      const loggedInUser = await mockAuth.mockLogin(exchange, userIndex);
      setUser(loggedInUser);
    } catch (error) {
      console.error("Mock login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    fullName: string,
    exchange: "okx" | "binance" | "bybit"
  ) => {
    setIsLoading(true);
    try {
      const newUser = await mockAuth.mockSignup(email, fullName, exchange);
      setUser(newUser);
    } catch (error) {
      console.error("Mock signup failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    mockAuth.mockLogout();
    setUser(null);
    router.push("/auth/login");
  };

  const getExchangeCredentials = () => {
    return mockAuth.getMockExchangeCredentials();
  };

  const value: MockAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    getExchangeCredentials,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}

export function useAuthUser() {
  const mockAuth = useMockAuth();

  // Return mock user if in development and authenticated
  if (MockAuthService.isDevelopment() && mockAuth.isAuthenticated) {
    return mockAuth.user;
  }

  // TODO: Return real Supabase user in production
  return null;
}
