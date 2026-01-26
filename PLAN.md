## Phase 0 — Repo foundation & architecture decisions

**Description**
Set up turborepo, shared packages, baseline conventions, and environments for CMS + docs.

**Tools/libraries/services**

- Turborepo, pnpm
- Next.js (apps), TypeScript, Tailwind
- ESLint/Prettier, tsup (for packages)
- Docker compose (local Payload DB + Meilisearch)

**Roles/responsibilities**

- Platform/Tech Lead: repo structure, CI conventions, environment strategy
- DevOps: local compose + deployment baseline
- FE/BE leads: confirm runtime model (ISR + on-demand revalidate)

**Key deliverables**

- `apps/cms`, `apps/docs`, `packages/*` scaffolding
- Shared TS config, linting, formatting, CI build pipeline
- Local dev stack: DB + Meilisearch

**Known challenges / mitigation**

- **Cross-app type sharing** → create `packages/types` and enforce “CMS is source of truth” types.
- **Env sprawl** → standardize env naming and validation in `packages/env`.

**Stepwise actions**

1. Create turborepo with `apps/cms`, `apps/docs`, `packages/types`, `packages/ui` (optional), `packages/search`, `packages/config`.
2. Set up Tailwind config sharing (`packages/config/tailwind`).
3. Add env validation (`zod` or similar) in `packages/env` used by both apps.
4. Add docker compose: Postgres (or Mongo, depending on Payload adapter) + Meilisearch.
5. Add CI: install, lint, typecheck, build for both apps.

---

## Phase 1 — Payload CMS modeling (CMS-first core)

**Description**
Design Payload schemas to support: multiple services, full semver versions, hierarchical docs, drafts, and publish workflow.

**Tools/libraries/services**

- Payload CMS (Next.js integration), Lexical rich text
- (Optional) Shadcn for admin UI enhancements (mostly docs site; Payload admin is separate)

**Roles/responsibilities**

- Backend engineer: schema + hooks + access control
- Tech writer representative: content model validation
- Product owner: publish rules and roles

**Key deliverables**

- Collections:
  - `services` (name, slug, branding/theme config, search defaults)
  - `docVersions` (service relation, semver string `1.2.3`, computed sortable key, release notes, status)
  - `docPages` (service, version, slug, title, richText, nav metadata, status draft/published, timestamps)
  - `redirects` (optional)

- Draft/publish states and role-based access
- Computed “latest version per service” logic

**Known challenges / mitigation**

- **Semver ordering** must be correct and consistent → store both raw string and a **sortable key** (or parse on read).
- **Route uniqueness** across services/versions → enforce compound uniqueness: `(service, version, slug)`.

**Stepwise actions**

1. Define `services` collection with:
   - `slug` (route prefix), display name, optional theme tokens, default search scope.

2. Define `docVersions`:
   - `version` as string `1.2.3` (store without “v”, render with “v”)
   - `versionKey` computed (sortable) and `isPrerelease` flag if needed.

3. Define `docPages`:
   - `service` relation, `docVersion` relation, `slug` (nested path segments), `title`
   - `content` as Lexical rich text
   - `status`: `draft | published`
   - nav fields: `sidebarGroup`, `order`, `toc`, `hideFromNav` etc.

4. Add Payload hooks:
   - on create/update: validate semver format, compute `versionKey`
   - on publish: trigger indexing + revalidation (implemented in later phases)

5. Define access control:
   - writers can draft, editors can publish; preview requires auth token or draft mode.

---

## Phase 2 — Docs site foundation (Next.js + Fumadocs + routing)

**Description**
Build docs frontend with route structure per service + version, plus the two dropdown selectors (service + version). Default route resolves to latest semver automatically.

**Tools/libraries/services**

- Next.js (App Router), TypeScript
- Fumadocs (UI + structure)
- Tailwind, (Optional) Shadcn components for dropdowns, command palette, search modal

**Roles/responsibilities**

- Frontend engineer: routing, layout, UI, Fumadocs integration
- Backend engineer: CMS query endpoints / caching strategy

**Key deliverables**

- Routes:
  - `/[service]/` → redirects or rewrites to latest version home
  - `/[service]/v[semver]/[...slug]` → doc page render
  - optional convenience: `/[service]/latest/[...slug]` internal alias (not required)

