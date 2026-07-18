import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

/* Barre d'onglets docked (5 pages racines) — pas de bouton "+" ici, l'ajout
   passe uniquement par le FAB flottant (app-fab), pour éviter de dupliquer
   l'action. Voir docs/DESIGN.md. */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav aria-label="Navigation principale">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="pill"><app-icon name="home" [size]="21" /></span>
        <span>Accueil</span>
      </a>
      <a routerLink="/transactions" routerLinkActive="active">
        <span class="pill"><app-icon name="list" [size]="21" /></span>
        <span>Historique</span>
      </a>
      <a routerLink="/budgets" routerLinkActive="active">
        <span class="pill"><app-icon name="target" [size]="21" /></span>
        <span>Budgets</span>
      </a>
      <a routerLink="/statistiques" routerLinkActive="active">
        <span class="pill"><app-icon name="pie" [size]="21" /></span>
        <span>Stats</span>
      </a>
      <a routerLink="/menu" routerLinkActive="active">
        <span class="pill"><app-icon name="sparkle" [size]="21" /></span>
        <span>Plus</span>
      </a>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 30;
      flex-shrink: 0;
    }
    nav {
      display: flex;
      align-items: stretch;
      gap: 2px;
      background: var(--paper);
      border-top: 1px solid var(--line);
      /* max() et non calc(+) : sur les téléphones avec barre gestuelle
         (safe-bottom 24-48px), l'inset sert de padding au lieu de s'empiler
         dessus — sinon grand vide sous les onglets. */
      padding: 8px 6px max(10px, var(--safe-bottom));
    }
    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 0;
      border-radius: 12px;
      color: var(--ink-faint);
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
    }
    .pill {
      display: grid;
      place-items: center;
      opacity: 0.55;
    }
    a.active {
      color: var(--accent);
      background: var(--accent-pale);
    }
    a.active .pill {
      opacity: 1;
    }
  `,
})
export class BottomNavComponent {}
