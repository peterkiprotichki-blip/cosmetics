import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  host: { class: 'inline-flex shrink-0 items-center justify-center' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="'#i-' + name()" />
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
}
