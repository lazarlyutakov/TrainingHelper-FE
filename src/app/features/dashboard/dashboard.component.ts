import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StatsSummary } from '../../core/models/stats.model';
import { Activity, ActivityFilters, Pagination } from '../../core/models/activity.model';

const SORT_COLUMNS = [
  { label: 'Date',           value: 'date' },
  { label: 'Name',           value: 'name' },
  { label: 'Sport',          value: 'sport' },
  { label: 'Distance',       value: 'distance' },
  { label: 'Moving Time',    value: 'movingtime' },
  { label: 'Elevation Gain', value: 'elevationgain' },
] as const;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  protected auth = inject(AuthService);
  private api = inject(ApiService);

  stats = signal<StatsSummary | null>(null);
  activities = signal<Activity[]>([]);
  pagination = signal<Pagination | null>(null);
  syncStatus = signal<string>('Ready');
  syncing = signal<boolean>(false);
  statsLoading = signal<boolean>(true);
  activitiesLoading = signal<boolean>(true);
  sportTypes = signal<string[]>([]);

  // Filter state
  filterSportType = '';
  filterName = '';
  filterDateFrom = '';
  filterDateTo = '';
  sortBy = 'date';
  sortDir: 'asc' | 'desc' = 'desc';

  readonly sortColumns = SORT_COLUMNS;

  ngOnInit(): void {
    this.loadStats();
    this.loadActivities(1);
    this.api.getSportTypes().subscribe({ next: t => this.sportTypes.set(t) });
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.api.getStats().subscribe({
      next: s => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false)
    });
  }

  loadActivities(page: number): void {
    this.activitiesLoading.set(true);
    const filters: ActivityFilters = {
      sportType: this.filterSportType || undefined,
      name: this.filterName || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
    };
    this.api.getActivities(page, filters).subscribe({
      next: r => {
        this.activities.set(r.activities);
        this.pagination.set(r.pagination);
        this.activitiesLoading.set(false);
      },
      error: () => this.activitiesLoading.set(false)
    });
  }

  applyFilters(): void {
    this.loadActivities(1);
  }

  resetFilters(): void {
    this.filterSportType = '';
    this.filterName = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.sortBy = 'date';
    this.sortDir = 'desc';
    this.loadActivities(1);
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDir = 'desc';
    }
    this.loadActivities(this.pagination()?.page ?? 1);
  }

  sortIndicator(column: string): string {
    if (this.sortBy !== column) return '';
    return this.sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  sync(full: boolean): void {
    const athleteId = this.auth.currentUser()?.athleteId;
    if (!athleteId) return;
    this.syncing.set(true);
    this.syncStatus.set(full ? 'Full re-syncing...' : 'Syncing...');
    this.api.sync(athleteId, full).subscribe({
      next: res => {
        this.syncStatus.set(`${res.mode} sync loaded ${res.syncedCount} activities.`);
        this.syncing.set(false);
        setTimeout(() => {
          this.loadStats();
          this.loadActivities(1);
          this.api.getSportTypes().subscribe({ next: t => this.sportTypes.set(t) });
        }, 500);
      },
      error: () => {
        this.syncStatus.set('Sync failed.');
        this.syncing.set(false);
      }
    });
  }

  km(meters: number): string { return (meters / 1000).toFixed(2); }
  hours(seconds: number): string { return (seconds / 3600).toFixed(2); }
  minutes(seconds: number): string { return (seconds / 60).toFixed(1); }
  elevM(meters: number): number { return Math.round(meters); }
  formatDate(iso: string): string { return new Date(iso).toLocaleString(); }

  get prevPage(): number { return Math.max(1, (this.pagination()?.page ?? 1) - 1); }
  get nextPage(): number {
    const p = this.pagination();
    return Math.min(p?.totalPages ?? 1, (p?.page ?? 1) + 1);
  }
}
