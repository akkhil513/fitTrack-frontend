import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../core/services/auth.service";

@Component({
  selector: "app-splash",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./splash.component.html",
  styleUrls: ["./splash.component.css"],
})
export class SplashComponent implements OnInit {
  step = signal(0);

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    setTimeout(() => this.step.set(1), 500);
    setTimeout(() => this.step.set(2), 1500);
    setTimeout(() => this.step.set(3), 2500);

    setTimeout(() => {
      const pwaShown = localStorage.getItem("pwaGuideShown");
      if (!pwaShown) {
        this.router.navigate(["/pwa-guide"]);
      } else if (this.auth.currentUser()) {
        this.router.navigate(["/dashboard"]);
      } else {
        this.router.navigate(["/auth/login"]);
      }
    }, 3500);
  }
}