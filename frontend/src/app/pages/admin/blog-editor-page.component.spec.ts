import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { LocalBlogService } from '../../core/services/local-blog.service';
import { BlogEditorPageComponent } from './blog-editor-page.component';

describe('BlogEditorPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogEditorPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } }
        },
        { provide: LocalBlogService, useValue: {} }
      ]
    }).compileComponents();
  });

  it('regenerates the slug after every title edit', () => {
    const fixture = TestBed.createComponent(BlogEditorPageComponent);
    const form = fixture.componentInstance.form;

    form.controls.title.setValue('Planning Surface Work in Austin');
    expect(form.controls.slug.value).toBe('planning-surface-work-in-austin');

    form.controls.slug.setValue('temporary-custom-slug');
    form.controls.title.setValue('Updated: Parking Lot Maintenance');
    expect(form.controls.slug.value).toBe('updated-parking-lot-maintenance');
  });

  it('labels the generated slug and associates its update instructions', () => {
    const fixture = TestBed.createComponent(BlogEditorPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('label[for="post-slug"]')?.textContent).toContain('URL slug');
    expect(element.querySelector('#post-slug')?.getAttribute('aria-describedby')).toBe('post-slug-help');
    expect(element.querySelector('#post-slug-help')?.textContent).toContain('title changes');
  });

  it('removes publishing metadata controls and explains their automatic values', () => {
    const fixture = TestBed.createComponent(BlogEditorPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#post-status')).toBeNull();
    expect(element.querySelector('#post-date')).toBeNull();
    expect(element.querySelector('#post-author')).toBeNull();
    expect(element.textContent).toContain('Posts publish immediately');
    expect(element.textContent).toContain('publish date and author are assigned automatically');
  });
});
