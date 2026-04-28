import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { onboardingGuard } from "./core/guards/onboarding.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./splash/splash.component").then((m) => m.SplashComponent),
    pathMatch: "full",
  },
  {
    path: "splash",
    loadComponent: () =>
      import("./splash/splash.component").then((m) => m.SplashComponent),
  },

  // Auth routes
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },

  // Onboarding — only if no plan exists
  {
    path: "onboarding",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
  },

  {
    path: "pwa-guide",
    loadComponent: () =>
      import("./features/pwa-guide/pwa-guide.component").then(
        (m) => m.PwaGuideComponent,
      ),
  },

  // Main app — protected
  {
    path: "dashboard",
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    children: [
      { path: "", redirectTo: "today", pathMatch: "full" },
      {
        path: "today",
        loadComponent: () =>
          import("./features/dashboard/checklist/checklist.component").then(
            (m) => m.ChecklistComponent,
          ),
      },
      {
        path: "schedule",
        loadComponent: () =>
          import("./features/dashboard/schedule/schedule.component").then(
            (m) => m.ScheduleComponent,
          ),
      },
      {
        path: "log",
        loadComponent: () =>
          import("./features/dashboard/log/log.component").then(
            (m) => m.LogComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
      },
    ],
  },

  { path: "**", redirectTo: "/dashboard" },
];
