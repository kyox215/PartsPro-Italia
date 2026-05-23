---
name: frontend-ui-audit
description: Use when auditing or fixing frontend UI layout quality, visual alignment, responsive breakpoints, hidden controls, text overflow, or screenshot-reported misalignment in a web app. Especially useful for checking desktop/mobile navigation, header symmetry, drawers, menus, i18n language switches, and B2B/storefront pages before shipping.
---

# Frontend UI Audit

## Purpose

Audit the running frontend like a product designer and a senior frontend engineer: compare actual rendered pages against expected layout intent, identify visual defects with evidence, fix scoped issues, then re-check with screenshots and DOM measurements.

## Workflow

1. Read the relevant layout, page, route, store, and CSS files before judging the screenshot. Note existing design system conventions and current dirty changes.
2. Run the app locally and inspect the real page. Use browser screenshots plus DOM rectangle measurements for the elements under suspicion.
3. Test at least these states when relevant: guest, authenticated customer, staff/admin if the header changes, current language, alternate language.
4. Test at least these viewport classes: mobile around `390x844`, tablet around `768-1180`, desktop around `1440` or wider. Add the user-provided screenshot size when it matters.
5. For each issue, decide if it is a true defect, acceptable responsive behavior, or content/design debt. Fix true defects with the smallest change that matches local patterns.
6. Re-run type/build checks when code changed, and re-open the page after hot reload. Capture final screenshots or measurements for the changed breakpoints.

## What To Check

- Header rhythm: logo, search, action buttons, nav rows, and content max-width should align intentionally. Large unused space on one side of a toolbar is a defect unless it is a deliberate composition.
- Breakpoint parity: desktop controls must not disappear just because mobile has them in a drawer. Mobile-only controls should be hidden from compact headers when they duplicate drawer functionality.
- Menus and drawers: opening/closing controls, nested categories, account actions, cart state, and language switching should be reachable without overlap.
- I18n stress: check both Italian and Chinese labels. Watch for long placeholders, B2B/account tags, logout text, and mixed-language button widths.
- Text fit: no clipped labels, accidental ellipsis on primary actions, overlapping badges, or buttons whose text spills outside.
- Grid integrity: repeated cards should keep stable dimensions across hover, image fallback, loading, and empty states.
- Visual hierarchy: app/tool pages should feel operational and scannable, not like a landing page unless the page is explicitly marketing.

## Evidence Pattern

When reporting findings, include:

- `Issue`: what is visibly wrong and in which state/breakpoint.
- `Evidence`: screenshot observation or DOM measurement, such as right-side slack, hidden control count, overflow, or overlapping rectangles.
- `Fix`: the file and the scoped change.
- `Verification`: viewport, auth/language state, and command or browser check used.

## PartsPro Notes

- Storefront header and mobile drawer live in `src/layouts/StorefrontLayout.vue`; most visual rules live in `src/styles/base.css`.
- Language is stored in `useUiStore()` and changed with `handleLanguageChange`.
- Demo customer login affects header density, so audit both guest and customer states.
- The homepage hero is dense B2B commerce UI; prioritize compact, aligned, information-rich layouts over decorative hero treatment.
