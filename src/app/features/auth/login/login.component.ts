import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  email = "";
  password = "";
  error = signal("");
  loading = signal(false);

  step = signal<"login" | "forgot" | "reset">("login");
  resetEmail = "";
  resetCode = "";
  newPassword = "";
  confirmPassword = "";

  constructor(public auth: AuthService) {}

  async login() {
    if (!this.email || !this.password) {
      this.error.set("Please fill in all fields");
      return;
    }
    try {
      this.error.set("");
      await this.auth.signIn(this.email, this.password);
    } catch (e: any) {
      this.error.set(e.message || "Sign in failed. Check your credentials.");
    }
  }

  async sendResetCode() {
    if (!this.resetEmail) { this.error.set("Enter your email"); return; }
    this.loading.set(true);
    this.error.set("");
    try {
      await resetPassword({ username: this.resetEmail });
      this.step.set("reset");
    } catch (e: any) {
      this.error.set(e.message || "Failed to send code.");
    }
    this.loading.set(false);
  }

  async confirmReset() {
    if (!this.resetCode || !this.newPassword) {
      this.error.set("Fill in all fields");
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set("Passwords don't match");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    try {
      await confirmResetPassword({
        username: this.resetEmail,
        confirmationCode: this.resetCode,
        newPassword: this.newPassword
      });
      this.step.set("login");
      this.error.set("");
      alert("Password reset successful! Please sign in.");
    } catch (e: any) {
      this.error.set(e.message || "Reset failed.");
    }
    this.loading.set(false);
  }

}
