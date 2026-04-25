import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../../core/services/api.service";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}
interface DaySchedule {
  day: string;
  session: string;
  muscles: string;
  badge: string;
  exercises: Exercise[];
}

@Component({
  selector: "app-schedule",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./schedule.component.html",
  styleUrls: ["./schedule.component.css"],
})
export class ScheduleComponent implements OnInit {
  selectedDay = signal<DaySchedule | null>(null);
  schedule = signal<DaySchedule[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit() {
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
          const badgeMap: Record<string, string> = {
            Monday: "badge-push",
            Tuesday: "badge-pull",
            Wednesday: "badge-legs",
            Thursday: "badge-push",
            Friday: "badge-pull",
            Saturday: "badge-rest",
            Sunday: "badge-rest",
          };

          const scheduleData: DaySchedule[] = days.map((day) => {
            const dayData = training[day] || {};
            const exercises = (dayData.exercises || []).map((ex: any) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
            }));

            const session = dayData.session || day;
            const muscles = this.getMuscles(session, exercises);

            return {
              day,
              session,
              muscles,
              badge: badgeMap[day] || "badge-rest",
              exercises,
            };
          });

          this.schedule.set(scheduleData);

          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          const today = dayNames[new Date().getDay()];
          const todaySchedule = scheduleData.find((s) => s.day === today);
          if (todaySchedule) this.selectedDay.set(todaySchedule);
        } catch (e) {
          console.error("Failed to parse training plan:", e);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getMuscles(session: string, exercises: Exercise[]): string {
    if (exercises.length > 0) {
      return exercises
        .slice(0, 3)
        .map((e) => e.name)
        .join(" · ");
    }
    return session;
  }

  isToday(day: string): boolean {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return day === days[new Date().getDay()];
  }

  selectDay(day: DaySchedule) {
    this.selectedDay.set(day);
  }
}
