import { Component, signal } from "@angular/core";
import { Router } from "@angular/router";
import { PwaService } from "../../core/services/pwa.service";

@Component({
  selector: "app-pwa-guide",
  standalone: true,
  templateUrl: "./pwa-guide.component.html",
  styleUrls: ["./pwa-guide.component.css"],
})
export class PwaGuideComponent {
  step = signal(0);

  constructor(
    private router: Router,
    private pwa: PwaService,
  ) {}

  isIOS(): boolean {
    return this.pwa.isIOS();
  }

  next() {
    if (this.step() < 2) {
      this.step.update((value) => value + 1);
      return;
    }
    this.done();
  }

  done() {
    localStorage.setItem("pwaGuideShown", "true");
    this.router.navigate(["/dashboard"]);
  }
}