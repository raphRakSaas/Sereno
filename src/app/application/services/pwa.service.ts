import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_SNOOZE_KEY = 'sereno.pwa.installSnoozedUntil';
const UPDATE_DISMISSED_KEY = 'sereno.pwa.updateDismissedHash';
const IOS_HINT_DISMISSED_KEY = 'sereno.pwa.iosHintDismissed';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private pendingVersionHash: string | null = null;

  readonly isStandalone = signal(false);
  readonly canNativeInstall = signal(false);
  readonly showInstallBanner = signal(false);
  readonly showIosHint = signal(false);
  readonly showUpdateBanner = signal(false);

  init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isStandalone.set(this.detectStandalone());

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canNativeInstall.set(true);
      this.refreshInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canNativeInstall.set(false);
      this.showInstallBanner.set(false);
      this.isStandalone.set(true);
    });

    // iOS / Safari : pas de beforeinstallprompt — proposition manuelle après un court délai.
    queueMicrotask(() => {
      if (!this.isStandalone() && this.isIosSafari() && !this.isIosHintDismissed()) {
        this.showIosHint.set(true);
      }
      this.refreshInstallPrompt();
    });
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

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }
    await this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      this.showInstallBanner.set(false);
    }
    this.deferredPrompt = null;
    this.canNativeInstall.set(false);
  }

  dismissInstall(snoozeDays = 7): void {
    this.showInstallBanner.set(false);
    localStorage.setItem(INSTALL_SNOOZE_KEY, String(Date.now() + snoozeDays * 86_400_000));
  }

  dismissIosHint(): void {
    this.showIosHint.set(false);
    localStorage.setItem(IOS_HINT_DISMISSED_KEY, '1');
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
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  refreshInstallPrompt(): void {
    if (this.isStandalone() || this.isInstallSnoozed()) {
      this.showInstallBanner.set(false);
      return;
    }
    if (this.deferredPrompt) {
      this.showInstallBanner.set(true);
    }
  }

  private isInstallSnoozed(): boolean {
    const raw = localStorage.getItem(INSTALL_SNOOZE_KEY);
    return raw !== null && Number(raw) > Date.now();
  }

  private isIosHintDismissed(): boolean {
    return localStorage.getItem(IOS_HINT_DISMISSED_KEY) === '1';
  }

  private detectStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private isIosSafari(): boolean {
    const userAgent = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
    return isIos && isSafari;
  }
}
