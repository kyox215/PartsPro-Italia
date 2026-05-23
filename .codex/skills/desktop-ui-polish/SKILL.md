---
name: desktop-ui-polish
description: Audit and polish desktop frontend UI layout, visual hierarchy, spacing, alignment, and desktop interaction logic while preserving mobile behavior. Use when the user asks to beautify, inspect, redesign, or fix desktop pages, desktop breakpoints, desktop navigation/header/table/card layouts, B2B storefront/admin pages, or operation flows, especially when they explicitly say not to touch mobile logic.
---

# Desktop UI Polish

## Overview

Work like a desktop-focused UI/frontend reviewer: inspect the rendered page, identify layout and interaction defects on desktop, make scoped improvements, and verify that mobile behavior has not changed.

## Core Rule

Treat mobile as a protected contract. Desktop polish may improve desktop CSS, markup rhythm, component composition, and desktop-only interactions, but must not rewrite mobile drawer/search/menu/account/cart/language behavior unless the user explicitly asks for a mobile change.

Prefer:

- Desktop-scoped CSS such as `@media (min-width: 1024px)` or existing desktop breakpoints.
- Existing design tokens, spacing scales, components, icons, and layout helpers.
- Small component changes that keep existing mobile conditional rendering intact.
- Browser verification at desktop and mobile widths after every meaningful UI change.

Avoid:

- Replacing mobile drawers, mobile nav state, touch-specific controls, or shared stores to solve desktop-only visual problems.
- Broad rewrites of responsive architecture when a local desktop-scoped adjustment solves the issue.
- Decorative one-note visual treatments that make operational pages less scannable.
- Landing-page composition for app/tool/admin/storefront screens unless the page is explicitly marketing.

## Workflow

1. Read the relevant route, layout, component, store, and CSS files before editing. Identify the current breakpoint system and which code paths are mobile-only, desktop-only, or shared.
2. Capture a mobile baseline before edits when feasible: use around `390x844` and test the mobile drawer/menu/search/account/cart/language controls that could be affected.
3. Inspect the desktop page in the browser at `1440x900` or wider. Add `1280x800` and the user's screenshot size when relevant.
4. Audit visual quality first: alignment, max-width rhythm, header balance, toolbar density, typography scale, table/card grid stability, image sizing, empty/loading states, and text overflow.
5. Audit operation logic second: primary actions are reachable, menus open/close correctly, filters/search/sort work, state changes are visible, and hover/focus/disabled/loading states make sense on desktop.
6. Implement the smallest scoped changes that improve desktop. Keep mobile selectors and JS branches untouched unless a shared bug makes that impossible.
7. Re-run type/build checks when code changed. Re-open the page after hot reload and verify the edited desktop states.
8. Re-check mobile at `390x844`; if a tablet breakpoint could be affected, also check around `768x1024`.

## Desktop Quality Checklist

- Header and navigation: logo, search, category nav, language switch, cart/account actions, and CTA groups should align intentionally with no lopsided dead space.
- Content structure: pages should have clear scan paths, consistent section spacing, predictable max widths, and no nested-card clutter.
- Controls: use icons for common tool actions, segmented controls for modes, toggles for binary settings, menus for option sets, and buttons only for clear commands.
- Data-dense UI: admin, SaaS, CRM, catalog, and B2B pages should feel quiet, efficient, and information-rich instead of oversized or promotional.
- Responsiveness: desktop improvements must not introduce text clipping, wrapping collisions, layout shift, hidden controls, or accidental horizontal scroll.
- Interaction states: hover, focus-visible, active, disabled, loading, selected, empty, and error states should remain legible and stable.
- Localization stress: test long labels and placeholders when the app supports multiple languages.
- Accessibility basics: preserve semantic controls, keyboard reachability, focus outlines, color contrast, and readable type sizes.

## Mobile Preservation Checklist

- Compare before/after mobile screenshots for affected routes when possible.
- Open and close the mobile drawer or equivalent navigation.
- Test mobile search, language, account, cart, menu nesting, and primary CTA flows if those controls exist.
- Confirm no mobile-only control disappeared from the header or drawer.
- Confirm touch target sizes, vertical spacing, and fixed/sticky elements still behave correctly.
- If a shared component had to change, explain why the change is safe for mobile and include mobile verification evidence.

## PartsPro Notes

- Storefront header and mobile drawer live in `src/layouts/StorefrontLayout.vue`; most shared visual rules live in `src/styles/base.css`.
- Language switching uses `useUiStore()` and `handleLanguageChange`; preserve existing language state behavior.
- Demo customer login affects header density. Check both guest and customer states when desktop header spacing or account/cart areas change.
- Keep the homepage and catalog experience practical for B2B purchasing: compact, aligned, quick to scan, and action-oriented.

## Reporting Pattern

When reporting work, include:

- What desktop issues were found.
- Which files changed and why.
- Which desktop viewports and states were verified.
- Which mobile viewports and flows were verified to prove mobile logic stayed intact.
- Any remaining risk, especially when a shared component or shared CSS selector was touched.
