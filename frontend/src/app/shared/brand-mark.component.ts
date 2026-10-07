import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  host: { class: 'inline-flex shrink-0 items-center justify-center' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="32" height="32" rx="9" fill="#db2777" />
      <path
        d="M9.5 10 16 23l6.5-13"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16 5.5v3"
        fill="none"
        stroke="#ffffff"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.9"
      />
    </svg>
  `,
})
export class BrandMarkComponent {
  readonly size = input(36);
}
