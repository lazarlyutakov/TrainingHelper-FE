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
