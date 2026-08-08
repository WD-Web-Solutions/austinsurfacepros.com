import { TestBed } from '@angular/core/testing';

import { DesignLabComponent } from './design-lab.component';

describe('DesignLabComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignLabComponent]
    }).compileComponents();
  });

  it('renders only the first ten concepts on the initial page', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.dl-concept')).toHaveLength(10);
    expect(element.querySelector('#concept-1')).not.toBeNull();
    expect(element.querySelector('#concept-10')).not.toBeNull();
    expect(element.querySelector('#concept-11')).toBeNull();
  });

  it('filters the gallery by concept family', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    const component = fixture.componentInstance;

    component.setCategory('contact');
    fixture.detectChanges();

    const visibleConcepts = [
      ...fixture.nativeElement.querySelectorAll('.dl-concept')
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
    expect(fixture.nativeElement.querySelectorAll('form')).toHaveLength(6);
  });

  it('paginates all concepts ten at a time', () => {
    const fixture = TestBed.createComponent(DesignLabComponent);
    const component = fixture.componentInstance;

    component.setPage(3);
    fixture.detectChanges();

    const concepts = [...fixture.nativeElement.querySelectorAll('.dl-concept')] as HTMLElement[];

    expect(component.totalPages).toBe(5);
    expect(concepts).toHaveLength(10);
    expect(concepts[0]?.id).toBe('concept-21');
    expect(concepts[9]?.id).toBe('concept-30');
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
