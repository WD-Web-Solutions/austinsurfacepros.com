import { TestBed } from '@angular/core/testing';

import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponent]
    }).compileComponents();
  });

  it('discloses the current collection and tracking practices', () => {
    const fixture = TestBed.createComponent(PrivacyPolicyComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const policyText = element.textContent ?? '';

    expect(policyText).toContain('Privacy Policy');
    expect(policyText).toContain('estimate request');
    expect(policyText).toContain('does not set cookies');
    expect(policyText).toContain('We do not sell personal information');
    expect(policyText).toContain('Your privacy choices and rights');
  });

  it('sets privacy-specific page metadata', () => {
    const fixture = TestBed.createComponent(PrivacyPolicyComponent);
    fixture.detectChanges();

    const description = document.head.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );

    expect(document.title).toBe('Privacy Policy | Austin Surface Pros');
    expect(description?.content).toContain('collects, uses, protects, and shares');
  });
});
