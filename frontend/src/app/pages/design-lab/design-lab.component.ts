import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';

type LabCategory = 'all' | 'hero' | 'services' | 'proof' | 'tools' | 'content' | 'contact' | 'cta';

interface LabFilter {
  readonly id: LabCategory;
  readonly label: string;
  readonly count: number;
}

interface LabJumpLink {
  readonly id: number;
  readonly title: string;
  readonly category: Exclude<LabCategory, 'all'>;
}

@Component({
  selector: 'app-design-lab',
  standalone: true,
  templateUrl: './design-lab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignLabComponent {
  private readonly seoService = inject(SeoService);

  readonly filters: readonly LabFilter[] = [
    { id: 'all', label: 'All concepts', count: 50 },
    { id: 'hero', label: 'Heroes', count: 5 },
    { id: 'services', label: 'Services', count: 8 },
    { id: 'proof', label: 'Proof', count: 9 },
    { id: 'tools', label: 'Tools', count: 9 },
    { id: 'content', label: 'Content', count: 6 },
    { id: 'contact', label: 'Contact', count: 6 },
    { id: 'cta', label: 'Calls to action', count: 7 }
  ];

  readonly concepts: readonly LabJumpLink[] = [
    { id: 1, title: 'Split Reveal Hero', category: 'hero' },
    { id: 2, title: 'Service Orbit Hero', category: 'hero' },
    { id: 3, title: 'Blueprint Hero', category: 'hero' },
    { id: 4, title: 'Austin Night Hero', category: 'hero' },
    { id: 5, title: 'Editorial Statement Hero', category: 'hero' },
    { id: 6, title: 'Service Bento', category: 'services' },
    { id: 7, title: 'Surface Selector', category: 'services' },
    { id: 8, title: 'Asphalt Anatomy', category: 'services' },
    { id: 9, title: 'Maintenance Timeline', category: 'services' },
    { id: 10, title: 'Service Marquee', category: 'services' },
    { id: 11, title: 'Finish Swatches', category: 'services' },
    { id: 12, title: 'Equipment Specification', category: 'services' },
    { id: 13, title: 'Contract Plans', category: 'services' },
    { id: 14, title: 'Metric Ribbon', category: 'proof' },
    { id: 15, title: 'Case Study Spread', category: 'proof' },
    { id: 16, title: 'Testimonial Filmstrip', category: 'proof' },
    { id: 17, title: 'Warranty Seal', category: 'proof' },
    { id: 18, title: 'Safety Checklist', category: 'proof' },
    { id: 19, title: 'Crew Profile', category: 'proof' },
    { id: 20, title: 'Partner Rail', category: 'proof' },
    { id: 21, title: 'Impact Report', category: 'proof' },
    { id: 22, title: 'Neighborhood Proof', category: 'proof' },
    { id: 23, title: 'Instant Estimate', category: 'tools' },
    { id: 24, title: 'Problem Diagnoser', category: 'tools' },
    { id: 25, title: 'ROI Calculator', category: 'tools' },
    { id: 26, title: 'Maintenance Calendar', category: 'tools' },
    { id: 27, title: 'Weather Window', category: 'tools' },
    { id: 28, title: 'Project Readiness', category: 'tools' },
    { id: 29, title: 'Quote Receipt', category: 'tools' },
    { id: 30, title: 'Property Dashboard', category: 'tools' },
    { id: 31, title: 'Parking Optimizer', category: 'tools' },
    { id: 32, title: 'Project Gallery', category: 'content' },
    { id: 33, title: 'FAQ Ledger', category: 'content' },
    { id: 34, title: 'Resource Magazine', category: 'content' },
    { id: 35, title: 'Material Comparison', category: 'content' },
    { id: 36, title: 'Process Roadmap', category: 'content' },
    { id: 37, title: 'Service Area Map', category: 'content' },
    { id: 38, title: 'Emergency Alert', category: 'cta' },
    { id: 39, title: 'Schedule Strip', category: 'cta' },
    { id: 40, title: 'Floating Action Dock', category: 'cta' },
    { id: 41, title: 'Guided Estimate Form', category: 'contact' },
    { id: 42, title: 'Concierge Contact Form', category: 'contact' },
    { id: 43, title: 'Conversational Form', category: 'contact' },
    { id: 44, title: 'Local Map Form', category: 'contact' },
    { id: 45, title: 'Callback Card', category: 'contact' },
    { id: 46, title: 'Photo Quote Form', category: 'contact' },
    { id: 47, title: 'Jumbo Quote Footer', category: 'cta' },
    { id: 48, title: 'Availability Card', category: 'cta' },
    { id: 49, title: 'Mobile Sticky CTA', category: 'cta' },
    { id: 50, title: 'Mood Switcher', category: 'cta' }
  ];

  readonly pageSize = 10;

  activeCategory: LabCategory = 'all';
  revealPosition = 58;
  selectedService = 'asphalt';
  activeFaq = 0;
  selectedProblem = 'cracks';
  squareFeet = 24000;
  selectedMonth = 2;
  callbackTime = 'Morning';
  mood: 'precision' | 'warm' | 'bold' = 'precision';
  estimateStep = 1;
  currentPage = 1;

  constructor() {
    this.seoService.updatePage(
      'Design Lab | Austin Surface Pros',
      'Private component exploration page for Austin Surface Pros.',
      'noindex, nofollow'
    );
  }

  get filteredConcepts(): readonly LabJumpLink[] {
    if (this.activeCategory === 'all') {
      return this.concepts;
    }

    return this.concepts.filter(concept => concept.category === this.activeCategory);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredConcepts.length / this.pageSize));
  }

  get pageNumbers(): readonly number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get visibleRangeStart(): number {
    return this.filteredConcepts.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get visibleRangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredConcepts.length);
  }

  isRendered(id: number, category: Exclude<LabCategory, 'all'>): boolean {
    if (this.activeCategory !== 'all' && this.activeCategory !== category) {
      return false;
    }

    const index = this.filteredConcepts.findIndex(concept => concept.id === id);
    return index >= (this.currentPage - 1) * this.pageSize && index < this.currentPage * this.pageSize;
  }

  setCategory(category: LabCategory): void {
    this.activeCategory = category;
    this.currentPage = 1;
  }

  setPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages);
    if (nextPage === this.currentPage) {
      return;
    }

    this.currentPage = nextPage;
    const gallery = document.querySelector<HTMLElement>('.dl-stack');
    if (typeof gallery?.scrollIntoView === 'function') {
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  jumpTo(id: number): void {
    const target = this.concepts.find(concept => concept.id === id);
    if (!target) {
      return;
    }

    if (this.activeCategory !== 'all' && this.activeCategory !== target.category) {
      this.activeCategory = 'all';
    }

    const index = this.filteredConcepts.findIndex(concept => concept.id === id);
    this.currentPage = Math.floor(index / this.pageSize) + 1;

    setTimeout(() => {
      const concept = document.getElementById(`concept-${id}`);
      if (typeof concept?.scrollIntoView === 'function') {
        concept.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  setReveal(event: Event): void {
    this.revealPosition = Number((event.target as HTMLInputElement).value);
  }

  setSquareFeet(event: Event): void {
    this.squareFeet = Number((event.target as HTMLInputElement).value);
  }

  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? -1 : index;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  get estimateLow(): number {
    return Math.round(this.squareFeet * 0.18 / 100) * 100;
  }

  get estimateHigh(): number {
    return Math.round(this.squareFeet * 0.29 / 100) * 100;
  }

  get annualSavings(): number {
    return Math.round(this.squareFeet * 0.11 / 100) * 100;
  }
}
