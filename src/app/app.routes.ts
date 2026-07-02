import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '' },
];
