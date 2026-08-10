import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-share-buttons',
  standalone: true,
  templateUrl: './share-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareButtonsComponent {
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly copied = signal(false);

  get url(): string {
    return typeof window === 'undefined' ? '' : window.location.href;
  }

  get encodedUrl(): string { return encodeURIComponent(this.url); }
  get encodedTitle(): string { return encodeURIComponent(this.title()); }
  get emailHref(): string {
    return `mailto:?subject=${this.encodedTitle}&body=${encodeURIComponent(`${this.summary()}\n\n${this.url}`)}`;
  }

  async share(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: this.title(), text: this.summary(), url: this.url });
      return;
    }
    await this.copy();
  }

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.url);
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1800);
  }
}
