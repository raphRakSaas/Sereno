import { ChangeDetectionStrategy, Component, computed, input, LOCALE_ID, inject } from '@angular/core';

/* Les montants sont les gros titres de Sereno : entier dominant, décimales et
   devise en retrait, chiffres tabulaires. */
@Component({
  selector: 'app-amount',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="amount wrap" [class]="'s-' + size()">
      @if (effectiveSign()) {
        <span class="sign">{{ effectiveSign() }}</span>
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
    /* Le hero est un moment fort : l'entier respire en Fraunces (display).
       Les colonnes de montants (lg/md/sm) restent en Plex tabulaire. */
    .s-hero .int, .s-hero .sign {
      font-family: var(--font-display);
      font-weight: 560;
      font-variation-settings: 'opsz' 40;
      font-size: clamp(36px, 12vw, 56px);
      letter-spacing: -0.02em;
      line-height: 1.05;
    }
    .s-hero .frac, .s-hero .cur { font-size: clamp(14px, 4.5vw, 20px); opacity: 0.5; }
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

  /** Sans signe explicite, une valeur négative (ex. solde) affiche son moins. */
  protected readonly effectiveSign = computed(() => this.sign() || (this.value() < 0 ? '−' : ''));

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
