import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TrainingAnalysis, PlanFramework } from '../../core/models/training.model';

@Component({
  selector: 'app-coaching',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './coaching.component.html',
  styleUrl: './coaching.component.css'
})
export class CoachingComponent implements OnInit {
  private api = inject(ApiService);

  analysis = signal<TrainingAnalysis | null>(null);
  frameworks = signal<{ id: string; label: string; description: string }[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedFramework = 'Polarized8020';
  planWeeks = 8;

  ngOnInit(): void {
    this.api.getTrainingFrameworks().subscribe({
      next: f => this.frameworks.set(f),
      error: () => {}
    });
    this.loadAnalysis();
  }

  loadAnalysis(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getTrainingAnalysis(this.planWeeks, this.selectedFramework).subscribe({
      next: a => { this.analysis.set(a); this.loading.set(false); },
      error: () => { this.error.set('Failed to load training analysis.'); this.loading.set(false); }
    });
  }

  frameworkLabel(id: string): string {
    return this.frameworks().find(f => f.id === id)?.label ?? id;
  }

  tsbClass(tsb: number): string {
    if (tsb > 10) return 'tsb-fresh';
    if (tsb < -20) return 'tsb-fatigued';
    return 'tsb-optimal';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  km(m: number): string { return (m / 1000).toFixed(1); }
  round1(n: number): string { return n.toFixed(1); }
  round0(n: number): string { return n.toFixed(0); }
}

