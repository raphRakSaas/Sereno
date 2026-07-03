import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LogoComponent } from '../../atoms/logo/logo.component';

/* Navigation desktop (≥ 768px) : rail fixe à gauche. Le mobile garde sa
   navigation basse — même vocabulaire, deux postures. */
@Component({
  selector: 'app-side-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  template: `
    <nav aria-label="Navigation principale">
      <a routerLink="/" class="brand">
        <app-logo [size]="30" [decorative]="true" />
        Sereno
      </a>

      <a routerLink="/transactions/nouvelle" class="btn btn-primary add">
        <app-icon name="plus" [size]="18" />
        Nouvelle transaction
      </a>

      <div class="links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="strata" [size]="20" />
          <span>Accueil</span>
        </a>
        <a routerLink="/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="list" [size]="20" />
          <span>Activité</span>
        </a>
        <a routerLink="/calendrier" routerLinkActive="active">
          <app-icon name="calendar" [size]="20" />
          <span>Calendrier</span>
        </a>
        <a routerLink="/statistiques" routerLinkActive="active">
          <app-icon name="strata" [size]="20" />
          <span>Statistiques</span>
        </a>
        <a routerLink="/budgets" routerLinkActive="active">
          <app-icon name="wallet" [size]="20" />
          <span>Budgets</span>
        </a>
        <a routerLink="/reglages" routerLinkActive="active">
          <app-icon name="sliders" [size]="20" />
          <span>Réglages</span>
        </a>
      </div>

      <div class="status">
        <app-icon [name]="auth.isSignedIn() ? 'cloud' : 'user'" [size]="16" />
        <span>{{ auth.isSignedIn() ? (auth.user()?.email ?? 'Connecté') : 'Mode invité' }}</span>
      </div>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
      position: sticky;
      top: 0;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      height: 100%;
      padding: var(--space-6) var(--space-4) var(--space-5);
      background: var(--surface);
      border-right: 1px solid var(--line);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 600;
      font-size: 26px;
      color: var(--sage-deep);
      text-decoration: none;
      padding: 0 6px;
    }
    .add {
      font-size: 14.5px;
      padding: 11px 14px;
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .links a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      border-radius: var(--radius);
      color: var(--ink-soft);
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      transition: background 0.15s ease;
    }
    @media (hover: hover) {
      .links a:hover {
        background: var(--paper);
        color: var(--ink);
      }
    }
    /* Même repère chaud que la nav mobile : l'accent signature marque
       « où je suis », rien d'autre. */
    .links a.active {
      background: var(--clay-soft);
      color: var(--ink);
      font-weight: 600;
    }
    .links a.active app-icon {
      color: var(--clay);
    }
    .status {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 6px;
      color: var(--ink-faint);
      font-size: 12.5px;
      min-width: 0;
    }
    .status span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class SideNavComponent {
  protected readonly auth = inject(AuthService);
}
