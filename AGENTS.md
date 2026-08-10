# Coding-agent instructions

## Privacy and legal-content maintenance

The website's privacy disclosures must match its actual behavior. Any change that
collects, stores, logs, uses, transmits, shares, or deletes personal information
must include a privacy review in the same change.

This includes changes involving forms, accounts, authentication, payments,
uploads, chat, email or SMS, analytics, advertising pixels, embedded third-party
content, cookies, browser storage, session replay, geolocation, IP or device
logging, AI features, data vendors, retention periods, or security practices.

When one of those changes is made:

1. Update `frontend/src/app/pages/privacy-policy/privacy-policy.component.html`
   so its categories, purposes, recipients, retention language, user choices,
   and "Last updated" date remain accurate.
2. Add or update a clear notice at the point where information is collected.
   Add consent and opt-out controls before collection when applicable law
   requires them.
3. Do not add non-essential cookies, pixels, browser storage, or similar tracking
   until consent, opt-out, Global Privacy Control, and regional requirements have
   been evaluated and the required controls are implemented.
4. Review service-provider contracts and the actual data flow. Do not make
   absolute privacy or security promises that the implementation cannot support.
5. Add or update tests that verify material public-facing disclosures and
   controls.
6. Flag sensitive-data processing, targeted advertising, data sales, automated
   decision-making, children's data, or expansion outside the current U.S.
   service area for qualified legal review before release.

The policy is part of the product, not static boilerplate. A functional or data
change is incomplete if it makes the published policy inaccurate.

## Accessibility maintenance

Customer-facing functionality must continue to target WCAG 2.2 Level AA. Any
change to routes, navigation, forms, dialogs, menus, media, animation, color,
content structure, or interactive controls must include an accessibility review
in the same change.

At minimum:

1. Preserve one descriptive `h1` and one visible `main` landmark per page, a
   logical heading hierarchy, descriptive page titles, and named navigation
   landmarks.
2. Keep every feature operable by keyboard with a visible focus indicator. Do
   not introduce keyboard traps, hover-only actions, or controls without an
   accessible name, state, and purpose.
3. Give form controls persistent labels, native semantics, clear instructions,
   programmatically associated errors, and useful focus handling after invalid
   submission.
4. Maintain AA text and non-text contrast, 320 CSS-pixel reflow without
   two-dimensional scrolling, 200% text resizing, appropriate target sizes,
   reduced-motion support, and meaningful alternative text.
5. Update or add automated regression tests for material semantics and controls,
   then perform keyboard and responsive browser checks on affected flows.
6. Do not expose prototypes or experiments as production routes until they have
   received the same accessibility and functional review. The current
   `/design-lab`, `/login`, and `/register` routes are development-only for this
   reason.
7. Do not add accessibility overlays as a substitute for fixing the underlying
   HTML, CSS, and interaction behavior.

Accessibility conformance is a product requirement, not a one-time statement.
Do not claim legal or standards conformance solely because automated checks pass;
manual testing and periodic assistive-technology review are still required.
