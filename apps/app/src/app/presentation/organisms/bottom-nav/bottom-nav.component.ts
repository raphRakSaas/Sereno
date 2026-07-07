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
        <app-icon name="home" />
        <span>Accueil</span>
      </a>
      <a routerLink="/statistiques" routerLinkActive="active">
        <app-icon name="pie" />
        <span>Statistiques</span>
      </a>
      <a routerLink="/transactions/nouvelle" class="add" aria-label="Ajouter une transaction">
        <app-icon name="plus" [size]="26" />
      </a>
      <a routerLink="/calendrier" routerLinkActive="active">
        <app-icon name="calendar" />
        <span>Calendrier</span>
      </a>
      <a routerLink="/reglages" routerLinkActive="active">
        <app-icon name="sliders" />
        <span>Réglages</span>
      </a>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      bottom: 0;
      z-index: 30;
    }
    nav {
      display: grid;
      grid-template-columns: 1fr 1fr auto 1fr 1fr;
      align-items: end;
      background: var(--surface);
      border-top: 1px solid var(--line);
      padding: 10px 12px calc(10px + var(--safe-bottom));
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
    a:not(.add) app-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 26px;
      border-radius: 999px;
    }
    /* L'onglet actif porte la pastille chaude : le repère permanent de
       l'accent signature (--clay), discret mais immanquable. */
    a.active {
      color: var(--ink);
    }
    a.active app-icon {
      background: var(--clay-soft);
      color: var(--clay);
    }
    .add {
      width: 56px;
      height: 56px;
      margin: -18px 12px 0;
      border-radius: 999px;
      background: var(--sage);
      color: var(--surface);
      justify-content: center;
      border: 3px solid var(--paper);
    }
    .add:active {
      background: var(--sage-deep);
    }
  `,
})
export class BottomNavComponent {}
