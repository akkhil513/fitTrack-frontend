import { Component, OnInit } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { Amplify } from "aws-amplify";
import { environment } from "../environments/environment";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolWebClientId,
      signUpVerificationMethod: "code",
    },
  },
});

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const shown = localStorage.getItem("pwaGuideShown");
    if (!shown && this.router.url !== "/pwa-guide") {
      this.router.navigate(["/pwa-guide"]);
    }
  }
}
