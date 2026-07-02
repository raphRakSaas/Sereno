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
          [style.background]="color"
          [class.on]="selectedColor() === color"
          [attr.aria-selected]="selectedColor() === color"
          [attr.aria-label]="'Marqueur ' + color"
          (click)="pick(color)"
        ></button>
      }
    </div>
  `,
  styles: `
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .swatch {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
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
    .swatch.on {
      border-color: var(--ink);
      box-shadow: 0 0 0 2px var(--surface);
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
