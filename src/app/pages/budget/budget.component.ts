import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BudgetService }      from '../../core/services/budget.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService }       from '../../core/services/toast.service';
import { Budget, BudgetStats } from '../../core/models/budget.model';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.component.html',
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private txService     = inject(TransactionService);
  private toastService  = inject(ToastService);
  private router        = inject(Router);

  loading    = signal(true);
  saving     = signal(false);
  showForm   = signal(false);
  isEditing  = signal(false);

  // Form fields
  inputAmount = 0;
  inputDays   = 0;

  get budget(): Budget | null { return this.budgetService.snapshot; }

  get stats(): BudgetStats | null {
    const totalDebit = this.txService.getTotalDebit();
    return this.budgetService.computeStats(totalDebit);
  }

  get dailyPreview(): number {
    if (!this.inputAmount || !this.inputDays) return 0;
    return this.budgetService.getDailyAllowance(this.inputAmount, this.inputDays);
  }

  get formValid(): boolean {
    return this.inputAmount > 0 && this.inputDays > 0;
  }

  get startDateLabel(): string {
    if (!this.budget) return '';
    return new Date(this.budget.startDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  get endDateLabel(): string {
    if (!this.budget) return '';
    const d = new Date(this.budget.startDate);
    d.setDate(d.getDate() + this.budget.days);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  ngOnInit() {
    const loaded = this.txService.snapshot.length > 0;

    if (loaded) {
      this.budgetService.load().subscribe(() => this.loading.set(false));
    } else {
      Promise.all([
        this.budgetService.load().toPromise(),
        this.txService.load().toPromise(),
      ]).then(() => this.loading.set(false));
    }
  }

  openCreate() {
    this.inputAmount = 0;
    this.inputDays   = 0;
    this.isEditing.set(false);
    this.showForm.set(true);
  }

  openEdit() {
    if (!this.budget) return;
    this.inputAmount = this.budget.amount;
    this.inputDays   = this.budget.days;
    this.isEditing.set(true);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
  }

  saveBudget() {
    if (!this.formValid || this.saving()) return;
    this.saving.set(true);

    this.budgetService.save(this.inputAmount, this.inputDays).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toastService.show('Budget saved! 🎉', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.toastService.show('Failed to save budget', 'error');
      },
    });
  }

  deleteBudget() {
    if (!confirm('Delete your current budget?')) return;
    this.budgetService.delete().subscribe({
      next: () => this.toastService.show('Budget deleted', 'error'),
      error: () => this.toastService.show('Failed to delete', 'error'),
    });
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
