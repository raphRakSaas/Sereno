import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      class="app-logo app-logo-light"
      src="logo.svg"
      [attr.alt]="decorative() ? '' : alt()"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="decorative() ? 'true' : null"
    />
    <img
      class="app-logo app-logo-dark"
      src="logo-dark.svg"
      alt=""
      aria-hidden="true"
      [attr.width]="size()"
      [attr.height]="size()"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }
    .app-logo-dark {
      display: none;
    }
  `,
})
export class LogoComponent {
  readonly size = input(26);
  readonly alt = input('Sereno');
  readonly decorative = input(false);
}
