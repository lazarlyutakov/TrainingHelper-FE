import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Activity } from '../../core/models/activity.model';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.css'
})
export class ActivityDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activity = signal<Activity | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.api.getActivity(id).subscribe({
      next: a => { this.activity.set(a); this.loading.set(false); },
      error: () => { this.error.set('Activity not found.'); this.loading.set(false); }
    });
  }

  // ── Format helpers ──────────────────────────────────────────────────────
  km(m: number): string { return (m / 1000).toFixed(2); }
  pace(speedMs: number): string {
    if (!speedMs) return '—';
    const secPerKm = 1000 / speedMs;
    const min = Math.floor(secPerKm / 60);
    const sec = Math.round(secPerKm % 60);
    return `${min}:${sec.toString().padStart(2, '0')} /km`;
  }
  speedKmh(ms: number): string { return (ms * 3.6).toFixed(1); }
  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  formatDate(iso: string): string { return new Date(iso).toLocaleString(); }
  calories(kj: number | null): string {
    if (kj == null) return '—';
    return `${Math.round(kj * 0.239006)} kcal  (${kj.toFixed(0)} kJ)`;
  }
  stravaLink(id: number): string {
    return 'https://www.strava.com/activities/' + id;
  }
}


