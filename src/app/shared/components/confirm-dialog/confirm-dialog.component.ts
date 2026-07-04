import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-[10000] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
           (click)="onCancel()">
        <div class="w-full max-w-[340px] bg-surface rounded-[28px] border border-white/10 p-6 flex flex-col gap-5 animate-pop-in shadow-2xl"
             (click)="$event.stopPropagation()">
          
          <div class="text-center flex flex-col items-center">
            <!-- Icon based on type -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3"
                 [ngClass]="{
                   'bg-debit/10 text-debit border border-debit/20': type === 'danger',
                   'bg-accent/10 text-accent border border-accent/20': type === 'primary',
                   'bg-credit/10 text-credit border border-credit/20': type === 'success'
                 }">
              {{ type === 'danger' ? '⚠️' : type === 'success' ? '✅' : '❓' }}
            </div>
            
            <h3 class="text-base font-bold text-white mb-2">{{ title }}</h3>
            <p class="text-xs text-muted leading-relaxed px-2">{{ message }}</p>
          </div>

          <div class="flex gap-3 mt-2">
            <button (click)="onCancel()"
                    class="btn-ghost flex-1 py-3 text-xs font-semibold tracking-wider uppercase rounded-2xl">
              {{ cancelText }}
            </button>
            <button (click)="onConfirm()"
                    [ngClass]="{
                      'bg-debit hover:bg-debit/80': type === 'danger',
                      'bg-accent hover:bg-accent/80': type === 'primary',
                      'bg-credit hover:bg-credit/80': type === 'success'
                    }"
                    class="flex-1 py-3 text-xs font-semibold tracking-wider uppercase text-white rounded-2xl transition-all duration-200">
              {{ confirmText }}
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
      0% { transform: scale(0.92); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'primary' | 'success' = 'primary';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
