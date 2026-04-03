import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StatsSummary } from '../../core/models/stats.model';
import { Activity, Pagination } from '../../core/models/activity.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit(): void {
    this.loadStats();
    this.loadActivities(1);
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
    this.api.getActivities(page).subscribe({
      next: r => {
        this.activities.set(r.activities);
        this.pagination.set(r.pagination);
        this.activitiesLoading.set(false);
      },
      error: () => this.activitiesLoading.set(false)
    });
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
        setTimeout(() => { this.loadStats(); this.loadActivities(1); }, 500);
      },
      error: () => {
        this.syncStatus.set('Sync failed.');
        this.syncing.set(false);
      }
    });
  }

  // Helpers for template
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

