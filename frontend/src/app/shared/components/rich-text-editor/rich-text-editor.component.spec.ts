import { TestBed } from '@angular/core/testing';

import { RichTextEditorComponent } from './rich-text-editor.component';

describe('RichTextEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RichTextEditorComponent] }).compileComponents();
  });

  it('creates links in selected rich text', () => {
    const fixture = TestBed.createComponent(RichTextEditorComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.writeValue('<p>Austin Surface Pros</p>');
    component.editor()!.commands.selectAll();
    component.applyLink('https://austinsurfacepros.com');
    expect(component.editor()!.getHTML()).toContain('href="https://austinsurfacepros.com"');
  });

  it('inserts uploaded image data into the article', async () => {
    const fixture = TestBed.createComponent(RichTextEditorComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const input = document.createElement('input');
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'surface.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });

    await component.uploadImage({ target: input } as unknown as Event);

    expect(component.editor()!.getHTML()).toContain('data:image/png;base64');
    expect(component.editor()!.getHTML()).toContain('alt="surface.png"');
  });
});
