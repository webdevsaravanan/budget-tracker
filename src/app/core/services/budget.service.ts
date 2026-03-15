import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Budget, BudgetApiResponse, BudgetStats } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly API = 'https://api.npoint.io/28daca92ce54a38ab4bb';
  private http = inject(HttpClient);

  private _budget$  = new BehaviorSubject<Budget | null>(null);
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _saving$  = new BehaviorSubject<boolean>(false);

  readonly budget$  = this._budget$.asObservable();
  readonly loading$ = this._loading$.asObservable();
  readonly saving$  = this._saving$.asObservable();

  // ── Fetch ────────────────────────────────────────────
  load(): Observable<BudgetApiResponse> {
    this._loading$.next(true);
    return this.http.get<BudgetApiResponse>(this.API).pipe(
      tap(res => {
        this._budget$.next(res.budget ?? null);
        this._loading$.next(false);
      }),
    );
  }

  get snapshot(): Budget | null {
    return this._budget$.getValue();
  }

  // ── Save ─────────────────────────────────────────────
  save(amount: number, days: number): Observable<BudgetApiResponse> {
    this._saving$.next(true);
    const budget: Budget = {
      amount,
      days,
      startDate: new Date().toISOString(),
    };
    return this.http.post<BudgetApiResponse>(this.API, { budget }).pipe(
      tap(() => {
        this._budget$.next(budget);
        this._saving$.next(false);
      }),
    );
  }

  // ── Delete ───────────────────────────────────────────
  delete(): Observable<BudgetApiResponse> {
    this._saving$.next(true);
    return this.http.post<BudgetApiResponse>(this.API, { budget: null }).pipe(
      tap(() => {
        this._budget$.next(null);
        this._saving$.next(false);
      }),
    );
  }

  // ── Computed stats ───────────────────────────────────
  computeStats(totalDebit: number): BudgetStats | null {
    const budget = this.snapshot;
    if (!budget) return null;

    const remaining    = Math.max(0, budget.amount - totalDebit);
    const daysLeft     = this.getRemainingDays();
    const safePerDay   = daysLeft > 0 ? remaining / daysLeft : 0;
    const percentSpent = Math.min((totalDebit / budget.amount) * 100, 100);
    const isOver       = totalDebit > budget.amount;

    return { totalDebit, remaining, daysLeft, safePerDay, percentSpent, isOver };
  }

  getRemainingDays(): number {
  const b = this.snapshot;
  if (!b) return 0;

  // Normalise both dates to midnight so we count calendar days,
  // not hours — this makes the number decrease by 1 each new day.
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = new Date(b.startDate);
  const endMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + b.days);

  const diffMs   = endMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  return Math.max(0, diffDays);
}

  getDailyAllowance(amount: number, days: number): number {
    return days > 0 ? amount / days : 0;
  }
}
