import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

/* Seule et unique action d'ajout rapide visible sur les pages racines
   (Accueil, Historique) — pas de "+" dupliqué dans la tab bar ni les cartes.
   Voir docs/DESIGN.md. */
@Component({
  selector: 'app-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button type="button" (click)="tapAdd()" aria-label="Ajouter une transaction">
      <app-icon name="plus" [size]="26" />
    </button>
  `,
  styles: `
    :host {
      position: fixed;
      right: var(--page-gutter);
      bottom: calc(var(--nav-height) + var(--space-3) + var(--safe-bottom));
      z-index: 20;
    }
    @media (min-width: 768px) {
      :host {
        display: none;
      }
    }
    button {
      width: 56px;
      height: 56px;
      border: none;
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      display: grid;
      place-items: center;
      box-shadow: var(--shadow-fab);
      cursor: pointer;
    }
    button:active {
      opacity: 0.9;
    }
  `,
})
export class FabComponent {
  private readonly router = inject(Router);

  protected tapAdd(): void {
    void this.router.navigateByUrl('/transactions/nouvelle');
  }
}
