import { ChangeDetectionStrategy, Component, computed, input, LOCALE_ID, inject } from '@angular/core';

/* Les montants sont les gros titres de Sereno : entier dominant, décimales et
   devise en retrait, chiffres tabulaires. */
@Component({
  selector: 'app-amount',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="amount wrap" [class]="'s-' + size()">
      @if (sign()) {
        <span class="sign">{{ sign() }}</span>
      }
      <span class="int">{{ parts().int }}</span>
      <span class="frac">{{ parts().frac }}</span>
      <span class="cur">&nbsp;{{ parts().cur }}</span>
    </span>
  `,
  styles: `
    .wrap {
      display: inline-flex;
      align-items: baseline;
      white-space: nowrap;
      font-weight: 600;
      color: inherit;
    }
    .frac,
    .cur {
      font-weight: 500;
      opacity: 0.62;
    }
    .s-hero .int, .s-hero .sign { font-size: 44px; letter-spacing: -0.02em; line-height: 1.1; }
    .s-hero .frac, .s-hero .cur { font-size: 22px; }
    .s-lg .int, .s-lg .sign { font-size: 26px; line-height: 1.15; }
    .s-lg .frac, .s-lg .cur { font-size: 15px; }
    .s-md .int, .s-md .sign { font-size: 17px; }
    .s-md .frac, .s-md .cur { font-size: 13px; }
    .s-sm .int, .s-sm .sign { font-size: 15px; font-weight: 500; }
    .s-sm .frac, .s-sm .cur { font-size: 12px; }
  `,
})
export class AmountComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly value = input.required<number>();
  readonly currency = input('EUR');
  readonly size = input<'hero' | 'lg' | 'md' | 'sm'>('md');
  /** '+' pour marquer un revenu, '−' pour une dépense dans une liste mixte. */
  readonly sign = input<'' | '+' | '−'>('');

  protected readonly parts = computed(() => {
    const formatter = new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency(),
    });
    const raw = formatter.formatToParts(Math.abs(this.value()));
    let int = '';
    let frac = '';
    let cur = '';
    for (const p of raw) {
      if (p.type === 'integer' || p.type === 'group') int += p.value;
      else if (p.type === 'decimal' || p.type === 'fraction') frac += p.value;
      else if (p.type === 'currency') cur = p.value;
    }
    return { int, frac, cur };
  });
}
