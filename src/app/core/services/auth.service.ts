import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  updatePassword,
  type SignInInput,
  type SignUpInput,
} from "aws-amplify/auth";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  currentUser = signal<AuthUser | null>(null);
  isLoading = signal(false);

  constructor(private router: Router) {
    this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.payload;
      this.currentUser.set({
        userId: user.userId,
        email: (token?.["email"] as string) || "",
        name: (token?.["name"] as string) || "",
      });
    } catch {
      this.currentUser.set(null);
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ nextStep: any }> {
    this.isLoading.set(true);
    try {
      const result = await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      } as SignUpInput);
      return result;
    } finally {
      this.isLoading.set(false);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    await confirmSignUp({ username: email, confirmationCode: code });
  }

  async signIn(email: string, password: string): Promise<void> {
    this.isLoading.set(true);
    try {
      await signIn({ username: email, password } as SignInInput);
      await this.loadCurrentUser();
      this.router.navigate(["/dashboard"]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    await signOut();
    this.currentUser.set(null);
    this.router.navigate(["/auth/login"]);
  }

  async getToken(): Promise<string> {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || "";
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
