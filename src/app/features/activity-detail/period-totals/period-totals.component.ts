import { Component, Input, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { ActivityTotals } from '../../../core/models/activity.model';
import { formatDate, parseDisplayDate } from '../../../core/utils/date-format';

type Preset = 'week' | 'month' | '30d' | 'year';

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'This week',    value: 'week' },
  { label: 'This month',   value: 'month' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This year',    value: 'year' },
];

const KCAL_PER_KJ = 0.239006;

/** "Totals for <sport>" panel on the activity detail page: sums all activities of that sport in a chosen date range. */
@Component({
  selector: 'app-period-totals',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './period-totals.component.html',
  styleUrl: './period-totals.component.css'
})
export class PeriodTotalsComponent {
  private api = inject(ApiService);

  @Input({ required: true }) sportType!: string;

  readonly presets = PRESETS;

  // dd/mm/yyyy, as typed in the text boxes
  from = signal('');
  to = signal('');
  activePreset = signal<Preset | null>(null);

  totals = signal<ActivityTotals | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  applyPreset(preset: Preset): void {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (preset === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));   // back to Monday
    if (preset === 'month') start.setDate(1);
    if (preset === '30d') start.setDate(start.getDate() - 29);
    if (preset === 'year') start.setMonth(0, 1);

    this.from.set(formatDate(start));
    this.to.set(formatDate(today));
    this.activePreset.set(preset);
    this.calculate();
  }

  /** Typing a custom date deselects the preset button. */
  setFrom(value: string): void { this.from.set(value); this.activePreset.set(null); }
  setTo(value: string): void { this.to.set(value); this.activePreset.set(null); }

  calculate(): void {
    const from = parseDisplayDate(this.from());
    const to = parseDisplayDate(this.to());
    if (!from || !to) {
      this.error.set('Enter both dates in dd/mm/yyyy format.');
      return;
    }
    if (from > to) {
      this.error.set('The start date must be on or before the end date.');
      return;
    }

    this.error.set(null);
    this.loading.set(true);
    this.api.getActivityTotals(this.sportType, from, to).subscribe({
      next: t => { this.totals.set(t); this.loading.set(false); },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.totals.set(null);
        this.error.set((err.error as { message?: string } | null)?.message ?? 'Could not load totals. Please try again.');
      }
    });
  }

  // ── Native date picker behind the 📅 button ─────────────────────────────────
  openPicker(input: HTMLInputElement): void {
    try { input.showPicker(); } catch { input.focus(); }
  }
  pickerValue(display: string): string { return parseDisplayDate(display); }
  onPicked(which: 'from' | 'to', isoDate: string): void {
    if (!isoDate) return;
    if (which === 'from') this.setFrom(formatDate(isoDate));
    else this.setTo(formatDate(isoDate));
  }

  // ── Formatting ──────────────────────────────────────────────────────────────
  rangeLabel(t: ActivityTotals): string { return `${formatDate(t.dateFrom)} – ${formatDate(t.dateTo)}`; }
  km(meters: number): string { return (meters / 1000).toFixed(2); }
  kcal(kj: number): number { return Math.round(kj * KCAL_PER_KJ); }
  duration(seconds: number): string {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
