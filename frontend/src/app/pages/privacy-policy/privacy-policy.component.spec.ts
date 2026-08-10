import { TestBed } from '@angular/core/testing';

import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrivacyPolicyComponent] }).compileComponents();
  });

  it('discloses browser-local blog storage, search processing, and deletion choices', () => {
    const fixture = TestBed.createComponent(PrivacyPolicyComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('IndexedDB');
    expect(text).toContain('sessionStorage');
    expect(text).toContain('processed locally in the browser');
    expect(text).toContain('clearing this site’s browser data');
    expect(text).toContain('not transmitted to Hugging Face');
  });
});
