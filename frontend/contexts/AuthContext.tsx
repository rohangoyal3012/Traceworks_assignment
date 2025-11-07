"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthService, User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error?: string }>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const validatedUser = await AuthService.validateToken();
    setUser(validatedUser);
    setLoading(false);
  };

  const signin = async (email: string, password: string) => {
    const response = await AuthService.signin(email, password);

    if (response.data) {
      setUser(response.data.user);
      return {};
    }

    return { error: response.error || "Sign in failed" };
  };

  const signup = async (email: string, password: string, name?: string) => {
    const response = await AuthService.signup(email, password, name);

    if (response.data) {
      setUser(response.data.user);
      return {};
    }

    return { error: response.error || "Sign up failed" };
  };

  const signout = async () => {
    await AuthService.signout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout }}>
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
