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
    expect(policyText).toContain('project address');
    expect(policyText).toContain('at least one contact method');
    expect(policyText).toContain('selected photos remain on your device');
    expect(policyText).toContain('not uploaded or submitted');
    expect(policyText).toContain('does not set cookies');
    expect(policyText).toContain('access token');
    expect(policyText).toContain('cryptographic hash');
    expect(policyText).toContain('displayed publicly');
    expect(policyText).toContain("signed-in administrator's account name");
    expect(policyText).toContain('fixed name "Austin Surface Pros"');
    expect(policyText).toContain('IndexedDB');
    expect(policyText).toContain('project-gallery photos');
    expect(policyText).toContain('private Amazon S3');
    expect(policyText).toContain('removes embedded metadata');
    expect(policyText).toContain('Amazon CloudFront');
    expect(policyText).toContain('expire after one day');
    expect(policyText).toContain('sessionStorage');
    expect(policyText).toContain('processed locally');
    expect(policyText).toContain('not transmitted to');
    expect(policyText).toContain("address text you type is sent to Komoot's Photon");
    expect(policyText).toContain('either address checker');
    expect(policyText).toContain('sent to Austin Surface Pros only if you submit');
    expect(policyText).toContain('OpenStreetMap Foundation');
    expect(policyText).toContain('discarded when the page is refreshed or closed');
    expect(policyText).toContain('email-delivery');
    expect(policyText).toContain('austinsurfacepros@gmail.com');
    expect(policyText).toContain('Last updated: August 10, 2026');
    expect(policyText).toContain('We do not sell personal information');
    expect(policyText).toContain('Your privacy choices and rights');

    const privacyRequestLink = element.querySelector<HTMLAnchorElement>(
      'a[href="mailto:austinsurfacepros@gmail.com?subject=Privacy%20Request"]'
    );
    expect(privacyRequestLink).not.toBeNull();
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
