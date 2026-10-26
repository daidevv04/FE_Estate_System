# UI consistency implementation plan

> Execute with superpowers:executing-plans, in the current authorized workspace.

**Goal:** Apply the approved UI consistency design without changing backend contracts.

**Architecture:** Extend existing PageHeader, KpiCard, AppShell and Ant Design theme. Keep application state and business actions in their existing features. Browser checks intercept API calls using synthetic fixtures.

**Stack:** React 18-compatible APIs, TypeScript, Ant Design 5, Vite, installed Playwright.

## Constraints

- Preserve the green brand, role permissions, security and business behavior.
- No dependency additions; do not write production data for browser checks.
- User approved the design spec and requested test, commit and merge main.

## Tasks

1. Shared navigation and hierarchy: `src/components/layout/{AppShell,Sidebar,Header,PageHeader}.tsx`, `src/components/common/KpiCard.tsx`, `src/theme/{tokens,AppTheme}.tsx` and scoped CSS. Add working breadcrumbs, loading skeletons, mobile Drawer, skip link and keyboard account menu. Verify via browser at 390 and 1440 px.
2. Feature polish: `src/features/reports/pages/SalesLeaderboardPage.tsx`, its existing components; `src/features/email-templates/pages/EmailTemplatesPage.tsx`; other concrete layout/state defects found by browser audit. Verify loading/error/empty and retry without misleading metrics.
3. Existing security entry points: `src/routes/router.tsx` and existing profile/login components only as needed. Reuse existing 2FA flows; do not create a second auth implementation. Verify protected route behavior.
4. Add `scripts/verify-ui-consistency.mjs` using installed Playwright and fixture routing. Audit representative main pages, roles, mobile overflow, dialogs and navigation; save screenshots/results under ignored `output/playwright/`.
5. Run `npm run build`, review diff and browser evidence, commit and merge main. Record exact checks and remaining limits in the release notes.
