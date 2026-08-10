import { TestBed } from '@angular/core/testing';

import { ShareButtonsComponent } from './share-buttons.component';

describe('ShareButtonsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareButtonsComponent]
    }).compileComponents();
  });

  it('pairs decorative icons with readable share-control names', () => {
    const fixture = TestBed.createComponent(ShareButtonsComponent);
    fixture.componentRef.setInput('title', 'Parking lot planning');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const controls = Array.from(element.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a, button'));
    const labels = controls.map(control => control.textContent?.trim());

    expect(labels).toEqual(['Share…', 'LinkedIn', 'Facebook', 'Email', 'Copy link']);
    expect(element.querySelectorAll('i')).toHaveLength(5);
    expect(element.querySelectorAll('i[aria-hidden="true"]')).toHaveLength(5);
    expect(element.querySelector('.fa-share-nodes')).not.toBeNull();
    expect(element.querySelector('.fa-linkedin-in')).not.toBeNull();
    expect(element.querySelector('.fa-facebook-f')).not.toBeNull();
    expect(element.querySelector('.fa-envelope')).not.toBeNull();
    expect(element.querySelector('.fa-link')).not.toBeNull();
  });
});
