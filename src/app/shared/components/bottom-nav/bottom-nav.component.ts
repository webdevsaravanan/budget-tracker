import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path:  string;
  icon:  string;
  label: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                bg-surface/95 backdrop-blur-xl border-t border-white/5
                flex items-center px-4 pt-3 pb-8 z-50">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive="active-nav"
           [routerLinkActiveOptions]="{ exact: item.path === '' }"
           #rla="routerLinkActive"
           class="flex-1 flex flex-col items-center gap-1 cursor-pointer
                  py-1.5 px-3 rounded-2xl transition-all duration-200
                  no-underline group">
          <span class="text-2xl transition-transform duration-200"
                [class.translate-y-[-2px]]="rla.isActive">
            {{ item.icon }}
          </span>
          <span class="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                [class.text-accent]="rla.isActive"
                [class.text-muted]="!rla.isActive">
            {{ item.label }}
          </span>
          <div class="w-1 h-1 rounded-full bg-accent transition-opacity duration-200"
               [class.opacity-100]="rla.isActive"
               [class.opacity-0]="!rla.isActive">
          </div>
        </a>
      }
    </nav>
  `,
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    { path: '',       icon: '🏠', label: 'Home'   },
    { path: 'search', icon: '🔍', label: 'Search' },
    { path: 'budget', icon: '💰', label: 'Budget' },
  ];
}
