import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { resolveMerchantBrand } from '../../../domain/utils/merchant-brand.util';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

/* Pastille : logo de marque reconnu dans le libellé, sinon icône de catégorie. */
@Component({
  selector: 'app-merchant-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryIconComponent],
  template: `
    <span
      class="badge"
      [class.round]="shape() === 'round'"
      [class.square]="shape() === 'square'"
      [style.background]="background()"
      [style.color]="foreground()"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      @if (brand(); as merchant) {
        <img [src]="merchant.logoUrl" [alt]="merchant.name" class="logo" />
      } @else {
        <app-category-icon [name]="fallbackIcon()" [size]="iconSize()" />
      }
    </span>
  `,
  styles: `
    .badge {
      flex: none;
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .round {
      border-radius: 999px;
    }
    .square {
      border-radius: 10px;
    }
    .logo {
      width: 58%;
      height: 58%;
      object-fit: contain;
      display: block;
    }
    .round .logo {
      width: 54%;
      height: 54%;
    }
  `,
})
export class MerchantBadgeComponent {
  readonly texts = input<string[]>([]);
  readonly fallbackIcon = input('dots');
  readonly fallbackColor = input('#8B948C');
  readonly size = input(40);
  readonly shape = input<'round' | 'square'>('square');

  protected readonly brand = computed(() => resolveMerchantBrand(...this.texts()));

  protected readonly iconSize = computed(() => Math.round(this.size() * 0.46));

  protected readonly background = computed(() => {
    const merchant = this.brand();
    if (merchant) {
      return merchant.tint;
    }
    return `color-mix(in srgb, ${this.fallbackColor()} 14%, var(--surface))`;
  });

  protected readonly foreground = computed(() => {
    const merchant = this.brand();
    if (merchant) {
      return '#ffffff';
    }
    return this.fallbackColor();
  });
}
