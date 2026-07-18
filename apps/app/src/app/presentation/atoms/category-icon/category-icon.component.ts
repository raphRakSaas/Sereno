import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/* Icônes de catégories : Fluent Emoji 3D de Microsoft (licence MIT,
   github.com/microsoft/fluentui-emoji), téléchargées dans public/emoji3d/
   sous le nom de l'icône ('home' → emoji3d/home.png). Rendu riche et coloré
   façon « 3D icons », voulu pour rendre les catégories immédiatement
   reconnaissables — contrairement aux icônes d'action de l'app (app-icon)
   qui restent au trait. Un nom inconnu retombe sur 'dots'. */
export const CATEGORY_EMOJI_NAMES = [
  'work',
  'pencil',
  'gift',
  'home',
  'health',
  'wallet',
  'building',
  'chart',
  'sparkle',
  'arrow-in',
  'dots',
  'basket',
  'transit',
  'dining',
  'leisure',
  'repeat',
  'clothing',
  'calendar',
  'user',
] as const;

const KNOWN_NAMES = new Set<string>(CATEGORY_EMOJI_NAMES);

@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="src()" alt="" [style.width.px]="size()" [style.height.px]="size()" />`,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    img {
      display: block;
      object-fit: contain;
    }
  `,
})
export class CategoryIconComponent {
  readonly name = input.required<string>();
  readonly size = input(22);

  protected readonly src = computed(() => {
    const iconName = KNOWN_NAMES.has(this.name()) ? this.name() : 'dots';
    return `emoji3d/${iconName}.png`;
  });
}
