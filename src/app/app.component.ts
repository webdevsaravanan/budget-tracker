import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent],
  template: `
    <div class="max-w-[430px] mx-auto min-h-screen bg-bg relative">
      <router-outlet />
      <app-bottom-nav />
      <app-toast />
    </div>
  `,
})
export class AppComponent {}
