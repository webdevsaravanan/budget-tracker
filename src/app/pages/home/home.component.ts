import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService }      from '../../core/services/budget.service';
import { CircularProgressComponent } from '../../shared/components/circular-progress/circular-progress.component';
import { TransactionItemComponent }  from '../../shared/components/transaction-item/transaction-item.component';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CircularProgressComponent, TransactionItemComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private txService     = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private router        = inject(Router);

  loading        = signal(true);
  selectedMonth  = signal('');
  availableMonths = signal<string[]>([]);

  get budget()       { return this.budgetService.snapshot; }
  get transactions() { return this.txService.snapshot; }

  get filteredTx(): Transaction[] {
    return this.txService.filterByMonth(this.selectedMonth());
  }

  get totalDebit(): number {
    return this.txService.getTotalDebit(this.filteredTx);
  }

  get recentTx(): Transaction[] {
    return this.txService.getRecent(8, this.selectedMonth());
  }

  get stats() {
    return this.budgetService.computeStats(this.totalDebit);
  }

  get currentMonthLabel(): string {
    const m = this.selectedMonth();
    if (!m) return 'All Time';
    const [yr, mo] = m.split('-');
    return new Date(+yr, +mo - 1).toLocaleString('en-IN', { month: 'long' });
  }

  get monthChips(): { key: string; label: string }[] {
    return this.availableMonths().map(m => {
      const [yr, mo] = m.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      return { key: m, label };
    });
  }

  ngOnInit() {
    forkJoin([
      this.txService.load(),
      this.budgetService.load(),
    ]).subscribe(() => {
      const months = this.txService.getAvailableMonths();
      this.availableMonths.set(months);

      // default to current month if available
      const now = new Date();
      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.selectedMonth.set(months.includes(curKey) ? curKey : (months[0] ?? ''));
      this.loading.set(false);
    });
  }

  selectMonth(key: string) {
    this.selectedMonth.set(key);
  }

  goSearch() { this.router.navigate(['/search']); }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
