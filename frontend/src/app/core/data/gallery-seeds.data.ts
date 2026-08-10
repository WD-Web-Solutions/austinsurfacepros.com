import { GalleryPhoto } from '../models/gallery.model';

const createdAt = '2026-08-10T12:00:00.000Z';

export const GALLERY_SEEDS: GalleryPhoto[] = [
  {
    id: 'gallery-seed-1', title: 'Downtown deck refresh',
    altText: 'Aerial view of a freshly striped downtown parking deck',
    description: 'Phased deck maintenance kept tenant routes open throughout the project.',
    tags: ['striping', 'parking-deck'], city: 'Austin', state: 'Texas', capturedAt: null,
    cropAspect: '4:3', cropX: 50, cropY: 50, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/parking-aerial.jpg',
    thumbnailUrl: '/assets/images/design-lab/parking-aerial.jpg', width: 1600, height: 1200,
    status: 'ready', createdAt, publishedAt: createdAt
  },
  {
    id: 'gallery-seed-2', title: 'Fresh asphalt placement',
    altText: 'Paving machine placing a smooth course of asphalt',
    description: 'An overnight paving sequence planned around property access.',
    tags: ['asphalt', 'paving'], city: 'Cedar Park', state: 'Texas', capturedAt: null,
    cropAspect: '16:9', cropX: 50, cropY: 50, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/paving-machine.jpg',
    thumbnailUrl: '/assets/images/design-lab/paving-machine.jpg', width: 1600, height: 900,
    status: 'ready', createdAt, publishedAt: createdAt
  },
  {
    id: 'gallery-seed-3', title: 'Commercial wayfinding',
    altText: 'Commercial property with clear parking and vehicle routes',
    description: 'A circulation-first layout for visitors, deliveries, and emergency access.',
    tags: ['wayfinding', 'striping'], city: 'North Austin', state: 'Texas', capturedAt: null,
    cropAspect: '1:1', cropX: 50, cropY: 50, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/aerial-property.jpg',
    thumbnailUrl: '/assets/images/design-lab/aerial-property.jpg', width: 1200, height: 1200,
    status: 'ready', createdAt, publishedAt: createdAt
  },
  {
    id: 'gallery-seed-4', title: 'Exterior surface cleaning',
    altText: 'Technician pressure washing a commercial building exterior',
    description: 'Surface preparation completed before protective coating work.',
    tags: ['cleaning', 'surface-prep'], city: 'Austin', state: 'Texas', capturedAt: null,
    cropAspect: '4:5', cropX: 50, cropY: 45, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/pressure-washing.jpg',
    thumbnailUrl: '/assets/images/design-lab/pressure-washing.jpg', width: 960, height: 1200,
    status: 'ready', createdAt, publishedAt: createdAt
  },
  {
    id: 'gallery-seed-5', title: 'Parking structure maintenance',
    altText: 'Clean and orderly lanes inside a commercial parking structure',
    description: 'High-visibility markings refreshed in carefully sequenced work zones.',
    tags: ['parking-deck', 'maintenance'], city: 'Round Rock', state: 'Texas', capturedAt: null,
    cropAspect: '4:3', cropX: 50, cropY: 50, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/parking-structure.jpg',
    thumbnailUrl: '/assets/images/design-lab/parking-structure.jpg', width: 1600, height: 1200,
    status: 'ready', createdAt, publishedAt: createdAt
  },
  {
    id: 'gallery-seed-6', title: 'Property access planning',
    altText: 'Aerial view of a commercial property and surrounding access roads',
    description: 'Condition mapping aligned maintenance priorities with tenant operations.',
    tags: ['planning', 'commercial'], city: 'Georgetown', state: 'Texas', capturedAt: null,
    cropAspect: '16:9', cropX: 50, cropY: 50, cropZoom: 1,
    imageUrl: '/assets/images/design-lab/aerial-property.jpg',
    thumbnailUrl: '/assets/images/design-lab/aerial-property.jpg', width: 1600, height: 900,
    status: 'ready', createdAt, publishedAt: createdAt
  }
];
