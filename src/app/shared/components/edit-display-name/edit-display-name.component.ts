import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionService } from '../../../core/services/transaction.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-edit-display-name',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && transaction) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300" 
           (click)="onClose()">
        
        <!-- Dialog Container -->
        <div class="w-full max-w-[380px] bg-surface rounded-[28px] border border-white/10 p-6 flex flex-col gap-5 animate-pop-in shadow-2xl" 
             (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white">Edit Details</h3>
              <p class="text-[11px] text-muted mt-0.5 font-mono truncate max-w-[260px]">ID: {{ transaction.id }}</p>
            </div>
            <button (click)="onClose()" 
                    class="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-white transition-colors"
                    aria-label="Close dialog">
              ✕
            </button>
          </div>

          <!-- Input Field -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Display Name 
              <span class="text-white/40 lowercase normal-case font-normal ml-1">
                (fallback: "{{ txService.getDisplayName(transaction) }}")
              </span>
            </label>
            <input 
              type="text" 
              class="form-input !font-sans text-sm" 
              placeholder="Enter custom display name" 
              [(ngModel)]="tempName"
              (keydown.enter)="onSave()"
              (keydown.escape)="onClose()"
              autofocus
            />
          </div>

          <!-- Category Field -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-semibold text-muted uppercase tracking-wider">Category</label>
            <input 
              type="text" 
              class="form-input !font-sans text-sm" 
              placeholder="e.g. Food, Utilities, Rent" 
              [(ngModel)]="tempCategory"
              (keydown.enter)="onSave()"
              (keydown.escape)="onClose()"
            />
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2.5 mt-2">
            <div class="flex gap-3">
              <button (click)="onClose()" 
                      [disabled]="isSaving || isDeleting"
                      class="btn-ghost flex-1 py-3.5 text-sm">
                Cancel
              </button>
              <button (click)="onSave()" 
                      [disabled]="isSaving || isDeleting"
                      class="btn-primary flex-1 py-3.5 text-sm flex items-center justify-center gap-2">
                @if (isSaving) {
                  <span class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                } @else {
                  <span>Save</span>
                }
              </button>
            </div>
            
            <button (click)="onDelete()" 
                    [disabled]="isSaving || isDeleting"
                    class="btn-danger w-full py-3.5 text-sm flex items-center justify-center gap-2">
              @if (isDeleting) {
                <span class="w-4 h-4 border-2 border-debit/20 border-t-debit rounded-full animate-spin"></span>
                <span>Deleting...</span>
              } @else {
                <span>🗑 Delete Transaction</span>
              }
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .animate-pop-in {
      animation: popIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes popIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class EditDisplayNameComponent implements OnChanges {
  @Input() transaction: Transaction | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  public txService = inject(TransactionService);
  private toastService = inject(ToastService);

  tempName = '';
  tempCategory = '';
  isSaving = false;
  isDeleting = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isOpen && this.transaction) {
      this.tempName = this.transaction.displayName || '';
      this.tempCategory = this.transaction.category || '';
      this.isSaving = false;
      this.isDeleting = false; // Reset deleting state when opened
    }
  }

  onClose(): void {
    if (this.isSaving || this.isDeleting) return;
    this.close.emit();
  }

  onSave(): void {
    if (!this.transaction || this.isSaving || this.isDeleting) return;

    const newName = this.tempName.trim();
    const newCategory = this.tempCategory.trim();

    this.isSaving = true;
    this.txService.saveTransactionDetails(this.transaction.id, newName, newCategory).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.show('Transaction details updated!', 'success');
        this.close.emit();
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.show('Failed to save changes', 'error');
        console.error('Error saving transaction details:', err);
      }
    });
  }

  onDelete(): void {
    if (!this.transaction || this.isSaving || this.isDeleting) return;

    if (confirm('Are you sure you want to delete this transaction?')) {
      this.isDeleting = true;
      this.txService.deleteTransaction(this.transaction.id).subscribe({
        next: () => {
          this.isDeleting = false;
          this.toastService.show('Transaction deleted successfully', 'success');
          this.close.emit();
        },
        error: (err) => {
          this.isDeleting = false;
          this.toastService.show('Failed to delete transaction', 'error');
          console.error('Error deleting transaction:', err);
        }
      });
    }
  }
}
