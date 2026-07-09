import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { UserPreferencesService } from '../../../application/services/user-preferences.service';
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
        <app-logo [size]="26" [decorative]="true" />
        sereno
      </a>

      <a routerLink="/transactions/nouvelle" class="add">
        <app-icon name="plus" [size]="16" />
        Nouvelle transaction
      </a>

      <div class="links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="home" [size]="19" />
          <span>Accueil</span>
        </a>
        <a routerLink="/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <app-icon name="activity" [size]="19" />
          <span>Activité</span>
        </a>
        <a routerLink="/calendrier" routerLinkActive="active">
          <app-icon name="calendar" [size]="19" />
          <span>Calendrier</span>
        </a>
        <a routerLink="/statistiques" routerLinkActive="active">
          <app-icon name="pie" [size]="19" />
          <span>Statistiques</span>
        </a>
        <a routerLink="/budgets" routerLinkActive="active">
          <app-icon name="wallet" [size]="19" />
          <span>Budgets</span>
        </a>
        <a routerLink="/reglages" routerLinkActive="active">
          <app-icon name="sliders" [size]="19" />
          <span>Réglages</span>
        </a>
      </div>

      <div class="status">
        <app-icon [name]="auth.isSignedIn() ? 'cloud' : 'user'" [size]="14" />
        <span>{{ auth.isSignedIn() ? (auth.user()?.email ?? 'Connecté') : 'Mode invité' }}</span>
      </div>

      <div class="theme-switch" role="group" aria-label="Thème">
        <button
          type="button"
          class="theme-btn"
          [class.active]="!preferences.isDark()"
          aria-label="Mode clair"
          (click)="preferences.setTheme('light')"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <circle cx="10" cy="10" r="3.2" />
            <path
              d="M10 3v1.6M10 15.4V17M3 10h1.6M15.4 10H17M5.1 5.1l1.1 1.1M13.8 13.8l1.1 1.1M5.1 14.9l1.1-1.1M13.8 6.2l1.1-1.1"
            />
          </svg>
        </button>
        <button
          type="button"
          class="theme-btn"
          [class.active]="preferences.isDark()"
          aria-label="Mode sombre"
          (click)="preferences.setTheme('dark')"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5 6.9 6.9 0 1 0 16.5 12.3z" />
          </svg>
        </button>
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
      background: var(--paper);
      border-right: 1px solid var(--line);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 9px;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.02em;
      color: var(--ink);
      text-decoration: none;
      padding: 0 6px;
    }
    .add {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: var(--ink);
      color: var(--paper);
      border: none;
      border-radius: var(--radius);
      padding: 11px 14px;
      font-size: 13.5px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .links a {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 10px 12px;
      border-radius: 10px;
      color: var(--ink-faint);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 600;
      transition: background 0.15s ease;
    }
    @media (hover: hover) {
      .links a:hover:not(.active) {
        background: var(--surface-2);
        color: var(--ink);
      }
    }
    /* Seul repère de couleur de la nav : l'accent bleu marque « où je suis ». */
    .links a.active {
      background: var(--accent-pale);
      color: var(--accent);
      font-weight: 700;
    }
    .status {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 6px;
      color: var(--ink-faint);
      font-size: 11.5px;
      font-weight: 600;
      min-width: 0;
    }
    .status span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .theme-switch {
      display: flex;
      gap: 4px;
      padding: 3px;
      border-radius: 999px;
      background: var(--surface-2);
    }

    .theme-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 26px;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: var(--ink-faint);
      cursor: pointer;
    }

    .theme-btn svg {
      width: 13px;
      height: 13px;
    }

    .theme-btn.active {
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow);
    }

    .theme-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `,
})
export class SideNavComponent {
  protected readonly auth = inject(AuthService);
  protected readonly preferences = inject(UserPreferencesService);
}
