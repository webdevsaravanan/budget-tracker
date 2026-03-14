import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  text:  string;
  type:  'success' | 'error' | 'info';
  id:    number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  show(text: string, type: ToastMessage['type'] = 'info') {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { text, type, id }]);
    setTimeout(() => this.dismiss(id), 3200);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(m => m.id !== id));
  }
}
