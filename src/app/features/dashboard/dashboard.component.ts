import { Component, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  menuOpen = signal(false);
  userName = signal("");
  userEmail = signal("");
  dayNumber = signal(1);

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.userName.set(user.name?.split(" ")[0] || "Champ");
      this.userEmail.set(user.email);
      this.initials.bind(this);
    }
    this.loadDayNumber();

    const userId = this.auth.currentUser()?.userId || "";
    this.api.getUser(userId).subscribe({
      next: (u: any) => {
        if (u.startDate) {
          localStorage.setItem("startDate", u.startDate);
        }
      },
    });
  }

  initials(): string {
    return this.userName().charAt(0).toUpperCase() || "A";
  }

  loadDayNumber() {
    const start =
      localStorage.getItem("startDate") ||
      new Date().toISOString().split("T")[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start + "T00:00:00");
    const diff = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) {
      this.dayNumber.set(0);
      return;
    }
    this.dayNumber.set(Math.min(diff + 1, 100));
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  async signOut() {
    this.menuOpen.set(false);
    await this.auth.signOut();
  }
}
