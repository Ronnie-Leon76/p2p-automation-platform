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
const FALLBACK_MOCK_AUTH_CONTEXT: MockAuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {
    throw new Error("Mock auth is disabled in this environment.");
  },
  signup: async () => {
    throw new Error("Mock auth is disabled in this environment.");
  },
  logout: () => {},
  getExchangeCredentials: () => null,
};

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const mockAuth = MockAuthService.getInstance();

  // Ensure we're on the client before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for existing session on mount, but only on client
  useEffect(() => {
    if (!isClient) return;

    const currentUser = mockAuth.getCurrentMockUser();
    setUser(currentUser);
    setIsLoading(false);
  }, [isClient]);

  // Listen for localStorage changes (when auth state changes in another tab/component)
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = () => {
      const currentUser = mockAuth.getCurrentMockUser();
      setUser(currentUser);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isClient]);

  const login = async (
    exchange: "okx" | "binance" | "bybit",
    userIndex: number = 0
  ) => {
    setIsLoading(true);
    try {
      console.log(`🔑 MockAuth context: Starting login for ${exchange}`);
      const loggedInUser = await mockAuth.mockLogin(exchange, userIndex);
      console.log(`👤 MockAuth context: Setting user state:`, loggedInUser);
      setUser(loggedInUser);
      // Force a small delay to ensure state is committed
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log(`✅ MockAuth context: Login completed, user set`);
    } catch (error) {
      console.error("❌ MockAuth context: Login failed:", error);
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
      console.log(
        `📝 MockAuth context: Starting signup for ${email} on ${exchange}`
      );
      const newUser = await mockAuth.mockSignup(email, fullName, exchange);
      console.log(`👤 MockAuth context: Setting new user state:`, newUser);
      setUser(newUser);
      // Force a small delay to ensure state is committed
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log(`✅ MockAuth context: Signup completed, user set`);
    } catch (error) {
      console.error("❌ MockAuth context: Signup failed:", error);
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
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "useMockAuth called without MockAuthProvider. Returning disabled fallback context."
      );
    }
    return FALLBACK_MOCK_AUTH_CONTEXT;
  }
  return context;
}

export function useAuthUser() {
  const mockAuth = useMockAuth();

  // Return mock user if in development and authenticated
  if (MockAuthService.isDevelopment() && mockAuth.isAuthenticated) {
    return mockAuth.user;
  }

  // TODO: Return real authenticated user in production
  return null;
}
