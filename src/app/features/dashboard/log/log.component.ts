import { Component, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ApiService,
  DailyLog,
  WorkoutLog,
  NutritionLog,
} from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import {
  ExerciseService,
  Exercise,
} from "../../../core/services/exercise.service";
import { ExercisePickerComponent } from "../exercises/exercise-picker.component";
import { ExerciseDetailComponent } from "../exercises/exercise-detail.component";
import {
  FoodSearchComponent,
  FoodEntry,
} from "../nutrition/food-search.component";

interface SetRow {
  reps: string;
  weight: string;
  done: boolean;
}
interface ExerciseRow {
  name: string;
  sets: SetRow[];
  expanded: boolean;
  weightType: "total" | "perSide";
  showCalc: boolean;
  barWeight: number;
  plateEachSide: number;
}

const workoutExercises: Record<string, string[]> = {
  Monday: [
    "Flat Barbell Bench Press",
    "Incline Dumbbell Press",
    "Cable Chest Fly",
    "Seated DB Shoulder Press",
    "Lateral Raises",
    "Tricep Rope Pushdown",
    "Overhead Tricep Extension",
  ],
  Tuesday: [
    "Pull-ups",
    "Wide Grip Lat Pulldown",
    "Seated Cable Row",
    "Single Arm DB Row",
    "Straight Arm Cable Pulldown",
    "Barbell Curl",
    "Hammer Curl",
  ],
  Wednesday: [
    "Barbell Back Squat",
    "Romanian Deadlift",
    "Leg Press",
    "Walking Lunges",
    "Leg Curl Machine",
    "Leg Extension Machine",
    "Standing Calf Raises",
  ],
  Thursday: [
    "Overhead Barbell Press",
    "Incline Barbell Bench Press",
    "Dumbbell Lateral Raises",
    "Cable Front Raise",
    "Dumbbell Rear Delt Fly",
    "Face Pulls",
    "Tricep Dips",
  ],
  Friday: [
    "Deadlift",
    "Barbell Row",
    "Cable Pullover",
    "Chest Supported DB Row",
    "Barbell Shrugs",
    "Incline Dumbbell Curl",
    "Cable Curl",
  ],
  Saturday: [],
  Sunday: [],
};

@Component({
  selector: "app-log",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExercisePickerComponent,
    ExerciseDetailComponent,
    FoodSearchComponent,
  ],
  templateUrl: "./log.component.html",
  styleUrls: ["./log.component.css"],
})
export class LogComponent implements OnInit {
  activeTab = signal<"workout" | "nutrition" | "history">("workout");
  saving = signal(false);
  savedMsg = signal("");
  pastLogs = signal<DailyLog[]>([]);
  exercises = signal<ExerciseRow[]>([]);
  todayExerciseList = signal<string[]>([]);
  planExercises: Record<string, string[]> = {};
  planSessions: Record<string, string> = {};

  readonly exerciseDbMap: Record<string, string> = {
    // Push A
    "Flat Barbell Bench Press": "barbell bench press",
    "Incline Dumbbell Press": "dumbbell incline bench press",
    "Cable Chest Fly": "cable fly",
    "Seated DB Shoulder Press": "dumbbell shoulder press",
    "Lateral Raises": "dumbbell lateral raise",
    "Tricep Rope Pushdown": "cable pushdown",
    "Overhead Tricep Extension": "dumbbell triceps extension",
    // Push B
    "Overhead Barbell Press": "barbell overhead press",
    "Incline Barbell Bench Press": "barbell incline bench press",
    "Dumbbell Lateral Raises": "dumbbell lateral raise",
    "Cable Front Raise": "cable front raise",
    "Dumbbell Rear Delt Fly": "dumbbell rear delt row",
    "Face Pulls": "cable face pull",
    "Tricep Dips": "dips",
    // Pull A
    "Pull-ups": "pull up",
    "Wide Grip Lat Pulldown": "cable lat pulldown",
    "Seated Cable Row": "cable seated row",
    "Single Arm DB Row": "dumbbell one arm row",
    "Straight Arm Cable Pulldown": "cable pushdown",
    "Barbell Curl": "barbell curl",
    "Hammer Curl": "dumbbell hammer curl",
    // Pull B
    Deadlift: "barbell deadlift",
    "Barbell Row": "barbell bent over row",
    "Cable Pullover": "cable pullover",
    "Chest Supported DB Row": "dumbbell bent over row",
    "Barbell Shrugs": "barbell shrug",
    "Incline Dumbbell Curl": "dumbbell incline curl",
    "Cable Curl": "cable curl",
    // Legs
    "Barbell Back Squat": "barbell squat",
    "Romanian Deadlift": "romanian deadlift",
    "Leg Press": "leg press",
    "Walking Lunges": "dumbbell lunge",
    "Leg Curl Machine": "lying leg curl",
    "Leg Extension Machine": "leg extension",
    "Standing Calf Raises": "standing calf raise",
  };

