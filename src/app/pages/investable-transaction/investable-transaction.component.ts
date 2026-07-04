import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { EditDisplayNameComponent } from '../../shared/components/edit-display-name/edit-display-name.component';
import { Transaction } from '../../core/models/transaction.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-investable-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, EditDisplayNameComponent, ConfirmDialogComponent],
  templateUrl: './investable-transaction.component.html',
})
export class InvestableTransactionComponent implements OnInit {
  public txService = inject(TransactionService);

  loading = signal(true);
  results = signal<Transaction[]>([]);
  displayedResults = signal<Transaction[]>([]);

  totalInvestable = computed(() => {
    return this.results().reduce((sum, tx) => sum + this.getInvestableAmount(tx), 0);
  });

  totalInvested = computed(() => {
    return this.results()
      .filter(tx => tx.invested)
      .reduce((sum, tx) => sum + this.getInvestableAmount(tx), 0);
  });

  hasUninvestedFilteredTransactions = computed(() => {
    return this.results().some(tx => !tx.invested);
  });

  filterMonth = '';
  filterInvested: 'all' | 'yes' | 'no' = 'all';

  selectedTx = signal<Transaction | null>(null);
  isEditing = signal(false);
  isConfirmInvestAllOpen = false;

  pageSize = 15;
  currentPage = 1;

  readonly months = [
    { value: '01', label: 'January' },   { value: '02', label: 'February' },
    { value: '03', label: 'March' },     { value: '04', label: 'April' },
    { value: '05', label: 'May' },       { value: '06', label: 'June' },
    { value: '07', label: 'July' },      { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' },  { value: '12', label: 'December' },
  ];

  ngOnInit() {
    this.txService.transactions$.subscribe(() => {
      this.applyFilters();
    });

    this.txService.load().subscribe({
      next: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let list = this.txService.snapshot.filter(t => t.investable !== false);

    // Month filter
    if (this.filterMonth) {
      list = list.filter(t => {
        const d = this.txService.parseDate(t.date);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return m === this.filterMonth;
      });
    }

    // Invested filter
    if (this.filterInvested === 'yes') {
      list = list.filter(t => t.invested === true);
    } else if (this.filterInvested === 'no') {
      list = list.filter(t => !t.invested);
    }

    // Sort by date descending
    list.sort((a, b) => this.txService.parseDate(b.date).getTime() - this.txService.parseDate(a.date).getTime());

    this.results.set(list);
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

  setInvestedFilter(status: 'all' | 'yes' | 'no') {
    this.filterInvested = status;
    this.applyFilters();
  }

  getInvestableAmount(tx: Transaction): number {
    const amt = parseFloat(tx.amount) || 0;
    return Math.round(amt * 0.1);
  }



  openEdit(tx: Transaction) {
    this.selectedTx.set(tx);
    this.isEditing.set(true);
  }

  closeEdit() {
    this.isEditing.set(false);
    this.selectedTx.set(null);
  }

  getIconMeta(tx: Transaction) {
    return this.txService.getIconMeta(tx);
  }

  getDisplayName(tx: Transaction): string {
    return this.txService.getDisplayName(tx);
  }

  displayDate(dateStr: string): string {
    return this.txService.formatDisplayDate(dateStr);
  }

  fmt(n: number): string {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  markAllFilteredAsInvested() {
    this.isConfirmInvestAllOpen = true;
  }

  onInvestAllConfirmed() {
    this.isConfirmInvestAllOpen = false;
    const targets = this.results().filter(tx => !tx.invested);
    if (targets.length === 0) return;

    this.loading.set(true);
    const requests = targets.map(tx => {
      return this.txService.saveTransactionDetails(
        tx.id,
        this.txService.getDisplayName(tx),
        tx.category || '',
        tx.investable !== false,
        true
      );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.txService.load().subscribe({
          next: () => {
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error refreshing transactions:', err);
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error updating transactions:', err);
        this.loading.set(false);
        alert('Failed to update some transactions. Please try again.');
      }
    });
  }
}
