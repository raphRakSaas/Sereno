import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'] as const;

/* Clavier numérique custom réutilisé pour le montant de transaction et le
   revenu de l'onboarding — grille 3×4, une seule virgule, effacement borné
   à "0". Voir docs/DESIGN.md. */
@Component({
  selector: 'app-numeric-keypad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="keypad">
      @for (key of keys; track key) {
        <button type="button" (click)="press(key)">{{ key }}</button>
      }
    </div>
  `,
  styles: `
    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    button {
      padding: 14px 0;
      border: none;
      border-radius: 12px;
      background: var(--surface);
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 17px;
      color: var(--ink);
      cursor: pointer;
    }
    button:active {
      opacity: 0.75;
    }
  `,
})
export class NumericKeypadComponent {
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly keys = KEYS;

  protected press(key: (typeof KEYS)[number]): void {
    const current = this.value();
    if (key === '⌫') {
      this.valueChange.emit(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    if (key === ',') {
      if (current.includes(',')) return;
      this.valueChange.emit(current + ',');
      return;
    }
    this.valueChange.emit(current === '0' ? key : current + key);
  }
}
