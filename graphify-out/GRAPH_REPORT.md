# Graph Report - .  (2026-08-07)

## Corpus Check
- Corpus is ~6,510 words - fits in a single context window. You may not need a graph.

## Summary
- 264 nodes · 319 edges · 23 communities (16 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.88)
- Token cost: 126,773 input · 22,370 output

## Community Hubs (Navigation)
- Page Components & SEO Service
- Public Layout & Page Templates
- Angular Build Configuration
- Dev Dependencies & Testing
- Runtime Dependencies
- Angular CLI Project Config
- Contact Form Feature
- App Bootstrap & Routing
- Package Scripts & Metadata
- Brand Logo & Service Lines
- Button Components
- Section Heading Components
- Gallery Feature
- Resources Feature
- Terms & Conditions Page
- Service Card Component
- Login Page
- Privacy Policy Page
- Register Page
- Terms Component (Code)
- Page Container Component
- Project README
- Contact Request Model

## God Nodes (most connected - your core abstractions)
1. `SeoService` - 14 edges
2. `NavbarComponent` - 14 edges
3. `UiCardComponent` - 11 edges
4. `options` - 9 edges
5. `FooterComponent` - 8 edges
6. `austinsurfacepros` - 7 edges
7. `Austin Surface Pros Logo (SVG)` - 7 edges
8. `Contact Page Template` - 7 edges
9. `development` - 6 edges
10. `options` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Resource Cards Grid Section` --semantically_similar_to--> `UiCardComponent`  [INFERRED] [semantically similar]
  src/app/pages/resources/resources.component.html → src/app/shared/components/ui-card/ui-card.component.ts
- `LoadingSpinnerComponent` --semantically_similar_to--> `Service Loading State (text fallback)`  [INFERRED] [semantically similar]
  src/app/shared/components/loading-spinner/loading-spinner.component.ts → src/app/pages/service-detail/service-detail.component.html
- `PublicLayoutComponent` --references--> `Router Outlet Routing Mechanism`  [EXTRACTED]
  src/app/layouts/public-layout/public-layout.component.ts → src/app/app.component.html
- `AppComponent` --references--> `Router Outlet Routing Mechanism`  [EXTRACTED]
  src/app/app.component.ts → src/app/app.component.html
- `Index HTML App Shell` --references--> `AppComponent`  [EXTRACTED]
  src/index.html → src/app/app.component.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brand-to-services grouping in logo tagline** — public_assets_images_austin_surface_pros_logo_austin_surface_pros, public_assets_images_austin_surface_pros_logo_concrete, public_assets_images_austin_surface_pros_logo_stone, public_assets_images_austin_surface_pros_logo_asphalt [EXTRACTED 1.00]
- **Paving-trade visual motif (badge, trowel icon, stripe imagery)** — public_assets_images_austin_surface_pros_logo_badge_emblem_design, public_assets_images_austin_surface_pros_logo_trowel_striping_tool_icon, public_assets_images_austin_surface_pros_logo_asphalt_stripe_imagery [INFERRED 0.85]
- **Public Layout Shell Composition** — src_app_layouts_public_layout_public_layout_component_publiclayoutcomponent, src_app_layouts_public_layout_navbar_navbar_component_navbarcomponent, src_app_layouts_public_layout_footer_footer_component_footercomponent, src_app_app_component_routeroutletrouting [EXTRACTED 1.00]
- **Request Estimate CTA Pattern** — src_app_pages_about_about_component_aboutpage, src_app_pages_gallery_gallery_component_gallerypage, src_app_pages_home_home_component_homepage, src_app_pages_contact_contact_component_contactpage [EXTRACTED 1.00]
- **Services Presentation Pattern** — src_app_pages_contact_contact_component_serviceslist, src_app_pages_home_home_component_servicessection, src_app_shared_components_ui_card_ui_card_component_uicardcomponent [INFERRED 0.75]
- **Card UI Pattern Family (UiCard, ServiceCard, Resource cards)** — src_app_shared_components_ui_card_ui_card_component_uicardcomponent, src_app_shared_components_service_card_service_card_component_servicecardcomponent, src_app_pages_resources_resources_component_resourcecardsgrid [INFERRED 0.75]
- **CTA Button Pattern Family (Button, UiButton, inline CTA links)** — src_app_shared_components_button_button_component_buttoncomponent, src_app_shared_components_ui_button_ui_button_component_uibuttoncomponent, src_app_pages_service_detail_service_detail_component_servicedetailpage [INFERRED 0.75]
- **Section Heading Pattern Family (SectionHeader, SectionTitle, page hero eyebrow/title/description)** — src_app_shared_components_section_header_section_header_component_sectionheadercomponent, src_app_shared_components_section_title_section_title_component_sectiontitlecomponent, src_app_pages_resources_resources_component_resourcespage [INFERRED 0.75]

## Communities (23 total, 7 thin omitted)

### Community 0 - "Page Components & SEO Service"
Cohesion: 0.11
Nodes (17): SERVICES, Service, SeoService, Injectable, AboutComponent, Component, HomeComponent, Component (+9 more)

### Community 1 - "Public Layout & Page Templates"
Cohesion: 0.09
Nodes (26): Austin Surface Pros Contact Info (Address/Email), FooterComponent, Component, NavbarComponent, Component, PublicLayoutComponent, Component, About Page Template (+18 more)

### Community 2 - "Angular Build Configuration"
Cohesion: 0.08
Nodes (30): build, serve, builder, configurations, defaultConfiguration, options, development, production (+22 more)

### Community 3 - "Dev Dependencies & Testing"
Cohesion: 0.07
Nodes (27): @angular/compiler-cli, @angular-devkit/build-angular, jasmine-core, karma, karma-chrome-launcher, karma-coverage, karma-jasmine, karma-jasmine-html-reporter (+19 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic, @angular/router (+17 more)

### Community 5 - "Angular CLI Project Config"
Cohesion: 0.11
Nodes (17): extract-i18n, test, architect, prefix, projectType, root, schematics, sourceRoot (+9 more)

### Community 6 - "Contact Form Feature"
Cohesion: 0.23
Nodes (6): ContactComponent, Component, ContactFormPayload, ContactResponse, ContactService, Injectable

### Community 7 - "App Bootstrap & Routing"
Cohesion: 0.25
Nodes (6): AppComponent, Router Outlet Routing Mechanism, Component, appConfig, routes, Index HTML App Shell

### Community 8 - "Package Scripts & Metadata"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, ng, start, test, watch (+1 more)

### Community 9 - "Brand Logo & Service Lines"
Cohesion: 0.43
Nodes (8): Asphalt (service line), Perspective asphalt lane-stripe imagery, Austin Surface Pros (brand name), Circular badge emblem design, Concrete (service line), Austin Surface Pros Logo (SVG), Stone (service line), Trowel / striping-tool icon

### Community 10 - "Button Components"
Cohesion: 0.25
Nodes (6): ButtonComponent, Component, Input, Component, Input, UiButtonComponent

### Community 11 - "Section Heading Components"
Cohesion: 0.25
Nodes (6): SectionHeaderComponent, Component, Input, SectionTitleComponent, Component, Input

### Community 12 - "Gallery Feature"
Cohesion: 0.38
Nodes (4): GALLERY_ITEMS, GalleryItem, GalleryComponent, Component

### Community 13 - "Resources Feature"
Cohesion: 0.38
Nodes (4): RESOURCES, Resource, ResourcesComponent, Component

### Community 14 - "Terms & Conditions Page"
Cohesion: 0.40
Nodes (5): Estimates and Proposals Section, Payments Section, Services Section (Terms), Terms & Conditions Page, Website Use Section

### Community 15 - "Service Card Component"
Cohesion: 0.50
Nodes (3): ServiceCardComponent, Component, Input

## Knowledge Gaps
- **77 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `schematics` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UiCardComponent` connect `Page Components & SEO Service` to `Public Layout & Page Templates`, `Gallery Feature`, `Service Card Component`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies & Testing` to `Package Scripts & Metadata`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `UiCardComponent` (e.g. with `Resource Cards Grid Section` and `ServiceCardComponent`) actually correct?**
  _`UiCardComponent` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Page Components & SEO Service` be split into smaller, more focused modules?**
  _Cohesion score 0.11363636363636363 - nodes in this community are weakly interconnected._
- **Should `Public Layout & Page Templates` be split into smaller, more focused modules?**
  _Cohesion score 0.08870967741935484 - nodes in this community are weakly interconnected._
- **Should `Angular Build Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07816091954022988 - nodes in this community are weakly interconnected._