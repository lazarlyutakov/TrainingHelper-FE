export interface WeeklyVolume {
  weekStart: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  activityCount: number;
  estimatedTss: number;
}

export interface IntensityDistribution {
  sportType: string;
  easyPercent: number;
  moderatePercent: number;
  hardPercent: number;
  activitiesAnalyzed: number;
  weeksAnalyzed: number;
}

export interface Vo2Trend {
  sportType: string;
  estimatedVo2Max: number | null;
  trendPercentPerMonth: number | null;
  trendLabel: string;
}

export interface AthleteLoad {
  ctl: number;
  atl: number;
  tsb: number;
  formLabel: string;
  suggestRecoveryWeek: boolean;
}

export interface PlannedWorkout {
  date: string;
  type: string;
  sportType: string;
  description: string;
  targetDistanceMeters: number | null;
  targetDurationMinutes: number | null;
  paceGuidance: string | null;
  hrGuidance: string | null;
}

export interface WeeklyPlan {
  weekNumber: number;
  weekStart: string;
  weekLabel: string;
  focus: string;
  workouts: PlannedWorkout[];
  totalTargetDistanceMeters: number;
  plannedTss: number;
}

export interface TrainingPlan {
  framework: string;
  frameworkLabel: string;
  goal: string;
  planStart: string;
  planEnd: string;
  weeks: WeeklyPlan[];
  keyInsights: string[];
}

export interface TrainingAnalysis {
  athleteId: number;
  generatedAtUtc: string;
  recentWeeklyVolume: WeeklyVolume[];
  intensityDistribution: IntensityDistribution[];
  vo2Trends: Vo2Trend[];
  currentLoad: AthleteLoad;
  suggestedPlan: TrainingPlan;
  insights: string[];
  aiCoachingSummary: string | null;
}

export interface PlanFramework {
  id: string;
  label: string;
  description: string;
}


