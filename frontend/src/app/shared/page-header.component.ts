import { Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-page-header',
  imports: [IconComponent],
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex items-start gap-3">
        @if (icon()) {
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-100 bg-pink-50 text-pink-600"
          >
            <app-icon [name]="icon()" [size]="22" />
          </div>
        }
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">
            {{ title() }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">{{ subtitle() }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input('');
}
