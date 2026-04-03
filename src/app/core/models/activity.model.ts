export interface Activity {
  stravaActivityId: number;
  athleteId: number;
  name: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  totalElevationGainMeters: number;
  startDateUtc: string;
  averageSpeedMetersPerSecond: number;
  maxSpeedMetersPerSecond: number;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
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