- Layout:
  - Service dropdown (global)
  - Version dropdown (service-specific)
  - Left sidebar nav + TOC (from CMS data)

- Theme:
  - per-service theme tokens (from Payload `services`)

**Known challenges / mitigation**

- **Fumadocs expects structured content sources** → implement a “CMS-backed source adapter” layer in `packages/docs-source` that provides:
  - page content (renderable)
  - nav tree
  - metadata (title, headings)

- **Fast latest resolution** → precompute latest per service in CMS and cache in docs app (ISR).

**Stepwise actions**

1. In `packages/docs-source`, implement functions:
   - `getServices()`, `getVersions(service)`, `getLatestVersion(service)`, `getPage(service, version, slug)`, `getNav(service, version)`.

2. In docs app, implement routing:
   - `/[service]/page.tsx` resolves latest version and routes to latest home.

3. Implement dropdowns:
   - Service dropdown sets `[service]`
   - Version dropdown lists all versions for the selected service, defaulting to latest.

4. Render doc pages:
   - Convert Payload rich text → renderable React (see Phase 3).

5. Add caching:
   - Use `fetch(..., { next: { revalidate: <seconds>, tags: [...] } })`
   - Tag by `service`, `service+version`, and `page` so publish can revalidate precisely.

---

## Phase 3 — Canonical rich text rendering pipeline (Payload → docs UI)

**Description**
Make Payload rich text the canonical source while producing a high-quality docs reading experience (headings, code blocks, callouts, tables, etc.).

**Tools/libraries/services**

- Payload Lexical rich text
- Renderer strategy (choose one):
  - Preferred: a Lexical-to-React renderer aligned with Payload’s output
  - Optional: transform to MDX-like AST for Fumadocs components

- Shiki (optional) for code highlighting

**Roles/responsibilities**

- Frontend engineer: renderer + component mapping
- Tech writer: validate authoring experience and output fidelity

**Key deliverables**

- Rich text renderer with:
  - Heading anchors and TOC extraction
  - Code blocks, inline code
  - Callouts/admonitions
  - Links (internal and external), images/media

- Content normalization rules (slugify headings, sanitize)

**Known challenges / mitigation**

- **TOC + headings from rich text** → derive headings during transform and store/calculate consistently.
- **Component parity with MDX docs** → define a constrained “docs component set” in Payload editor (blocks) and map to UI components.

**Stepwise actions**

1. Define allowed rich text features in Payload (keep it docs-friendly).
2. Implement transform:
   - Input: Payload Lexical JSON
   - Output: React tree + extracted headings array

3. Standardize components (in `packages/ui`):
   - `Callout`, `Tabs`, `Steps`, `CodeBlock`, etc.

4. Ensure internal links can resolve across versions/services (support “relative to current service/version” linking rules).

---

## Phase 4 — Search architecture (Meilisearch + scoping rules)

**Description**
Create per-service and global search with default scope “latest per service” unless the user opts into older versions.

**Tools/libraries/services**

- Meilisearch
- `packages/search` for indexing + query utilities
- Optional: Shadcn Command/Dialog for search UI

**Roles/responsibilities**

- Backend engineer: indexing pipeline, Meilisearch settings
- Frontend engineer: search UI and filters

**Key deliverables**

- Index strategy (recommended):
  - `docs_pages` (single index) with fields: `serviceSlug`, `version`, `versionKey`, `isLatest`, `path`, `title`, `headings`, `content`, `status`
  - Filterable attributes: `serviceSlug`, `version`, `isLatest`

- Queries:
  - **Service search default**: filter `serviceSlug = X AND isLatest = true`
  - **Global search default**: filter `isLatest = true` (then group by service in UI)
  - “Include older versions” toggle:
    - service search: drop `isLatest` filter (or allow selecting versions)
    - global search: drop `isLatest` filter

- Search UI:
  - global search modal from header
  - service-scoped search inside service docs context

**Known challenges / mitigation**

- **“Latest” changes when a new version publishes** → on publish, recompute latest and update `isLatest` flags for affected service docs in index.
- **Draft content must not leak** → index only `published` unless explicit preview mode with separate index.

**Stepwise actions**

