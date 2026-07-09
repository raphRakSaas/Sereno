import { Routes } from '@angular/router';
import { cloudOnlyGuard } from './presentation/guards/cloud-only.guard';
import { onboardingGuard } from './presentation/guards/onboarding.guard';
import { startScreenGuard } from './presentation/guards/start-screen.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [onboardingGuard, startScreenGuard],
    loadComponent: () => import('./presentation/templates/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Sereno',
  },
  {
    path: 'bienvenue',
    loadComponent: () => import('./presentation/templates/onboarding/onboarding.page').then((m) => m.OnboardingPage),
    title: 'Bienvenue — Sereno',
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
    path: 'statistiques',
    loadComponent: () =>
      import('./presentation/templates/statistics/statistics.page').then((m) => m.StatisticsPage),
    title: 'Statistiques — Sereno',
  },
  {
    path: 'calendrier',
    loadComponent: () =>
      import('./presentation/templates/calendar/calendar.page').then((m) => m.CalendarPage),
    title: 'Calendrier — Sereno',
  },
  {
    path: 'transferts/nouveau',
    loadComponent: () =>
      import('./presentation/templates/transfer-edit/transfer-edit.page').then((m) => m.TransferEditPage),
    title: 'Transfert — Sereno',
  },
  {
    path: 'transferts/:id',
    loadComponent: () =>
      import('./presentation/templates/transfer-edit/transfer-edit.page').then((m) => m.TransferEditPage),
    title: 'Modifier le virement — Sereno',
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
  {
    path: 'modeles',
    loadComponent: () =>
      import('./presentation/templates/templates/templates.page').then((m) => m.TemplatesPage),
    title: 'Modèles — Sereno',
  },
  {
    path: 'echeances',
    loadComponent: () =>
      import('./presentation/templates/installments/installments.page').then((m) => m.InstallmentsPage),
    title: 'Échéances — Sereno',
  },
  { path: '**', redirectTo: '' },
];
