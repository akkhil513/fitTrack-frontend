import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

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
}
