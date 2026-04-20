import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, DailyLog, WorkoutLog, NutritionLog } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExerciseService, Exercise } from '../../../core/services/exercise.service';
import { ExercisePickerComponent } from '../exercises/exercise-picker.component';
import { ExerciseDetailComponent } from '../exercises/exercise-detail.component';
import { FoodSearchComponent, FoodEntry } from '../nutrition/food-search.component';

interface SetRow { reps: string; weight: string; }
interface ExerciseRow { name: string; sets: SetRow[]; }

const workoutExercises: Record<string, string[]> = {
  'Monday':    ['Flat Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Chest Fly', 'Seated DB Shoulder Press', 'Lateral Raises', 'Tricep Rope Pushdown', 'Overhead Tricep Extension'],
  'Tuesday':   ['Pull-ups', 'Wide Grip Lat Pulldown', 'Seated Cable Row', 'Single Arm DB Row', 'Straight Arm Cable Pulldown', 'Barbell Curl', 'Hammer Curl'],
  'Wednesday': ['Barbell Back Squat', 'Romanian Deadlift', 'Leg Press', 'Walking Lunges', 'Leg Curl Machine', 'Leg Extension Machine', 'Standing Calf Raises'],
  'Thursday':  ['Overhead Barbell Press', 'Incline Barbell Bench Press', 'Dumbbell Lateral Raises', 'Cable Front Raise', 'Dumbbell Rear Delt Fly', 'Face Pulls', 'Tricep Dips'],
  'Friday':    ['Deadlift', 'Barbell Row', 'Cable Pullover', 'Chest Supported DB Row', 'Barbell Shrugs', 'Incline Dumbbell Curl', 'Cable Curl'],
  'Saturday':  [],
  'Sunday':    []
};

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [CommonModule, FormsModule, ExercisePickerComponent, ExerciseDetailComponent, FoodSearchComponent],
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit {
  activeTab = signal<'workout' | 'nutrition' | 'history'>('workout');
  saving = signal(false);
  savedMsg = signal('');
  pastLogs = signal<DailyLog[]>([]);
  exercises = signal<ExerciseRow[]>([]);
  todayExerciseList = signal<string[]>([]);

  workout = { session: 'Push A — Chest/Shoulders/Triceps', notes: '' };
  nutrition: NutritionLog = { protein: 0, calories: 0, water: 0, sleep: 0 };

  today = new Date().toISOString().split('T')[0];
  logDate = this.today;
  selectedDate = this.today;
  selectedLog = signal<any>(null);

  showPicker = signal(false);
  activeExerciseIndex = signal(-1);
  selectedExerciseDetail = signal<Exercise | null>(null);
  customExercises = signal<Set<number>>(new Set());
  selectedLogExercises = signal<ExerciseRow[]>([]);
  showFoodSearch = signal(false);
  foodEntries = signal<FoodEntry[]>([]);

  constructor(private api: ApiService, private auth: AuthService, private exerciseService: ExerciseService) { }

  ngOnInit() { this.loadLogs(); this.onDateChange(); }

  onFoodAdded(entry: FoodEntry) {
    this.foodEntries.update(entries => [...entries, entry]);
    const totals = this.foodEntries().reduce((acc, e) => ({
      protein: acc.protein + e.calculated.protein,
      calories: acc.calories + e.calculated.calories,
      carbs: acc.carbs + (e.calculated.carbs || 0),
      fat: acc.fat + (e.calculated.fat || 0)
    }), { protein: 0, calories: 0, carbs: 0, fat: 0 });
    this.nutrition.protein = Math.round(totals.protein);
    this.nutrition.calories = Math.round(totals.calories);
  }

  removeFoodEntry(index: number) {
    this.foodEntries.update(entries => entries.filter((_, i) => i !== index));
    const totals = this.foodEntries().reduce((acc, e) => ({
      protein: acc.protein + e.calculated.protein,
      calories: acc.calories + e.calculated.calories
    }), { protein: 0, calories: 0 });
    this.nutrition.protein = Math.round(totals.protein);
    this.nutrition.calories = Math.round(totals.calories);
  }

  loadDefaultExercises(dayName: string, sessionMap: Record<string, string>) {
    this.workout.session = sessionMap[dayName] || 'Push A — Chest/Shoulders/Triceps';
    const todayExercises = workoutExercises[dayName] || [];
    this.todayExerciseList.set(todayExercises);
    if (todayExercises.length > 0) {
      this.exercises.set(todayExercises.map(name => ({
        name,
        sets: [
          { reps: '', weight: '' },
          { reps: '', weight: '' },
          { reps: '', weight: '' },
          { reps: '', weight: '' }
        ]
      })));
    } else {
      this.exercises.set([{ name: '', sets: [{ reps: '', weight: '' }] }]);
    }
  }

  addRow() {
    this.exercises.update(rows => [...rows, {
      name: '',
      sets: [{ reps: '', weight: '' }]
    }]);
  }

  addSet(exIndex: number) {
    this.exercises.update(rows => {
      const updated = [...rows];
      updated[exIndex] = { ...updated[exIndex], sets: [...updated[exIndex].sets, { reps: '', weight: '' }] };
      return updated;
    });
  }

  removeSet(exIndex: number, setIndex: number) {
    this.exercises.update(rows => {
      const updated = [...rows];
      if (updated[exIndex].sets.length > 1) {
        updated[exIndex] = { ...updated[exIndex], sets: updated[exIndex].sets.filter((_, i) => i !== setIndex) };
      }
      return updated;
    });
  }

  onExerciseChange(ex: ExerciseRow, index: number) {
    if (ex.name === 'other') {
      ex.name = '';
      this.activeExerciseIndex.set(index);
      this.showPicker.set(true);
    }
  }

  loadLogs() {
    this.api.getLogs().subscribe({ next: logs => this.pastLogs.set(logs), error: () => { } });
  }

  saveWorkout() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || '';

    const exercisesJson = JSON.stringify(
      this.exercises().filter(e => e.name && e.sets.some(s => s.reps && s.weight)).map(e => ({
        name: e.name,
        sets: e.sets.filter(s => s.reps && s.weight).map((s, i) => ({
          setNumber: i + 1,
          reps: s.reps,
          weight: s.weight,
          unit: 'lbs'
        }))
      }))
    );

    const log: DailyLog = {
      userId,
      date: this.logDate,
      dayNumber: this.getDayNumber(),
      workout: {
        session: this.workout.session,
        exercises: exercisesJson,
        notes: this.workout.notes
      }
    };
    this.api.saveLog(log).subscribe({
      next: () => { this.saving.set(false); this.savedMsg.set('✓ Workout saved!'); this.loadLogs(); setTimeout(() => this.savedMsg.set(''), 3000); },
      error: () => { this.saving.set(false); this.savedMsg.set('Failed to save. Try again.'); }
    });
  }

  saveNutrition() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || '';

    this.api.getLogByDate(this.logDate).subscribe({
      next: () => {
        const log: any = {
          userId,
          date: this.logDate,
          dayNumber: this.getDayNumber(),
          protein: String(this.nutrition.protein),
          calories: String(this.nutrition.calories),
          water: String(this.nutrition.water),
          sleep: String(this.nutrition.sleep)
        };
        this.api.updateLog(this.logDate, log).subscribe({
          next: () => { this.saving.set(false); this.savedMsg.set('✓ Nutrition saved!'); setTimeout(() => this.savedMsg.set(''), 3000); },
          error: () => { this.saving.set(false); }
        });
      },
      error: () => {
        const log: DailyLog = {
          userId,
          date: this.logDate,
          dayNumber: this.getDayNumber(),
          nutrition: this.nutrition
        };
        this.api.saveLog(log).subscribe({
          next: () => { this.saving.set(false); this.savedMsg.set('✓ Nutrition saved!'); setTimeout(() => this.savedMsg.set(''), 3000); },
          error: () => { this.saving.set(false); }
        });
      }
    });
  }

  loadLogByDate() {
    this.api.getLogByDate(this.selectedDate).subscribe({
      next: (log) => this.selectedLog.set(log),
      error: () => this.selectedLog.set(null)
    });
  }

  editLog(log: DailyLog) {
    this.selectedDate = log.date;
    this.selectedLog.set({...log.workout, ...log.nutrition, notes: log.workout?.notes || ''});
    window.scrollTo(0, 0);
  }

  updateLog() {
    const userId = this.auth.currentUser()?.userId || '';
    this.saving.set(true);
    const log: DailyLog = {
      userId,
      date: this.selectedDate,
      dayNumber: this.getDayNumber(),
      workout: {
        session: this.selectedLog()?.session || '',
        exercises: '[]',
        notes: this.selectedLog()?.notes || ''
      },
      nutrition: {
        protein: this.selectedLog()?.protein || 0,
        calories: this.selectedLog()?.calories || 0,
        water: this.selectedLog()?.water || 0,
        sleep: this.selectedLog()?.sleep || 0
      }
    };
    this.api.saveLog(log).subscribe({
      next: () => { this.saving.set(false); this.savedMsg.set('✓ Log updated!'); this.loadLogs(); setTimeout(() => this.savedMsg.set(''), 3000); },
      error: () => { this.saving.set(false); }
    });
  }

  getDayNumber(): number {
    const start = localStorage.getItem('startDate') || new Date().toISOString().split('T')[0];
    const today = new Date(this.logDate + 'T00:00:00');
    const startDate = new Date(start + 'T00:00:00');
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 0;
    return Math.min(diff + 1, 100);
  }

  onExerciseSelected(ex: Exercise) {
    const index = this.activeExerciseIndex();
    if (index >= 0) {
      this.exercises.update(rows => {
        const updated = [...rows];
        updated[index] = { ...updated[index], name: ex.name };
        return updated;
      });
      this.customExercises.update(set => new Set([...set, index]));
    }
    this.showPicker.set(false);
  }

  removeExercise(index: number) {
    this.exercises.update(rows => rows.filter((_, i) => i !== index));
  }

  removeCustomExercise(index: number) {
    this.customExercises.update(set => {
      const next = new Set(set);
      next.delete(index);
      return next;
    });
  }

  searchAndShowDetail(name: string) {
    if (!name) return;
    this.exerciseService.search(name, 1).subscribe({
      next: (exercises) => {
        if (exercises.length > 0) this.selectedExerciseDetail.set(exercises[0]);
      }
    });
  }

  onDateChange() {
    const date = new Date(this.logDate + 'T00:00:00');
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayName = days[date.getDay()];

    const sessionMap: Record<string, string> = {
      'Monday': 'Push A — Chest/Shoulders/Triceps',
      'Tuesday': 'Pull A — Back/Biceps',
      'Wednesday': 'Legs',
      'Thursday': 'Push B — Shoulders/Upper Chest',
      'Friday': 'Pull B — Back/Traps/Biceps',
      'Saturday': 'Active Recovery',
      'Sunday': 'Rest Day'
    };

    this.api.getLogByDate(this.logDate).subscribe({
      next: (log: any) => {
        this.workout.session = log.session || sessionMap[dayName] || '';
        this.workout.notes = log.notes?.trim() || '';

        if (log.exercises && log.exercises.trim()) {
          try {
            const parsed = JSON.parse(log.exercises);
            this.exercises.set(parsed.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets.map((s: any) => ({
                reps: String(s.reps),
                weight: String(s.weight)
              }))
            })));
            this.todayExerciseList.set(parsed.map((ex: any) => ex.name));
          } catch {
            this.loadDefaultExercises(dayName, sessionMap);
          }
        } else {
          this.loadDefaultExercises(dayName, sessionMap);
        }

        // Load nutrition
        if (log.protein && log.protein.trim() !== '') {
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
      }
    });
  }
}
