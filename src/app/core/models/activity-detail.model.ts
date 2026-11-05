import { Activity } from './activity.model';

export type ActivitySource = 'Strava' | 'GpxImport' | 'CsvImport' | 'Manual';

export interface ActivityDetail extends Activity {
  stravaActivityId: number | null;
  source: ActivitySource;
}

export interface ComparedToRecent {
  sampleSize: number;
  distance: string;
  speed: string;
  heartRate: string;
  avgRecentDistanceKm: number | null;
  avgRecentSpeedKmh: number | null;
  avgRecentHeartRate: number | null;
}

export interface ActivityCoachingResponse {
  activity: ActivityDetail;
  /** HR-based training load (Garmin-style scale). */
  activityLoad: number;
  /** Single-run VO₂ max estimate; null when the activity doesn't qualify. */
  activityVo2Max: number | null;
  comparedToRecent: ComparedToRecent;
}
