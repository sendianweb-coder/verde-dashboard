---
version: alpha
name: "Verde Frappe Light"
description: "Frappe-inspired minimal light layout with Verde brand identity preserved for primary actions, success states, and key workflow affordances. Typography baseline relies on InterVariable for primary body text, nav items, card content."
colors:
  card-surface: "#ffffff"
  cta-button-fill: "#171717"
  verde-brand-50: "#f0fdf4"
  verde-brand-100: "#dcfce7"
  verde-brand-500: "#22c55e"
  verde-brand-600: "#16a34a"
  verde-brand-700: "#15803d"
  page-background: "#f3f3f3"
  body-text: "#525252"
  button-label: "#ffffff"
  heading-text: "#383838"
  muted-text-helper: "#7c7c7c"
  input-border-subtle-divider: "#ededed"
  nav-bottom-border: "#ededed"
typography:
  body-default:
    fontFamily: "InterVariable"
    fontSize: "16px"
    fontWeight: "420"
    lineHeight: "24px"
    letterSpacing: "0.32px"
  body-small:
    fontFamily: "InterVariable"
    fontSize: "14px"
    fontWeight: "420"
    lineHeight: "21px"
    letterSpacing: "0.28px"
  label-medium:
    fontFamily: "InterVariable"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "14px"
    letterSpacing: "0.32px"
  heading-h4:
    fontFamily: "InterVariable"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "27px"
    letterSpacing: "0.32px"
  nav-brand-link:
    fontFamily: "InterVariable"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "21.6px"
    letterSpacing: "0.18px"
  caption-micro:
    fontFamily: "InterVariable"
    fontSize: "12px"
    fontWeight: "420"
    lineHeight: "18px"
    letterSpacing: "0.32px"
rounded:
  card-input: "8px"
  app-icon: "10px"
spacing:
  xs: "4px"
  sm: "6px"
  sm-plus: "8px"
  md: "10px"
  base: "16px"
  lg: "20px"
  xl: "29px"
  2xl: "35px"
  3xl: "40px"
  4xl: "45px"
  hero: "80px"
components:
  auth-card:
    backgroundColor: "{colors.button-label}"
    rounded: "{rounded.card-input}"
    boxShadow: "none"
    padding: "~40px"
  brand-badge:
    backgroundColor: "{colors.cta-button-fill}"
    textColor: "{colors.button-label}"
    rounded: "{rounded.app-icon}"
    width: "~48px"
    height: "~48px"
  button-primary-dark:
    backgroundColor: "{colors.cta-button-fill}"
    textColor: "{colors.button-label}"
    rounded: "{rounded.card-input}"
    borderWidth: "0px"
    boxShadow: "none"
    padding: "4px 8px"
    fontSize: "14px"
    fontWeight: "500"
  button-primary-verde:
    backgroundColor: "{colors.verde-brand-600}"
    textColor: "{colors.button-label}"
    rounded: "{rounded.card-input}"
    borderWidth: "0px"
    boxShadow: "none"
    padding: "8px 14px"
    fontSize: "14px"
    fontWeight: "500"
  form-input:
    backgroundColor: "{colors.page-background}"
    textColor: "{colors.heading-text}"
    rounded: "{rounded.card-input}"
    borderWidth: "0px"
    boxShadow: "none"
    padding: "6px 8px 6px 35px"
    fontSize: "14px"
  heading-h4:
    textColor: "{colors.heading-text}"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "27px"
    letterSpacing: "0.32px"
  inline-link-muted:
    textColor: "{colors.muted-text-helper}"
    fontSize: "14px"
    fontWeight: "420"
    textDecoration: "none"
  navigation-top-nav:
    backgroundColor: "{colors.button-label}"
    textColor: "{colors.body-text}"
    borderBottom: "1px solid #e2e2e2"
    rounded: "0px"
    boxShadow: "none"
    padding: "0px"
    fontSize: "16px"
---

## Overview

Primary visual anchor uses #ffffff with login card white surface; --neutral-white. Typography baseline relies on InterVariable for primary body text, nav items, card content.

Authenticated dashboards use a Frappe-inspired minimal workspace while preserving Verde's brand identity. Use the Frappe reference for structure, spacing, flatness, quiet navigation, and typography; use Verde brand colors for primary actions, approval/success workflows, and small identity accents.

