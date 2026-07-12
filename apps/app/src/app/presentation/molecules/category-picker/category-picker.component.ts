import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Category } from '../../../domain/models/category.model';
import { categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-category-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryIconComponent, IconComponent],
  template: `
    <div class="grid" role="listbox" aria-label="Catégorie">
      @for (category of visibleCategories(); track category.id) {
        <button
          type="button"
          role="option"
          [attr.aria-selected]="category.id === selectedId()"
          [class.selected]="category.id === selectedId()"
          [class.sub]="category.parentId"
          (click)="select.emit(category.id)"
        >
          <span class="icon-wrap">
            <app-category-icon [name]="category.icon" [size]="22" />
          </span>
          <span class="label">{{ labelFor(category) }}</span>
          @if (category.id === selectedId()) {
            <app-icon name="check" [size]="15" />
          }
        </button>
      }

      @if (canExpand()) {
        <button type="button" class="more" (click)="expanded.set(true)">
          Plus de catégories
          <app-icon name="chevron-right" [size]="15" />
        </button>
      } @else if (canCollapse()) {
        <button type="button" class="more" (click)="expanded.set(false)">
          Moins de catégories
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
    /* Déclencheur de progressive disclosure : ton discret, pas une catégorie. */
    button.more {
      padding: 6px 13px;
      color: var(--accent);
      font-weight: 600;
    }
    button.more app-icon {
      color: var(--accent);
    }
    .icon-wrap {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      flex: none;
    }
  `,
})
export class CategoryPickerComponent {
  readonly categories = input.required<Category[]>();
  readonly selectedId = input<string | null>(null);
  /** Active la révélation progressive : seules les catégories `primaryIds` (+ la
     sélection courante) sont visibles tant que « Plus de catégories » n'est pas ouvert. */
  readonly collapsible = input(false);
  readonly primaryIds = input<readonly string[]>([]);
  readonly select = output<string>();

  protected readonly expanded = signal(false);

  private readonly categoriesById = computed(
    () => new Map(this.categories().map((category) => [category.id, category])),
  );

  /** Catégories affichées : toutes si non repliable ou déplié, sinon les
     prioritaires plus la sélection courante (pour ne jamais masquer un choix actif). */
  protected readonly visibleCategories = computed(() => {
    const allCategories = this.categories();
    if (!this.collapsible() || this.expanded()) {
      return allCategories;
    }
    const primarySet = new Set(this.primaryIds());
    const selected = this.selectedId();
    return allCategories.filter(
      (category) => primarySet.has(category.id) || category.id === selected,
    );
  });

  protected readonly canExpand = computed(
    () =>
      this.collapsible() &&
      !this.expanded() &&
      this.visibleCategories().length < this.categories().length,
  );

  protected readonly canCollapse = computed(() => this.collapsible() && this.expanded());

  protected labelFor(category: Category): string {
    return categoryDisplayName(category, this.categoriesById());
  }
}
