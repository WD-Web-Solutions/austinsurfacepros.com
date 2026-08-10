import { PhotoMetadataService } from './photo-metadata.service';

describe('PhotoMetadataService', () => {
  const service = new PhotoMetadataService();

  it('reads editable city, state, and capture time from XMP metadata', async () => {
    const file = new File([
      '<x:xmpmeta photoshop:City="Austin" photoshop:State="Texas" exif:DateTimeOriginal="2026:08:10 14:30:00"></x:xmpmeta>'
    ], 'project.jpg', { type: 'image/jpeg' });

    const metadata = await service.read(file);

    expect(metadata.city).toBe('Austin');
    expect(metadata.state).toBe('Texas');
    expect(metadata.capturedAt).toContain('2026-08-10');
  });

  it('reads IPTC city and province-state datasets without sending the photo anywhere', async () => {
    const city = new TextEncoder().encode('Cedar Park');
    const state = new TextEncoder().encode('Texas');
    const bytes = new Uint8Array([
      0x1c, 0x02, 90, 0, city.length, ...city,
      0x1c, 0x02, 95, 0, state.length, ...state
    ]);
    const metadata = await service.read(new File([bytes], 'iptc.jpg', { type: 'image/jpeg' }));

    expect(metadata.city).toBe('Cedar Park');
    expect(metadata.state).toBe('Texas');
  });
});
