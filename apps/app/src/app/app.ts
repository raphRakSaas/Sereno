import { Component, computed, inject, isDevMode, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ConversionService } from './application/services/conversion.service';
import { KeyboardShortcutsService } from './application/services/keyboard-shortcuts.service';
import { PwaService } from './application/services/pwa.service';
import { ToastService } from './application/services/toast.service';
import { AccountsStore } from './application/stores/accounts.store';
import { CategoriesStore } from './application/stores/categories.store';
import { TransactionTemplatesStore } from './application/stores/transaction-templates.store';
import { TransactionsStore } from './application/stores/transactions.store';
import { PwaBannerComponent } from './presentation/molecules/pwa-banner/pwa-banner.component';
import { ThemeToggleComponent } from './presentation/atoms/theme-toggle/theme-toggle.component';
import { BottomNavComponent } from './presentation/organisms/bottom-nav/bottom-nav.component';
import { ConversionModalComponent } from './presentation/organisms/conversion-modal/conversion-modal.component';
import { SideNavComponent } from './presentation/organisms/side-nav/side-nav.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    BottomNavComponent,
    ConversionModalComponent,
    PwaBannerComponent,
    SideNavComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly toasts = inject(ToastService);
  private readonly conversion = inject(ConversionService);
  private readonly shortcuts = inject(KeyboardShortcutsService);
  private readonly pwa = inject(PwaService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly router = inject(Router);

  private readonly currentUrl = signal(this.router.url);

  /* Les pages plein écran (formulaires, connexion) portent leur propre bouton
     Fermer en haut à gauche : on y masque le switch flottant pour éviter tout
     recouvrement. */
  protected readonly showThemeToggle = computed(() => {
    const url = this.currentUrl().split('?')[0];
    const fullScreenRoutes = [
      /^\/transactions\/.+/,
      /^\/transferts\/.+/,
      /^\/compte$/,
    ];
    return !fullScreenRoutes.some((pattern) => pattern.test(url));
  });

  private readonly accounts = inject(AccountsStore);
  private readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);
  private readonly templates = inject(TransactionTemplatesStore);

  constructor() {
    // L'initializer (app.config) a déjà chargé les stores si une session
    // existait ; sinon on charge les données invité ici.
    if (!this.accounts.loaded()) void this.accounts.load();
    if (!this.categories.loaded()) void this.categories.load();
    if (!this.transactions.loaded()) void this.transactions.load();
    if (!this.templates.loaded()) void this.templates.load();

    // Déclencheur "14 jours d'utilisation" — vérifié à chaque démarrage.
    void this.conversion.checkQuotaTriggers();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));

    this.shortcuts.init();

    this.pwa.init();
    if (!isDevMode() && this.swUpdate?.isEnabled) {
      this.pwa.initUpdates(this.swUpdate);
    }
  }
}