  workout = { session: "Push A — Chest/Shoulders/Triceps", notes: "" };
  nutrition: NutritionLog = { protein: 0, calories: 0, water: 0, sleep: 0 };

  today = new Date().toISOString().split("T")[0];
  logDate = this.today;
  selectedDate = this.today;
  selectedLog = signal<any>(null);
  selectedLogExercises = signal<ExerciseRow[]>([]);

  showPicker = signal(false);
  activeExerciseIndex = signal(-1);
  selectedExerciseDetail = signal<Exercise | null>(null);
  customExercises = signal<Set<number>>(new Set());
  showFoodSearch = signal(false);
  foodEntries = signal<FoodEntry[]>([]);

  readonly quickFoods = [
    {
      id: "eggs",
      icon: "🥚",
      name: "Eggs",
      unit: "eggs",
      defaultQty: 3,
      per: 1,
      protein: 6,
      calories: 70,
      carbs: 0.6,
      fat: 5,
    },
    {
      id: "chicken",
      icon: "🍗",
      name: "Chicken Breast",
      unit: "g",
      defaultQty: 150,
      per: 100,
      protein: 31,
      calories: 165,
      carbs: 0,
      fat: 3.6,
    },
    {
      id: "whey",
      icon: "🥛",
      name: "Whey Protein",
      unit: "scoops",
      defaultQty: 1,
      per: 1,
      protein: 25,
      calories: 120,
      carbs: 5,
      fat: 2,
    },
    {
      id: "rice",
      icon: "🍚",
      name: "Rice (cooked)",
      unit: "g",
      defaultQty: 150,
      per: 100,
      protein: 2.7,
      calories: 130,
      carbs: 28,
      fat: 0.3,
    },
    {
      id: "quinoa",
      icon: "🌾",
      name: "Quinoa",
      unit: "g",
      defaultQty: 100,
      per: 100,
      protein: 4.4,
      calories: 120,
      carbs: 22,
      fat: 1.9,
    },
    {
      id: "redmeat",
      icon: "🥩",
      name: "Red Meat (lean)",
      unit: "g",
      defaultQty: 150,
      per: 100,
      protein: 26,
      calories: 215,
      carbs: 0,
      fat: 9,
    },
    {
      id: "fish",
      icon: "🐟",
      name: "Fish / Tuna",
      unit: "g",
      defaultQty: 150,
      per: 100,
      protein: 25,
      calories: 130,
      carbs: 0,
      fat: 3,
    },
    {
      id: "oats",
      icon: "🥣",
      name: "Oats",
      unit: "g",
      defaultQty: 80,
      per: 100,
      protein: 13,
      calories: 370,
      carbs: 66,
      fat: 7,
    },
    {
      id: "banana",
      icon: "🍌",
      name: "Banana",
      unit: "bananas",
      defaultQty: 1,
      per: 1,
      protein: 1.3,
      calories: 105,
      carbs: 27,
      fat: 0.4,
    },
    {
      id: "milk",
      icon: "🍼",
      name: "Milk (whole)",
      unit: "ml",
      defaultQty: 250,
      per: 100,
      protein: 3.4,
      calories: 61,
      carbs: 4.8,
      fat: 3.3,
    },
  ];

