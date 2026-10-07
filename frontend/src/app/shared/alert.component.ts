import { Component, computed, input } from '@angular/core';
import { IconComponent } from './icon.component';

export type AlertTone = 'error' | 'success' | 'info';

const baseClasses =
  'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium';

const toneClasses: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

const toneIcons: Record<AlertTone, string> = {
  error: 'alert-triangle',
  success: 'check-circle',
  info: 'info',
};

@Component({
  selector: 'app-alert',
  imports: [IconComponent],
  host: { class: 'block' },
  template: `
    @if (message()) {
      <div role="alert" [class]="classes()">
        <span class="mt-0.5">
          <app-icon [name]="iconName()" [size]="18" />
        </span>
        <p>{{ message() }}</p>
      </div>
    }
  `,
})
export class AlertComponent {
  readonly message = input('');
  readonly tone = input<AlertTone>('error');

  protected readonly classes = computed(
    () => `${baseClasses} ${toneClasses[this.tone()]}`,
  );
  protected readonly iconName = computed(() => toneIcons[this.tone()]);
}
