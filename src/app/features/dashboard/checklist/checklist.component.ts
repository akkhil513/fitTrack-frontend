import { Component, OnDestroy, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService, DailyLog } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";

interface CheckItem {
  id: string;
  group: "meal" | "supp" | "train" | "water" | "recovery";
  name: string;
  time: string;
  tag: string;
  tagLabel: string;
}

@Component({
  selector: "app-checklist",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./checklist.component.html",
  styleUrls: ["./checklist.component.css"],
})
export class ChecklistComponent implements OnInit, OnDestroy {
  checked = signal<Record<string, boolean>>({});
  saving = signal(false);
  savedMsg = signal("");
  todayKey = new Date().toISOString().split("T")[0];
  private savedTimeoutId: ReturnType<typeof setTimeout> | null = null;
  planLoaded = signal(false);

  groups = [
    { key: "supp", label: "Supplements", icon: "💊" },
    { key: "train", label: "Training", icon: "💪" },
    { key: "water", label: "Hydration", icon: "💧" },
    { key: "recovery", label: "Recovery", icon: "😴" },
  ];

  // Default fallback items
  defaultItems: CheckItem[] = [
    {
      id: "supp1",
      group: "supp",
      name: "Whey Protein — post workout",
      time: "Post-workout",
      tag: "supp",
      tagLabel: "SUPP",
    },
    {
      id: "supp2",
      group: "supp",
      name: "Creatine 5g",
      time: "Post-workout",
      tag: "supp",
      tagLabel: "SUPP",
    },
    {
      id: "supp3",
      group: "supp",
      name: "Vitamin D3",
      time: "With breakfast",
      tag: "supp",
      tagLabel: "SUPP",
    },
    {
      id: "supp4",
      group: "supp",
      name: "Omega-3 Fish Oil",
      time: "With lunch",
      tag: "supp",
      tagLabel: "SUPP",
    },
    {
      id: "supp5",
      group: "supp",
      name: "Magnesium Glycinate",
      time: "Before bed",
      tag: "supp",
      tagLabel: "SUPP",
    },
    {
      id: "water1",
      group: "water",
      name: "Drink 3.5L water",
      time: "Throughout day",
      tag: "water",
      tagLabel: "WATER",
    },
    {
      id: "train1",
      group: "train",
      name: "Complete today's workout",
      time: "Evening",
      tag: "train",
      tagLabel: "TRAIN",
    },
    {
      id: "train2",
      group: "train",
      name: "Log all sets and reps",
      time: "Post-workout",
      tag: "train",
      tagLabel: "TRAIN",
    },
    {
      id: "recovery1",
      group: "recovery",
      name: "8000+ steps today",
      time: "Daily",
      tag: "recovery",
      tagLabel: "STEPS",
    },
    {
      id: "recovery2",
      group: "recovery",
      name: "Foam roll 10 min",
      time: "Evening",
      tag: "recovery",
      tagLabel: "RECOV",
    },
    {
      id: "recovery3",
      group: "recovery",
      name: "Sleep 7+ hours",
      time: "Before bed",
      tag: "sleep",
      tagLabel: "SLEEP",
    },
  ];

  items = signal<CheckItem[]>(this.defaultItems);

  motivations = [
    "Every rep today is a vote for who you want to become.",
    "The belly doesn't vanish overnight. But it vanishes with days like today.",
    "Lateral raises. Never skip them. Shoulders win in shirts.",
    "Sleep. Eat. Train. Repeat. 100 days. No excuses.",
    "Protein first. Always. 160g today or it doesn't count.",
    "The T-shirt is waiting. Fill it out.",
    "Progressive overload. Same weight = same body. Add the plates.",
    "Consistency over intensity. Show up today.",
  ];

  motivation = signal("");

