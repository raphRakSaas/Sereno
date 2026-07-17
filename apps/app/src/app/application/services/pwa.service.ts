import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Vue affichée dans la feuille d'installation mobile. */
export type InstallSheetView = 'choice' | 'ios-steps' | 'manual-steps';

const INSTALL_SNOOZE_KEY = 'sereno.pwa.installSnoozedUntil';
const UPDATE_DISMISSED_KEY = 'sereno.pwa.updateDismissedHash';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private pendingVersionHash: string | null = null;

  readonly isStandalone = signal(false);
  readonly canNativeInstall = signal(false);
  /** Feuille « télécharger ou navigateur » sur mobile. */
  readonly showInstallSheet = signal(false);
  readonly installSheetView = signal<InstallSheetView>('choice');
  readonly showUpdateBanner = signal(false);
  readonly installing = signal(false);

  init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isStandalone.set(this.detectStandalone());

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canNativeInstall.set(true);
      this.maybeShowInstallSheet();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canNativeInstall.set(false);
      this.showInstallSheet.set(false);
      this.installing.set(false);
      this.isStandalone.set(true);
    });

    // ?install=1 force la feuille même après un « Continuer dans le navigateur ».
    const forceInstall = new URLSearchParams(window.location.search).has('install');
    if (forceInstall) {
      localStorage.removeItem(INSTALL_SNOOZE_KEY);
      this.installSheetView.set('choice');
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('install');
      window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }

    // Sur mobile, proposer le choix dès l'arrivée (sans attendre BIP).
    queueMicrotask(() => this.maybeShowInstallSheet());
  }

  initUpdates(swUpdate: SwUpdate): void {
    if (!swUpdate.isEnabled) {
      return;
    }

    void swUpdate.checkForUpdate();

    swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe((event) => {
        const versionHash = event.latestVersion.hash;
        this.pendingVersionHash = versionHash;
        const dismissed = localStorage.getItem(UPDATE_DISMISSED_KEY);
        if (dismissed !== versionHash) {
          this.showUpdateBanner.set(true);
        }
      });

    window.setInterval(() => {
      void swUpdate.checkForUpdate();
    }, 6 * 60 * 60 * 1000);
  }

  /** Choix « Télécharger l'application » → install native, guide iOS, ou menu navigateur. */
  async chooseInstall(): Promise<void> {
    if (this.deferredPrompt) {
      this.installing.set(true);
      try {
        await this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          // Chrome ouvre souvent l'app installée tout seul après acceptation.
          this.showInstallSheet.set(false);
        } else {
          this.installSheetView.set('choice');
        }
      } finally {
        this.deferredPrompt = null;
        this.canNativeInstall.set(false);
        this.installing.set(false);
      }
      return;
    }

    if (this.isIosDevice()) {
      this.installSheetView.set('ios-steps');
      return;
    }

    this.installSheetView.set('manual-steps');
  }

  /** Choix « Continuer dans le navigateur ». */
  continueInBrowser(snoozeDays = 14): void {
    this.showInstallSheet.set(false);
    this.installSheetView.set('choice');
    localStorage.setItem(INSTALL_SNOOZE_KEY, String(Date.now() + snoozeDays * 86_400_000));
  }

  /** Retour à l'écran de choix depuis un guide d'installation. */
  backToChoice(): void {
    this.installSheetView.set('choice');
  }

  /** Relance manuelle depuis Réglages. */
  openInstallSheet(): void {
    if (this.isStandalone()) {
      return;
    }
    this.installSheetView.set('choice');
    this.showInstallSheet.set(true);
  }

  async promptInstall(): Promise<void> {
    await this.chooseInstall();
  }

  dismissInstall(snoozeDays = 14): void {
    this.continueInBrowser(snoozeDays);
  }

  async applyUpdate(swUpdate: SwUpdate): Promise<void> {
    await swUpdate.activateUpdate();
    this.showUpdateBanner.set(false);
    document.location.reload();
  }

  dismissUpdate(): void {
    this.showUpdateBanner.set(false);
    if (this.pendingVersionHash) {
      localStorage.setItem(UPDATE_DISMISSED_KEY, this.pendingVersionHash);
    }
  }

  isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || this.isIpadOs();
  }

  isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true;
    }
    return this.isIpadOs();
  }

  private maybeShowInstallSheet(): void {
    if (this.isStandalone() || this.isInstallSnoozed()) {
      this.showInstallSheet.set(false);
      return;
    }
    // Desktop : pas de feuille intrusive — l'install reste dans Réglages.
    // Mobile : choix « télécharger / navigateur » dès l'arrivée.
    if (this.isMobileDevice()) {
      this.showInstallSheet.set(true);
    }
  }

  private isInstallSnoozed(): boolean {
    const raw = localStorage.getItem(INSTALL_SNOOZE_KEY);
    return raw !== null && Number(raw) > Date.now();
  }

  private detectStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private isIpadOs(): boolean {
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }
}
