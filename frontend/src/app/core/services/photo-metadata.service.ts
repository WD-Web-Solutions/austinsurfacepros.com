import { Injectable } from '@angular/core';

export interface PhotoMetadata {
  city: string | null;
  state: string | null;
  capturedAt: string | null;
}

const MAX_METADATA_BYTES = 2 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class PhotoMetadataService {
  async read(file: File): Promise<PhotoMetadata> {
    const bytes = new Uint8Array(await file.slice(0, MAX_METADATA_BYTES).arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    return {
      city: this.xmpValue(text, ['photoshop:City', 'Iptc4xmpCore:Location'])
        ?? this.iptcValue(bytes, 90),
      state: this.xmpValue(text, ['photoshop:State', 'Iptc4xmpCore:ProvinceState'])
        ?? this.iptcValue(bytes, 95),
      capturedAt: this.captureDate(text)
    };
  }

  private xmpValue(text: string, fields: string[]): string | null {
    for (const field of fields) {
      const escaped = field.replace(':', '\\:');
      const attribute = text.match(new RegExp(`${escaped}=["']([^"']+)["']`, 'i'))?.[1];
      const element = text.match(new RegExp(`<${escaped}>([^<]+)</${escaped}>`, 'i'))?.[1];
      const value = this.clean(attribute ?? element ?? '');
      if (value) return value;
    }
    return null;
  }

  private iptcValue(bytes: Uint8Array, dataset: number): string | null {
    for (let index = 0; index < bytes.length - 6; index += 1) {
      if (bytes[index] !== 0x1c || bytes[index + 1] !== 0x02 || bytes[index + 2] !== dataset) {
        continue;
      }
      const length = (bytes[index + 3]! << 8) | bytes[index + 4]!;
      if (length <= 0 || index + 5 + length > bytes.length) continue;
      return this.clean(new TextDecoder().decode(bytes.slice(index + 5, index + 5 + length)));
    }
    return null;
  }

  private captureDate(text: string): string | null {
    const raw = this.xmpValue(text, ['exif:DateTimeOriginal', 'photoshop:DateCreated']);
    if (!raw) return null;
    const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
  }

  private clean(value: string): string | null {
    const decoded = value
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .replace(/\s+/g, ' ');
    return decoded ? decoded.slice(0, 120) : null;
  }
}
