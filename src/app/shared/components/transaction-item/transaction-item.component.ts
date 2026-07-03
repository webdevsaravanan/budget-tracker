import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tx-item" (click)="edit.emit(tx)">
      <!-- Icon -->
      <div class="tx-icon" [ngClass]="meta.cls">
        {{ meta.icon }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-sm font-semibold text-white truncate">{{ displayName }}</span>
          @if (tx.category) {
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/20 tracking-wider uppercase flex-shrink-0">
              {{ tx.category }}
            </span>
          }
        </div>
        <div class="text-[11px] text-muted font-mono mt-0.5">{{ tx.account }}</div>
      </div>

      <!-- Amount + date -->
      <div class="text-right flex-shrink-0">
        <div class="text-sm font-bold font-mono"
             [class.text-debit]="tx.transactionType === 'debit'"
             [class.text-credit]="tx.transactionType === 'credit'">
          {{ tx.transactionType === 'debit' ? '-' : '+' }}₹{{ tx.amount | number:'1.0-2' }}
        </div>
        <div class="text-[11px] text-muted mt-0.5">{{ displayDate }}</div>
      </div>
    </div>
  `,
})
export class TransactionItemComponent {
  @Input({ required: true }) tx!: Transaction;
  @Output() edit = new EventEmitter<Transaction>();

  private txService = inject(TransactionService);

  get meta()        { return this.txService.getIconMeta(this.tx); }
  get displayName() { return this.txService.getDisplayName(this.tx); }
  get displayDate() { return this.txService.formatDisplayDate(this.tx.date); }
}
