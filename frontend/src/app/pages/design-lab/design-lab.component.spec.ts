import { TestBed } from '@angular/core/testing';

import { DesignLabComponent } from './design-lab.component';

describe('DesignLabComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignLabComponent]
    }).compileComponents();
  });

  it('renders all 50 numbered concepts, including six contact-form studies', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.dl-concept')).toHaveLength(50);
    expect(element.querySelectorAll('form')).toHaveLength(6);
  });

  it('filters the gallery by concept family', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    const component = fixture.componentInstance;

    component.setCategory('contact');
    fixture.detectChanges();

    const visibleConcepts = [
      ...fixture.nativeElement.querySelectorAll('.dl-concept:not(.dl-is-hidden)')
    ] as HTMLElement[];

    expect(visibleConcepts).toHaveLength(6);
    expect(visibleConcepts.map(concept => concept.id)).toEqual([
      'concept-41',
      'concept-42',
      'concept-43',
      'concept-44',
      'concept-45',
      'concept-46'
    ]);
  });

  it('marks the private page as noindex and nofollow', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    fixture.detectChanges();

    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');

    expect(robots?.content).toBe('noindex, nofollow');
  });

  it('updates the interactive planning estimate', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    const component = fixture.componentInstance;

    component.squareFeet = 50_000;

    expect(component.estimateLow).toBe(9_000);
    expect(component.estimateHigh).toBe(14_500);
    expect(component.annualSavings).toBe(5_500);
  });
});
