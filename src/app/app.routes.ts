import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'budget',
    loadComponent: () => import('./pages/budget/budget.component').then(m => m.BudgetComponent),
  },
  { path: '**', redirectTo: '' },
];
