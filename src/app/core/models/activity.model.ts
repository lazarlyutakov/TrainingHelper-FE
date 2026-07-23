export interface Activity {
  id: number;
  stravaActivityId: number | null;
  source?: string;
  athleteId: number;
  name: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  totalElevationGainMeters: number;
  startDateUtc: string;
  averageSpeedMetersPerSecond: number;
  maxSpeedMetersPerSecond: number;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  kilojoules: number | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ActivitiesResponse {
  activities: Activity[];
  pagination: Pagination;
}

export interface ActivityFilters {
  sportType?: string;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ComparisonActivity {
  id: number;
  stravaActivityId: number | null;
  source?: string;
  name: string;
  startDateUtc: string;
  averageHeartRate: number | null;
  averageSpeedMetersPerSecond: number;
  distanceMeters: number;
}

