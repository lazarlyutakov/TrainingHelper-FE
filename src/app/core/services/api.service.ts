import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { StatsSummary } from '../models/stats.model';
import { Activity, ActivitiesResponse, ActivityFilters, ComparisonActivity } from '../models/activity.model';
import { ActivityCoachingResponse, ActivityDetail } from '../models/activity-detail.model';
import { TrainingAnalysis, PlanFramework } from '../models/training.model';
import { ImportSummary } from '../models/activity-import.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = this.resolveBaseUrl();
  private activitiesRefresh = new Subject<void>();

  readonly activitiesRefresh$ = this.activitiesRefresh.asObservable();

  private resolveBaseUrl(): string {
    if (environment.apiUrl) {
      return environment.apiUrl.replace(/\/$/, '');
    }

    // Render static FE host fallback: call the BE service directly in production.
    if (environment.production && typeof window !== 'undefined' && window.location.hostname === 'traininghelper-fe.onrender.com') {
      return 'https://training-helper.onrender.com';
    }

    return '';
  }

  getStats(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.base}/api/stats/summary`);
  }

  getSportTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/api/activities/sport-types`);
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

  getActivity(id: number): Observable<ActivityDetail> {
    return this.http.get<ActivityDetail>(`${this.base}/api/activities/id/${id}`);
  }

  getComparisonActivities(sportType: string): Observable<ComparisonActivity[]> {
    return this.http.get<ComparisonActivity[]>(
      `${this.base}/api/activities/comparison`,
      { params: new HttpParams().set('sportType', sportType) }
    );
  }

  getTrainingAnalysis(planWeeks = 8, framework = 'Polarized8020'): Observable<TrainingAnalysis> {
    const params = new HttpParams().set('planWeeks', planWeeks).set('framework', framework);
    return this.http.get<TrainingAnalysis>(`${this.base}/api/training/analysis`, { params });
  }

  getTrainingFrameworks(): Observable<PlanFramework[]> {
    return this.http.get<PlanFramework[]>(`${this.base}/api/training/frameworks`);
  }

  getActivityCoaching(id: number, planWeeks = 8, framework = 'Polarized8020'): Observable<ActivityCoachingResponse> {
    const params = new HttpParams().set('planWeeks', planWeeks).set('framework', framework);
    return this.http.get<ActivityCoachingResponse>(`${this.base}/api/activities/id/${id}/coaching`, { params });
  }


  importGarminCsv(file: File): Observable<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportSummary>(`${this.base}/api/activities/import-csv`, formData);
  }

  importGpx(files: File[]): Observable<ImportSummary> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<ImportSummary>(`${this.base}/api/activities/import-gpx`, formData);
  }

  requestActivitiesRefresh(): void {
    this.activitiesRefresh.next();
  }
}

