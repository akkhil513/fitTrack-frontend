import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FoodItem {
  fdcId: number;
  description: string;
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
}

@Injectable({ providedIn: 'root' })
export class NutritionService {

  private base = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey = environment.usdaApiKey;

  constructor(private http: HttpClient) {}

  searchFood(query: string): Observable<FoodItem[]> {
    return this.http.get<any>(
      `${this.base}/foods/search?query=${encodeURIComponent(query)}&api_key=${this.apiKey}&pageSize=10&dataType=Foundation,SR Legacy`
    ).pipe(
      map(res => res.foods.map((f: any) => ({
        fdcId: f.fdcId,
        description: f.description,
        protein: this.getNutrient(f.foodNutrients, 1003),
        calories: this.getNutrient(f.foodNutrients, 1008),
        carbs: this.getNutrient(f.foodNutrients, 1005),
        fat: this.getNutrient(f.foodNutrients, 1004)
      })))
    );
  }

  // Extract nutrient value by nutrientId
  private getNutrient(nutrients: any[], id: number): number {
    const n = nutrients?.find((n: any) => n.nutrientId === id);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }

  // Calculate nutrition for a given gram weight
  calculate(food: FoodItem, grams: number): FoodItem {
    const ratio = grams / 100;
    return {
      ...food,
      protein: Math.round(food.protein * ratio * 10) / 10,
      calories: Math.round(food.calories * ratio),
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10
    };
  }
}
