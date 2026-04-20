import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, DailyLog } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Measurement { label: string; key: string; unit: string; value: number; prev: number; target: 'grow' | 'reduce'; }

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  dayNumber = signal(1);
  saving = signal(false);
  savedMsg = signal('');
  weightHistory = signal<DailyLog[]>([]);
  measurements = signal<Measurement[]>([
    { label: 'Weight', key: 'weight', unit: 'kg', value: 0, prev: 0, target: 'grow' },
    { label: 'Waist', key: 'waist', unit: 'cm', value: 0, prev: 0, target: 'reduce' },
    { label: 'Chest', key: 'chest', unit: 'cm', value: 0, prev: 0, target: 'grow' },
    { label: 'Shoulders', key: 'shoulders', unit: 'cm', value: 0, prev: 0, target: 'grow' },
    { label: 'Left Arm', key: 'armL', unit: 'cm', value: 0, prev: 0, target: 'grow' },
    { label: 'Right Arm', key: 'armR', unit: 'cm', value: 0, prev: 0, target: 'grow' },
  ]);

  newMeasure = { weight: 0, waist: 0, chest: 0, shoulders: 0, armL: 0, armR: 0 };

  constructor(private api: ApiService, private auth: AuthService) { }

  ngOnInit() {
    this.calcDayNumber();
    this.loadMeasurements();
  }

  calcDayNumber() {
    const start = localStorage.getItem('startDate') || new Date().toISOString().split('T')[0];
    const diff = Math.floor((new Date().getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    this.dayNumber.set(Math.min(Math.max(diff, 1), 100));
  }

  updateMeasurements(logs: DailyLog[]) {
    const withMeasure = logs.filter(l => l.measurements);
    if (withMeasure.length < 1) return;
    const latest = withMeasure[0].measurements!;
    const prev = withMeasure[1]?.measurements || {};
    this.measurements.update(ms => ms.map(m => ({ ...m, value: (latest as any)[m.key] || 0, prev: (prev as any)[m.key] || 0 })));
  }

  loadMeasurements() {
    const userId = this.auth.currentUser()?.userId || '';
    this.api.getUser(userId).subscribe({
      next: (user: any) => {
        if (user.measurements && user.measurements.trim() !== '') {
          try {
            const m = JSON.parse(user.measurements);
            this.newMeasure = { ...this.newMeasure, ...m };
            this.measurements.update(ms => ms.map(meas => ({
              ...meas,
              value: m[meas.key] || 0
            })));
          } catch {}
        }
      },
      error: () => {}
    });
  }

  saveMeasurements() {
    this.saving.set(true);
    const userId = this.auth.currentUser()?.userId || '';
    const measureJson = JSON.stringify(this.newMeasure);
    this.api.updateMeasurements(userId, measureJson).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMsg.set('✓ Measurements saved!');
        this.measurements.update(ms => ms.map(m => ({
          ...m,
          prev: m.value,
          value: (this.newMeasure as any)[m.key] || 0
        })));
        setTimeout(() => this.savedMsg.set(''), 3000);
      },
      error: () => { this.saving.set(false); }
    });
  }
}
