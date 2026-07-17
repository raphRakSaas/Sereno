import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../atoms/icon/icon.component';

interface MenuRow {
  label: string;
  route: string;
  icon: IconName;
}

const MENU_ROWS: MenuRow[] = [
  { label: 'Comptes', route: '/comptes', icon: 'building' },
  { label: 'Catégories', route: '/categories', icon: 'tag' },
  { label: 'Récurrences', route: '/recurrences', icon: 'repeat' },
  { label: 'Échéances', route: '/echeances', icon: 'chart' },
  { label: 'Modèles', route: '/modeles', icon: 'bolt' },
  { label: 'Objectif d’épargne', route: '/objectif', icon: 'target' },
  { label: 'Calendrier', route: '/calendrier', icon: 'calendar' },
  { label: 'Réglages', route: '/reglages', icon: 'sliders' },
];

@Component({
  selector: 'app-menu-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage {
  protected readonly rows = MENU_ROWS;
}
