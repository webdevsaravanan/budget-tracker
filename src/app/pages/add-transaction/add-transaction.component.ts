import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container flex flex-col h-screen overflow-hidden !pb-0 !min-h-0">
      <!-- Header -->
      <header class="px-6 pt-14 pb-4 flex-shrink-0 fade-up">
        <h1 class="text-3xl font-bold">Add Transaction</h1>
      </header>
      
      <!-- Scrollable Form Container -->
      <div class="flex-1 overflow-y-auto px-6 pb-28 space-y-5 fade-up">
        <form (ngSubmit)="onSubmit()" #txForm="ngForm" class="space-y-5">
          
          <!-- Transaction Type -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">Type</p>
            <div class="flex gap-2">
              <button type="button" 
                      (click)="form.transactionType = 'debit'"
                      class="chip flex-1 py-2.5 text-center font-semibold" 
                      [class.active]="form.transactionType === 'debit'">
                ↗ Debit
              </button>
              <button type="button" 
                      (click)="form.transactionType = 'credit'"
                      class="chip flex-1 py-2.5 text-center font-semibold" 
                      [class.active]="form.transactionType === 'credit'">
                ↙ Credit
              </button>
            </div>
          </div>

          <!-- Amount -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Amount (₹)</p>
            <input type="number" 
                   step="0.01"
                   [(ngModel)]="form.amount"
                   name="amount"
                   required
                   #amountField="ngModel"
                   placeholder="0.00"
                   class="form-input text-lg font-mono py-3 font-semibold w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
            @if (amountField.invalid && amountField.touched) {
              <p class="text-xs text-debit mt-1">Amount is required</p>
            }
          </div>

          <!-- Source / Merchant -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Source / Merchant</p>
            <input type="text" 
                   [(ngModel)]="form.source"
                   name="source"
                   required
                   #sourceField="ngModel"
                   placeholder="e.g. Swiggy, Salary, Rent"
                   class="form-input text-sm py-2.5 w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
            @if (sourceField.invalid && sourceField.touched) {
              <p class="text-xs text-debit mt-1">Source is required</p>
            }
          </div>

          <!-- Account -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Account</p>
            <input type="text" 
                   [(ngModel)]="form.account"
                   name="account"
                   required
                   #accountField="ngModel"
                   placeholder="e.g. HDFC, UPI, Cash"
                   class="form-input text-sm py-2.5 w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
            @if (accountField.invalid && accountField.touched) {
              <p class="text-xs text-debit mt-1">Account is required</p>
            }
          </div>

          <!-- Date -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Date</p>
            <input type="date" 
                   [(ngModel)]="form.date"
                   name="date"
                   required
                   #dateField="ngModel"
                   class="form-input text-sm py-2.5 w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
            @if (dateField.invalid && dateField.touched) {
              <p class="text-xs text-debit mt-1">Date is required</p>
            }
          </div>

          <!-- Display Name -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Display Name (Optional)</p>
            <input type="text" 
                   [(ngModel)]="form.displayName"
                   name="displayName"
                   placeholder="e.g. Dinner, Monthly Income"
                   class="form-input text-sm py-2.5 w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
          </div>

          <!-- Category -->
          <div>
            <p class="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5">Category (Optional)</p>
            <input type="text" 
                   [(ngModel)]="form.category"
                   name="category"
                   placeholder="e.g. Food, Salary, Housing"
                   class="form-input text-sm py-2.5 w-full bg-surface border border-white/5 focus:border-accent/50 rounded-2xl outline-none px-4 text-white">
          </div>

          <!-- Submit Button -->
          <button type="submit" 
                  [disabled]="saving() || txForm.invalid || !form.amount"
                  class="w-full bg-accent text-white font-semibold rounded-2xl py-3.5 px-4 shadow-lg transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {{ saving() ? 'Saving...' : 'Add Transaction' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AddTransactionComponent implements OnInit {
  private txService = inject(TransactionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  saving = signal(false);

  form = {
    amount: null as number | null,
    transactionType: 'debit' as 'debit' | 'credit',
    source: '',
    account: '',
    date: '',
    displayName: '',
    category: '',
  };

  ngOnInit() {
    this.form.date = this.getTodayString();
  }

  getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatTransactionDate(pickerDate: string): string {
    const [y, m, d] = pickerDate.split('-');
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const yy = y.substring(2);
    return `${d}-${m}-${yy}, ${hh}:${mm}:${ss}`;
  }

  onSubmit() {
    if (!this.form.amount || !this.form.source || !this.form.account || !this.form.date) {
      return;
    }

    this.saving.set(true);

    const formattedDate = this.formatTransactionDate(this.form.date);

    const newTx: Transaction = {
      id: 'TXN/' + this.form.source.trim().replace(/\s+/g, '_') + '/' + Date.now(),
      date: formattedDate,
      amount: String(this.form.amount),
      source: this.form.source.trim(),
      account: this.form.account.trim(),
      created: formattedDate,
      transactionType: this.form.transactionType,
      displayName: this.form.displayName.trim() || undefined,
      category: this.form.category.trim() || undefined,
    };

    this.txService.addTransaction(newTx).subscribe({
      next: () => {
        this.toastService.show('Transaction added successfully!');
        this.saving.set(false);
        this.router.navigate(['/search']); // redirect to Search view to show it
      },
      error: () => {
        this.toastService.show('Failed to add transaction.');
        this.saving.set(false);
      }
    });
  }
}