  selectedQuickFood = signal<any>(null);
  quickFoodQty = signal<number>(1);
  mealTemplates = signal<any[]>([]);
  showTemplateManager = signal(false);
  newTemplateName = "";
  showMealDescriber = signal(false);
  mealDescription = "";
  mealMacros = signal<any>(null);
  calculatingMeal = signal(false);
  savingTemplate = signal(false);

  selectQuickFood(food: any) {
    this.selectedQuickFood.set(food);
    this.quickFoodQty.set(food.defaultQty);
  }

  getQuickFoodMacros() {
    const food = this.selectedQuickFood();
    if (!food) return null;
    const ratio = this.quickFoodQty() / food.per;
    return {
      protein: Math.round(food.protein * ratio * 10) / 10,
      calories: Math.round(food.calories * ratio),
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
    };
  }

  addQuickFood() {
    const food = this.selectedQuickFood();
    const macros = this.getQuickFoodMacros();
    if (!food || !macros) return;

    this.nutrition.protein = Math.round(
      this.nutrition.protein + macros.protein,
    );
    this.nutrition.calories = Math.round(
      this.nutrition.calories + macros.calories,
    );

    this.foodEntries.update((entries) => [
      ...entries,
      {
        food: {
          fdcId: 0,
          description: `${food.icon} ${food.name}`,
          protein: macros.protein,
          calories: macros.calories,
          carbs: macros.carbs,
          fat: macros.fat,
        },
        grams: this.quickFoodQty(),
        calculated: {
          fdcId: 0,
          description: food.name,
          protein: macros.protein,
          calories: macros.calories,
          carbs: macros.carbs,
          fat: macros.fat,
        },
      },
    ]);

    this.selectedQuickFood.set(null);
  }

