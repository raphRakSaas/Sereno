import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { categoryIconInner } from '../../../domain/data/category-icon-paths';

/* Rend une icône duotone Solar (deux calques teintés par `currentColor`) :
   la couleur vient du parent (pastille de catégorie), l'effet deux-tons est
   porté par le calque à opacité réduite dans le SVG lui-même. */
@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      [innerHTML]="markup()"
      aria-hidden="true"
    ></svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    svg {
      display: block;
    }
  `,
})
export class CategoryIconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input(22);

  protected readonly markup = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(categoryIconInner(this.name())),
  );
}
