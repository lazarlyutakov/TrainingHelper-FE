export interface HeartRateProfile {
  maxHr: number;
  restingHr: number;
  maxHrEstimated: boolean;
  restingHrEstimated: boolean;
}

export interface WeeklyVolume {
  weekStart: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  activityCount: number;
  trainingLoad: number;
}

export interface WeeklyLoad {
  weekStart: string;
  load: number;
  activityCount: number;
  acuteLoad: number;
  chronicLoad: number;
}

export interface Vo2MaxPoint {
  date: string;
  vo2Max: number;
}

export interface Vo2MaxSummary {
  current: number | null;
  measuredOn: string | null;
  changeLast4Weeks: number | null;
  trendLabel: string;
  /** 'Garmin' when imported from Garmin Connect, 'Estimated' when derived from runs. */
  source: 'Garmin' | 'Estimated';
  qualifyingRuns: number;
  history: Vo2MaxPoint[];
}

export interface TrainingLoadStatus {
  acuteLoad: number;
  chronicLoad: number;
  loadRatio: number | null;
  loadRatioLabel: 'Low' | 'Optimal' | 'High' | 'Very high' | 'None';
  optimalAcuteMin: number;
  optimalAcuteMax: number;
  trainingStatus: string;
  trainingStatusDescription: string;
  suggestRecoveryWeek: boolean;
  lastActivityDate: string | null;
  daysSinceLastActivity: number | null;
}

export interface LoadFocus {
  lowAerobic: number;
  highAerobic: number;
  anaerobic: number;
  lowAerobicPercent: number;
  highAerobicPercent: number;
  anaerobicPercent: number;
  activitiesAnalyzed: number;
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
  plannedLoad: number;
}

export interface TrainingPlan {
  frameworkLabel: string;
  goal: string;
  planStart: string;
  planEnd: string;
  weeks: WeeklyPlan[];
  keyInsights: string[];
}

export interface HrvSummary {
  date: string | null;
  lastNight: number | null;
  sevenDayAverage: number | null;
  baselineLow: number | null;
  baselineHigh: number | null;
  status: string;
  isAverage: boolean;
}

export interface RestingHrSummary {
  date: string | null;
  latest: number | null;
  baseline: number | null;
  delta: number | null;
  isAverage: boolean;
}

export interface SleepSummary {
  date: string | null;
  lastNight: number | null;
  lastNightDurationMinutes: number | null;
  sevenDayAverage: number | null;
  quality: string;
  isAverage: boolean;
}

export interface ReadinessFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface TrainingReadiness {
  date: string | null;
  score: number | null;
  level: 'Prime' | 'High' | 'Moderate' | 'Low' | 'Poor' | 'No data';
  description: string;
  recommendation: string;
  factors: ReadinessFactor[];
}

export interface DailyWellnessPoint {
  date: string;
  restingHeartRate: number | null;
  hrv: number | null;
  sleepScore: number | null;
}

export interface WellnessSummary {
  latestDate: string | null;
  daysSinceLatest: number | null;
  hrv: HrvSummary;
  restingHr: RestingHrSummary;
  sleep: SleepSummary;
  readiness: TrainingReadiness;
  last14Days: DailyWellnessPoint[];
}

export interface TrainingAnalysis {
  athleteId: number;
  generatedAtUtc: string;
  heartRate: HeartRateProfile;
  wellness: WellnessSummary;
  runningVo2Max: Vo2MaxSummary;
  currentLoad: TrainingLoadStatus;
  loadFocus: LoadFocus;
  weeklyLoad: WeeklyLoad[];
  recentWeeklyVolume: WeeklyVolume[];
  suggestedPlan: TrainingPlan;
  insights: string[];
  aiCoachingSummary: string | null;
}
