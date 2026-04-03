import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatsSummary } from '../models/stats.model';
import { ActivitiesResponse } from '../models/activity.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getStats(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.base}/api/stats/summary`);
  }

  getActivities(page: number): Observable<ActivitiesResponse> {
    return this.http.get<ActivitiesResponse>(`${this.base}/api/activities?take=${page}`);
  }

  sync(athleteId: number, full = false): Observable<{ syncedCount: number; mode: string }> {
    const url = full
      ? `${this.base}/api/sync/${athleteId}/full`
      : `${this.base}/api/sync/${athleteId}`;
    return this.http.post<{ syncedCount: number; mode: string }>(url, null);
  }
}

