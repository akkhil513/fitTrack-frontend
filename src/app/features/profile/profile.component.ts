import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  savedMsg = signal('');
  activeSection = signal<'info' | 'plan' | 'measurements'>('info');

  // User info
  user = signal<any>(null);
  editName = '';
  editStartDate = '';
  today = new Date().toISOString().split('T')[0];

  // Plan
  plan = signal<any>(null);
  trainingSchedule = signal<any>(null);
  showFullPlan = signal(false);

  // Measurements
  measurements = signal<any>(null);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadPlan();
  }

  loadProfile() {
    const userId = this.auth.currentUser()?.userId || '';
    this.api.getUser(userId).subscribe({
      next: (user: any) => {
        this.user.set(user);
        this.editName = `${user.firstName} ${user.lastName}`.trim();
        this.editStartDate = user.startDate || '';
        if (user.startDate) {
          localStorage.setItem('startDate', user.startDate);
        }
        if (user.measurements && user.measurements.trim() !== '') {
          try { this.measurements.set(JSON.parse(user.measurements)); } catch {}
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPlan() {
    this.api.getPlan().subscribe({
      next: (plan: any) => {
        const clean = (val: string) => {
          if (!val) return '';
          return val.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        };

        // Parse training as JSON object
        let trainingSchedule = null;
        try {
          let training = plan.training;
          if (typeof training === 'string') {
            training = training.replace(/^"|"$/g, '');
            trainingSchedule = JSON.parse(training);
          }
        } catch {}

        this.trainingSchedule.set(trainingSchedule);
        this.plan.set({
          strategy: clean(plan.strategy),
          nutrition: clean(plan.nutrition),
          supplements: clean(plan.supplements),
          recovery: clean(plan.recovery),
          createdAt: plan.createdAt
        });
      },
      error: () => {}
    });
  }

  saveProfile() {
    this.saving.set(true);
    const parts = this.editName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    if (this.editStartDate) {
      localStorage.setItem('startDate', this.editStartDate);
    }

    this.api.updateProfile({ firstName, lastName, startDate: this.editStartDate }).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMsg.set('✓ Profile updated!');
        this.loadProfile();
        setTimeout(() => this.savedMsg.set(''), 3000);
      },
      error: () => { this.saving.set(false); }
    });
  }

  regeneratePlan() {
    this.router.navigate(['/onboarding']);
  }

  getDayNumber(): number {
    const start = localStorage.getItem('startDate') || this.editStartDate || new Date().toISOString().split('T')[0];
    const diff = Math.floor((new Date().getTime() - new Date(start + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diff, 1), 100);
  }

  getDaysRemaining(): number {
    return Math.max(100 - this.getDayNumber() + 1, 0);
  }
}
