import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ApiService, OnboardingAnswers } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

@Component({
  selector: "app-onboarding",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./onboarding.component.html",
  styleUrls: ["./onboarding.component.css"],
})
export class OnboardingComponent {
  currentStep = signal(1);
  isGenerating = signal(false);
  planReady = signal(false);
  error = signal("");
  generatingStep = signal(0);

  steps: Step[] = [
    { id: 1, title: "BODY STATS", subtitle: "Tell us about your body" },
    { id: 2, title: "GOALS", subtitle: "What do you want to achieve" },
    { id: 3, title: "TRAINING", subtitle: "Your gym setup" },
    { id: 4, title: "NUTRITION", subtitle: "Your eating habits" },
    { id: 5, title: "LIFESTYLE", subtitle: "Recovery and health" },
    { id: 6, title: "GENERATING", subtitle: "Building your plan" },
  ];

  generatingSteps = [
    "Analyzing your body stats...",
    "Calculating calorie targets...",
    "Building your workout split...",
    "Creating your meal plan...",
    "Finalizing supplement guide...",
    "Saving your plan...",
  ];

  visualGoalOptions = [
    "Broader shoulders",
    "Fuller chest",
    "Bigger arms",
    "Wider back / V-taper",
    "Thicker traps",
    "Toned arms",
    "Flat stomach",
    "Visible abs",
    "Smaller waist",
    "Bigger / rounder glutes",
    "Toned legs",
    "Slim thighs",
    "Defined calves",
    "Hip dips reduction",
    "Better posture",
    "Overall toned look",
    "Lose body fat",
    "Hourglass figure",
  ];
  supplementOptions = [
    "Whey Protein",
    "Creatine",
    "Multivitamin",
    "Pre-workout",
    "Mass gainer",
    "Nothing currently",
  ];
  injuryOptions = [
    "Shoulder pain",
    "Lower back issues",
    "Knee pain",
    "Elbow/wrist pain",
    "No injuries",
  ];
  fatStorageOptions = [
    "Belly / Midsection",
    "Love handles / Waist",
    "Chest",
    "Hips / Thighs",
    "Lower belly",
    "Back / Shoulders",
    "Arms",
    "Evenly distributed",
  ];

  customGoal = "";
  customInjury = "";

  answers: OnboardingAnswers = {
    age: 0,
    gender: "",
    height: "",
    weight: 0,
    physique: "",
    fatStorage: [],
    primaryGoal: "",
    laggingMuscles: [],
    trainingLevel: "",
    gymAccess: "",
    daysPerWeek: 5,
    sessionDuration: "75-90 minutes",
    sleepHours: "7-8 hours",
    dietType: "",
    foodPreference: "No preference",
    appetite: "Moderate",
    supplements: [],
    injuries: [],
    visualGoals: [],
    bulkApproach: "Lean bulk",
    coachingStyle: "Strict",
    trackingPreference: "Simple meal structure",
    preferredTrainTime: "Evening",
    stressLevel: "Moderate",
    usesProteinPowder: false,
    proteinPowderType: "",
    needsProteinRestock: false,
    wantsProteinRecommendation: false,
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private auth: AuthService,
  ) {}

  toggleArray(arr: string[], val: string) {
    const idx = arr.indexOf(val);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(val);
  }

  toggleFatStorage(area: string) {
    const idx = this.answers.fatStorage.indexOf(area);
    if (idx > -1) {
      this.answers.fatStorage.splice(idx, 1);
    } else {
      this.answers.fatStorage.push(area);
    }
  }

  isStepValid(): boolean {
    switch (this.currentStep()) {
      case 1:
        return !!(
          this.answers.age &&
          this.answers.gender &&
          this.answers.height &&
          this.answers.weight &&
          this.answers.physique
        );
      case 2:
        return !!(this.answers.primaryGoal && this.answers.bulkApproach);
      case 3:
        return !!(this.answers.trainingLevel && this.answers.gymAccess);
      case 4:
        return !!this.answers.dietType;
      case 5:
        return !!this.answers.stressLevel;
      default:
        return true;
    }
  }

  nextStep() {
    if (this.isStepValid()) this.currentStep.update((s) => s + 1);
  }
  prevStep() {
    this.currentStep.update((s) => s - 1);
  }

  generatePlan() {
    this.currentStep.set(6);
    this.isGenerating.set(true);
    this.error.set("");

    const heightValue = this.answers.height?.trim() || "";
    const payloadHeight = /feet$/i.test(heightValue)
      ? heightValue
      : `${heightValue} feet`;
    const payloadWeight = `${this.answers.weight} kgs`;

    const payload = {
      ...this.answers,
      age: String(this.answers.age),
      height: payloadHeight,
      weight: payloadWeight,
      daysPerWeek: String(this.answers.daysPerWeek),
      primaryGoal:
        this.answers.primaryGoal === "custom"
          ? this.customGoal
          : this.answers.primaryGoal,
      injuries: [
        ...this.answers.injuries,
        ...(this.customInjury ? [this.customInjury] : []),
      ],
      userId: this.auth.currentUser()?.userId || "",
    };

    this.api.generatePlan(payload as any).subscribe({
      next: () => this.pollForPlan(),
      error: () => {
        // 503 - Lambda running, start polling
        this.pollForPlan();
      },
    });
  }

  pollForPlan() {
    let attempts = 0;
    const maxAttempts = 25;

    const interval = setInterval(() => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        this.isGenerating.set(false);
        this.error.set("Plan generation timed out. Please retry.");
        return;
      }

      this.api.getPlan().subscribe({
        next: (plan: any) => {
          console.log("Poll:", attempts, plan.status);
          if (
            plan.status === "READY" &&
            plan.strategy &&
            plan.strategy.trim().length > 5
          ) {
            clearInterval(interval);
            this.isGenerating.set(false);
            this.planReady.set(true);
          }
          // else keep polling
        },
        error: (err) => {
          // 404 = plan deleted, still generating - keep polling
          console.log("Poll error:", err.status, "attempt:", attempts);
        },
      });
    }, 5000);
  }

  goToDashboard() {
    this.router.navigate(["/dashboard"]);
  }

  cancel() {
    this.router.navigate(["/dashboard/profile"]);
  }
}
