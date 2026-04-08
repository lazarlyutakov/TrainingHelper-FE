import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatsSummary } from '../models/stats.model';
import { Activity, ActivitiesResponse, ActivityFilters } from '../models/activity.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getStats(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.base}/api/stats/summary`);
  }

  getActivities(page: number, filters: ActivityFilters = {}): Observable<ActivitiesResponse> {
    let params = new HttpParams().set('take', page.toString());
    if (filters.sportType) params = params.set('sportType', filters.sportType);
    if (filters.name)      params = params.set('name', filters.name);
    if (filters.dateFrom)  params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)    params = params.set('dateTo', filters.dateTo);
    if (filters.sortBy)    params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir)   params = params.set('sortDir', filters.sortDir);
    return this.http.get<ActivitiesResponse>(`${this.base}/api/activities`, { params });
  }

  getActivity(stravaActivityId: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.base}/api/activities/${stravaActivityId}`);
  }

  sync(athleteId: number, full = false): Observable<{ syncedCount: number; mode: string }> {
    const url = full
      ? `${this.base}/api/sync/${athleteId}/full`
      : `${this.base}/api/sync/${athleteId}`;
    return this.http.post<{ syncedCount: number; mode: string }>(url, null);
  }
}

