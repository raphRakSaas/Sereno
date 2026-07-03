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
    } @else if (pwa.showInstallBanner()) {
      <div class="banner install" role="status">
        <app-icon name="cloud" [size]="18" />
        <p>Installe Sereno pour un accès rapide, même hors ligne.</p>
        <button type="button" class="btn btn-primary" (click)="pwa.promptInstall()">Installer</button>
        <button type="button" class="dismiss" (click)="pwa.dismissInstall()" aria-label="Plus tard">×</button>
      </div>
    } @else if (pwa.showIosHint()) {
      <div class="banner ios" role="status">
        <app-icon name="cloud" [size]="18" />
        <p>
          Sur iPhone : touche <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong> pour
          installer Sereno.
        </p>
        <button type="button" class="dismiss" (click)="pwa.dismissIosHint()" aria-label="Compris">×</button>
      </div>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      left: 12px;
      right: 12px;
      z-index: 45;
      bottom: calc(68px + var(--safe-bottom));
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: 0 4px 24px color-mix(in srgb, var(--ink) 12%, transparent);
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
