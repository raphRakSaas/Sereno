import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav aria-label="Navigation principale">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <app-icon name="strata" />
        <span>Accueil</span>
      </a>
      <a routerLink="/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <app-icon name="list" />
        <span>Activité</span>
      </a>
      <a routerLink="/transactions/nouvelle" class="add" aria-label="Ajouter une transaction">
        <app-icon name="plus" [size]="26" />
      </a>
      <a routerLink="/budgets" routerLinkActive="active">
        <app-icon name="wallet" />
        <span>Budgets</span>
      </a>
      <a routerLink="/reglages" routerLinkActive="active">
        <app-icon name="sliders" />
        <span>Réglages</span>
      </a>
    </nav>
  `,
  styles: `
    nav {
      display: grid;
      grid-template-columns: 1fr 1fr auto 1fr 1fr;
      align-items: center;
      background: var(--surface);
      border-top: 1px solid var(--line);
      padding: 6px 8px calc(6px + var(--safe-bottom));
    }
    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 0 4px;
      color: var(--ink-faint);
      text-decoration: none;
      font-size: 11px;
      font-weight: 500;
      border-radius: var(--radius);
    }
    a.active {
      color: var(--sage);
    }
    .add {
      width: 52px;
      height: 52px;
      margin: 0 10px;
      border-radius: 999px;
      background: var(--sage);
      color: var(--surface);
      justify-content: center;
    }
    .add:active {
      background: var(--sage-deep);
    }
  `,
})
export class BottomNavComponent {}
