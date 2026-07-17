import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

/* En-tête des écrans "en pile" (pas une des 5 pages racines) — bouton retour
   + titre, remplace la tab bar sur ces écrans. Voir docs/DESIGN.md. */
@Component({
  selector: 'app-back-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="head">
      <button type="button" class="back" (click)="back()" aria-label="Retour">
        <app-icon name="chevron-left" [size]="18" />
      </button>
      <span class="title">{{ title() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 15;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: calc(12px + var(--safe-top)) var(--page-gutter) 8px;
      background: var(--paper);
    }
    .back {
      flex: none;
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 11px;
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
    }
    .title {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 17px;
      color: var(--ink);
    }
  `,
})
export class BackHeaderComponent {
  readonly title = input('');

  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected back(): void {
    // navigationId > 1 : on est arrivé ici depuis l'app → retour naturel.
    // Sinon (arrivée directe : raccourci PWA, lien), back() sortirait de
    // Sereno → on va au dashboard.
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
