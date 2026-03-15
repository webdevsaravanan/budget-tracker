import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionItemComponent } from '../../shared/components/transaction-item/transaction-item.component';
import { Transaction, TransactionFilter } from '../../core/models/transaction.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionItemComponent],
  templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
  private txService = inject(TransactionService);

  loading  = signal(true);
  results  = signal<Transaction[]>([]);
  accounts = signal<string[]>([]);

  filter: TransactionFilter = {
    query:    '',
    date:     '',
    month:    '',
    type:     'all',
    accounts: new Set(),
  };

  readonly months = [
    { value: '01', label: 'January' },   { value: '02', label: 'February' },
    { value: '03', label: 'March' },     { value: '04', label: 'April' },
    { value: '05', label: 'May' },       { value: '06', label: 'June' },
    { value: '07', label: 'July' },      { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' },  { value: '12', label: 'December' },
  ];

  ngOnInit() {
      this.txService.load().subscribe(() => this.init());
  }

  private init() {
    this.accounts.set(this.txService.getAccounts());
    this.applyFilters();
    this.loading.set(false);
  }

  applyFilters() {
    this.results.set(this.txService.applyFilters(this.filter));
  }

  setType(type: TransactionFilter['type']) {
    this.filter.type = type;
    this.applyFilters();
  }

  toggleAccount(acc: string) {
    if (this.filter.accounts.has(acc)) this.filter.accounts.delete(acc);
    else this.filter.accounts.add(acc);
    this.applyFilters();
  }

  clearFilters() {
    this.filter = { query: '', date: '', month: '', type: 'all', accounts: new Set() };
    this.applyFilters();
  }

  get totalDebit(): number {
    return this.txService.getTotalDebit(this.results());
  }

  get totalCredit(): number {
    return this.txService.getTotalCredit(this.results());
  }

  get hasActiveFilters(): boolean {
    return !!(this.filter.query || this.filter.date || this.filter.month ||
              this.filter.type !== 'all' || this.filter.accounts.size > 0);
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
