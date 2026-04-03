export interface SportBreakdown {
  sportType: string;
  activityCount: number;
  distanceMeters: number;
}

export interface StatsSummary {
  totalActivities: number;
  totalDistanceMeters: number;
  totalMovingTimeSeconds: number;
  distanceLast30DaysMeters: number;
  activitiesLast30Days: number;
  totalElevationGainMeters: number;
  bySport: SportBreakdown[];
}

