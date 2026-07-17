import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { isDevMode } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PwaService } from '../../../application/services/pwa.service';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-pwa-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (pwa.showUpdateBanner()) {
      <div class="banner update" role="status">
        <app-icon name="cloud" [size]="18" />
        <p>Une mise à jour de Sereno est prête.</p>
        <button type="button" class="btn btn-primary" (click)="applyUpdate()">Mettre à jour</button>
        <button type="button" class="dismiss" (click)="pwa.dismissUpdate()" aria-label="Plus tard">×</button>
      </div>
    }

    @if (pwa.showInstallSheet()) {
      <div class="backdrop" (click)="pwa.continueInBrowser()"></div>
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        (click)="$event.stopPropagation()"
      >
        <div class="handle" aria-hidden="true"></div>

        @if (pwa.installSheetView() === 'choice') {
          <span class="mark">
            <app-icon name="home" [size]="26" />
          </span>
          <h2 id="pwa-install-title">Installer Sereno ?</h2>
          <p>
            Sur mobile, tu peux ajouter Sereno à ton écran d'accueil pour l'ouvrir comme une vraie
            application — même hors ligne — ou continuer dans le navigateur.
          </p>
          <button
            type="button"
            class="btn btn-primary btn-block"
            [disabled]="pwa.installing()"
            (click)="pwa.chooseInstall()"
          >
            {{ pwa.installing() ? 'Installation…' : "Télécharger l'application" }}
          </button>
          <button type="button" class="btn btn-ghost btn-block" (click)="pwa.continueInBrowser()">
            Continuer dans le navigateur
          </button>
        } @else if (pwa.installSheetView() === 'ios-steps') {
          <span class="mark">
            <app-icon name="plus" [size]="26" />
          </span>
          <h2 id="pwa-install-title">Ajoute Sereno à l'accueil</h2>
          <ol class="steps">
            <li>Touche <strong>Partager</strong> en bas de Safari</li>
            <li>Fais défiler et choisis <strong>Sur l'écran d'accueil</strong></li>
            <li>Confirme avec <strong>Ajouter</strong></li>
            <li>Ouvre ensuite l'icône Sereno depuis ton écran d'accueil</li>
          </ol>
          <p class="note">
            Safari ne permet pas d'installer automatiquement — ces quelques gestes suffisent, une
            seule fois.
          </p>
          <button type="button" class="btn btn-primary btn-block" (click)="pwa.continueInBrowser()">
            J'ai compris
          </button>
          <button type="button" class="btn btn-ghost btn-block" (click)="pwa.backToChoice()">
            Retour
          </button>
        } @else {
          <span class="mark">
            <app-icon name="plus" [size]="26" />
          </span>
          <h2 id="pwa-install-title">Installer depuis le navigateur</h2>
          <ol class="steps">
            <li>Ouvre le menu du navigateur (⋮ ou ≡)</li>
            <li>
              Choisis <strong>Installer l'application</strong> ou
              <strong>Ajouter à l'écran d'accueil</strong>
            </li>
            <li>Confirme, puis ouvre Sereno depuis ton écran d'accueil</li>
          </ol>
          <button type="button" class="btn btn-primary btn-block" (click)="pwa.continueInBrowser()">
            J'ai compris
          </button>
          <button type="button" class="btn btn-ghost btn-block" (click)="pwa.backToChoice()">
            Retour
          </button>
        }
      </div>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      left: 12px;
      right: 12px;
      z-index: 45;
      bottom: calc(var(--nav-height) + var(--space-3) + var(--safe-bottom));
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }
    .banner p {
      flex: 1;
      margin: 0;
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--ink-soft);
    }
    .banner .btn {
      flex-shrink: 0;
      padding: 8px 12px;
      font-size: 13px;
    }
    .dismiss {
      flex-shrink: 0;
      border: none;
      background: none;
      color: var(--ink-faint);
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      padding: 0 2px;
    }
    @media (min-width: 768px) {
      .banner {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        width: min(480px, calc(100% - 48px));
        bottom: 24px;
      }
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, var(--ink) 40%, transparent);
      z-index: 60;
    }
    .sheet {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      width: min(100%, 480px);
      background: var(--paper);
      border-radius: 24px 24px 0 0;
      padding: var(--space-5) var(--space-5) calc(var(--space-5) + var(--safe-bottom));
      z-index: 61;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      animation: rise 0.25s ease-out;
      box-sizing: border-box;
    }
    .handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--line);
      margin: 0 auto 4px;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: var(--accent-pale);
      color: var(--accent);
    }
    h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--ink);
    }
    p {
      margin: 0 0 var(--space-2);
      color: var(--ink-soft);
      font-size: 15px;
      line-height: 1.55;
    }
    .note {
      font-size: 13.5px;
      color: var(--ink-faint);
    }
    .steps {
      margin: 0 0 var(--space-2);
      padding-left: 1.25rem;
      color: var(--ink-soft);
      font-size: 15px;
      line-height: 1.55;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .steps strong {
      color: var(--ink);
      font-weight: 600;
    }
    @media (min-width: 768px) {
      .sheet {
        top: 50%;
        bottom: auto;
        transform: translate(-50%, -50%);
        width: min(calc(100% - 48px), 420px);
        border-radius: var(--radius-lg);
        padding: var(--space-6) var(--space-5);
        animation: dialog-in 0.22s ease-out;
      }
      .handle {
        display: none;
      }
    }
    @keyframes rise {
      from {
        transform: translate(-50%, 24px);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
    @keyframes dialog-in {
      from {
        transform: translate(-50%, calc(-50% + 14px));
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%);
        opacity: 1;
      }
    }
  `,
})
export class PwaBannerComponent {
  protected readonly pwa = inject(PwaService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  protected async applyUpdate(): Promise<void> {
    if (!this.swUpdate?.isEnabled || isDevMode()) {
      this.pwa.dismissUpdate();
      return;
    }
    await this.pwa.applyUpdate(this.swUpdate);
  }
}
