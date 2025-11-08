import { ApiClient } from "./api";

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
}

export class AuthService {
  // Cookies are automatically sent with requests, no need to manage tokens
  static async signup(email: string, password: string, name?: string) {
    return ApiClient.post<AuthResponse>("/auth/signup", {
      email,
      password,
      name,
    });
  }

  static async signin(email: string, password: string) {
    return ApiClient.post<AuthResponse>("/auth/signin", {
      email,
      password,
    });
  }

  static async signout() {
    return ApiClient.post("/auth/signout", {});
  }

  static async refreshToken() {
    return ApiClient.post("/auth/refresh", {});
  }

  static async validateToken(): Promise<User | null> {
    const response = await ApiClient.post<{ user: User }>("/auth/validate", {});

    if (response.data) {
      return response.data.user;
    }

    return null;
  }
}