  incrementQty() {
    this.quickFoodQty.update((q) => q + 1);
  }
  decrementQty() {
    this.quickFoodQty.update((q) => Math.max(1, q - 1));
  }

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private exerciseService: ExerciseService,
  ) {}

  ngOnInit() {
    this.loadLogs();
    this.loadPlanAndSetExercises();
    this.loadMealTemplates();
  }

  makeExerciseRow(name: string, expanded: boolean): ExerciseRow {
    return {
      name,
      expanded,
      weightType: "total",
      showCalc: false,
      barWeight: 45,
      plateEachSide: 0,
      sets: [
        { reps: "", weight: "", done: false },
        { reps: "", weight: "", done: false },
        { reps: "", weight: "", done: false },
        { reps: "", weight: "", done: false },
      ],
    };
  }

  loadPlanAndSetExercises() {
    this.api.getPlan().subscribe({
      next: (plan: any) => {
        try {
          let training = plan.training;
          if (typeof training === "string") {
            training = training.replace(/^"|"$/g, "");
            training = JSON.parse(training);
          }
          const days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          days.forEach((day) => {
            if (training[day]?.exercises) {
              this.planExercises[day] = training[day].exercises.map(
                (e: any) => e.name,
              );
            }
            if (training[day]?.session) {
              this.planSessions[day] = training[day].session;
            }
          });
        } catch {}
        this.onDateChange();
      },
      error: () => this.onDateChange(),
    });
  }

  loadDefaultExercises(dayName: string, sessionMap: Record<string, string>) {
    this.workout.session =
      this.planSessions[dayName] || sessionMap[dayName] || "";

    const restSessions = ["Rest Day", "Complete Rest", "Active Recovery"];
    if (restSessions.includes(this.workout.session)) {
      this.exercises.set([]);
      this.todayExerciseList.set([]);
      return;
    }

    const list = this.planExercises[dayName]?.length
      ? this.planExercises[dayName]
      : workoutExercises[dayName] || [];
    this.todayExerciseList.set(list);
    if (list.length > 0) {
      this.exercises.set(
        list.map((name, i) => this.makeExerciseRow(name, i === 0)),
      );
    } else {
      this.exercises.set([this.makeExerciseRow("", true)]);
    }
  }

  onSessionChange() {
    const restSessions = ["Rest Day", "Complete Rest", "Active Recovery"];

    if (restSessions.includes(this.workout.session)) {
      this.exercises.set([]);
      this.todayExerciseList.set([]);
      return;
    }

    const dayName = Object.keys(this.planSessions).find(
      (day) => this.planSessions[day] === this.workout.session,
    );

    if (dayName && this.planExercises[dayName]?.length) {
      this.todayExerciseList.set(this.planExercises[dayName]);
      this.exercises.set(
        this.planExercises[dayName].map((name, i) =>
          this.makeExerciseRow(name, i === 0),
        ),
      );
    }
  }

  addRow() {
    this.exercises.update((rows) => [...rows, this.makeExerciseRow("", true)]);
  }

  addSet(exIndex: number) {
    this.exercises.update((rows) => {
      const updated = [...rows];
      updated[exIndex] = {
        ...updated[exIndex],
        sets: [...updated[exIndex].sets, { reps: "", weight: "", done: false }],
      };
      return updated;
    });
  }

  removeSet(exIndex: number, setIndex: number) {
    this.exercises.update((rows) => {
      const updated = [...rows];
      if (updated[exIndex].sets.length > 1) {
        updated[exIndex] = {
          ...updated[exIndex],
          sets: updated[exIndex].sets.filter((_, i) => i !== setIndex),
        };
      }
      return updated;
    });
  }

  removeExercise(index: number) {
    this.exercises.update((rows) => rows.filter((_, i) => i !== index));
  }

  toggleExpanded(index: number) {
    this.exercises.update((rows) =>
      rows.map((ex, i) => ({
        ...ex,
        expanded: i === index ? !ex.expanded : ex.expanded,
      })),
    );
  }

  toggleDone(exIndex: number, setIndex: number) {
    this.exercises.update((rows) => {
      const updated = [...rows];
      const sets = [...updated[exIndex].sets];
      sets[setIndex] = { ...sets[setIndex], done: !sets[setIndex].done };
      updated[exIndex] = { ...updated[exIndex], sets };
      return updated;
    });
  }

  toggleCalc(index: number) {
    this.exercises.update((rows) =>
      rows.map((ex, i) => ({
        ...ex,
        showCalc: i === index ? !ex.showCalc : ex.showCalc,
      })),
    );
  }

  toggleWeightType(index: number) {
    this.exercises.update((rows) =>
      rows.map((ex, i) => ({
        ...ex,
        weightType:
          i === index
            ? ex.weightType === "total"
              ? "perSide"
              : "total"
            : ex.weightType,
      })),
    );
  }

  getCalcTotal(ex: ExerciseRow): number {
    return ex.barWeight + ex.plateEachSide * 2;
  }

  useCalcTotal(exIndex: number) {
    const ex = this.exercises()[exIndex];
    const total = this.getCalcTotal(ex);
    this.exercises.update((rows) => {
      const updated = [...rows];
      updated[exIndex] = {
        ...updated[exIndex],
        sets: updated[exIndex].sets.map((s) => ({
          ...s,
          weight: String(total),
        })),
        showCalc: false,
      };
      return updated;
    });
  }

  getDoneCount(ex: ExerciseRow): number {
    return ex.sets.filter((s) => s.done).length;
  }

  onExerciseChange(ex: ExerciseRow, index: number) {
    if (ex.name === "other") {
      ex.name = "";
      this.activeExerciseIndex.set(index);
      this.showPicker.set(true);
    }
  }

  onExerciseSelected(ex: Exercise) {
    const index = this.activeExerciseIndex();
    if (index >= 0) {
      this.exercises.update((rows) => {
        const updated = [...rows];
        updated[index] = { ...updated[index], name: ex.name };
        return updated;
      });
      this.customExercises.update((set) => new Set([...set, index]));
    }
    this.showPicker.set(false);
  }

  removeCustomExercise(index: number) {
    this.customExercises.update((set) => {
      const next = new Set(set);
      next.delete(index);
      return next;
    });
  }

  searchAndShowDetail(name: string) {
    if (!name) return;
    const searchName = this.exerciseDbMap[name] || name.toLowerCase();

    this.exerciseService.search(searchName, 3).subscribe({
      next: (exercises) => {
        if (exercises.length > 0) this.selectedExerciseDetail.set(exercises[0]);
      },
    });
  }

  loadLogs() {
    this.api
      .getLogs()
      .subscribe({ next: (logs) => this.pastLogs.set(logs), error: () => {} });
  }

  loadMealTemplates() {
    this.api.getMealTemplates().subscribe({
      next: (res: any) => {
        try {
          const templates =
            typeof res.mealTemplates === "string"
              ? JSON.parse(res.mealTemplates)
              : res.mealTemplates || [];
          this.mealTemplates.set(templates);
        } catch {
          this.mealTemplates.set([]);
        }
      },
      error: () => this.mealTemplates.set([]),
    });
  }

  addTemplateToLog(template: any) {
    this.nutrition.protein = Math.round(
      this.nutrition.protein + template.macros.protein,
    );
    this.nutrition.calories = Math.round(
      this.nutrition.calories + template.macros.calories,
    );
    this.foodEntries.update((entries) => [
      ...entries,
      {
        food: {
          fdcId: 0,
          description: `📋 ${template.name}`,
          protein: template.macros.protein,
          calories: template.macros.calories,
          carbs: template.macros.carbs,
          fat: template.macros.fat,
        },
        grams: 0,
        calculated: {
          fdcId: 0,
          description: template.name,
          protein: template.macros.protein,
          calories: template.macros.calories,
          carbs: template.macros.carbs,
          fat: template.macros.fat,
        },
      },
    ]);
  }

  deleteTemplate(index: number) {
    this.mealTemplates.update((t) => t.filter((_, i) => i !== index));
    this.saveTemplates();
  }

  saveTemplates() {
    this.api.saveMealTemplates(this.mealTemplates()).subscribe();
  }

  calculateMealMacros() {
    if (!this.mealDescription.trim()) return;
    this.calculatingMeal.set(true);
    this.mealMacros.set(null);

    this.api.calculateMealMacros(this.mealDescription).subscribe({
      next: (macros: any) => {
        this.mealMacros.set(macros);
        this.calculatingMeal.set(false);
      },
      error: () => {
        this.calculatingMeal.set(false);
      },
    });
  }

  saveAsTemplate() {
    if (!this.newTemplateName.trim() || !this.mealMacros()) return;
    this.savingTemplate.set(true);
    const template = {
      id: Date.now().toString(),
      name: this.newTemplateName,
      description: this.mealDescription,
      macros: {
        protein: this.mealMacros().protein,
        calories: this.mealMacros().calories,
        carbs: this.mealMacros().carbs,
        fat: this.mealMacros().fat,
      },
      breakdown: this.mealMacros().breakdown || [],
    };
    this.mealTemplates.update((t) => [...t, template]);
    this.api.saveMealTemplates(this.mealTemplates()).subscribe({
      next: () => {
        this.savingTemplate.set(false);
        this.newTemplateName = "";
        this.mealDescription = "";
        this.mealMacros.set(null);
        this.showMealDescriber.set(false);
      },
      error: () => this.savingTemplate.set(false),
    });
  }

  addMealToLog() {
    const macros = this.mealMacros();
    if (!macros) return;
    this.nutrition.protein = Math.round(
      this.nutrition.protein + macros.protein,
    );
    this.nutrition.calories = Math.round(
      this.nutrition.calories + macros.calories,
    );
    this.foodEntries.update((entries) => [
      ...entries,
      {
        food: {
          fdcId: 0,
          description: `🍽 ${this.mealDescription.substring(0, 40)}`,
          protein: macros.protein,
          calories: macros.calories,
          carbs: macros.carbs,
          fat: macros.fat,
        },
        grams: 0,
        calculated: {
          fdcId: 0,
          description: this.mealDescription,
          protein: macros.protein,
          calories: macros.calories,
          carbs: macros.carbs,
          fat: macros.fat,
        },
      },
    ]);
    this.showMealDescriber.set(false);
    this.mealDescription = "";
    this.mealMacros.set(null);
  }

  saveWorkout() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || "";
    const exercisesJson = JSON.stringify(
      this.exercises()
        .filter((e) => e.name && e.sets.some((s) => s.reps && s.weight))
        .map((e) => ({
          name: e.name,
          weightType: e.weightType,
          sets: e.sets
            .filter((s) => s.reps && s.weight)
            .map((s, i) => ({
              setNumber: i + 1,
              reps: s.reps,
              weight: s.weight,
              unit: "lbs",
              weightType: e.weightType,
            })),
        })),
    );
    const log: DailyLog = {
      userId,
      date: this.logDate,
      dayNumber: this.getDayNumber(),
      workout: {
        session: this.workout.session,
        exercises: exercisesJson,
        notes: this.workout.notes,
      },
    };
    this.api.saveLog(log).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMsg.set("✓ Workout saved!");
        this.loadLogs();
        setTimeout(() => this.savedMsg.set(""), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.savedMsg.set("Failed to save. Try again.");
      },
    });
  }

  saveNutrition() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || "";
    this.api.getLogByDate(this.logDate).subscribe({
      next: () => {
        const log: any = {
          userId,
          date: this.logDate,
          dayNumber: this.getDayNumber(),
          protein: String(this.nutrition.protein),
          calories: String(this.nutrition.calories),
          water: String(this.nutrition.water),
          sleep: String(this.nutrition.sleep),
        };
        this.api.updateLog(this.logDate, log).subscribe({
          next: () => {
            this.saving.set(false);
            this.savedMsg.set("✓ Nutrition saved!");
            setTimeout(() => this.savedMsg.set(""), 3000);
          },
          error: () => {
            this.saving.set(false);
          },
        });
      },
      error: () => {
        const log: DailyLog = {
          userId,
          date: this.logDate,
          dayNumber: this.getDayNumber(),
          nutrition: this.nutrition,
        };
        this.api.saveLog(log).subscribe({
          next: () => {
            this.saving.set(false);
            this.savedMsg.set("✓ Nutrition saved!");
            setTimeout(() => this.savedMsg.set(""), 3000);
          },
          error: () => {
            this.saving.set(false);
          },
        });
      },
    });
  }

  loadLogByDate() {
    this.api.getLogByDate(this.selectedDate).subscribe({
      next: (log: any) => {
        this.selectedLog.set(log);
        if (log.exercises && log.exercises.trim() !== " ") {
          try {
            const parsed = JSON.parse(log.exercises);
            this.selectedLogExercises.set(
              parsed.map((ex: any) => ({
                name: ex.name,
                expanded: true,
                weightType: ex.weightType || "total",
                showCalc: false,
                barWeight: 45,
                plateEachSide: 0,
                sets: ex.sets.map((s: any) => ({
                  reps: String(s.reps),
                  weight: String(s.weight),
                  done: false,
                })),
              })),
            );
          } catch {
            this.selectedLogExercises.set([]);
          }
        } else {
          this.selectedLogExercises.set([]);
        }
      },
      error: () => {
        this.selectedLog.set(null);
        this.selectedLogExercises.set([]);
      },
    });
  }

  editLog(log: any) {
    this.selectedDate = log.date;
    this.selectedLog.set({ ...log });
    if (log.exercises && log.exercises.trim() !== " ") {
      try {
        const parsed = JSON.parse(log.exercises);
        this.selectedLogExercises.set(
          parsed.map((ex: any) => ({
            name: ex.name,
            expanded: true,
            weightType: ex.weightType || "total",
            showCalc: false,
            barWeight: 45,
            plateEachSide: 0,
            sets: ex.sets.map((s: any) => ({
              reps: String(s.reps),
              weight: String(s.weight),
              done: false,
            })),
          })),
        );
      } catch {
        this.selectedLogExercises.set([]);
      }
    }
    window.scrollTo(0, 0);
  }

  updateLog() {
    const userId = this.auth.currentUser()?.userId || "";
    this.saving.set(true);
    const exercisesJson = JSON.stringify(
      this.selectedLogExercises().map((ex) => ({
        name: ex.name,
        weightType: ex.weightType,
        sets: ex.sets.map((s, i) => ({
          setNumber: i + 1,
          reps: s.reps,
          weight: s.weight,
          unit: "lbs",
        })),
      })),
    );
    const log: any = {
      userId,
      date: this.selectedDate,
      dayNumber: this.getDayNumber(),
      session: this.selectedLog()?.session || "",
      exercises: exercisesJson,
      notes: this.selectedLog()?.notes || "",
      protein: String(this.selectedLog()?.protein || ""),
      calories: String(this.selectedLog()?.calories || ""),
      water: String(this.selectedLog()?.water || ""),
      sleep: String(this.selectedLog()?.sleep || ""),
    };
    this.api.updateLog(this.selectedDate, log).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMsg.set("✓ Log updated!");
        this.loadLogs();
        setTimeout(() => this.savedMsg.set(""), 3000);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  getDayNumber(): number {
    const start =
      localStorage.getItem("startDate") ||
      new Date().toISOString().split("T")[0];
    const today = new Date(this.logDate + "T00:00:00");
    const startDate = new Date(start + "T00:00:00");
    const diff = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return 0;
    return Math.min(diff + 1, 100);
  }

  onDateChange() {
    const date = new Date(this.logDate + "T00:00:00");
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[date.getDay()];
    const sessionMap: Record<string, string> = {
      Monday: "Push A — Chest/Shoulders/Triceps",
      Tuesday: "Pull A — Back/Biceps",
      Wednesday: "Legs",
      Thursday: "Push B — Shoulders/Upper Chest",
      Friday: "Pull B — Back/Traps/Biceps",
      Saturday: "Active Recovery",
      Sunday: "Rest Day",
    };
    this.api.getLogByDate(this.logDate).subscribe({
      next: (log: any) => {
        this.workout.session = log.session || sessionMap[dayName] || "";
        this.workout.notes = log.notes?.trim() || "";
        if (
          log.exercises &&
          log.exercises.trim() &&
          log.exercises.trim() !== " "
        ) {
          try {
            const parsed = JSON.parse(log.exercises);
            this.exercises.set(
              parsed.map((ex: any, i: number) => ({
                name: ex.name,
                expanded: i === 0,
                weightType: ex.weightType || "total",
                showCalc: false,
                barWeight: 45,
                plateEachSide: 0,
                sets: ex.sets.map((s: any) => ({
                  reps: String(s.reps),
                  weight: String(s.weight),
                  done: false,
                })),
              })),
            );
            this.todayExerciseList.set(parsed.map((ex: any) => ex.name));
          } catch {
            this.loadDefaultExercises(dayName, sessionMap);
          }
        } else {
          this.loadDefaultExercises(dayName, sessionMap);
        }
        if (log.protein && log.protein.trim() !== " ") {
          this.nutrition.protein = parseFloat(log.protein) || 0;
          this.nutrition.calories = parseFloat(log.calories) || 0;
          this.nutrition.water = parseFloat(log.water) || 0;
          this.nutrition.sleep = parseFloat(log.sleep) || 0;
        } else {
          this.nutrition = { protein: 0, calories: 0, water: 0, sleep: 0 };
        }
      },
      error: () => {
        this.loadDefaultExercises(dayName, sessionMap);
        this.nutrition = { protein: 0, calories: 0, water: 0, sleep: 0 };
      },
    });
  }

  onFoodAdded(entry: FoodEntry) {
    this.foodEntries.update((entries) => [...entries, entry]);
    const totals = this.foodEntries().reduce(
      (acc, e) => ({
        protein: acc.protein + e.calculated.protein,
        calories: acc.calories + e.calculated.calories,
      }),
      { protein: 0, calories: 0 },
    );
    this.nutrition.protein = Math.round(totals.protein);
    this.nutrition.calories = Math.round(totals.calories);
  }

  removeFoodEntry(index: number) {
    this.foodEntries.update((entries) => entries.filter((_, i) => i !== index));
    const totals = this.foodEntries().reduce(
      (acc, e) => ({
        protein: acc.protein + e.calculated.protein,
        calories: acc.calories + e.calculated.calories,
      }),
      { protein: 0, calories: 0 },
    );
    this.nutrition.protein = Math.round(totals.protein);
    this.nutrition.calories = Math.round(totals.calories);
  }
}
