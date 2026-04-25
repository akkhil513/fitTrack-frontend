import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class PwaService {
  canInstall = signal(false);
  isInstalled = signal(false);
  notificationsEnabled = signal(false);

  private installPrompt: any = null;

  constructor() {
    this.checkInstalled();
    this.listenForInstallPrompt();
    this.checkNotificationPermission();
  }

  private checkInstalled() {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    this.isInstalled.set(isStandalone);
  }

  private listenForInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener("appinstalled", () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) return false;
    this.installPrompt.prompt();
    const result = await this.installPrompt.userChoice;
    this.installPrompt = null;
    this.canInstall.set(false);
    return result.outcome === "accepted";
  }

  isIOS(): boolean {
    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    );
  }

  isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  // Notifications
  private checkNotificationPermission() {
    if ("Notification" in window) {
      this.notificationsEnabled.set(Notification.permission === "granted");
    }
  }

  async requestNotifications(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    const granted = permission === "granted";
    this.notificationsEnabled.set(granted);
    if (granted) this.scheduleLocalReminders();
    return granted;
  }

  scheduleLocalReminders() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      // Trigger the SW to schedule reminders
      reg.active?.postMessage({ type: "SCHEDULE_REMINDERS" });
    });
  }

  sendTestNotification() {
    if (Notification.permission === "granted") {
      new Notification("💪 FitTrack", {
        body: "Notifications are working! You'll get reminders throughout the day.",
        icon: "/icons/icon-192x192.png",
      });
    }
  }
}
