import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { Subject, debounceTime, distinctUntilChanged, switchMap } from "rxjs";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent {
  name = "";
  email = "";
  password = "";
  username = "";
  code = "";
  step = signal<"register" | "confirm">("register");
  error = signal("");
  usernameStatus = signal<"idle" | "checking" | "available" | "taken">("idle");

  private usernameCheck$ = new Subject<string>();

  constructor(
    public auth: AuthService,
    private api: ApiService,
  ) {
    this.usernameCheck$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((username) => {
          this.usernameStatus.set("checking");
          return this.api.checkUsername(username);
        }),
      )
      .subscribe({
        next: (res: any) => {
          this.usernameStatus.set(res.available ? "available" : "taken");
        },
        error: (err) => {
          this.usernameStatus.set(err.status === 409 ? "taken" : "idle");
        },
      });
  }

  onUsernameChange() {
    if (this.username.length < 3) {
      this.usernameStatus.set("idle");
      return;
    }
    this.usernameCheck$.next(this.username);
  }

  async signUp() {
    if (!this.name || !this.email || !this.password || !this.username) return;
    if (this.usernameStatus() === "taken") return;
    this.error.set("");
    try {
      await this.auth.signUp(this.email, this.password, this.name);
      this.step.set("confirm");
    } catch (err: any) {
      this.error.set(err.message || "Sign up failed.");
    }
  }

  async confirm() {
    this.error.set("");
    try {
      await this.auth.confirmSignUp(this.email, this.code);
      await this.auth.signIn(this.email, this.password);
      const user = this.auth.currentUser();
      if (user) {
        this.api
          .createUser({
            firstName: this.name.split(" ")[0],
            lastName: this.name.split(" ")[1] || "",
            email: this.email,
            username: this.username,
          })
          .subscribe();
      }
    } catch (err: any) {
      this.error.set(err.message || "Verification failed.");
    }
  }
}
