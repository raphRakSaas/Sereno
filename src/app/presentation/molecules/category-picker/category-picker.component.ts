import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category } from '../../../domain/models/category.model';
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
          (click)="select.emit(category.id)"
        >
          <span class="dot" [style.background]="category.color"></span>
          <span class="label">{{ category.name }}</span>
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
    button.selected {
      border-color: var(--sage);
      background: var(--sage-pale);
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      flex: none;
    }
  `,
})
export class CategoryPickerComponent {
  readonly categories = input.required<Category[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();
}
