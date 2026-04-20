import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService, FoodItem } from '../../../core/services/nutrition.service';

export interface FoodEntry {
  food: FoodItem;
  grams: number;
  calculated: FoodItem;
}

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-search.component.html',
  styleUrls: ['./food-search.component.css']
})
export class FoodSearchComponent {
  @Output() addFood = new EventEmitter<FoodEntry>();
  @Output() close = new EventEmitter<void>();

  searchQuery = '';
  results = signal<FoodItem[]>([]);
  loading = signal(false);
  selectedFood = signal<FoodItem | null>(null);
  grams = 100;

  constructor(private nutritionService: NutritionService) {}

  search() {
    if (!this.searchQuery.trim()) return;
    this.loading.set(true);
    this.nutritionService.searchFood(this.searchQuery).subscribe({
      next: (foods) => { this.results.set(foods); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  selectFood(food: FoodItem) {
    this.selectedFood.set(food);
    this.grams = 100;
  }

  calculated(): FoodItem | null {
    const food = this.selectedFood();
    if (!food) return null;
    return this.nutritionService.calculate(food, this.grams);
  }

  getPresets(): {label: string, grams: number}[] {
    const name = this.selectedFood()?.description.toLowerCase() || '';

    if (name.includes('egg')) return [
      { label: '1 egg', grams: 50 },
      { label: '2 eggs', grams: 100 },
      { label: '3 eggs', grams: 150 },
      { label: '4 eggs', grams: 200 }
    ];
    if (name.includes('rice')) return [
      { label: '½ cup', grams: 93 },
      { label: '1 cup', grams: 186 },
      { label: '1.5 cups', grams: 279 }
    ];
    if (name.includes('chicken')) return [
      { label: '100g', grams: 100 },
      { label: '150g', grams: 150 },
      { label: '200g', grams: 200 },
      { label: '250g', grams: 250 }
    ];
    if (name.includes('oat')) return [
      { label: '½ cup dry', grams: 40 },
      { label: '1 cup dry', grams: 80 }
    ];
    if (name.includes('milk')) return [
      { label: '1 cup', grams: 244 },
      { label: '2 cups', grams: 488 }
    ];

    return [
      { label: '50g', grams: 50 },
      { label: '100g', grams: 100 },
      { label: '150g', grams: 150 },
      { label: '200g', grams: 200 }
    ];
  }

  addToLog() {
    const food = this.selectedFood();
    const calc = this.calculated();
    if (!food || !calc) return;
    this.addFood.emit({ food, grams: this.grams, calculated: calc });
    this.selectedFood.set(null);
    this.searchQuery = '';
    this.results.set([]);
  }
}
