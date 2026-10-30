import { Activity } from './activity.model';
import { TrainingAnalysis } from './training.model';

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
  activityTss: number;
  comparedToRecent: ComparedToRecent;
  trainingAnalysis: TrainingAnalysis;
}
