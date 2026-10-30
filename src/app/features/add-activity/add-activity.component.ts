import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CreateActivityRequest } from '../../core/models/activity.model';
import { formatDate, parseDisplayDate } from '../../core/utils/date-format';

/** Suggested in the sport type box alongside the user's existing sport types. */
const COMMON_SPORTS = ['Run', 'Ride', 'MountainBikeRide', 'Swim', 'Walk', 'Hike', 'WeightTraining', 'Yoga', 'Workout'];

const KCAL_PER_KJ = 0.239006;

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css'
})
export class AddActivityComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  sportOptions = signal<string[]>(COMMON_SPORTS);

  // Required — signals so the live speed/pace summary can react to them
  name = signal('');
  sportType = signal('');
  date = signal(formatDate(new Date()));     // dd/mm/yyyy
  startTime = signal(this.currentTime());    // HH:mm
  movingH = signal<number | null>(null);
  movingM = signal<number | null>(null);
  movingS = signal<number | null>(null);
  distanceKm = signal<number | null>(null);

  // Optional
  elapsedH: number | null = null;
  elapsedM: number | null = null;
  elapsedS: number | null = null;
  elevationGainM: number | null = null;
  maxSpeedKmh: number | null = null;
  averageHeartRate: number | null = null;
  maxHeartRate: number | null = null;
  calories: number | null = null;

  submitting = signal(false);
  errors = signal<string[]>([]);

  readonly movingTimeSeconds = computed(() => toSeconds(this.movingH(), this.movingM(), this.movingS()));

  /** e.g. "5:12 /km · 11.5 km/h", shown under the distance field once both values are known. */
  readonly speedSummary = computed(() => {
    const seconds = this.movingTimeSeconds();
    const km = this.distanceKm();
    if (!seconds || !km || km <= 0) return '';
    const kmh = km / (seconds / 3600);
    const isSwim = this.sportType().toLowerCase().includes('swim');
    const paceSec = isSwim ? seconds / (km * 10) : seconds / km;
    const pace = `${Math.floor(paceSec / 60)}:${Math.round(paceSec % 60).toString().padStart(2, '0')}`;
    return `${pace} ${isSwim ? '/100m' : '/km'} · ${kmh.toFixed(1)} km/h`;
  });

  ngOnInit(): void {
    this.api.getSportTypes().subscribe({
      next: types => this.sportOptions.set([...new Set([...types, ...COMMON_SPORTS])].sort()),
    });
  }

  openPicker(input: HTMLInputElement): void {
    try { input.showPicker(); } catch { input.focus(); }
  }

  /** Native picker value (yyyy-mm-dd) → dd/mm/yyyy text box. */
  onPickerChange(isoDate: string): void {
    if (isoDate) this.date.set(formatDate(isoDate));
  }

  pickerValue(): string {
    return parseDisplayDate(this.date());
  }

  submit(): void {
    const request = this.buildRequest();
    if (!request) return;

    this.submitting.set(true);
    this.api.createActivity(request).subscribe({
      next: res => {
        this.api.requestActivitiesRefresh();
        this.router.navigate(['/activities', res.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const serverErrors = (err.error as { errors?: string[] } | null)?.errors;
        this.errors.set(serverErrors?.length ? serverErrors : ['Could not save the activity. Please try again.']);
      }
    });
  }

  /** Validates the form and converts it to API units; sets `errors` and returns null if invalid. */
  private buildRequest(): CreateActivityRequest | null {
    const errors: string[] = [];

    const isoDate = parseDisplayDate(this.date());
    if (!isoDate) errors.push('Date must be a valid date in dd/mm/yyyy format.');

    const time = /^(\d{1,2}):(\d{2})$/.exec(this.startTime().trim());
    const hours = time ? Number(time[1]) : NaN;
    const minutes = time ? Number(time[2]) : NaN;
    if (!time || hours > 23 || minutes > 59) errors.push('Start time must be in HH:mm format (24-hour).');

    if (!this.name().trim()) errors.push('Name is required.');
    if (!this.sportType().trim()) errors.push('Sport type is required.');

    const moving = this.movingTimeSeconds();
    if (!moving) errors.push('Moving time is required.');

    const km = this.distanceKm();
    if (km == null || km < 0) errors.push('Distance is required (use 0 for activities without distance).');

    const elapsed = toSeconds(this.elapsedH, this.elapsedM, this.elapsedS);

    this.errors.set(errors);
    if (errors.length) return null;

    const [y, m, d] = isoDate.split('-').map(Number);
    const start = new Date(y, m - 1, d, hours, minutes);   // local time → serialized as UTC below

    return {
      name: this.name().trim(),
      sportType: this.sportType().trim(),
      startDate: start.toISOString(),
      movingTimeSeconds: moving,
      elapsedTimeSeconds: elapsed || null,
      distanceMeters: Math.round(km! * 1000 * 10) / 10,
      totalElevationGainMeters: this.elevationGainM,
      maxSpeedMetersPerSecond: this.maxSpeedKmh != null ? this.maxSpeedKmh / 3.6 : null,
      averageHeartRate: this.averageHeartRate,
      maxHeartRate: this.maxHeartRate,
      kilojoules: this.calories != null ? Math.round(this.calories / KCAL_PER_KJ) : null
    };
  }

  private currentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}

function toSeconds(h: number | null, m: number | null, s: number | null): number {
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
}
