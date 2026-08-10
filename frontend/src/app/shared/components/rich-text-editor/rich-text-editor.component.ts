import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  forwardRef,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  templateUrl: './rich-text-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorHost', { static: true }) private editorHost!: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput', { static: true }) private imageInput!: ElementRef<HTMLInputElement>;

  readonly editor = signal<Editor | null>(null);
  readonly linkEditorOpen = signal(false);
  readonly imageError = signal<string | null>(null);
  private pendingValue = '';
  private disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngAfterViewInit(): void {
    const editor = new Editor({
      element: this.editorHost.nativeElement,
      editable: !this.disabled,
      content: this.pendingValue || '<p></p>',
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3, 4] },
          link: {
            autolink: true,
            openOnClick: false,
            defaultProtocol: 'https',
            HTMLAttributes: { rel: 'noopener noreferrer' }
          }
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: { class: 'blog-editor-image' }
        }),
        Placeholder.configure({ placeholder: 'Write a useful, practical article…' })
      ],
      editorProps: {
        attributes: {
          class: 'blog-editor-content',
          'aria-label': 'Blog post content'
        }
      },
      onUpdate: ({ editor: currentEditor }) => this.onChange(currentEditor.getHTML()),
      onBlur: () => this.onTouched()
    });
    this.editor.set(editor);
  }

  ngOnDestroy(): void {
    this.editor()?.destroy();
  }

  writeValue(value: string | null): void {
    this.pendingValue = value ?? '';
    const editor = this.editor();
    if (editor && editor.getHTML() !== this.pendingValue) {
      editor.commands.setContent(this.pendingValue || '<p></p>', { emitUpdate: false });
    }
  }

  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.editor()?.setEditable(!disabled);
  }

  setParagraph(): void { this.editor()?.chain().focus().setParagraph().run(); }
  toggleHeading(level: 2 | 3 | 4): void { this.editor()?.chain().focus().toggleHeading({ level }).run(); }
  toggleBold(): void { this.editor()?.chain().focus().toggleBold().run(); }
  toggleItalic(): void { this.editor()?.chain().focus().toggleItalic().run(); }
  toggleUnderline(): void { this.editor()?.chain().focus().toggleUnderline().run(); }
  toggleStrike(): void { this.editor()?.chain().focus().toggleStrike().run(); }
  toggleBulletList(): void { this.editor()?.chain().focus().toggleBulletList().run(); }
  toggleOrderedList(): void { this.editor()?.chain().focus().toggleOrderedList().run(); }
  toggleBlockquote(): void { this.editor()?.chain().focus().toggleBlockquote().run(); }
  addHorizontalRule(): void { this.editor()?.chain().focus().setHorizontalRule().run(); }
  undo(): void { this.editor()?.chain().focus().undo().run(); }
  redo(): void { this.editor()?.chain().focus().redo().run(); }
  clearFormatting(): void { this.editor()?.chain().focus().unsetAllMarks().clearNodes().run(); }

  openLinkEditor(): void {
    this.linkEditorOpen.set(!this.linkEditorOpen());
  }

  applyLink(value: string): void {
    const href = value.trim();
    if (!href) {
      this.editor()?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      this.editor()?.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    this.linkEditorOpen.set(false);
  }

  chooseImage(): void {
    this.imageInput.nativeElement.click();
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.imageError.set(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Choose a PNG, JPEG, GIF, or WebP image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.imageError.set('Article images must be 3 MB or smaller for local storage.');
      return;
    }
    const dataUrl = await this.readFile(file);
    this.editor()?.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
  }

  isActive(name: string, attributes?: Record<string, unknown>): boolean {
    return this.editor()?.isActive(name, attributes) ?? false;
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Image could not be read.'));
      reader.readAsDataURL(file);
    });
  }
}
