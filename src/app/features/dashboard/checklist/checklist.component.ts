import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, DailyLog } from '../../../core/services/api.service';

interface CheckItem {
  id: string;
  group: 'meal'|'supp'|'train'|'water'|'recovery';
  name: string;
  time: string;
  tag: string;
  tagLabel: string;
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class ChecklistComponent implements OnInit {
  checked = signal<Record<string, boolean>>({});
  todayKey = new Date().toISOString().split('T')[0];

  groups = [
    { key: 'meal', label: 'Meals', icon: '🍽' },
    { key: 'supp', label: 'Supplements', icon: '💊' },
    { key: 'train', label: 'Training', icon: '💪' },
    { key: 'water', label: 'Hydration', icon: '💧' },
    { key: 'recovery', label: 'Recovery', icon: '😴' },
  ];

  items: CheckItem[] = [
    { id: 'meal1', group: 'meal', name: 'Meal 1 — Breakfast', time: '7:00 AM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'meal2', group: 'meal', name: 'Meal 2 — Mid Morning Snack', time: '10:30 AM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'meal3', group: 'meal', name: 'Meal 3 — Lunch', time: '1:00 PM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'meal4', group: 'meal', name: 'Meal 4 — Pre Workout', time: '3:00 PM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'meal5', group: 'meal', name: 'Meal 5 — Post Workout', time: '7:00 PM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'meal6', group: 'meal', name: 'Meal 6 — Dinner', time: '9:00 PM', tag: 'meal', tagLabel: 'MEAL' },
    { id: 'supp1', group: 'supp', name: 'Whey Protein (Pre-workout)', time: '3:00 PM', tag: 'supp', tagLabel: 'SUPP' },
    { id: 'supp2', group: 'supp', name: 'Whey Protein (Post-workout)', time: '7:00 PM', tag: 'supp', tagLabel: 'SUPP' },
    { id: 'supp3', group: 'supp', name: 'Creatine 5g', time: '3:00 PM', tag: 'supp', tagLabel: 'SUPP' },
    { id: 'supp4', group: 'supp', name: 'Vitamin D3', time: 'With any meal', tag: 'supp', tagLabel: 'SUPP' },
    { id: 'train1', group: 'train', name: 'Gym Session', time: '4:00 PM', tag: 'train', tagLabel: 'TRAIN' },
    { id: 'train2', group: 'train', name: '20 Min Incline Walk', time: 'After gym', tag: 'train', tagLabel: 'TRAIN' },
    { id: 'train3', group: 'train', name: 'Post-workout Stretch', time: 'After gym', tag: 'train', tagLabel: 'TRAIN' },
    { id: 'water1', group: 'water', name: '4 Litres Water Today', time: 'Throughout day', tag: 'water', tagLabel: 'WATER' },
    { id: 'core1', group: 'recovery', name: 'Core & Posture Routine (5 min)', time: 'Any time', tag: 'train', tagLabel: 'CORE' },
    { id: 'sleep1', group: 'recovery', name: 'Sleep by 10:30 PM', time: '10:30 PM', tag: 'sleep', tagLabel: 'SLEEP' },
  ];

  motivations = [
    'Every rep today is a vote for who you want to become.',
    'The belly doesn\'t vanish overnight. But it vanishes with days like today.',
    'Lateral raises. Never skip them. Shoulders win in shirts.',
    'Sleep. Eat. Train. Repeat. 100 days. No excuses.',
    'Protein first. Always. 160g today or it doesn\'t count.',
    'The T-shirt is waiting. Fill it out.',
    'Progressive overload. Same weight = same body. Add the plates.',
    'Consistency over intensity. Show up today.'
  ];

  motivation = signal('');

  doneCount = computed(() => Object.values(this.checked()).filter(Boolean).length);
  scorePct = computed(() => Math.round((this.doneCount() / this.items.length) * 100));
  scoreMessage = computed(() => {
    const pct = this.scorePct();
    if (pct === 100) return '🔥 PERFECT DAY — 100% complete!';
    if (pct >= 75) return 'Almost there — finish strong!';
    if (pct >= 50) return 'Solid progress — more than halfway!';
    if (pct > 0) return 'Good start — keep going!';
    return 'Complete all tasks to hit 100% today.';
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.motivation.set(this.motivations[Math.floor(Math.random() * this.motivations.length)]);
    const saved = localStorage.getItem('checked_' + this.todayKey);
    if (saved) this.checked.set(JSON.parse(saved));
  }

  getGroupItems(group: string): CheckItem[] {
    return this.items.filter(i => i.group === group);
  }

  toggle(id: string) {
    const current = { ...this.checked() };
    current[id] = !current[id];
    this.checked.set(current);
    localStorage.setItem('checked_' + this.todayKey, JSON.stringify(current));
    // Sync to backend
    this.api.saveLog({
      userId: '',
      date: this.todayKey,
      dayNumber: 0,
      checklist: current
    }).subscribe({ error: () => {} });
  }
}
