import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "./auth.service";

export interface OnboardingAnswers {
  age: number;
  gender: string;
  height: string;
  weight: number;
  physique: string;
  fatStorage: string[];
  primaryGoal: string;
  laggingMuscles: string[];
  trainingLevel: string;
  gymAccess: string;
  daysPerWeek: number;
  sessionDuration: string;
  sleepHours: string;
  dietType: string;
  foodPreference: string;
  appetite: string;
  supplements: string[];
  injuries: string[];
  visualGoals: string[];
  bulkApproach: string;
  coachingStyle: string;
  trackingPreference: string;
  preferredTrainTime: string;
  stressLevel: string;
  usesProteinPowder: boolean;
  proteinPowderType: string;
  needsProteinRestock: boolean;
  wantsProteinRecommendation: boolean;
}

export interface FitPlan {
  planId: string;
  userId: string;
  createdAt: string;
  strategy: any;
  training: any;
  nutrition: any;
  supplements: any;
  recovery: any;
}

export interface DailyLog {
  logId?: string;
  userId: string;
  date: string;
  dayNumber: number;
  session?: string;
  exercises?: string;
  protein?: string;
  calories?: string;
  water?: string;
  sleep?: string;
  notes?: string;
  checklist?: Record<string, boolean>;
  workout?: WorkoutLog;
  nutrition?: NutritionLog;
  measurements?: MeasurementLog;
}

export interface WorkoutLog {
  session: string;
  exercises: string;
  notes: string;
}

export interface NutritionLog {
  protein: number;
  calories: number;
  water: number;
  sleep: number;
}

export interface MeasurementLog {
  weight?: number;
  waist?: number;
  chest?: number;
  shoulders?: number;
  armL?: number;
  armR?: number;
}

@Injectable({ providedIn: "root" })
export class ApiService {
  private base = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) { }

  // ── PLAN ──
  generatePlan(payload: any): Observable<any> {
    return this.http.post(`${this.base}/plans/generate`, payload);
  }

  getPlan(): Observable<FitPlan> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.get<FitPlan>(`${this.base}/plans/${userId}`);
  }

  // ── LOGS ──
  saveLog(log: DailyLog): Observable<DailyLog> {
    return this.http.post<DailyLog>(`${this.base}/logs/createLog`, log);
  }

  getLogs(): Observable<DailyLog[]> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.get<DailyLog[]>(`${this.base}/logs/${userId}`);
  }

  getLogByDate(date: string): Observable<DailyLog> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.get<DailyLog>(`${this.base}/logs/${userId}/${date}`);
  }

  updateLog(date: string, log: any): Observable<any> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.put(`${this.base}/logs/update/${userId}/${date}`, log);
  }

  createUser(data: any): Observable<any> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.post(`${this.base}/users/create`, { ...data, userId });
  }

  getProfile(): Observable<any> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.get(`${this.base}/users/${userId}`);
  }

  updateProfile(data: any): Observable<any> {
    const userId = this.auth.currentUser()?.userId || "";
    return this.http.put(`${this.base}/users/update/${userId}`, data);
  }

  getUser(userId: string): Observable<any> {
    return this.http.get(`${this.base}/users/${userId}`);
  }

  updateMeasurements(userId: string, measurements: string): Observable<any> {
    return this.http.put(`${this.base}/measurements/${userId}`, {
      measurements,
    });
  }

  checkUsername(username: string): Observable<any> {
    return this.http.get(`${this.base}/users/check/${username}`);
  }

  saveMealTemplates(templates: any[]): Observable<any> {
    const userId = this.auth.currentUser()?.userId || '';
    return this.http.put(`${this.base}/meal-templates/${userId}`, {
      mealTemplates: JSON.stringify(templates)
    });
  }

  getMealTemplates(): Observable<any> {
    const userId = this.auth.currentUser()?.userId || '';
    return this.http.get(`${this.base}/meal-templates/${userId}`);
  }

  calculateMealMacros(description: string): Observable<any> {
    return this.http.post(`${this.base}/nutrition/calculate`, { description });
  }
  //2 egg whites and 2 whole eggs, 200 ml fairlife 2% reduce fat milk whihc has 11gm protein in it and added once scoop of whey proetein.

  updateMeasurementHistory(
    userId: string,
    measurements: string,
    history: string,
  ): Observable<any> {
    return this.http.put(`${this.base}/measurements/${userId}`, {
      measurements,
      measurementHistory: history,
    });
  }

  uploadPhoto(userId: string, base64Image: string, contentType: string): Observable<any> {
    return this.http.post(`${this.base}/users/photo/upload`, {
      userId,
      base64Image,
      contentType,
    });
  }

  private getCurrentUserId(): string {
    // Extract userId from JWT token in localStorage
    const keys = Object.keys(localStorage);
    const tokenKey = keys.find((k) => k.includes("idToken"));
    if (tokenKey) {
      const token = localStorage.getItem(tokenKey) || "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || "";
    }
    return "";
  }
}
