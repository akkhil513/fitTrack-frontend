import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private base = 'https://exercisedb.p.rapidapi.com';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      'x-rapidapi-key': environment.exerciseDbKey
    });
  }

  search(name: string, limit = 10): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.base}/exercises/name/${encodeURIComponent(name)}?limit=${limit}`,
      { headers: this.getHeaders(), withCredentials: false }
    );
  }

  getByBodyPart(bodyPart: string, limit = 20): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.base}/exercises/bodyPart/${bodyPart}?limit=${limit}`,
      { headers: this.getHeaders(), withCredentials: false }
    );
  }

  getAlternatives(target: string, limit = 5): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.base}/exercises/target/${target}?limit=${limit}`,
      { headers: this.getHeaders(), withCredentials: false }
    );
  }

  getBodyParts(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.base}/exercises/bodyPartList`,
      { headers: this.getHeaders(), withCredentials: false }
    );
  }

  getImageUrl(exerciseId: string): string {
    return `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=360&rapidapi-key=${environment.exerciseDbKey}`;
  }
}
