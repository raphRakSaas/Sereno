import { Routes } from '@angular/router';
import { onboardingGuard } from './presentation/guards/onboarding.guard';
import { startScreenGuard } from './presentation/guards/start-screen.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [onboardingGuard, startScreenGuard],
    loadComponent: () => import('./presentation/templates/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Sereno',
    data: { rootTab: 'dashboard', fab: true },
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
    data: { rootTab: 'transactions', fab: true },
  },
  {
    path: 'transactions/nouvelle',
    loadComponent: () =>
      import('./presentation/templates/transaction-edit/transaction-edit.page').then((m) => m.TransactionEditPage),
    title: 'Ajouter — Sereno',
    data: { headerTitle: 'Ajouter' },
  },
  {
    path: 'transactions/:id',
    loadComponent: () =>
      import('./presentation/templates/transaction-edit/transaction-edit.page').then((m) => m.TransactionEditPage),
    title: 'Modifier — Sereno',
    data: { headerTitle: 'Modifier' },
  },
  {
    path: 'budgets',
    loadComponent: () => import('./presentation/templates/budgets/budgets.page').then((m) => m.BudgetsPage),
    title: 'Budgets — Sereno',
    data: { rootTab: 'budgets' },
  },
  {
    path: 'statistiques',
    loadComponent: () =>
      import('./presentation/templates/statistics/statistics.page').then((m) => m.StatisticsPage),
    title: 'Statistiques — Sereno',
    data: { rootTab: 'statistiques' },
  },
  {
    path: 'calendrier',
    loadComponent: () =>
      import('./presentation/templates/calendar/calendar.page').then((m) => m.CalendarPage),
    title: 'Calendrier — Sereno',
    data: { headerTitle: 'Calendrier' },
  },
  {
    path: 'transferts/nouveau',
    loadComponent: () =>
      import('./presentation/templates/transfer-edit/transfer-edit.page').then((m) => m.TransferEditPage),
    title: 'Transfert — Sereno',
    data: { headerTitle: 'Virement' },
  },
  {
    path: 'transferts/:id',
    loadComponent: () =>
      import('./presentation/templates/transfer-edit/transfer-edit.page').then((m) => m.TransferEditPage),
    title: 'Modifier le virement — Sereno',
    data: { headerTitle: 'Virement' },
  },
  {
    path: 'menu',
    loadComponent: () => import('./presentation/templates/menu/menu.page').then((m) => m.MenuPage),
    title: 'Plus — Sereno',
    data: { rootTab: 'menu' },
  },
  {
    path: 'reglages',
    loadComponent: () => import('./presentation/templates/settings/settings.page').then((m) => m.SettingsPage),
    title: 'Réglages — Sereno',
    data: { headerTitle: 'Réglages' },
  },
  {
    path: 'compte',
    loadComponent: () => import('./presentation/templates/auth/auth.page').then((m) => m.AuthPage),
    title: 'Ton compte — Sereno',
  },
  {
    path: 'comptes',
    loadComponent: () => import('./presentation/templates/accounts/accounts.page').then((m) => m.AccountsPage),
    title: 'Comptes — Sereno',
    data: { headerTitle: 'Comptes' },
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./presentation/templates/categories/categories.page').then((m) => m.CategoriesPage),
    title: 'Catégories — Sereno',
    data: { headerTitle: 'Catégories' },
  },
  {
    path: 'recurrences',
    loadComponent: () =>
      import('./presentation/templates/recurring/recurring.page').then((m) => m.RecurringPage),
    title: 'Récurrences — Sereno',
    data: { headerTitle: 'Récurrences' },
  },
  {
    path: 'modeles',
    loadComponent: () =>
      import('./presentation/templates/templates/templates.page').then((m) => m.TemplatesPage),
    title: 'Modèles — Sereno',
    data: { headerTitle: 'Modèles' },
  },
  {
    path: 'echeances',
    loadComponent: () =>
      import('./presentation/templates/installments/installments.page').then((m) => m.InstallmentsPage),
    title: 'Échéances — Sereno',
    data: { headerTitle: 'Échéances' },
  },
  {
    path: 'objectif',
    loadComponent: () =>
      import('./presentation/templates/savings-goal/savings-goal.page').then((m) => m.SavingsGoalPage),
    title: 'Objectif — Sereno',
    data: { headerTitle: 'Objectif' },
  },
  { path: '**', redirectTo: '' },
];