  doneCount = computed(
    () => Object.values(this.checked()).filter(Boolean).length,
  );
  scorePct = computed(() =>
    Math.round((this.doneCount() / this.items().length) * 100),
  );
  scoreMessage = computed(() => {
    const pct = this.scorePct();
    if (pct === 100) return "🔥 PERFECT DAY — 100% complete!";
    if (pct >= 75) return "Almost there — finish strong!";
    if (pct >= 50) return "Solid progress — more than halfway!";
    if (pct > 0) return "Good start — keep going!";
    return "Complete all tasks to hit 100% today.";
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.motivation.set(
      this.motivations[Math.floor(Math.random() * this.motivations.length)],
    );
    this.loadPlanChecklist();
  }

  loadPlanChecklist() {
    this.api.getPlan().subscribe({
      next: (plan: any) => {
        if (plan.dailyChecklist && plan.dailyChecklist.trim() !== " ") {
          try {
            const planItems = JSON.parse(plan.dailyChecklist);
            if (Array.isArray(planItems) && planItems.length > 0) {
              const mapped: CheckItem[] = planItems
                .filter((item: any) => item.category !== "nutrition")
                .map((item: any, i: number) => ({
                  id: item.id || `plan_${i}`,
                  group: this.mapCategory(item.category),
                  name: item.label,
                  time: item.time || "",
                  tag: item.category || "supp",
                  tagLabel: item.category?.toUpperCase().substring(0, 5) || "TASK",
                }));
              this.items.set(mapped);
            }
          } catch {
            // keep default items
          }
        }
        this.planLoaded.set(true);
        this.loadTodayChecklist();
      },
      error: () => {
        this.planLoaded.set(true);
        this.loadTodayChecklist();
      },
    });
  }

  mapCategory(category: string): "meal" | "supp" | "train" | "water" | "recovery" {
    switch (category) {
      case "supplement":
        return "supp";
      case "training":
        return "train";
      case "nutrition":
        return "water";
      case "recovery":
        return "recovery";
      default:
        return "supp";
    }
  }

  loadTodayChecklist() {
    this.api.getLogByDate(this.todayKey).subscribe({
      next: (log: any) => {
        if (log.checklist && log.checklist.trim() !== " ") {
          try {
            const saved = JSON.parse(log.checklist);
            const checked: Record<string, boolean> = {};
            this.items().forEach((item) => {
              checked[item.id] = saved[item.name] || saved[item.id] || false;
            });
            this.checked.set(checked);
          } catch {}
        } else {
          const saved = localStorage.getItem(this.storageKey);
          if (saved) this.checked.set(JSON.parse(saved));
        }
      },
      error: () => {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) this.checked.set(JSON.parse(saved));
      },
    });
  }

  ngOnDestroy() {
    if (this.savedTimeoutId) {
      clearTimeout(this.savedTimeoutId);
    }
  }

  getGroupItems(group: string): CheckItem[] {
    return this.items().filter((i) => i.group === group);
  }

  toggle(id: string) {
    const current = { ...this.checked() };
    current[id] = !current[id];
    this.checked.set(current);
    localStorage.setItem(this.storageKey, JSON.stringify(current));
  }

  saveChecklist() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || "";

    const labeledChecklist: Record<string, boolean> = {};
    this.items().forEach((item) => {
      labeledChecklist[item.name] = this.checked()[item.id] || false;
    });

    this.api
      .saveLog({
        userId,
        date: this.todayKey,
        dayNumber: this.getDayNumber(),
        checklist: labeledChecklist as any,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.savedMsg.set("✓ Saved!");
          setTimeout(() => this.savedMsg.set(""), 2000);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  private getDayNumber(): number {
    const start = localStorage.getItem("startDate") || this.todayKey;
    const today = new Date(this.todayKey + "T00:00:00");
    const startDate = new Date(start + "T00:00:00");
    const diff = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return 0;
    return Math.min(diff + 1, 100);
  }

  private get storageKey(): string {
    return "checked_" + this.todayKey;
  }
}
