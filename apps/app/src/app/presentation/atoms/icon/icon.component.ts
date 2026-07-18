import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/* Pictogrammes d'interface de Sereno (navigation, actions) : tracés à la main
   sur grille 24px, trait 1.7, extrémités rondes. Un point = `M x 12h.01`
   (cap rond). Les catégories, elles, utilisent les Fluent Emoji 3D via
   app-category-icon (voir category-icon.component.ts) — rendu coloré voulu. */
export const ICON_PATHS: Record<string, string[]> = {
  // Catégories
  work: ['M4 8h16v11H4z', 'M9 8V6a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6v2', 'M4 12.5h16'],
  sparkle: ['M12 4.5l1.7 4.3 4.3 1.7-4.3 1.7L12 16.5l-1.7-4.3L6 10.5l4.3-1.7z', 'M18 16.5v3', 'M16.5 18h3'],
  gift: ['M4 8h16v11H4z', 'M12 8V5.5', 'M8 5.5c0-1.5 1.8-2.2 4-1', 'M16 5.5c0-1.5-1.8-2.2-4-1', 'M12 8l-2 2', 'M12 8l2 2'],
  building: ['M5 20V9l7-5 7 5v11', 'M9 13h.01', 'M12 13h.01', 'M15 13h.01', 'M9 16.5h.01', 'M12 16.5h.01', 'M15 16.5h.01'],
  chart: ['M4 18.5h16', 'M7 14.5l3-4 3 3 4-6'],
  home: ['M4 11.2l8-6.7 8 6.7', 'M6.2 9.5V19h11.6V9.5'],
  basket: ['M4.5 9.5h15L18 19H6z', 'M9 9.5l3-5.2 3 5.2', 'M12 13v3'],
  transit: ['M5.5 4.5h13V16h-13z', 'M5.5 8.5h13', 'M8.5 19.5h.01', 'M15.5 19.5h.01', 'M5.5 16l-1 3.5', 'M18.5 16l1 3.5'],
  dining: ['M6.5 9.5h9.5v4.2a4.75 4.75 0 0 1-9.5 0z', 'M16 10.5h1.6a2 2 0 0 1 0 4H16', 'M9 4.5c0 1.2-1 1.3-1 2.5', 'M13 4.5c0 1.2-1 1.3-1 2.5'],
  health: ['M12 19.5s-7-4.3-7-9.5a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.2-7 9.5-7 9.5z'],
  leisure: ['M4 5.6c2.6-1 5.4-.9 8 .6 2.6-1.5 5.4-1.6 8-.6v12.8c-2.6-1-5.4-.9-8 .6-2.6-1.5-5.4-1.6-8-.6z', 'M12 6.2V19'],
  repeat: ['M17 3.5l3 3-3 3', 'M20 6.5H8.5a4.5 4.5 0 0 0-4.5 4.5', 'M7 20.5l-3-3 3-3', 'M4 17.5h11.5a4.5 4.5 0 0 0 4.5-4.5'],
  clothing: ['M9 4.5L4.5 7.5 6.5 11l1.5-.8V19.5h8v-9.3l1.5.8 2-3.5L15 4.5a3 3 0 0 1-6 0z'],
  dots: ['M5.5 12h.01', 'M12 12h.01', 'M18.5 12h.01'],

  // Navigation & actions
  pie: ['M12 3a9 9 0 1 0 9 9', 'M12 3v9h9', 'M12 12 9 9'],
  activity: ['M4 18.5h2', 'M4 12h4', 'M4 5.5h6', 'M14 18.5h6', 'M14 12h4', 'M14 5.5h2'],
  strata: ['M4 18.5h16', 'M4 13.5h11', 'M4 8.5h6.5'],
  list: ['M8.5 6.5H20', 'M8.5 12H20', 'M8.5 17.5H20', 'M4.5 6.5h.01', 'M4.5 12h.01', 'M4.5 17.5h.01'],
  plus: ['M12 5.5v13', 'M5.5 12h13'],
  wallet: ['M4 7.5a2 2 0 0 1 2-2h11.5v3', 'M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5H20v-11H6a2 2 0 0 1-2-2z', 'M16 14.5h.01'],
  sliders: ['M4 8h9', 'M17.5 8H20', 'M13 5.2V10.8', 'M4 16h2.5', 'M11 16h9', 'M8 13.2v5.6'],
  'chevron-left': ['M14.5 5.5L8 12l6.5 6.5'],
  'chevron-right': ['M9.5 5.5L16 12l-6.5 6.5'],
  check: ['M5 12.5l4.2 4.2L19 6.5'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  trash: ['M4.5 7h15', 'M9.5 7V5h5v2', 'M6.5 7l.8 12.5h9.4L17.5 7', 'M10 10.5v5.5', 'M14 10.5v5.5'],
  pencil: ['M4.5 19.5l1-3.8L16.7 4.5a2 2 0 0 1 2.8 2.8L8.3 18.5z', 'M14.5 6.5l3 3'],
  lock: ['M6 10.5h12v9H6z', 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5', 'M12 14v2'],
  cloud: ['M7.5 18.5a4.2 4.2 0 0 1-.4-8.4 5.2 5.2 0 0 1 10-1.4 3.6 3.6 0 0 1-.6 9.8z'],
  'arrow-in': ['M17 7L7 17', 'M7 9.5V17h7.5'],
  'arrow-out': ['M7 17L17 7', 'M9.5 7H17v7.5'],
  calendar: ['M4.5 6.5h15v13h-15z', 'M4.5 10.5h15', 'M8.5 4.5v3.5', 'M15.5 4.5v3.5'],
  user: ['M12 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z', 'M5 20a7 7 0 0 1 14 0'],
  'log-out': ['M9 4.5H5.5v15H9', 'M14.5 8.5L18 12l-3.5 3.5', 'M18 12H9.5'],
  camera: ['M5 8.5h3l1.5-2h5L16 8.5h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V10a1.5 1.5 0 0 1 1.5-1.5z', 'M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'],
  image: ['M4.5 6.5h15v11h-15z', 'M8.5 14l2.5-3 3 3.5 2-2.5 3.5 4.5', 'M9 10a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z'],
  tag: ['M11 4.5H6.5A2 2 0 0 0 4.5 6.5V11l9.5 9.5 6-6z', 'M8.5 8.5h.01'],
  bolt: ['M13 3.5L5 14h5.5l-1.5 6.5L18 9h-5.5z'],
  target: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M12 12h.01'],
  warning: ['M12 4.5L21 19H3z', 'M12 10v4', 'M12 16.5h.01'],
  paperclip: ['M8 12.5l6.5-6.5a3 3 0 0 1 4.2 4.2L11 18a5 5 0 0 1-7-7l7.5-7.5'],
};

export type IconName = keyof typeof ICON_PATHS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(22);

  protected readonly paths = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['dots']);
}
