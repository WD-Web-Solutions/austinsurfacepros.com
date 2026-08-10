import { BlogPost } from '../models/blog-post.model';

const image = (name: string): string => `/assets/images/design-lab/${name}`;

export const BLOG_SEEDS: BlogPost[] = [
  {
    id: 'seed-night-striping',
    slug: 'night-striping-without-disrupting-tenants',
    title: 'Night Striping Without Disrupting Tenants',
    summary: 'A practical phasing plan for refreshing a busy commercial lot while entrances, fire lanes, and morning traffic stay operational.',
    contentHtml: `<h2>The best striping project starts with traffic</h2><p>Fresh markings improve safety, accessibility, and the first impression of a property—but only when the work plan respects how the site actually moves.</p><img src="${image('parking-lines.jpg')}" alt="Fresh parking lot striping viewed at an angle"><h2>Divide the lot into useful phases</h2><p>Start with entrances, delivery routes, fire lanes, and tenant peak hours. From there, divide the lot into sections that crews can clean, lay out, stripe, and reopen without trapping vehicles.</p><blockquote>Good phasing protects the finish and keeps the property usable.</blockquote><ul><li>Notify tenants before work begins.</li><li>Confirm accessible routes remain available.</li><li>Use cones and directional signage at every transition.</li><li>Schedule a final daylight walkthrough.</li></ul><p>For a site-specific plan, <a href="/contact">request an estimate</a> and include your preferred work window.</p>`,
    thumbnailUrl: image('parking-lines.jpg'), thumbnailAlt: 'Fresh white parking lines on dark pavement', author: 'Austin Surface Pros',
    publishedAt: '2026-08-08T14:00:00.000Z', createdAt: '2026-08-08T13:30:00.000Z', updatedAt: '2026-08-08T14:00:00.000Z', status: 'published',
    tags: ['parking-lots', 'striping', 'property-management'], readingMinutes: 3
  },
  {
    id: 'seed-asphalt-warning-signs',
    slug: 'five-signs-your-asphalt-needs-attention',
    title: 'Five Signs Your Asphalt Needs Attention',
    summary: 'Small surface changes often reveal drainage, base, or traffic problems before they turn into expensive reconstruction.',
    contentHtml: `<h2>Read the pavement before the next storm</h2><p>Cracks and faded color are easy to notice. The more important question is what they indicate below the surface.</p><img src="${image('asphalt-road.jpg')}" alt="Long asphalt roadway under an open sky"><ol><li><strong>Connected cracking:</strong> a block or alligator pattern may point to base movement.</li><li><strong>Standing water:</strong> persistent puddles accelerate surface damage.</li><li><strong>Raveling:</strong> loose aggregate means the wearing surface is losing cohesion.</li><li><strong>Depressions:</strong> wheel paths or isolated low spots deserve an inspection.</li><li><strong>Repeated patches:</strong> recurring failure can mean the cause was never addressed.</li></ol><p>An early site review creates more repair options and a more predictable capital plan.</p>`,
    thumbnailUrl: image('fresh-asphalt.jpg'), thumbnailAlt: 'Close view of a freshly paved asphalt surface', author: 'Austin Surface Pros',
    publishedAt: '2026-08-04T15:30:00.000Z', createdAt: '2026-08-04T15:00:00.000Z', updatedAt: '2026-08-04T15:30:00.000Z', status: 'published',
    tags: ['asphalt', 'maintenance', 'budget-planning'], readingMinutes: 3
  },
  {
    id: 'seed-pressure-washing',
    slug: 'commercial-pressure-washing-preparation-guide',
    title: 'A Property Manager’s Pressure-Washing Prep Guide',
    summary: 'The simple access, drainage, signage, and tenant-notice checks that make commercial cleaning faster and safer.',
    contentHtml: `<h2>Preparation keeps the cleaning window predictable</h2><p>A professional surface-cleaning plan begins before equipment arrives. Identify pedestrian paths, electrical fixtures, delicate landscaping, runoff routes, and areas that cannot be closed at the same time.</p><img src="${image('pressure-washing.jpg')}" alt="Commercial surface being pressure washed"><h3>Before the crew arrives</h3><ul><li>Move portable furniture, signs, and merchandise.</li><li>Notify tenants about overspray and access windows.</li><li>Confirm water access and any site-specific restrictions.</li><li>Mark stains or problem areas that require special attention.</li></ul><p>These details reduce interruptions and help crews focus on consistent results.</p>`,
    thumbnailUrl: image('pressure-washing.jpg'), thumbnailAlt: 'Technician pressure washing a commercial surface', author: 'Austin Surface Pros',
    publishedAt: '2026-07-30T13:00:00.000Z', createdAt: '2026-07-30T12:00:00.000Z', updatedAt: '2026-07-30T13:00:00.000Z', status: 'published',
    tags: ['pressure-washing', 'property-management', 'maintenance'], readingMinutes: 2
  },
  {
    id: 'seed-budget-roadmap',
    slug: 'building-a-three-year-surface-maintenance-roadmap',
    title: 'Building a Three-Year Surface Maintenance Roadmap',
    summary: 'Turn reactive repairs into an inspection-led plan that separates urgent safety work, preservation, and long-term replacement.',
    contentHtml: `<h2>A roadmap gives every repair a reason</h2><p>Commercial sites rarely need every surface repaired at once. A useful plan ranks work by safety, water movement, operational impact, and the cost of waiting.</p><img src="${image('aerial-property.jpg')}" alt="Aerial view of a commercial property and surrounding pavement"><h3>Year one: stabilize</h3><p>Address trip hazards, potholes, failed drainage areas, and markings tied to accessibility or fire access.</p><h3>Year two: preserve</h3><p>Protect sound pavement and repair developing defects before they spread.</p><h3>Year three: renew</h3><p>Schedule larger rehabilitation around tenant cycles and capital budgets.</p><p>Revisit the plan after major weather events and whenever traffic patterns change.</p>`,
    thumbnailUrl: image('aerial-property.jpg'), thumbnailAlt: 'Aerial view of a commercial building and parking areas', author: 'Austin Surface Pros',
    publishedAt: '2026-07-24T16:00:00.000Z', createdAt: '2026-07-24T15:20:00.000Z', updatedAt: '2026-07-24T16:00:00.000Z', status: 'published',
    tags: ['budget-planning', 'maintenance', 'commercial-properties'], readingMinutes: 3
  },
  {
    id: 'seed-sealcoat-weather',
    slug: 'why-weather-matters-for-sealcoating',
    title: 'Why Weather Matters for Sealcoating',
    summary: 'Temperature, humidity, shade, and rain risk all affect curing—and the reopening time your tenants experience.',
    contentHtml: `<h2>The forecast is only the starting point</h2><p>Sealcoating needs an appropriate surface temperature and enough drying time. Air temperature alone does not tell the whole story: shaded sections, overnight humidity, and pavement moisture can change the schedule.</p><img src="${image('austin-skyline.jpg')}" alt="Austin skyline under a clear blue sky"><p>A responsible work window includes preparation, application, curing, striping when required, and a realistic reopening buffer.</p><p>When weather changes, protecting the finished surface matters more than forcing the original schedule.</p>`,
    thumbnailUrl: image('austin-skyline.jpg'), thumbnailAlt: 'Austin skyline beneath clear weather', author: 'Austin Surface Pros',
    publishedAt: '2026-07-18T14:30:00.000Z', createdAt: '2026-07-18T14:00:00.000Z', updatedAt: '2026-07-18T14:30:00.000Z', status: 'published',
    tags: ['sealcoating', 'weather', 'asphalt'], readingMinutes: 2
  },
  {
    id: 'seed-accessible-markings',
    slug: 'accessible-parking-markings-site-review',
    title: 'Accessible Parking Markings: What a Site Review Should Cover',
    summary: 'A field review should consider stalls, access aisles, routes, signage, slopes, and the way users move from parking to an entrance.',
    contentHtml: `<h2>Paint is one part of an accessible route</h2><p>Markings need to be evaluated with the full path of travel. A clear stall is not enough if an access aisle leads into a curb, damaged walkway, or delivery path.</p><img src="${image('parking-aerial.jpg')}" alt="Aerial view of an organized parking lot"><p>A site review should document existing geometry, signs, slopes, curb transitions, surface condition, and connections to each served entrance.</p><p>Requirements vary by project and jurisdiction. Engage qualified design or legal professionals when compliance questions extend beyond maintenance work.</p>`,
    thumbnailUrl: image('parking-aerial.jpg'), thumbnailAlt: 'Organized parking stalls viewed from above', author: 'Austin Surface Pros',
    publishedAt: '2026-07-11T17:00:00.000Z', createdAt: '2026-07-11T16:15:00.000Z', updatedAt: '2026-07-11T17:00:00.000Z', status: 'published',
    tags: ['accessibility', 'striping', 'property-management'], readingMinutes: 2
  },
  {
    id: 'seed-concrete-trip-hazards',
    slug: 'prioritizing-concrete-trip-hazards',
    title: 'How to Prioritize Concrete Trip Hazards',
    summary: 'Use pedestrian exposure, height change, route importance, and deterioration to build a practical repair queue.',
    contentHtml: `<h2>Prioritize risk, not just appearance</h2><p>Start with heavily used routes: accessible paths, main entrances, mail areas, loading zones, and transitions between sidewalks and parking lots.</p><img src="${image('commercial-building.jpg')}" alt="Commercial building entrance and paved approach"><p>Document each location consistently with photos, measurements, nearby drainage conditions, and a temporary-control decision. Then group permanent repairs by method and location to reduce mobilization costs.</p>`,
    thumbnailUrl: image('commercial-building.jpg'), thumbnailAlt: 'Commercial building with a paved entrance', author: 'Austin Surface Pros',
    publishedAt: '2026-07-03T13:30:00.000Z', createdAt: '2026-07-03T13:00:00.000Z', updatedAt: '2026-07-03T13:30:00.000Z', status: 'published',
    tags: ['concrete', 'safety', 'maintenance'], readingMinutes: 2
  },
  {
    id: 'seed-contractor-walkthrough',
    slug: 'questions-for-a-commercial-surface-walkthrough',
    title: 'Seven Questions to Ask During a Surface Walkthrough',
    summary: 'A better walkthrough connects observed damage to causes, repair limits, site operations, and a measurable finished result.',
    contentHtml: `<h2>Make the walkthrough earn its place in the project</h2><img src="${image('worksite-team.jpg')}" alt="Worksite team reviewing a commercial project"><ol><li>What is failing—and what caused it?</li><li>Where does water move after a storm?</li><li>Which areas cannot close together?</li><li>What preparation is included?</li><li>How will repair limits be marked?</li><li>What weather conditions change the schedule?</li><li>What does final acceptance include?</li></ol><p>Clear answers make competing scopes easier to compare and reduce assumptions before mobilization.</p>`,
    thumbnailUrl: image('worksite-team.jpg'), thumbnailAlt: 'Commercial worksite team planning together', author: 'Austin Surface Pros',
    publishedAt: '2026-06-25T15:00:00.000Z', createdAt: '2026-06-25T14:00:00.000Z', updatedAt: '2026-06-25T15:00:00.000Z', status: 'published',
    tags: ['project-planning', 'commercial-properties', 'contractors'], readingMinutes: 2
  },
  {
    id: 'seed-austin-summer',
    slug: 'planning-surface-work-around-austin-summer-heat',
    title: 'Planning Surface Work Around Austin Summer Heat',
    summary: 'Early starts, shaded staging, tenant communication, and material-specific limits help keep hot-weather projects safe and predictable.',
    contentHtml: `<h2>Heat changes people, materials, and schedules</h2><p>Summer planning needs more than a high-temperature forecast. Surface temperature, crew exposure, equipment staging, cure behavior, and afternoon storms all influence the work window.</p><img src="${image('construction-crew.jpg')}" alt="Construction crew working together outdoors"><p>Use phased closures, confirm hydration and shade plans, and communicate reopening estimates as ranges until field conditions are verified.</p>`,
    thumbnailUrl: image('construction-crew.jpg'), thumbnailAlt: 'Construction crew working outdoors in Central Texas', author: 'Austin Surface Pros',
    publishedAt: '2026-06-16T14:00:00.000Z', createdAt: '2026-06-16T13:30:00.000Z', updatedAt: '2026-06-16T14:00:00.000Z', status: 'published',
    tags: ['austin', 'weather', 'project-planning'], readingMinutes: 2
  }
];
