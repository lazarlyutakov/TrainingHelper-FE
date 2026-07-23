import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { ImportSummary, ImportRowResult } from '../../core/models/import.model';

type ImportTab = 'csv' | 'gpx';

@Component({
  selector: 'app-import-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './import-activities.component.html',
  styleUrl: './import-activities.component.css'
})
export class ImportActivitiesComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  activeTab = signal<ImportTab>('csv');

  csvFile = signal<File | null>(null);
  gpxFiles = signal<File[]>([]);

  csvValidationError = signal<string | null>(null);
  gpxValidationError = signal<string | null>(null);
  csvRequestError = signal<string | null>(null);
  gpxRequestError = signal<string | null>(null);

  csvImporting = signal<boolean>(false);
  gpxImporting = signal<boolean>(false);

  csvSummary = signal<ImportSummary | null>(null);
  gpxSummary = signal<ImportSummary | null>(null);

  setTab(tab: ImportTab): void {
    this.activeTab.set(tab);
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    this.csvValidationError.set(null);
    this.csvRequestError.set(null);

    if (!files || files.length !== 1) {
      this.csvFile.set(null);
      return;
    }

    const file = files[0];
    if (!this.isCsvFile(file)) {
      this.csvFile.set(null);
      this.csvValidationError.set('Please choose a valid .csv file.');
      return;
    }

    this.csvFile.set(file);
  }

  onGpxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    this.gpxValidationError.set(null);
    this.gpxRequestError.set(null);

    if (!files || files.length === 0) {
      this.gpxFiles.set([]);
      return;
    }

    const selected = Array.from(files);
    const invalid = selected.find(f => !this.isGpxFile(f));
    if (invalid) {
      this.gpxFiles.set([]);
      this.gpxValidationError.set('All files must be valid .gpx files.');
      return;
    }

    this.gpxFiles.set(selected);
  }

  importCsv(): void {
    this.csvValidationError.set(null);
    this.csvRequestError.set(null);
    this.csvSummary.set(null);

    const file = this.csvFile();
    if (!file) {
      this.csvValidationError.set('Select one .csv file to import.');
      return;
    }
    if (!this.isCsvFile(file)) {
      this.csvValidationError.set('Please choose a valid .csv file.');
      return;
    }

    this.csvImporting.set(true);
    this.api.importGarminCsv(file).subscribe({
      next: summary => {
        this.csvSummary.set(summary);
        this.csvImporting.set(false);
        if (summary.imported > 0) {
          this.api.requestActivitiesRefresh();
        }
      },
      error: err => {
        this.csvRequestError.set(this.errorMessage(err));
        this.csvImporting.set(false);
      }
    });
  }

  importGpx(): void {
    this.gpxValidationError.set(null);
    this.gpxRequestError.set(null);
    this.gpxSummary.set(null);

    const files = this.gpxFiles();
    if (files.length === 0) {
      this.gpxValidationError.set('Select at least one .gpx file to import.');
      return;
    }
    const invalid = files.find(file => !this.isGpxFile(file));
    if (invalid) {
      this.gpxValidationError.set('All files must be valid .gpx files.');
      return;
    }

    this.gpxImporting.set(true);
    this.api.importGpx(files).subscribe({
      next: summary => {
        this.gpxSummary.set(summary);
        this.gpxImporting.set(false);
        if (summary.imported > 0) {
          this.api.requestActivitiesRefresh();
        }
      },
      error: err => {
        this.gpxRequestError.set(this.errorMessage(err));
        this.gpxImporting.set(false);
      }
    });
  }

  statusClass(status: ImportRowResult['status']): string {
    if (status === 'Imported') return 'status-imported';
    if (status === 'Duplicate') return 'status-duplicate';
    if (status === 'Skipped') return 'status-skipped';
    return 'status-error';
  }

  private isCsvFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.csv');
  }

  private isGpxFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.gpx');
  }

  private errorMessage(error: unknown): string {
    const httpError = error as HttpErrorResponse;

    if (httpError?.status === 401) {
      this.router.navigate(['/login']);
      return 'Your session expired. Redirecting to login...';
    }

    if (httpError?.status === 400) {
      return 'Invalid import request. Check selected file(s) and try again.';
    }

    if (httpError?.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }

    return 'Import failed. Please try again.';
  }
}
