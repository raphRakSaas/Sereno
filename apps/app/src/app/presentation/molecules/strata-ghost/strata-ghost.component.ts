import { ChangeDetectionStrategy, Component } from '@angular/core';

/* Aperçu « fantôme » des strates pour les états vides : montre la signature
   de Sereno avant même la première donnée. Même langage de forme que
   app-strata-chart (colonne 96px, rx 3, écarts 2px, socle en bas), couleurs
   de catégories adoucies. Purement décoratif. */
@Component({
  selector: 'app-strata-ghost',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="96" height="134" viewBox="0 0 96 134" aria-hidden="true" focusable="false">
      <rect class="l4" x="0" y="0" width="96" height="12" rx="3" />
      <rect class="l3" x="0" y="14" width="96" height="20" rx="3" />
      <rect class="l2" x="0" y="36" width="96" height="34" rx="3" />
      <rect class="l1" x="0" y="72" width="96" height="62" rx="3" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 96px;
      margin: 0 auto;
    }
    svg {
      display: block;
    }
    .l1 { fill: color-mix(in srgb, #196e44 36%, var(--surface)); }
    .l2 { fill: color-mix(in srgb, #a07417 34%, var(--surface)); }
    .l3 { fill: color-mix(in srgb, #1e6d9c 32%, var(--surface)); }
    .l4 { fill: color-mix(in srgb, #a85769 28%, var(--surface)); }
  `,
})
export class StrataGhostComponent {}
