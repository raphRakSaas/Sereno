import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ConversionService } from '../../../application/services/conversion.service';
import { IconComponent } from '../../atoms/icon/icon.component';

/* La modale de conversion : une invitation posée, jamais un mur.
   "Plus tard" est toujours disponible et respecté (pause d'une semaine). */
@Component({
  selector: 'app-conversion-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (conversion.open()) {
      <div class="backdrop" (click)="conversion.dismiss()"></div>
      <div class="sheet" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <span class="mark">
          <app-icon name="cloud" [size]="26" />
        </span>
        <h2>{{ title() }}</h2>
        <p>{{ body() }}</p>
        <button type="button" class="btn btn-primary btn-block" (click)="goToAccount()">
          Créer un compte gratuit
        </button>
        <button type="button" class="btn btn-ghost btn-block" (click)="conversion.dismiss()">
          Plus tard
        </button>
      </div>
    }
  `,
  styles: `
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
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 16px 16px 0 0;
      padding: var(--space-6) var(--space-5) calc(var(--space-5) + var(--safe-bottom));
      z-index: 61;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      animation: rise 0.25s ease-out;
    }
    @media (min-width: 768px) {
      .sheet {
        top: 50%;
        bottom: auto;
        transform: translate(-50%, -50%);
        width: min(calc(100% - 48px), 420px);
        border-radius: var(--radius);
        padding: var(--space-6) var(--space-5);
        animation: dialog-in 0.22s ease-out;
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
    .mark {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: var(--sage-pale);
      color: var(--sage-deep);
    }
    h2 {
      font-size: 22px;
    }
    p {
      margin: 0 0 var(--space-2);
      color: var(--ink-soft);
      font-size: 15px;
      line-height: 1.55;
    }
  `,
})
export class ConversionModalComponent {
  protected readonly conversion = inject(ConversionService);
  private readonly router = inject(Router);

  constructor() {
    // Arriver sur la page compte par ses propres moyens rend la modale inutile.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (e.urlAfterRedirects.startsWith('/compte') && this.conversion.open()) {
          this.conversion.proceed();
        }
      });
  }

  protected readonly title = computed(() => {
    switch (this.conversion.reason()) {
      case 'transactions':
        return 'Bel élan.';
      case 'days':
        return 'Deux semaines déjà.';
      case 'feature':
        return 'Encore un pas.';
    }
  });

  protected readonly body = computed(() => {
    switch (this.conversion.reason()) {
      case 'transactions':
        return 'Déjà 20 transactions notées. Crée un compte gratuit pour mettre cet historique à l’abri et le retrouver sur tous tes appareils.';
      case 'days':
        return 'Tu tiens tes comptes ici depuis deux semaines. Crée un compte gratuit pour synchroniser tes données et ne rien perdre.';
      case 'feature':
        return `Crée un compte gratuit pour débloquer ${this.conversion.featureName() || 'cette fonctionnalité'} et synchroniser tes données.`;
    }
  });

  protected goToAccount(): void {
    this.conversion.proceed();
    void this.router.navigateByUrl('/compte');
  }
}
