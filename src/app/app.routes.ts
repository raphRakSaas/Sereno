import { Routes } from '@angular/router';
import { cloudOnlyGuard } from './presentation/guards/cloud-only.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./presentation/templates/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Sereno',
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./presentation/templates/transactions/transactions.page').then((m) => m.TransactionsPage),
    title: 'Transactions — Sereno',
  },
  {
    path: 'transactions/nouvelle',
    loadComponent: () =>
      import('./presentation/templates/transaction-edit/transaction-edit.page').then((m) => m.TransactionEditPage),
    title: 'Ajouter — Sereno',
  },
  {
    path: 'transactions/:id',
    loadComponent: () =>
      import('./presentation/templates/transaction-edit/transaction-edit.page').then((m) => m.TransactionEditPage),
    title: 'Modifier — Sereno',
  },
  {
    path: 'budgets',
    loadComponent: () => import('./presentation/templates/budgets/budgets.page').then((m) => m.BudgetsPage),
    title: 'Budgets — Sereno',
  },
  {
    path: 'reglages',
    loadComponent: () => import('./presentation/templates/settings/settings.page').then((m) => m.SettingsPage),
    title: 'Réglages — Sereno',
  },
  {
    path: 'compte',
    loadComponent: () => import('./presentation/templates/auth/auth.page').then((m) => m.AuthPage),
    title: 'Ton compte — Sereno',
  },
  {
    path: 'comptes',
    loadComponent: () => import('./presentation/templates/accounts/accounts.page').then((m) => m.AccountsPage),
    canActivate: [cloudOnlyGuard('les comptes multiples')],
    title: 'Comptes — Sereno',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./presentation/templates/categories/categories.page').then((m) => m.CategoriesPage),
    canActivate: [cloudOnlyGuard('les catégories personnalisées')],
    title: 'Catégories — Sereno',
  },
  {
    path: 'recurrences',
    loadComponent: () =>
      import('./presentation/templates/recurring/recurring.page').then((m) => m.RecurringPage),
    canActivate: [cloudOnlyGuard('les récurrences')],
    title: 'Récurrences — Sereno',
  },
  { path: '**', redirectTo: '' },
];
