import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="px-5 py-3 rounded-full text-sm font-semibold shadow-2xl border
                    backdrop-blur-xl animate-[fadeDown_0.3s_ease_forwards] whitespace-nowrap"
             [class]="toastClass(toast.type)">
          {{ toast.text }}
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-12px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)     scale(1); }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);

  toastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-credit/10 border-credit/30 text-credit';
      case 'error':   return 'bg-debit/10  border-debit/30  text-debit';
      default:        return 'bg-surface2  border-white/10  text-white';
    }
  }
}
