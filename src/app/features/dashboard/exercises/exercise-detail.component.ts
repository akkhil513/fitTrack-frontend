import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExerciseService, Exercise } from '../../../core/services/exercise.service';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.css']
})
export class ExerciseDetailComponent {
  @Input() exercise!: Exercise;
  @Output() close = new EventEmitter<void>();
  @Output() selectAlternative = new EventEmitter<Exercise>();

  alternatives = signal<Exercise[]>([]);
  loadingAlts = signal(false);
  showAlts = signal(false);

  constructor(public exerciseService: ExerciseService) {}

  loadAlternatives() {
    this.showAlts.set(true);
    this.loadingAlts.set(true);
    this.exerciseService.getAlternatives(this.exercise.target, 5).subscribe({
      next: (exercises) => {
        // Exclude current exercise from alternatives
        this.alternatives.set(exercises.filter(e => e.id !== this.exercise.id));
        this.loadingAlts.set(false);
      },
      error: () => this.loadingAlts.set(false)
    });
  }

  pickAlternative(ex: Exercise) {
    this.selectAlternative.emit(ex);
    this.close.emit();
  }
}