1. Define the searchable document shape in `packages/types`.
2. Configure Meilisearch settings:
   - searchable attributes: title, headings, content
   - ranking rules tuned for docs (title/headings boost via field order)

3. Implement `indexPage()` and `indexServiceLatestFlip()`:
   - When latest changes, update old latest docs to `isLatest=false`, new to `true`.

4. Build UI:
   - Search input triggers query with scope context + toggle for older versions.

---

## Phase 5 — Draft preview (Payload drafts → Next.js draft mode)

**Description**
Enable authenticated previews for draft pages and draft versions without publishing. Preview should respect service/version routes and render draft content.

**Tools/libraries/services**

- Next.js Draft Mode (App Router)
- Payload auth + preview token endpoint
- Secure preview links from Payload admin

**Roles/responsibilities**

- Backend engineer: token issuance + Payload admin “Preview” action
- Frontend engineer: draft-mode fetching and rendering logic

**Key deliverables**

- Payload admin button: “Preview”
  - Generates a signed preview URL to docs site with:
    - `service`, `version`, `slug`, and a short-lived token

- Docs site preview endpoints:
  - `/api/preview` enables draft mode after validating token
  - Draft-mode fetches include `draft=true` and auth token to CMS

- Visual indicator banner: “Preview mode” + exit control

**Known challenges / mitigation**

- **Securing draft access** → short-lived signed tokens, server-side validation only.
- **Caching pitfalls** → ensure draft-mode requests bypass ISR cache (`cache: 'no-store'` or draft-mode logic).

**Stepwise actions**

1. Implement token signer/verifier in `packages/auth-preview`.
2. Add Payload admin “Preview” action that links to docs `/api/preview?...`.
3. In docs app, implement `/api/preview`:
   - validate token, enable draft mode, redirect to target route.

4. Update docs data fetching:
   - if draft mode enabled, fetch draft content securely and uncached.

---

## Phase 6 — Publish workflow (reindex + Next.js revalidation, no full rebuild)

**Description**
Publishing triggers:

1. status change to published in Payload
2. Meilisearch indexing updates
3. Next.js on-demand revalidation for impacted pages and navigation/search surfaces

**Tools/libraries/services**

- Payload custom endpoints / hooks / “Publish” UI action
- Next.js `revalidateTag` / `revalidatePath` via API route (or server action endpoint)
- Meilisearch indexing functions from `packages/search`

**Roles/responsibilities**

- Backend engineer: publish transaction semantics, webhook-like callbacks
- Frontend engineer: revalidation endpoint + tag strategy
- DevOps: ensure secrets and network access between cms → docs → meilisearch

**Key deliverables**

- A single “Publish” action in Payload that:
  - Publishes selected page(s) or an entire version batch
  - Recomputes latest semver for the service (if needed)
  - Reindexes documents into Meilisearch
  - Calls docs revalidation endpoint with impacted tags/paths

- Revalidation endpoint in docs:
  - Authenticated (shared secret)
  - Supports:
    - revalidate a specific page
    - revalidate a whole version nav (`service+version`)
    - revalidate service latest resolution (`service`)
    - revalidate global search page (if any)

**Known challenges / mitigation**

- **Atomicity** (avoid docs showing published content without search updated, or vice versa):
  - Use a publish pipeline with clear ordering and retries:
    1. update CMS status
    2. update search index
    3. trigger revalidation

  - Log each step; allow manual retry from Payload.

- **Latest semver changes cascade**:
  - When new version becomes latest, revalidate `/[service]/*` entry points and update `isLatest` in Meilisearch for that service.

**Stepwise actions**

1. Add a Payload “Publish” endpoint that accepts:
   - scope: single page / version / service

2. On publish:
   - set `status=published`
   - if version publish: ensure all pages under version are published as intended

3. Compute latest semver per service:
   - compare `versionKey` across published versions

4. Update Meilisearch:
   - index affected pages
   - if latest changed: flip `isLatest` flags for service docs

5. Call docs `/api/revalidate` with:
   - tags: `service:${slug}`, `service:${slug}:version:${version}`, `page:${id}`, and `global:*` if needed

6. Add observability:
   - store publish job logs in Payload (`publishJobs` collection) for audit/retry.
