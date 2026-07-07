import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Category } from '../../../domain/models/category.model';
import { categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { IconComponent } from '../../atoms/icon/icon.component';

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
          <span
            class="icon-wrap"
            [style.background]="categoryColor(category.color)"
            [style.color]="category.color"
          >
            <app-icon [name]="category.icon" [size]="14" />
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
      gap: 7px;
      padding: 8px 13px;
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
      border-color: var(--sage);
      background: var(--sage-pale);
    }
    .icon-wrap {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 7px;
      flex: none;
      color: inherit;
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

  protected categoryColor(color: string): string {
    return `color-mix(in srgb, ${color} 16%, var(--surface))`;
  }
}
