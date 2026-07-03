import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionItemComponent } from '../../shared/components/transaction-item/transaction-item.component';
import { EditDisplayNameComponent } from '../../shared/components/edit-display-name/edit-display-name.component';
import { Transaction, TransactionFilter } from '../../core/models/transaction.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionItemComponent, EditDisplayNameComponent],
  templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
  private txService = inject(TransactionService);

  loading  = signal(true);
  results  = signal<Transaction[]>([]);
  displayedResults = signal<Transaction[]>([]);
  showFilters = signal(false);

  selectedTx = signal<Transaction | null>(null);
  isEditing  = signal(false);
  accounts = signal<string[]>([]);
  dateMode: 'today' | 'all' | 'custom' = 'today';

  categories = signal<string[]>([]);
  pageSize = 15;
  currentPage = 1;

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  filter: TransactionFilter = {
    query:    '',
    date:     '',
    month:    '',
    category: '',
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

  getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  ngOnInit() {
      this.txService.load().subscribe(() => this.init());
  }

  private init() {
    this.accounts.set(this.txService.getAccounts());
    this.categories.set(this.txService.getCategories());
    this.filter.date = this.getTodayString();
    this.applyFilters();
    this.loading.set(false);
  }

  applyFilters() {
    this.results.set(this.txService.applyFilters(this.filter));
    this.currentPage = 1;
    this.updateDisplayedResults();
  }

  updateDisplayedResults() {
    const limit = this.currentPage * this.pageSize;
    this.displayedResults.set(this.results().slice(0, limit));
  }

  loadNextPage() {
    if (this.displayedResults().length >= this.results().length) {
      return;
    }
    this.currentPage++;
    this.updateDisplayedResults();
  }

  onResultsScroll(event: Event) {
    const element = event.target as HTMLElement;
    const threshold = 150;
    const position = element.scrollTop + element.clientHeight;
    const height = element.scrollHeight;
    
    if (position >= height - threshold) {
      this.loadNextPage();
    }
  }

  onDateModeChange(mode: 'today' | 'all' | 'custom') {
    this.dateMode = mode;
    this.filter.month = ''; // Clear month as they are mutually exclusive

    if (mode === 'today') {
      this.filter.date = this.getTodayString();
    } else if (mode === 'all') {
      this.filter.date = '';
    } else if (mode === 'custom') {
      this.filter.date = this.getTodayString(); // Default to today in picker
    }
    this.applyFilters();
  }

  onMonthChange() {
    if (this.filter.month) {
      this.dateMode = 'all';
      this.filter.date = '';
    }
    this.applyFilters();
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
    this.dateMode = 'today';
    this.filter = { 
      query: '', 
      date: this.getTodayString(), 
      month: '', 
      category: '',
      type: 'all', 
      accounts: new Set() 
    };
    this.applyFilters();
  }

  get totalDebit(): number {
    return this.txService.getTotalDebit(this.results());
  }

  get totalCredit(): number {
    return this.txService.getTotalCredit(this.results());
  }

  get hasActiveFilters(): boolean {
    return !!(this.filter.query || this.dateMode !== 'today' || this.filter.month ||
              this.filter.category || this.filter.type !== 'all' || this.filter.accounts.size > 0);
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
