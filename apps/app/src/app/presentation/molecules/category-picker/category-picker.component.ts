import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Category } from '../../../domain/models/category.model';
import { categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { IconComponent } from '../../atoms/icon/icon.component';

/* Icônes 3D colorées (Fluent Emoji, MIT) plutôt que le trait fin habituel :
   la sélection de catégorie est l'endroit où un peu de relief/couleur aide
   à repérer vite, contrairement à la nav où le trait discret reste la règle. */
const CATEGORY_ICON_IMAGE: Record<string, string> = {
  home: 'home.png',
  basket: 'basket.png',
  transit: 'transit.png',
  dining: 'dining.png',
  health: 'health.png',
  leisure: 'leisure.png',
  repeat: 'repeat.png',
  clothing: 'clothing.png',
  dots: 'dots.png',
  work: 'work.png',
  sparkle: 'sparkle.png',
  gift: 'gift.png',
  building: 'building.png',
  chart: 'chart.png',
};

@Component({
  selector: 'app-category-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="grid" role="listbox" aria-label="Catégorie">
      @for (category of categories(); track category.id) {
        <button
          type="button"
          role="option"
          [attr.aria-selected]="category.id === selectedId()"
          [class.selected]="category.id === selectedId()"
          [class.sub]="category.parentId"
          (click)="select.emit(category.id)"
        >
          <span class="icon-wrap">
            <img [src]="iconSrc(category.icon)" alt="" width="22" height="22" />
          </span>
          <span class="label">{{ labelFor(category) }}</span>
          @if (category.id === selectedId()) {
            <app-icon name="check" [size]="15" />
          }
        </button>
      }
    </div>
  `,
  styles: `
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 13px 6px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    button.sub {
      font-size: 13px;
    }
    button.selected {
      border-color: var(--accent);
      background: var(--accent-pale);
    }
    .icon-wrap {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      flex: none;
    }
    .icon-wrap img {
      display: block;
      width: 22px;
      height: 22px;
    }
  `,
})
export class CategoryPickerComponent {
  readonly categories = input.required<Category[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();

  private readonly categoriesById = computed(
    () => new Map(this.categories().map((category) => [category.id, category])),
  );

  protected labelFor(category: Category): string {
    return categoryDisplayName(category, this.categoriesById());
  }

  protected iconSrc(icon: string): string {
    return `category-icons/${CATEGORY_ICON_IMAGE[icon] ?? CATEGORY_ICON_IMAGE['dots']}`;
  }
}
