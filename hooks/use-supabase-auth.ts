"use client";

import { getAuthPort } from "@/lib/composition/auth-composer";
import type { AuthPortUser } from "@/lib/ports/auth-port";
import { useEffect, useState } from "react";

export interface AuthState {
  user: AuthPortUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<AuthPortUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authPort = getAuthPort();

    // Get initial user
    const getUser = async () => {
      try {
        const user = await authPort.getCurrentUser();
        
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth session check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const unsubscribe = authPort.onAuthStateChange((updatedUser) => {
      console.log('Auth state changed:', updatedUser?.email || 'no user');
      setUser(updatedUser);
      setIsAuthenticated(Boolean(updatedUser));
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { user, isAuthenticated, isLoading };
}

// Utility function to get display name from Supabase user
export function getUserDisplayName(user: AuthPortUser | null): string {
  if (!user) return 'User';
  
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

// Utility function to check if user has specific role
export function userHasRole(user: AuthPortUser | null, role: string): boolean {
  if (!user) return false;
  return user.user_metadata?.role === role;
}
