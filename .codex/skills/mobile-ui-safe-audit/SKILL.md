---
name: mobile-ui-safe-audit
description: Audit and polish mobile frontend page layout, responsive spacing, touch interactions, mobile navigation, drawers, forms, and checkout/storefront flows while preserving desktop behavior. Use when the user asks for mobile UI beautification, mobile layout checks, phone viewport fixes, mobile operation logic review, or says phrases like "移动端页面美化", "手机端排版", "移动端操作逻辑", "检查前端页面", or "不动桌面端逻辑".
---

# Mobile UI Safe Audit

## Overview

Audit the running frontend like a mobile product designer and senior frontend engineer. Make mobile UI and interaction fixes with the smallest scoped change, then prove desktop behavior still holds.

## Scope Contract

- Treat desktop behavior as a protected baseline. Do not change desktop routes, stores, services, API contracts, auth/cart/order logic, or desktop-only interaction flows unless the user explicitly asks.
- Prefer mobile-scoped CSS, existing responsive utilities, `max-width` media queries, drawer/menu-specific styles, and mobile-only state guards.
- If a shared template change is required, keep the desktop DOM and event behavior equivalent and verify desktop before and after the edit.
- Never remove desktop controls to fix mobile clutter. Reposition, collapse, or hide only at mobile breakpoints when an equivalent mobile control remains reachable.

## Workflow

1. Read the affected route, layout, component, store usage, and CSS before judging the UI. Note current dirty files and do not overwrite unrelated user changes.
2. Run the app locally when needed and inspect the real page on mobile viewports: `360x800`, `390x844`, `430x932`, plus any user-provided screenshot size.
3. Capture evidence with browser screenshots, DOM rectangle measurements, overflow checks, and console errors. Verify the actual tap path, not only the static screenshot.
4. Identify each issue as a mobile defect, acceptable responsive behavior, or broader product/design debt. Fix only true mobile defects unless the user asks for redesign.
5. Edit with the narrowest mobile-safe change. Keep changes in existing style/component conventions and avoid broad refactors.
6. Re-check mobile after hot reload, then verify a desktop guard viewport such as `1440x900` or the app's common desktop size to confirm no desktop regression.
7. Run the appropriate type/build/test command when code changed, or explain why it could not be run.

## Mobile Checks

- Layout rhythm: header, search, nav, filters, cards, checkout panels, and bottom actions should align cleanly with stable spacing.
- Touch ergonomics: primary actions, quantity controls, menu triggers, close buttons, tabs, and form controls need comfortable hit areas and no accidental overlap.
- Navigation logic: mobile drawers, nested menus, account actions, language switchers, cart/favorites access, and back/close paths must be reachable and reversible.
- Text fit: long Italian/Chinese labels, prices, badges, placeholders, and CTA labels must not clip, overlap, or force horizontal scroll.
- Sticky and fixed UI: headers, bottom bars, modals, drawers, and keyboard-open form states should not hide important content or controls.
- Data states: loading, empty, error, logged-out, logged-in, cart with items, and dense product/category states should keep the layout stable.
- Visual hierarchy: mobile screens should be compact, scannable, and commerce-focused; avoid decorative landing-page treatment for operational storefront flows.

## Desktop Preservation

- Before editing shared files, identify which selectors, components, and handlers affect desktop.
- Keep new CSS under mobile breakpoints where possible, commonly `@media (max-width: 767px)` or the project's existing mobile breakpoint.
- Avoid changes to shared stores, router guards, service methods, and checkout/order business rules for purely visual mobile work.
- After edits, compare desktop screenshots or DOM measurements for the touched area. Desktop may receive only incidental CSS no-ops, not behavior changes.
- If preserving desktop requires a tradeoff, stop and ask the user before changing shared logic.

## Evidence Pattern

When reporting work, include:

- `Mobile issue`: what was wrong, at which viewport and state.
- `Evidence`: screenshot observation, DOM measurement, overflow/tap-path result, or console error.
- `Fix`: file and scoped mobile-safe change.
- `Desktop guard`: desktop viewport/state checked and whether it changed.
- `Verification`: command, browser check, and remaining risk.

## PartsPro Notes

- PartsPro is a Vue/Vite storefront with shared layout and global styles. Read `src/layouts/StorefrontLayout.vue`, relevant files under `src/pages/storefront/`, and `src/styles/base.css` when auditing storefront pages.
- Language and auth/customer state can change header density and labels. Check guest/customer states and Italian/Chinese text when relevant.
- Checkout, account, cart, taxonomy, favorites, and order flows are business-sensitive. For mobile UI fixes, avoid changing their store/service semantics unless the user separately requests logic work.
