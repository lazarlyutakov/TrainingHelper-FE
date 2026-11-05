export type ImportRowStatus = 'Imported' | 'Duplicate' | 'Skipped' | 'Error';

export interface ImportRowResult {
  rowNumber: number;
  title: string;
  status: ImportRowStatus;
  message: string | null;
}

export interface ImportSummary {
  imported: number;
  duplicates: number;
  skipped: number;
  errors: number;
  details: ImportRowResult[];
}

/** Result for one Garmin health-stat CSV (HRV Status, Resting Heart Rate, VO₂ Max, Sleep). */
export interface WellnessFileImportResult {
  fileName: string;
  /** Detected file type, or null when the file wasn't recognised. */
  kind: string | null;
  /** True when the file contained weekly/monthly averages (long-range export). */
  isAverages: boolean;
  summary: ImportSummary;
}
