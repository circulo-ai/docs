# AGENTS.md

Task tracker derived from `PLAN.md`. Checkboxes reflect the current repo state.

Legend:

- [x] Done
- [ ] Pending

## Phase 0 — Repo foundation & architecture decisions

Repo scaffolding

- [x] Initialize Turborepo + pnpm workspace (`package.json`, `turbo.json`, `pnpm-workspace.yaml`).
- [x] Scaffold `apps/cms` (Payload + Next.js) (`apps/cms`).
- [x] Scaffold `apps/docs` (Next.js + Fumadocs) (`apps/docs`).
- [x] Create shared UI package (`packages/ui`).
- [x] Create shared ESLint config (`packages/eslint-config`).
- [x] Create shared TypeScript config (`packages/typescript-config`).
- [ ] Create `packages/types` for cross-app CMS-derived types.
- [ ] Create `packages/search` for indexing/query utilities.
- [ ] Create `packages/config` (shared Tailwind config).
- [ ] Create `packages/env` for env validation (zod or similar).

Tailwind + styling

- [x] Enable Tailwind in docs app (`apps/docs/postcss.config.mjs`).
- [ ] Centralize Tailwind config in `packages/config/tailwind`.
- [ ] Share `postcss.config.mjs` at the workspace level.

Tooling/CI

- [x] Root scripts for `build`, `dev`, `lint`, `check-types` (`package.json`).
- [ ] Add shared Prettier config and update ignore list (include `.source`).
- [ ] Add CI pipeline: install → lint → typecheck → build (apps + packages).

Local dev stack

- [x] Provide docker-compose for CMS dev (`apps/cms/docker-compose.yml`).
- [ ] Align docker-compose DB with Payload adapter choice (Postgres in config vs Mongo in compose).
- [ ] Add Meilisearch to local compose stack.

Architecture decisions

- [ ] Confirm runtime model (ISR + on-demand revalidation) and document it.
- [ ] Standardize env naming + validation strategy across apps.

## Phase 1 — Payload CMS modeling (CMS-first core)

Baseline collections

- [x] Users collection scaffold (`apps/cms/src/collections/Users.ts`).
- [x] Media collection scaffold (`apps/cms/src/collections/Media.ts`).

Core docs model

- [x] Create `services` collection (slug, name, theme tokens, search defaults).
- [x] Create `docVersions` collection (semver string, `versionKey`, prerelease flag, status).
- [x] Create `docPages` collection (service/version relations, slug, title, Lexical content, status).
- [x] Add optional `redirects` collection.

Data integrity + access

- [x] Enforce compound uniqueness `(service, version, slug)`.
- [x] Add semver validation + `versionKey` computation hooks.
- [x] Define roles (writer/editor/admin) and access rules for draft/publish.
- [x] Implement “latest version per service” logic.

## Phase 2 — Docs site foundation (Next.js + Fumadocs + routing)

Fumadocs baseline

- [x] Fumadocs MDX pipeline wired (`apps/docs/source.config.ts`, `apps/docs/lib/source.ts`).
- [x] Docs layout + page rendering wired (`apps/docs/app/docs/layout.tsx`, `apps/docs/app/docs/[[...slug]]/page.tsx`).
- [x] Search API route present (`apps/docs/app/api/search/route.ts`).

CMS-backed source adapter

- [x] Create `packages/docs-source` with `getServices`, `getVersions`, `getLatestVersion`, `getPage`, `getNav`.
- [ ] Replace local MDX source with CMS-backed adapter.

Routing + UI

- [ ] Add routes: `/[service]/` → latest version redirect.
- [ ] Add routes: `/[service]/v[semver]/[...slug]` for docs pages.
- [ ] Add service + version dropdowns in layout.
- [ ] Build nav tree + TOC from CMS data.

Caching

- [ ] Add tag-based caching for service/version/page and search surfaces.

## Phase 3 — Canonical rich text rendering pipeline (Payload → docs UI)

Editor constraints

- [ ] Define allowed Lexical features for docs in Payload.

Renderer

- [ ] Implement Lexical JSON → React renderer with headings + TOC extraction.
- [ ] Add code blocks, callouts, tables, images, and links handling.
- [ ] Normalize heading slugs and link rules across services/versions.

Shared UI components

- [ ] Add docs UI primitives in `packages/ui` (Callout, Tabs, Steps, CodeBlock, etc.).

## Phase 4 — Search architecture (Meilisearch + scoping rules)

Schema + indexing

- [ ] Define searchable document shape in `packages/types`.
- [ ] Configure Meilisearch settings + ranking rules.
- [ ] Implement indexing helpers in `packages/search`.
- [ ] Update latest flip logic (`isLatest`).

Search UI

- [ ] Add global search modal.
- [ ] Add service-scoped search with “include older versions” toggle.

## Phase 5 — Draft preview (Payload drafts → Next.js draft mode)

Preview auth

- [ ] Create preview token signer/verifier in `packages/auth-preview`.
- [ ] Add Payload admin “Preview” action linking to docs `/api/preview`.

Docs integration

- [ ] Implement `/api/preview` endpoint (validate token, enable draft mode).
- [ ] Draft-mode fetches: `draft=true`, no cache, auth token.
- [ ] Add preview banner + exit action.

## Phase 6 — Publish workflow (reindex + Next.js revalidation)

Publish pipeline

- [ ] Add Payload publish endpoint (page/version/service scope).
- [ ] Publish ordering: update CMS status → update search index → trigger revalidation.
- [ ] Recompute latest per service on publish.

Revalidation

- [ ] Add docs `/api/revalidate` endpoint (authenticated).
- [ ] Support tags: `service`, `service+version`, `page`, global search.

Observability

- [ ] Add `publishJobs` collection for logs/audit/retry.
