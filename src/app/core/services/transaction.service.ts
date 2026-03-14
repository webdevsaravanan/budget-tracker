import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Transaction, TransactionFilter } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly API = 'https://api.npoint.io/e38b788a1721f85a81b3';
  private http = inject(HttpClient);

  private _transactions$ = new BehaviorSubject<Transaction[]>([]);
  private _loading$      = new BehaviorSubject<boolean>(false);

  readonly transactions$ = this._transactions$.asObservable();
  readonly loading$      = this._loading$.asObservable();

  // ── Fetch ────────────────────────────────────────────
  load(): Observable<Transaction[]> {
    this._loading$.next(true);
    return this.http.get<Transaction[]>(this.API).pipe(
      tap(txs => {
        this._transactions$.next(txs);
        this._loading$.next(false);
      }),
    );
  }

  // ── Derived helpers ──────────────────────────────────
  get snapshot(): Transaction[] {
    return this._transactions$.getValue();
  }

  getAccounts(): string[] {
    return [...new Set(this.snapshot.map(t => t.account))];
  }

  getAvailableMonths(): string[] {
    const months = new Set(this.snapshot.map(t => {
      const d = this.parseDate(t.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }));
    return [...months].sort().reverse();
  }

  getTotalDebit(transactions?: Transaction[]): number {
    const list = transactions ?? this.snapshot;
    return list
      .filter(t => t.transactionType === 'debit')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
  }

  getTotalCredit(transactions?: Transaction[]): number {
    const list = transactions ?? this.snapshot;
    return list
      .filter(t => t.transactionType === 'credit')
      .reduce((s, t) => s + parseFloat(t.amount), 0);
  }

  filterByMonth(month: string): Transaction[] {
    if (!month) return this.snapshot;
    return this.snapshot.filter(t => {
      const d = this.parseDate(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === month;
    });
  }

  applyFilters(f: TransactionFilter): Transaction[] {
    let list = [...this.snapshot];

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      );
    }

    if (f.date) {
      list = list.filter(t => {
        const d = this.parseDate(t.date);
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return ds === f.date;
      });
    }

    if (f.month) {
      list = list.filter(t => {
        const d = this.parseDate(t.date);
        return String(d.getMonth() + 1).padStart(2, '0') === f.month;
      });
    }

    if (f.type !== 'all') {
      list = list.filter(t => t.transactionType === f.type);
    }

    if (f.accounts.size > 0) {
      list = list.filter(t => f.accounts.has(t.account));
    }

    return list.sort((a, b) => this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime());
  }

  getRecent(limit = 8, month = ''): Transaction[] {
    const list = month ? this.filterByMonth(month) : this.snapshot;
    return [...list]
      .sort((a, b) => this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime())
      .slice(0, limit);
  }

  // ── Date parsing ─────────────────────────────────────
  parseDate(dateStr: string): Date {
    try {
      const [datePart, timePart] = dateStr.split(', ');
      const [d, m, y] = datePart.split('-');
      const iso = `20${y}-${m}-${d}` + (timePart ? `T${timePart}` : '');
      return new Date(iso);
    } catch {
      return new Date();
    }
  }

  formatDisplayDate(dateStr: string): string {
    const d = this.parseDate(dateStr);
    const now = new Date();
    const today   = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
    const txDay   = new Date(d.getFullYear(),    d.getMonth(),    d.getDate());
    const diffMs  = today.getTime() - txDay.getTime();

    if (diffMs === 0) {
      const [, timePart] = dateStr.split(', ');
      const [h, min]     = timePart.split(':');
      const hr = parseInt(h, 10);
      const suffix = hr >= 12 ? 'PM' : 'AM';
      const h12    = hr % 12 || 12;
      return `Today, ${h12}:${min} ${suffix}`;
    }
    if (diffMs === 86_400_000) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  getIconMeta(tx: Transaction): { icon: string; cls: string } {
    if (tx.transactionType === 'credit') return { icon: '↙', cls: 'credit' };
    const id = tx.id.toLowerCase();
    if (id.includes('p2a') || id.includes('upi')) return { icon: '⇄', cls: 'transfer' };
    return { icon: '↗', cls: 'debit' };
  }

  getDisplayName(tx: Transaction): string {
    const parts = tx.id.split('/');
    const last  = parts[parts.length - 1];
    return last.length > 2 ? last.replace(/_/g, ' ') : tx.id;
  }
}
