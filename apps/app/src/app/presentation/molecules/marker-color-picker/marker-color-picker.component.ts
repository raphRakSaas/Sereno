import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MARKER_COLORS } from '../../../domain/data/marker-colors';

@Component({
  selector: 'app-marker-color-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="swatches" role="listbox" [attr.aria-label]="label()">
      <button
        type="button"
        role="option"
        class="swatch none"
        [class.on]="selectedColor() === null"
        [attr.aria-selected]="selectedColor() === null"
          (click)="pick(null)"
      >
        Aucune
      </button>
      @for (color of colors; track color) {
        <button
          type="button"
          role="option"
          class="swatch"
          [style.--swatch]="color"
          [class.on]="selectedColor() === color"
          [attr.aria-selected]="selectedColor() === color"
          [attr.aria-label]="'Étiquette ' + color"
          (click)="pick(color)"
        ></button>
      }
    </div>
  `,
  styles: `
    /* Anneaux creux, pas des pastilles pleines : l'étiquette est un repère,
       elle ne doit pas imiter les couleurs de catégories. Une seule ligne. */
    .swatches {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 6px;
      align-items: center;
      padding: 4px 2px;
    }
    .swatch {
      flex: none;
      width: 36px;
      height: 36px;
      padding: 6px;
      border: none;
      border-radius: 999px;
      background: none;
      cursor: pointer;
    }
    .swatch::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 999px;
      border: 6px solid var(--swatch);
    }
    .swatch.none {
      width: auto;
      height: auto;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink-soft);
      font-size: 13px;
      font-weight: 500;
      padding: 7px 12px;
    }
    .swatch.none::before {
      content: none;
    }
    .swatch.on::before {
      outline: 2px solid var(--ink);
      outline-offset: 2px;
    }
    .swatch.none.on {
      border-color: var(--ink);
    }
  `,
})
export class MarkerColorPickerComponent {
  readonly colors = MARKER_COLORS;
  readonly selectedColor = input<string | null>(null);
  readonly label = input('Couleur de marqueur');

  readonly colorSelected = output<string | null>();

  protected pick(color: string | null): void {
    this.colorSelected.emit(color);
  }
}
