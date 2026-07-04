import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BudgetService }      from '../../core/services/budget.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService }       from '../../core/services/toast.service';
import { Budget, BudgetStats } from '../../core/models/budget.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
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
  isConfirmClearOpen = false;

  // Form fields
  inputAmount = 0;
  inputDays   = 0;

  selectedCategory = signal<string>('');

  get budget(): Budget | null { return this.budgetService.snapshot; }

  get categories(): string[] {
    return this.txService.getCategories();
  }

  get stats(): BudgetStats | null {
    const category = this.selectedCategory();
    const txs = category
      ? this.txService.snapshot.filter(t => t.category === category)
      : this.txService.snapshot;
    const totalDebit = this.txService.getTotalDebit(txs);
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
      Promise.all([
        this.budgetService.load().toPromise(),
        this.txService.load().toPromise(),
      ]).then(() => this.loading.set(false));
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



  clearTransactions() {
    this.isConfirmClearOpen = true;
  }

  onClearConfirmed() {
    this.isConfirmClearOpen = false;
    this.txService.clearAllTransactions().subscribe({
      next: () => this.toastService.show('All transactions cleared! 🧹', 'success'),
      error: () => this.toastService.show('Failed to clear transactions', 'error')
    });
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
