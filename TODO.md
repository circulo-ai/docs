# TODO

## Build and tooling

- [ ] Convert `apps/docs/next.config.js` to `next.config.mjs` or `next.config.ts`
- [ ] Install Prettier in the workspace and share its config
- [ ] Share `postcss.config.mjs` in the workspace
- [ ] Add `.source` to Prettier ignore (docs app)

## Docs app polish

- [ ] Set default font via `next/font`
- [ ] Replace the "My App" string in `apps/docs/lib/layout.shared.tsx`
- [ ] Add analytics
- [ ] Replace Fumadocs icons with Huge Icons
- [ ] Ignore version or service changes when the selected value is unchanged
- [ ] Remove the `docs` route

## CMS app polish

- [ ] Convert with the web app
- [ ] Validate doc page service/version match and show UI error
- [ ] Block publishing a doc version without pages (or without published pages) and show UI error
- [ ] Validate doc page slug format (lowercase, no leading slash, no spaces, no "..") with UI error
- [ ] Validate redirects: `from` must start with `/`, `to` must be `/...` or `https://...` with UI error
- [ ] Fix an issue where a document page from one service can be versioned using another service’s version.

## Ops

- [ ] Add logs
- [ ] Add backups
- [ ] Add rate limiting

## Cleanup

- [ ] Remove extra apps/packages once v1 is ready
- [ ] Check and remove logs before production
- [ ] Run `turbo lint`
- [ ] Lint Markdown files

## Done

- [x] Fix the `docs` inferred type error in `apps/docs/source.config.ts`
- [x] Resolve `fumadocs-mdx:collections/server` module error (docs app)
