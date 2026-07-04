import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, of } from 'rxjs';
import { Transaction, TransactionFilter } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly API = 'https://expense-tracker-63640-default-rtdb.asia-southeast1.firebasedatabase.app/transactions.json';
  private http = inject(HttpClient);

  private _transactions$ = new BehaviorSubject<Transaction[]>([]);
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _saving$ = new BehaviorSubject<boolean>(false);

  readonly transactions$ = this._transactions$.asObservable();
  readonly loading$ = this._loading$.asObservable();
  readonly saving$ = this._saving$.asObservable();

  // ── Fetch ────────────────────────────────────────────
  load(): Observable<Transaction[]> {
    this._loading$.next(true);
    return this.http.get<Record<string, Transaction>>(this.API).pipe(
      map(res => {
        if (!res) return [];
        return Object.entries(res).map(([fbKey, tx]) => ({
          ...tx,
          fbKey
        }));
      }),
      tap(txs => {
        this._transactions$.next(txs);
        this._loading$.next(false);
      })
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
        this.getDisplayName(t).toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      );
    }

    if (f.startDate || f.endDate) {
      list = list.filter(t => {
        const d = this.parseDate(t.date);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (f.startDate && ds < f.startDate) return false;
        if (f.endDate && ds > f.endDate) return false;
        return true;
      });
    } else if (f.date) {
      list = list.filter(t => {
        const d = this.parseDate(t.date);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

    if (f.category) {
      list = list.filter(t => t.category === f.category);
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffMs = today.getTime() - txDay.getTime();

    if (diffMs === 0) {
      const [, timePart] = dateStr.split(', ');
      const [h, min] = timePart.split(':');
      const hr = parseInt(h, 10);
      const suffix = hr >= 12 ? 'PM' : 'AM';
      const h12 = hr % 12 || 12;
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
    if (tx.displayName) {
      return tx.displayName;
    }
    const parts = tx.id.split('/');
    const last = parts[parts.length - 1];
    return last.length > 2 ? last.replace(/_/g, ' ') : tx.id;
  }

  saveTransactionDetails(txId: string, displayName: string, category: string, investable: boolean, invested: boolean): Observable<Transaction[]> {
    this._saving$.next(true);
    const tx = this.snapshot.find(t => t.id === txId);
    if (!tx || !tx.fbKey) {
      this._saving$.next(false);
      return of(this.snapshot);
    }
    const url = this.API.replace('.json', `/${tx.fbKey}.json`);
    const payload = {
      displayName: displayName.trim(),
      category: category.trim() || null,
      investable,
      invested
    };
    return this.http.patch<any>(url, payload).pipe(
      map(() => {
        const updated = this.snapshot.map(t => {
          if (t.id === txId) {
            return {
              ...t,
              displayName: displayName.trim(),
              category: category.trim() || undefined,
              investable,
              invested
            };
          }
          return t;
        });
        this._transactions$.next(updated);
        this._saving$.next(false);
        return updated;
      })
    );
  }

  deleteTransaction(txId: string): Observable<Transaction[]> {
    this._saving$.next(true);
    const tx = this.snapshot.find(t => t.id === txId);
    if (!tx || !tx.fbKey) {
      this._saving$.next(false);
      return of(this.snapshot);
    }
    const url = this.API.replace('.json', `/${tx.fbKey}.json`);
    return this.http.delete<void>(url).pipe(
      map(() => {
        const updated = this.snapshot.filter(t => t.id !== txId);
        this._transactions$.next(updated);
        this._saving$.next(false);
        return updated;
      })
    );
  }

  clearAllTransactions(): Observable<Transaction[]> {
    this._saving$.next(true);
    return this.http.delete<void>(this.API).pipe(
      map(() => {
        const updated: Transaction[] = [];
        this._transactions$.next(updated);
        this._saving$.next(false);
        return updated;
      })
    );
  }

  addTransaction(tx: Transaction): Observable<Transaction[]> {
    this._saving$.next(true);
    return this.http.post<{ name: string }>(this.API, tx).pipe(
      map(res => {
        const newTx = { ...tx, fbKey: res.name };
        const updated = [newTx, ...this.snapshot];
        this._transactions$.next(updated);
        this._saving$.next(false);
        return updated;
      })
    );
  }

  getCategories(): string[] {
    return [...new Set(this.snapshot.map(t => t.category).filter(Boolean))] as string[];
  }
}
