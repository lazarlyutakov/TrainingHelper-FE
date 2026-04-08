import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Activity, ComparisonActivity } from '../../core/models/activity.model';
import {
  Chart, LineController, ScatterController,
  LinearScale, PointElement, LineElement,
  Tooltip, Legend, CategoryScale,
  type ChartEvent, type ActiveElement
} from 'chart.js';

Chart.register(
  LineController, ScatterController,
  LinearScale, PointElement, LineElement,
  Tooltip, Legend, CategoryScale
);

export type Period = '3M' | '6M' | '1Y' | 'All';

export const PERIODS: { label: string; value: Period }[] = [
  { label: '3 months', value: '3M' },
  { label: '6 months', value: '6M' },
  { label: '1 year',   value: '1Y' },
  { label: 'All time', value: 'All' },
];

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.css'
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activity          = signal<Activity | null>(null);
  allComparison     = signal<ComparisonActivity[]>([]);
  loading           = signal<boolean>(true);
  comparisonLoading = signal<boolean>(false);
  error             = signal<string | null>(null);
  selectedPeriod    = signal<Period>('1Y');

  // ── Popup state ───────────────────────────────────────────────────────────
  popupActivity  = signal<Activity | null>(null);
  popupLoading   = signal<boolean>(false);
  popupOpen      = signal<boolean>(false);

  readonly periods = PERIODS;

  private hrChart:   Chart | null = null;
  private paceChart: Chart | null = null;

  constructor() {
    effect(() => {
      const act    = this.activity();
      const comp   = this.allComparison();
      const period = this.selectedPeriod();
      if (act && comp.length > 0) {
        const filtered = this.filterByPeriod(comp, period);
        setTimeout(() => this.buildCharts(act, filtered), 0);
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
      next: c => { this.allComparison.set(c); this.comparisonLoading.set(false); },
      error: () => this.comparisonLoading.set(false)
    });
  }

  setPeriod(period: Period): void { this.selectedPeriod.set(period); }

  filterByPeriod(activities: ComparisonActivity[], period: Period): ComparisonActivity[] {
    if (period === 'All') return activities;
    const months = period === '3M' ? 3 : period === '6M' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return activities.filter(a => new Date(a.startDateUtc) >= cutoff);
  }

  filteredCount(): number {
    return this.filterByPeriod(this.allComparison(), this.selectedPeriod()).length;
  }

  // ── Popup ─────────────────────────────────────────────────────────────────
  openActivityPopup(id: number): void {
    this.popupOpen.set(true);
    this.popupActivity.set(null);
    this.popupLoading.set(true);
    this.api.getActivity(id).subscribe({
      next: a => { this.popupActivity.set(a); this.popupLoading.set(false); },
      error: () => { this.popupLoading.set(false); }
    });
  }

  closePopup(): void {
    this.popupOpen.set(false);
    this.popupActivity.set(null);
  }

  // ── Chart building ────────────────────────────────────────────────────────
  private buildCharts(current: Activity, all: ComparisonActivity[]): void {
    const currentId = current.stravaActivityId;

    const hrData = all.filter(a => a.averageHeartRate != null);
    this.hrChart = this.buildChart(
      'hrChart', this.hrChart,
      'Avg Heart Rate (bpm)', currentId,
      hrData.map(a => ({
        x: new Date(a.startDateUtc).getTime(),
        y: a.averageHeartRate as number,
        id: a.stravaActivityId,
        label: this.shortDate(a.startDateUtc) + ' – ' + a.name
      })),
      'rgba(220,53,69,0.7)', false
    );

    const paceData = all.filter(a => a.averageSpeedMetersPerSecond > 0);
    this.paceChart = this.buildChart(
      'paceChart', this.paceChart,
      'Avg Pace (min/km)', currentId,
      paceData.map(a => ({
        x: new Date(a.startDateUtc).getTime(),
        y: parseFloat((1000 / a.averageSpeedMetersPerSecond / 60).toFixed(3)),
        id: a.stravaActivityId,
        label: this.shortDate(a.startDateUtc) + ' – ' + a.name
      })),
      'rgba(13,110,253,0.7)', true
    );
  }

  private buildChart(
    canvasId: string,
    existing: Chart | null,
    label: string,
    currentId: number,
    points: { x: number; y: number; id: number; label: string }[],
    color: string,
    invertAxis: boolean
  ): Chart | null {
    existing?.destroy();
    if (points.length < 2) return null;

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return null;

    const trend        = this.linearRegression(points);
    const currentPt    = points.find(p => p.id === currentId);

    const isPace = label.includes('Pace');

    const formatVal = (val: number): string => {
      if (isPace) {
        const m = Math.floor(val); const s = Math.round((val - m) * 60);
        return `${m}:${s.toString().padStart(2, '0')} /km`;
      }
      return `${val.toFixed(0)} bpm`;
    };

    return new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          // ── Gray connecting line + other-activity dots ──────────────────
          {
            label: 'Other ' + label.split('(')[0].trim(),
            data: points.map(p => ({ x: p.x, y: p.y })),
            // hide current-activity dot in this dataset (shown in dataset 1)
            pointRadius:      points.map(p => p.id === currentId ? 0 : 5),
            pointHoverRadius: points.map(p => p.id === currentId ? 0 : 7),
            backgroundColor:  points.map(p => p.id === currentId ? 'transparent' : color),
            pointBorderColor: points.map(p => p.id === currentId ? 'transparent' : color),
            borderColor: 'rgba(180,180,180,0.35)',  // light gray line
            borderWidth: 1.5,
            showLine: true,
            tension: 0.3,
            fill: false,
            order: 2
          },
          // ── Current activity (orange star on top) ──────────────────────
          {
            label: 'This activity',
            data: currentPt ? [{ x: currentPt.x, y: currentPt.y }] : [],
            pointRadius: 11,
            pointHoverRadius: 13,
            backgroundColor: '#fc4c02',
            borderColor: '#fff',
            borderWidth: 2,
            showLine: false,
            order: 0
          },
          // ── Trend line ─────────────────────────────────────────────────
          {
            label: 'Trend',
            data: trend,
            type: 'line' as any,
            borderColor: 'rgba(80,80,80,0.45)',
            borderWidth: 2,
            borderDash: [7, 4],
            pointRadius: 0,
            fill: false,
            order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_evt: ChartEvent, elements: ActiveElement[]) => {
          if (!elements.length) return;
          const el = elements[0];
          // dataset 0 → other activities; dataset 1 → current activity
          if (el.datasetIndex === 0) {
            const pt = points[el.index];
            if (pt) this.openActivityPopup(pt.id);
          } else if (el.datasetIndex === 1) {
            this.openActivityPopup(currentId);
          }
        },
        onHover: (_evt: ChartEvent, elements: ActiveElement[], chart: Chart) => {
          const clickable = elements.some(e => e.datasetIndex === 0 || e.datasetIndex === 1);
          chart.canvas.style.cursor = clickable ? 'pointer' : 'default';
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: import('chart.js').TooltipItem<'scatter'>[]) => {
                const idx = items[0]?.dataIndex;
                if (items[0]?.datasetIndex === 1) return currentPt?.label ?? '';
                return idx != null ? (points[idx]?.label ?? '') : '';
              },
              label: (ctx: import('chart.js').TooltipItem<'scatter'>) => {
                const val: number = ctx.parsed.y ?? 0;
                return formatVal(val);
              },
              footer: () => ['🖱 Click to open activity']
            },
            titleFont: { size: 12 },
            bodyFont: { size: 13, weight: 'bold' },
            footerColor: 'rgba(255,255,255,0.6)',
            footerFont: { size: 10 }
          }
        },
        scales: {
          x: {
            type: 'linear',
            ticks: {
              callback: (v: string | number) => this.shortDate(new Date(v as number).toISOString()),
              maxTicksLimit: 6,
              font: { size: 10 }
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            reverse: invertAxis,
            title: { display: true, text: label, font: { size: 10 } },
            ticks: {
              callback: (v: string | number) => isPace
                ? (() => { const m = Math.floor(+v); const s = Math.round((+v - m) * 60); return `${m}:${s.toString().padStart(2, '0')}`; })()
                : `${v}`,
              maxTicksLimit: 6,
              font: { size: 10 }
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      }
    });
  }

  private linearRegression(pts: { x: number; y: number }[]): { x: number; y: number }[] {
    const n = pts.length;
    if (n < 2) return [];
    const mx  = pts.reduce((s, p) => s + p.x, 0) / n;
    const my  = pts.reduce((s, p) => s + p.y, 0) / n;
    const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    if (den === 0) return [];
    const slope = num / den;
    const int   = my - slope * mx;
    return [pts[0].x, pts[pts.length - 1].x].map(x => ({ x, y: slope * x + int }));
  }

  private shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  km(m: number): string { return (m / 1000).toFixed(2); }
  pace(speedMs: number): string {
    if (!speedMs) return '—';
    const s = 1000 / speedMs;
    return `${Math.floor(s / 60)}:${Math.round(s % 60).toString().padStart(2, '0')} /km`;
  }
  speedKmh(ms: number): string { return (ms * 3.6).toFixed(1); }
  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  formatDate(iso: string): string { return new Date(iso).toLocaleString(); }
  calories(kj: number | null): string {
    if (kj == null) return '—';
    return `${Math.round(kj * 0.239006)} kcal (${kj.toFixed(0)} kJ)`;
  }
  stravaLink(id: number): string { return 'https://www.strava.com/activities/' + id; }
}