This system uses a 8px base grid with scale values 4, 6, 8, 10, 16, 20, 29, 35, 40, 45, 80.

**Signature traits:**
- Core token rhythm: Token evidence indicates consistent color, spacing, and radius rhythm across visible UI.
- Dashboard identity: Minimal white surfaces, soft gray backgrounds, subtle borders, flat cards, and Verde green reserved for important actions and positive state.

## Colors

The palette combines extracted Frappe-light neutral tokens with Verde brand identity tokens. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-background** maps to `page-background`: Role "background" is grounded by usage context "Full-page background and input field fill; --gray-100".
- **surface-primary** maps to `card-surface`: Role "primary" is grounded by usage context "Login card white surface; --neutral-white".
- **action-text** maps to `body-text`: Role "text" is grounded by usage context "Primary body text, nav links, placeholder text; --gray-700".
- **content-text** maps to `heading-text`: Role "text" is grounded by usage context "Headings, input text, strong labels; --gray-800".

### Primary Brand
- **Card Surface** (#ffffff): Login card white surface; --neutral-white. Role: primary. {authored: rgb(255, 255, 255), space: rgb}
- **Verde Brand 600** (#16a34a): Primary dashboard actions, approve/success workflows, and key Verde identity accents. Use sparingly.
- **Verde Brand 700** (#15803d): Hover or pressed state for primary Verde actions.
- **Verde Brand 50 / 100** (#f0fdf4 / #dcfce7): Soft positive backgrounds, success pills, and low-emphasis brand surfaces.

### Text Scale
- **Body Text** (#525252): Primary body text, nav links, placeholder text; --gray-700. Role: text. {authored: rgb(82, 82, 82), space: rgb}
- **Button Label** (#ffffff): Text on dark CTA button; --neutral-white. Role: text. {authored: rgb(255, 255, 255), space: rgb}
- **Heading Text** (#383838): Headings, input text, strong labels; --gray-800. Role: text. {authored: rgb(56, 56, 56), space: rgb}
- **Muted Text / Helper** (#7c7c7c): Forgot password link, secondary labels; --gray-600. Role: text. {authored: rgb(124, 124, 124), space: rgb}

### Interactive
- **Input Border / Subtle Divider** (#ededed): Subtle borders and dividers; --gray-200. Role: border. {authored: rgb(237, 237, 237), space: rgb}
- **Nav Bottom Border** (#ededed): Navbar bottom hairline divider; --gray-300. Role: border. {authored: rgb(237, 237, 237), space: rgb}

### Surface & Shadows
- **CTA Button Fill** (#171717): Login button background, app icon background; --gray-900 / --primary. Role: background. {authored: rgb(23, 23, 23), space: rgb}
- **Page Background** (#f3f3f3): Full-page background and input field fill; --gray-100. Role: background. {authored: rgb(243, 243, 243), space: rgb}

## Typography

Typography uses InterVariable across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Uses InterVariable throughout for a uniform feel. Weight range spans medium, semi-bold. Sizes range from 12px to 18px.

### Font Roles
- **Headline Font**: InterVariable
- **Body Font**: InterVariable

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Primary body text, nav items, card content | InterVariable | 16px | 420 | 24px | 0.32px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |
| Input placeholder text, helper text, secondary labels | InterVariable | 14px | 420 | 21px | 0.28px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |
| Button labels, form action labels | InterVariable | 14px | 500 | 14px | 0.32px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |
| Page heading — 'Login to Frappe' | InterVariable | 18px | 600 | 27px | 0.32px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |
| Brand/logo text in navbar | InterVariable | 18px | 600 | 21.6px | 0.18px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |
| Smallest labels, footnotes | InterVariable | 12px | 420 | 18px | 0.32px | InterVariable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif | Extracted token |

## Layout

Responsive system uses 4 breakpoint tier(s): mobile, tablet, desktop, wide.

### Responsive Strategy
- **mobile (567-1439.98px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (>= 768px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (>= 1200px)**: Expand layout density and horizontal composition for wide viewports.
- **wide (>= 1440px)**: Stretch composition with generous gutters and wider layout spans.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| xs | 4px | 4 | Extracted spacing token |
| sm | 6px | 6 | Extracted spacing token |
| sm-plus | 8px | 8 | Extracted spacing token |
| md | 10px | 10 | Extracted spacing token |
| base | 16px | 16 | Extracted spacing token |
| lg | 20px | 20 | Extracted spacing token |
| xl | 29px | 29 | Extracted spacing token |
| 2xl | 35px | 35 | Extracted spacing token |
| 3xl | 40px | 40 | Extracted spacing token |
| 4xl | 45px | 45 | Extracted spacing token |
| hero | 80px | 80 | Extracted spacing token |

## Dashboard Direction

Dashboards should resemble the provided minimal Frappe-style workspace without giving up Verde's current brand identity. The result should feel like a calm internal ERP dashboard: white surfaces, soft gray page background, light borders, compact controls, and minimal decoration.

Before creating a new dashboard page or editing shared UI components, read `.interface-design/system.md` first. Treat it as the compact source of truth for Verde's current interface direction, table patterns, row actions, spacing, depth, and component signatures. Use this document for detailed evidence and historical design notes.

### Dashboard Color Rules
- Keep Verde green for primary buttons, approval actions, success states, positive badges, and small identity accents.
- Do not replace dashboard primary buttons with the black Frappe auth CTA unless the screen is an auth/login flow.
- Use neutral grays for navigation, search, table chrome, inactive controls, helper text, and non-critical icons.
- Avoid using Verde green as broad decoration, large background fills, or repeated ornamental accents.
- Prefer soft semantic backgrounds for badges and status surfaces instead of saturated fills.

### Dashboard Shell
- Use a persistent top utility bar with white background, subtle bottom border, compact brand mark, command/search input, notification/help controls, and profile affordance.
- Use a left sidebar inspired by the reference: white background, subtle right border, simple icon + label rows, section labels, and no heavy shadows.
- Main content should sit on a soft gray page background with white content panels and generous horizontal breathing room.
- Desktop layout should keep the sidebar visible. Tablet and mobile may collapse it behind a menu or sheet.

### Sidebar Pattern
- Background: #ffffff.
- Border-right: 1px solid #ededed.
- Item text: #383838 or #525252.
- Item icon: #525252 or #7c7c7c.
- Active item background: #f3f3f3.
- Active item text: #383838 at medium weight.
- Active item icon: Verde brand green for identity, or strong neutral if green feels too loud in context.
- Radius: 8px. Shadow: none.
- Hover: soft gray background only; do not add heavy fills, glows, or shadows.

### Topbar Search Pattern
- Background: #f3f3f3.
- Border: none or 1px solid #ededed.
- Radius: 8px to 10px.
- Height: 36px to 40px.
- Text and icon color: #7c7c7c.
- Search should remain neutral; do not use Verde green in the search field.

### Dashboard Cards
- Background: #ffffff.
- Border: 1px solid #ededed.
- Radius: 12px to 14px for dashboard panels and KPI cards.
- Shadow: none by default.
- Padding: 20px to 24px for standard dashboard cards.
- Use subtle borders and white-on-gray contrast for separation, not elevation.

### Dashboard Table Pattern
- Table inspiration: Square UI dashboard tables, especially the minimal projects/employees table structure with a card shell, compact toolbar, rich cells, soft badges, and footer pagination.
- Current extracted interface rules live in `.interface-design/system.md`; follow that file first when applying table/card/action patterns.
- Use `src/components/shared/DataTable.tsx` as the global reusable table shell. Do not recreate one-off table chrome in pages unless the page has a truly unique workflow.
- Preferred structure: rounded white card, subtle border, toolbar/header inside the card, icon search, filter dropdowns, optional actions slot, table body, and compact footer pagination.
- Keep the table primitive simple. The shared table shell owns card border, radius, toolbar, and footer. The `Table` primitive should only provide semantic table layout and row/cell styling.
- Search fields in tables should use a neutral icon prefix, `h-9`, subtle gray/surface background, and muted placeholder text. Search should not use Verde green.
- Filters should appear as compact outline buttons with an icon, label, and a tiny Verde dot when active. Put role/status/date or domain-specific filters inside a `DropdownMenu` with labels, separators, checkbox items, and a clear filters action.
- Action buttons in table rows should be dropdown menus by default. Prefer a compact `MoreHorizontal` trigger with `View`, `Edit`, `Delete`, or domain actions inside the menu instead of multiple visible row buttons. Exception: high-frequency queue workflows may use minimal icon-only buttons when quick scanning and repeated action matter more than menu compactness.
- Destructive dropdown actions should open a confirmation dialog; avoid nesting dialog triggers directly inside dropdown menu items. Use controlled dialog state when needed.
- Use row selection only where it creates a clear bulk-action workflow. When enabled, use stable row IDs from backend IDs, not table indexes.

### Table Cell Styling
- Rich identity cells should combine a small avatar or icon with primary text. Use initials avatars for users when no image exists.
- Secondary metadata such as emails, counts, dates, and IDs should use muted text and compact type: `text-sm text-text-secondary` or `text-xs text-text-secondary` depending on density.
- Date columns should follow the reference typography: muted, compact, tabular numerals. Prefer `MMM d, yyyy` formatting, such as `Jun 7, 2026`, over browser locale defaults.
- Status cells should use soft badge treatments, not plain text. Preferred status badge shape is small rounded rectangle or pill with `text-xs font-medium`, a subtle border, and a tiny dot or icon when helpful.
- Role/category badges should use soft neutral or semantic backgrounds. Avoid saturated fills; keep badges quiet unless they represent success, errors, warnings, or urgent states.
- Keep table headers muted and medium weight. Header rows can use a soft gray/surface background, with no heavy contrast.
- Table rows should use subtle hover only. Do not add shadows, strong row fills, or large vertical padding.

### Current Table Preferences
- Users table preference: avatar initials in the user cell, role badge, active/inactive status badge, joined/created date in `MMM d, yyyy`, filter dropdown for role/status/date, and row actions inside a dropdown.
- Project table preference: project icon or visual marker, project status badge, optional progress indicator, task count metadata, due date in tabular muted format, owner/avatar cell, and the same global toolbar/footer pattern.
- Product, request, order, inventory, and audit tables should reuse the same global shell and adapt only their cells, filters, and row actions.
- Request queue preference: project, item-count badge, status badge, requester avatar after status, submitted date, and minimal icon-only action buttons with controlled confirmation dialogs.
- If a page needs custom filters, pass them into the `DataTable` filter slot instead of embedding filter logic inside the shared table component.
- Prefer `lucide-react` icons for consistency unless a specific reference requires a new icon set. Do not add Hugeicons only for table polish.

### KPI Cards
- Label: 12px to 13px, medium weight, uppercase or muted.
- Value: 28px to 32px, 600 to 700 weight, #383838.
- Delta text: 13px to 14px.
- Positive delta: Verde green.
- Negative delta: error red.
- KPI icon containers should be neutral unless the metric is explicitly success/approval related.

### Quick Access
- Use text links in a simple multi-column layout rather than heavy cards.
- Link text: 15px to 16px, medium, #383838.
- External-link arrows and secondary metadata: muted gray.
- Badges should use soft token backgrounds. Verde soft green is allowed for available/success counts; amber remains appropriate for pending/to-bill counts.

### Dashboard Typography Additions
| Role | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| Dashboard page title | InterVariable | 24px to 28px | 600 to 700 | 32px to 36px | Main page heading such as Projects or Stock |
| Dashboard section title | InterVariable | 18px to 20px | 600 | 27px to 30px | Card and content section headings |
| KPI value | InterVariable | 28px to 32px | 600 to 700 | 34px to 38px | Metric numbers |
| Sidebar item | InterVariable | 15px to 16px | 420 to 500 | 22px to 24px | Left navigation labels |
| Dashboard metadata | InterVariable | 13px to 14px | 420 | 20px to 21px | Sync time, helper labels, secondary captions |
| Table header | InterVariable | 14px | 500 | 20px to 21px | Muted table column labels |
| Table body | InterVariable | 14px | 420 to 500 | 20px to 21px | Primary table cell text |
| Table badge | InterVariable | 12px | 500 | 18px | Status, role, category, and compact labels |
| Table date | InterVariable | 14px | 420 | 20px to 21px | Muted, tabular date values such as `Jun 7, 2026` |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(82, 82, 82) ; rgb(56, 56, 56) ; rgb(124, 124, 124) |
| Light | outline-width | 3px ; 0px |
| Light | outline-offset | 0px |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| card / input | 8px | 8 | Control corner |
| app-icon | 10px | 10 | Control corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| card / input | 8px | px |
| app-icon | 10px | px |

## Components

Components should be recreated from token references first, then tuned with variant notes and probe-backed state guidance.
- **Primary Button**: Full-width dark CTA button used for the Login action. Probe-confirmed: #171717 background, white text, 8px radius, no shadow, no border.
- **Text Input**: Borderless input field with #f3f3f3 background fill, icon prefix, 8px radius. Used for email and password fields.
- **Navbar**: Top navigation bar with white background, gray-700 text links, and a 1px #e2e2e2 bottom border. No shadow.
- **Login Card**: Centered white card containing the login form. White surface on gray page background, 8px radius, no shadow.
- **App Icon Badge**: Square dark badge with rounded corners displaying the app initial letter. Used above the login heading.
- **Forgot Password Link**: Muted gray helper link aligned to the right of the form, below the password field.
- **Page Heading**: Centered h4-level heading 'Login to Frappe' above the auth card.

### Auth Card

**Default**
- backgroundColor: #ffffff
- rounded: 8px
- boxShadow: none
- padding: ~40px
- State guidance: Visually confirmed. Elevation achieved through white-on-gray contrast rather than shadow.

### Brand Badge

**Default**
- backgroundColor: #171717
- textColor: #ffffff
- rounded: 10px
- width: ~48px
- height: ~48px
- State guidance: Visually confirmed. Uses --gray-900 fill matching the CTA button for brand consistency.

### Button

**Primary Dark**
- backgroundColor: #171717
- textColor: #ffffff
- rounded: 8px
- borderWidth: 0px
- boxShadow: none
- padding: 4px 8px
- fontSize: 14px
- fontWeight: 500
- State guidance: Probe-confirmed. Full-width within login card. High contrast: white label on near-black fill.

### Form Input

**Default**
- backgroundColor: #f3f3f3
- textColor: #383838
- rounded: 8px
- borderWidth: 0px
- boxShadow: none
- padding: 6px 8px 6px 35px
- fontSize: 14px
- State guidance: Probe-confirmed via #login_password. Left padding accommodates icon prefix. No visible border — relies on background contrast.

### Heading

**H4**
- textColor: #383838
- fontSize: 18px
- fontWeight: 600
- lineHeight: 27px
- letterSpacing: 0.32px
- State guidance: Probe-confirmed via h4 selector. Uses --gray-800 for strong but not pure-black heading.

### Inline Link

**Muted**
- textColor: #7c7c7c
- fontSize: 14px
- fontWeight: 420
- textDecoration: none
- State guidance: Visually confirmed. Uses --gray-600 for subdued helper link treatment.

### Navigation

**Top Nav**
- backgroundColor: #ffffff
- textColor: #525252
- borderBottom: 1px solid #e2e2e2
- rounded: 0px
- boxShadow: none
- padding: 0px
- fontSize: 16px
- State guidance: Probe-confirmed via nav.navbar. Bottom border uses --gray-300 (#e2e2e2). Brand name at 18px/600 weight.

## Do's and Don'ts

Guardrails protect Core token rhythm without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 567px | screen and (max-width: 567px) |
| Mobile | <= 575.98px | (max-width: 575.98px) |
| Mobile | <= 576px | (max-width: 576px) |
| Mobile | <= 767px | (max-width: 767px) |
| Breakpoint 5 | <= 767.98px | (max-width: 767.98px) |
| Breakpoint 6 | <= 768px | (max-width: 768px) |
| Breakpoint 7 | <= 991px | (max-width: 991px) |
| Breakpoint 8 | <= 991.98px | (max-width: 991.98px) |
| Breakpoint 9 | <= 992px | (max-width: 992px) |
| Breakpoint 10 | <= 1199.98px | (max-width: 1199.98px) |
| Breakpoint 11 | <= 1439.98px | (max-width: 1439.98px) |
| Mobile | >= 567px | screen and (min-width: 567px) |
| Mobile | >= 576px | (min-width: 576px) |
| Tablet | >= 768px | (min-width: 768px) |
| Tablet | >= 992px | (min-width: 992px) |
| Desktop | >= 1200px | (min-width: 1200px) |
| Desktop | >= 1440px | (min-width: 1440px) |
| Breakpoint 18 | Unknown | (pointer: coarse) |

## Agent Prompt Guide

### Example Component Prompts
- Create App Icon Badge variant that preserves Square dark badge with rounded corners displaying the app initial letter. Used above the login heading..
- Create Forgot Password Link variant that preserves Muted gray helper link aligned to the right of the form, below the password field..
- Create Login Card variant that preserves Centered white card containing the login form. White surface on gray page background, 8px radius, no shadow..

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
