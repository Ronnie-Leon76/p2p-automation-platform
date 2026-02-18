export interface AuthPortUser {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  user_type?: "merchant" | "member";
  user_metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AuthPort {
  getCurrentUser(): Promise<AuthPortUser | null>;
  onAuthStateChange(callback: (user: AuthPortUser | null) => void): () => void;
  signOut(): Promise<void>;
}

export interface ServerAuthPort {
  getCurrentUser(): Promise<AuthPortUser | null>;
}
