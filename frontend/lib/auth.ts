import { ApiClient } from "./api";

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static TOKEN_KEY = "auth_token";

  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static async signup(email: string, password: string, name?: string) {
    const response = await ApiClient.post<AuthResponse>("/auth/signup", {
      email,
      password,
      name,
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  static async signin(email: string, password: string) {
    const response = await ApiClient.post<AuthResponse>("/auth/signin", {
      email,
      password,
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response;
  }

  static async signout() {
    const token = this.getToken();
    if (token) {
      await ApiClient.post("/auth/signout", {}, token);
    }
    this.removeToken();
  }

  static async validateToken(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    const response = await ApiClient.post<{ user: User }>(
      "/auth/validate",
      {},
      token
    );

    if (response.data) {
      return response.data.user;
    }

    this.removeToken();
    return null;
  }
}
