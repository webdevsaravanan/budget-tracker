import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';

import { TransactionService } from '../../core/services/transaction.service';
import { BudgetService }      from '../../core/services/budget.service';
import { TrackStockService }  from '../../core/services/track-stock.service';
import { CircularProgressComponent } from '../../shared/components/circular-progress/circular-progress.component';
import { TransactionItemComponent }  from '../../shared/components/transaction-item/transaction-item.component';
import { EditDisplayNameComponent } from '../../shared/components/edit-display-name/edit-display-name.component';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CircularProgressComponent, TransactionItemComponent, EditDisplayNameComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private txService     = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private trackStockService = inject(TrackStockService);
  private router        = inject(Router);

  loading        = signal(true);
  selectedMonth  = signal('');
  availableMonths = signal<string[]>([]);

  selectedTx = signal<Transaction | null>(null);
  isEditing  = signal(false);

  stockSymbol = 'PGINVIT.BSE';
  stockPrice = 94.03;
  activeChartIndex = 0;

  get budget()       { return this.budgetService.snapshot; }
  get transactions() { return this.txService.snapshot; }

  get chartsOrder(): ('budget' | 'stock')[] {
    if (this.notinvestedAmount >= this.stockPrice) {
      return ['stock', 'budget'];
    }
    return ['budget', 'stock'];
  }

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
      this.trackStockService.getStockQuote().pipe(
        catchError(err => {
          console.error('Error loading stock quote:', err);
          return of({ symbol: 'PGINVIT.BSE', price: 94.03 });
        })
      )
    ]).subscribe(([_, __, stock]) => {
      this.stockSymbol = stock.symbol;
      this.stockPrice = stock.price;

      const months = this.txService.getAvailableMonths();
      this.availableMonths.set(months);

      // default to current month if available
      const now = new Date();
      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.selectedMonth.set(months.includes(curKey) ? curKey : (months[0] ?? ''));
      this.loading.set(false);
    });
  }

  get notinvestedAmount(): number {
    return this.filteredTx
      .filter(t => t.investable !== false && !t.invested)
      .reduce((sum, t) => {
        const amt = parseFloat(t.amount) || 0;
        return sum + Math.round(amt * 0.1);
      }, 0);
  }

  get purchasableShares(): number {
    if (this.stockPrice <= 0) return 0;
    return Math.floor(this.notinvestedAmount / this.stockPrice);
  }

  get stockProgress(): number {
    if (this.stockPrice <= 0) return 0;
    if (this.notinvestedAmount >= this.stockPrice) {
      return 1.0;
    }
    return this.notinvestedAmount / this.stockPrice;
  }

  get stockStrokeColor(): string {
    return this.notinvestedAmount >= this.stockPrice ? '#32d583' : '#ff5f5f';
  }

  get stockDotColor(): string {
    return this.notinvestedAmount >= this.stockPrice ? '#32d583' : '#f5c842';
  }

  onChartScroll(event: Event) {
    const element = event.target as HTMLElement;
    const width = element.clientWidth;
    if (width > 0) {
      this.activeChartIndex = Math.round(element.scrollLeft / width);
    }
  }

  selectMonth(key: string) {
    this.selectedMonth.set(key);
  }

  goSearch() { this.router.navigate(['/search']); }

  onStockChartClick() {
    const isGreen = this.notinvestedAmount >= this.stockPrice;
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isGreen && isAndroid) {
      window.location.href = 'intent://#Intent;package=com.zerodha.kite3;scheme=kite;end;';
    } else {
      this.router.navigate(['/investable-transaction']);
    }
  }

  openEdit(tx: Transaction) {
    this.selectedTx.set(tx);
    this.isEditing.set(true);
  }

  closeEdit() {
    this.isEditing.set(false);
    this.selectedTx.set(null);
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
