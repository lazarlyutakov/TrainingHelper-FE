import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Activity, ComparisonActivity } from '../../core/models/activity.model';
import {
  Chart, LineController, ScatterController,
  LinearScale, PointElement, LineElement,
  Tooltip, Legend, TimeScale, CategoryScale
} from 'chart.js';

Chart.register(
  LineController, ScatterController,
  LinearScale, PointElement, LineElement,
  Tooltip, Legend, CategoryScale
);

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.css'
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  activity           = signal<Activity | null>(null);
  comparison         = signal<ComparisonActivity[]>([]);
  loading            = signal<boolean>(true);
  comparisonLoading  = signal<boolean>(false);
  error              = signal<string | null>(null);

  private hrChart:   Chart | null = null;
  private paceChart: Chart | null = null;

  constructor() {
    // Rebuild charts whenever both datasets are ready
    effect(() => {
      const act  = this.activity();
      const comp = this.comparison();
      if (act && comp.length > 1) {
        // Give Angular one tick to render the canvas elements
        setTimeout(() => this.buildCharts(act, comp), 0);
      }
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.api.getActivity(id).subscribe({
      next: a => {
        this.activity.set(a);
        this.loading.set(false);
        this.loadComparison(a.sportType);
      },
      error: () => { this.error.set('Activity not found.'); this.loading.set(false); }
    });
  }

  ngOnDestroy(): void {
    this.hrChart?.destroy();
    this.paceChart?.destroy();
  }

  private loadComparison(sportType: string): void {
    this.comparisonLoading.set(true);
    this.api.getComparisonActivities(sportType).subscribe({
      next: c => { this.comparison.set(c); this.comparisonLoading.set(false); },
      error: ()  => this.comparisonLoading.set(false)
    });
  }

  // ── Chart building ────────────────────────────────────────────────────────
  private buildCharts(current: Activity, all: ComparisonActivity[]): void {
    const currentId = current.stravaActivityId;

    // ── Heart-Rate chart ────────────────────────────────────────────────────
    const hrData = all.filter(a => a.averageHeartRate != null);
    if (hrData.length > 1) {
      const hrPoints = hrData.map(a => ({
        x: new Date(a.startDateUtc).getTime(),
        y: a.averageHeartRate as number,
        id: a.stravaActivityId,
        label: this.shortDate(a.startDateUtc) + ' – ' + a.name
      }));
      this.buildChart('hrChart', this.hrChart,
        'Avg Heart Rate (bpm)', currentId, hrPoints,
        'rgba(220,53,69,0.75)', 'rgba(220,53,69,0.2)');
    }

    // ── Pace chart ──────────────────────────────────────────────────────────
    const paceData = all.filter(a => a.averageSpeedMetersPerSecond > 0);
    if (paceData.length > 1) {
      const pacePoints = paceData.map(a => ({
        x: new Date(a.startDateUtc).getTime(),
        y: parseFloat((1000 / a.averageSpeedMetersPerSecond / 60).toFixed(3)), // min/km
        id: a.stravaActivityId,
        label: this.shortDate(a.startDateUtc) + ' – ' + a.name
      }));
      this.buildChart('paceChart', this.paceChart,
        'Avg Pace (min/km)', currentId, pacePoints,
        'rgba(13,110,253,0.75)', 'rgba(13,110,253,0.15)', true /* invert – lower is better */);
    }
  }

  private buildChart(
    canvasId: string,
    existing: Chart | null,
    label: string,
    currentId: number,
    points: { x: number; y: number; id: number; label: string }[],
    color: string,
    fillColor: string,
    invertAxis = false
  ): void {
    existing?.destroy();

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const trend = this.linearRegression(points);
    const colors  = points.map(p => p.id === currentId ? '#fc4c02' : color);
    const radii   = points.map(p => p.id === currentId ? 9 : 5);
    const borders = points.map(p => p.id === currentId ? '#fc4c02' : color);

    const chart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label,
            data: points.map(p => ({ x: p.x, y: p.y })),
            backgroundColor: colors,
            borderColor: borders,
            pointRadius: radii,
            pointHoverRadius: radii.map(r => r + 2),
            showLine: true,
            borderWidth: 1.5,
            tension: 0.3,
            fill: false,
            order: 2
          },
          {
            label: 'Trend',
            data: trend,
            type: 'line' as any,
            borderColor: 'rgba(100,100,100,0.55)',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx: import('chart.js').TooltipItem<'scatter'>) => {
                const idx = ctx.dataIndex;
                const pt  = points[idx];
                const val: number = ctx.parsed.y ?? 0;
                if (label.includes('Pace')) {
                  const min = Math.floor(val);
                  const sec = Math.round((val - min) * 60);
                  return `${pt?.label ?? ''}: ${min}:${sec.toString().padStart(2,'0')} /km`;
                }
                return `${pt?.label ?? ''}: ${val.toFixed(0)} bpm`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            ticks: {
              callback: (v: string | number) => this.shortDate(new Date(v as number).toISOString()),
              maxTicksLimit: 8
            },
            title: { display: true, text: 'Date' }
          },
          y: {
            reverse: invertAxis,
            title: { display: true, text: label },
            ticks: {
              callback: (v: string | number) => label.includes('Pace')
                ? (() => { const m=Math.floor(+v); const s=Math.round((+v-m)*60); return `${m}:${s.toString().padStart(2,'0')}`; })()
                : `${v}`
            }
          }
        }
      }
    });

    // Store back on the field
    if (canvasId === 'hrChart')   this.hrChart   = chart;
    if (canvasId === 'paceChart') this.paceChart = chart;
  }

  // ── Linear regression (returns two {x,y} endpoints for the trend line) ────
  private linearRegression(pts: { x: number; y: number }[]): { x: number; y: number }[] {
    const n = pts.length;
    if (n < 2) return [];
    const mx = pts.reduce((s, p) => s + p.x, 0) / n;
    const my = pts.reduce((s, p) => s + p.y, 0) / n;
    const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    if (den === 0) return [];
    const slope = num / den;
    const int   = my - slope * mx;
    const xs = [pts[0].x, pts[pts.length - 1].x];
    return xs.map(x => ({ x, y: slope * x + int }));
  }

  // ── Format helpers ────────────────────────────────────────────────────────
  private shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }

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
  stravaLink(id: number): string { return 'https://www.strava.com/activities/' + id; }
}



