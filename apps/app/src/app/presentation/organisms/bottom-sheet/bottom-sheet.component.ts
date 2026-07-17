import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/* Chrome partagé de toutes les modales bottom-sheet (catégorie, compte,
   marqueur, reçu, suppression, partage, paywall) : overlay, feuille ancrée
   en bas, poignée. Chaque appelant ne fournit que son contenu via
   <ng-content>. Voir docs/DESIGN.md. */
@Component({
  selector: 'app-bottom-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="backdrop" (click)="closed.emit()"></div>
      <div class="sheet" role="dialog" aria-modal="true" [attr.aria-label]="label()" (click)="$event.stopPropagation()">
        <div class="handle" aria-hidden="true"></div>
        <ng-content />
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, var(--ink) 45%, transparent);
      z-index: 60;
    }
    .sheet {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      width: min(100%, 480px);
      max-height: 78%;
      overflow-y: auto;
      background: var(--paper);
      border-radius: 24px 24px 0 0;
      padding: 20px 20px calc(28px + var(--safe-bottom));
      box-sizing: border-box;
      z-index: 61;
      animation: rise 0.25s ease-out;
    }
    .handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--line);
      margin: 0 auto 18px;
    }
    @media (min-width: 768px) {
      .sheet {
        top: 50%;
        bottom: auto;
        transform: translate(-50%, -50%);
        width: min(calc(100% - 48px), 420px);
        max-height: 80vh;
        border-radius: var(--radius-lg);
        padding: var(--space-5);
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
  `,
})
export class BottomSheetComponent {
  readonly open = input.required<boolean>();
  readonly label = input('');
  readonly closed = output<void>();
}
