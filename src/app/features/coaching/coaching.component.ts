import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TrainingAnalysis } from '../../core/models/training.model';
import { formatDate } from '../../core/utils/date-format';

/** Chart geometry shared by the two small SVG charts (viewBox units). */
const CHART_W = 600;
const CHART_H = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

interface LoadBar { x: number; y: number; w: number; h: number; label: string; tooltip: string; }
interface Vo2Dot { x: number; y: number; tooltip: string; }

@Component({
  selector: 'app-coaching',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coaching.component.html',
  styleUrl: './coaching.component.css'
})
export class CoachingComponent implements OnInit {
  private api = inject(ApiService);

  analysis = signal<TrainingAnalysis | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  planWeeks = 8;

  readonly chartW = CHART_W;
  readonly chartH = CHART_H;
  readonly baselineY = CHART_H - PAD_BOTTOM;

  /** Weekly load bars + chronic load line, both on the same "load per week" scale. */
  loadChart = computed(() => {
    const weeks = this.analysis()?.weeklyLoad ?? [];
    if (weeks.length === 0) return null;

    const max = Math.max(1, ...weeks.map(w => Math.max(w.load, w.chronicLoad)));
    const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const slot = CHART_W / weeks.length;
    const barW = Math.max(2, slot - 2); // 2px gap between adjacent bars
    const y = (v: number) => this.baselineY - (v / max) * plotH;

    const bars: LoadBar[] = weeks.map((w, i) => ({
      x: i * slot + 1,
      y: y(w.load),
      w: barW,
      h: this.baselineY - y(w.load),
      label: i % 4 === 0 ? formatDate(w.weekStart).slice(0, 5) : '',
      tooltip: `Week of ${formatDate(w.weekStart)}\nLoad ${w.load} (${w.activityCount} activities)\n` +
               `Acute ${w.acuteLoad} · Chronic ${w.chronicLoad}`
    }));
    const chronicLine = weeks
      .map((w, i) => `${(i * slot + slot / 2).toFixed(1)},${y(w.chronicLoad).toFixed(1)}`)
      .join(' ');

    return { bars, chronicLine, max: Math.round(max), slot };
  });

  /** Running VO₂ max trend over the last 12 months. */
  vo2Chart = computed(() => {
    const history = this.analysis()?.runningVo2Max.history ?? [];
    if (history.length < 2) return null;

    const values = history.map(p => p.vo2Max);
    const lo = Math.floor(Math.min(...values) - 1);
    const hi = Math.ceil(Math.max(...values) + 1);
    const t0 = new Date(history[0].date).getTime();
    const t1 = Math.max(t0 + 1, new Date(history[history.length - 1].date).getTime());
    const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const x = (d: string) => 8 + ((new Date(d).getTime() - t0) / (t1 - t0)) * (CHART_W - 16);
    const y = (v: number) => this.baselineY - ((v - lo) / (hi - lo)) * plotH;

    const dots: Vo2Dot[] = history.map(p => ({
      x: x(p.date), y: y(p.vo2Max), tooltip: `${formatDate(p.date)}: VO₂ max ${p.vo2Max.toFixed(1)}`
    }));
    return {
      dots,
      line: dots.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' '),
      lo, hi,
      first: formatDate(history[0].date),
      last: formatDate(history[history.length - 1].date)
    };
  });

  ngOnInit(): void {
    this.loadAnalysis();
  }

  loadAnalysis(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getTrainingAnalysis(this.planWeeks).subscribe({
      next: a => { this.analysis.set(a); this.loading.set(false); },
      error: () => { this.error.set('Failed to load training analysis.'); this.loading.set(false); }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Productive':
      case 'Peaking':      return 'status-good';
      case 'Maintaining':
      case 'Recovery':     return 'status-neutral';
      case 'Unproductive':
      case 'Detraining':   return 'status-warn';
      case 'Overreaching': return 'status-bad';
      default:             return 'status-none';
    }
  }

  readinessClass(level: string): string {
    switch (level) {
      case 'Prime':
      case 'High':     return 'status-good';
      case 'Moderate': return 'status-neutral';
      case 'Low':      return 'status-warn';
      case 'Poor':     return 'status-bad';
      default:         return 'status-none';
    }
  }

  hrvClass(status: string): string {
    switch (status) {
      case 'Balanced':   return 'status-good';
      case 'Unbalanced': return 'status-warn';
      case 'Low':        return 'status-bad';
      default:           return 'status-none';
    }
  }

  duration(minutes: number | null): string {
    if (minutes == null) return '';
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }

  ratioClass(label: string): string {
    switch (label) {
      case 'Optimal':   return 'status-good';
      case 'Low':       return 'status-neutral';
      case 'High':      return 'status-warn';
      case 'Very high': return 'status-bad';
      default:          return 'status-none';
    }
  }

  trendArrow(label: string): string {
    return label === 'Improving' ? '▲' : label === 'Declining' ? '▼' : label === 'Stable' ? '▶' : '';
  }

  /** Acute-load gauge: position (0–100 %) of a value on a 0 … 2×chronic scale. */
  gaugePos(value: number, chronic: number): number {
    const scale = Math.max(1, chronic * 2);
    return Math.min(100, Math.max(0, (value / scale) * 100));
  }

  formatDate(iso: string): string {
    return formatDate(iso);
  }

  signed(n: number): string { return (n > 0 ? '+' : '') + n.toFixed(1); }
  km(m: number): string { return (m / 1000).toFixed(1); }
  round0(n: number): string { return n.toFixed(0); }
}
