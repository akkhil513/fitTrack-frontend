import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExerciseService, Exercise } from '../../../core/services/exercise.service';
import { ExerciseDetailComponent } from './exercise-detail.component';

@Component({
  selector: 'app-exercise-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, ExerciseDetailComponent],
  templateUrl: './exercise-picker.component.html',
  styleUrls: ['./exercise-picker.component.css']
})
export class ExercisePickerComponent {
  @Output() selectExercise = new EventEmitter<Exercise>();
  @Output() close = new EventEmitter<void>();

  searchQuery = '';
  results = signal<Exercise[]>([]);
  loading = signal(false);
  selectedExercise = signal<Exercise | null>(null);

  bodyParts = ['chest', 'back', 'shoulders', 'upper arms', 'lower arms', 'upper legs', 'lower legs', 'waist'];
  selectedBodyPart = signal('');

  constructor(public exerciseService: ExerciseService) {}

  search() {
    if (!this.searchQuery.trim()) return;
    this.loading.set(true);
    this.selectedBodyPart.set('');
    this.exerciseService.search(this.searchQuery, 15).subscribe({
      next: (exercises) => { this.results.set(exercises); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterByBodyPart(part: string) {
    this.selectedBodyPart.set(part);
    this.searchQuery = '';
    this.loading.set(true);
    this.exerciseService.getByBodyPart(part, 20).subscribe({
      next: (exercises) => { this.results.set(exercises); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  viewDetail(ex: Exercise) {
    this.selectedExercise.set(ex);
  }

  pick(ex: Exercise) {
    this.selectExercise.emit(ex);
    this.close.emit();
  }
}
