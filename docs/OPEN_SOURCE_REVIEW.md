# Open-source release review — 2026-10-26

## Target and disposition

- Verified checkout: `calendar-ai`, remote `https://github.com/noahyoungs/calendar-ai.git`.
- Authenticated GitHub account and repository owner: `noahyoungs`.
- Original repository: private, not archived; default branch `main` at `130ba5430f232f1945afa40ff9109b3c88344643` when reviewed. Clean checkout; fetched remote branches and confirmed synchronization.
- Noah selected MIT for original contributions and approved preparing a separate clean-history `noahyoungs/calad` repository while retaining the original private repository.
- **Not cleared for publication.** Token revocation remains unresolved; Noah confirmed he created all custom cal.ad artwork. Do not change original visibility, rewrite its history, deploy, or restart the service.
- Shutdown reason intentionally omitted at Noah's request. Main product development dates are February–July 2025; later security and closure maintenance is distinguished in the README.

## Audit scope and method

Reviewed every reachable Git blob across all fetched branches/tags: **115 commits, 1,913 Git objects, 953 blob versions, 319 distinct historical paths**. Remote pull-request heads matched fetched branch histories; no tags were advertised. Reviewed commit messages and author metadata, current source/configuration/docs, SQL migration structure, historical path inventory, and all 13 binary asset versions visually. Extended local inspection to 47 unreachable objects (9 commits, 25 trees, 13 blobs); these are not part of the proposed clean export.

Used Gitleaks 8.30.1 with redacted reports and default detectors, then an explicit Supabase PAT detector. Supplemented this with full-blob pattern checks for private keys, provider/API credentials, OAuth tokens, JWTs, credential-bearing URLs, email addresses, UUIDs, and secret assignments. Default Gitleaks missed the Supabase PAT; the extended detector confirmed it. Lockfile integrity strings matching a refresh-token-shaped substring were false positives; configuration `env(...)` references were not credentials.

Looked for dumps, logs, private communications/calendar data, copied templates, copyright/license markers, and asset provenance. SQL is schema/functions/policies rather than a row-data dump; no tracked database row exports, actual email threads, calendar contents, or private key files were identified. This is an evidence-based review, not a guarantee that an automated detector recognizes every secret or that all authorship can be established from Git.

Local ignored `.env.local`, service-account JSON, build output, dependencies, and Vercel metadata were excluded from export and were not copied into reports. Original Git history is preserved. Removed private config/debug-route originals are retained under `.git/private-release-audit/private-originals/`, outside tracked source. Reports never include credential values.

## Redacted findings

| Category | Path / scope | Result and required action |
| --- | --- | --- |
| Supabase personal access token | `.cursor/mcp.json`; historical commits including `b722d311fa53` and `00a9869284b5` | Confirmed credential. Removed the file from candidate and ignored it. Owner must revoke token; no account-wide rotation attempted. Never publish original history. |
| Personal calendar identity and account UUID | `app/api/test/fetch/route.ts` | Legacy debug route targeted a real account/calendar through privileged helpers. Removed from candidate. Original identifiers persist in private history only. Route was never invoked during review. |
| Author contact metadata | Historical commit authors | Personal author email exists in history. A fresh initial commit should use the verified GitHub noreply identity. |
| Contact addresses and examples | Contact route/docs, product legal text/signatures/vCard, prompts; historical FAQ files | Product/owner business contact addresses and illustrative prompt addresses identified; no actual message corpus found. Historical third-party FAQ contacts support template provenance concerns. Clean history excludes deleted historical files. |
| Third-party UI provenance | Historical `components/landing/hero/app-screenshot.tsx` references HeroUI Pro; current landing/pricing/settings components require ownership confirmation | Owner supplied the v2 FAQ explicitly permitting qualifying open-source applications and selected a full-application release with Pro material excluded from MIT. LICENSE and THIRD_PARTY_NOTICES.md implement that scope; the public-preview/Git inventory in docs/HEROUI_PROVENANCE.md identifies strong matches and records remaining attribution uncertainty. |
| Brand/artwork provenance | `public/`, app icons, historical binary versions, brand SVGs/Lottie JSON | Visual review found branding, icons, email graphics, and a starter image; no private calendar screenshots identified. Noah confirmed on 2026-10-26 that he created all custom cal.ad artwork. Third-party brand assets retain their own rights. |
| Starter/component notices | Initial Next.js/Supabase starter README; historical shadcn-style UI | Preserved upstream MIT notices under `docs/licenses/`; project license does not override upstream rights. |
| Dependency security | Locked dependency installation | `npm audit` reported 52 advisories: 4 low, 16 moderate, 28 high, 4 critical. Critical package groups include `next`, `form-data`, `fast-xml-parser`, and `tar`. No live service should be revived from this snapshot without remediation. No broad dependency upgrades performed. |
| Dependency licensing | Lockfile and isolated install | Inventory in `docs/DEPENDENCY_LICENSES.json`; includes platform-optional packages. This is package metadata, not legal clearance for copied templates or artwork. Dependencies are not vendored. |

## Candidate changes

- New source-grounded README, architecture diagram, honest closure/setup limitations, and variable reference.
- MIT license selected by owner for original contributions, with an explicit HeroUI Pro v2 exclusion; upstream license texts and a provenance notice.
- Consolidated placeholder-only environment examples. Existing private environments were preserved.
- Removed token-bearing editor configuration and personal debug endpoint.
- Removed the unusable `test:webhook` script (its referenced script was absent), including its development-guide entry.
- No changes to calendar execution, authentication, stored learning/progress/data, or service closure behavior.

## Validation

- Fresh `npm ci --ignore-scripts` in an isolated directory passed (941 installed packages). Lifecycle scripts were intentionally not run; no production credentials were used for isolated validation.
- `npx tsc --noEmit --incremental false` passed.
- `npm run build` passed with synthetic `.env.example` placeholders in the isolated snapshot. A blank environment initially failed at Mailgun/PostHog import-time checks; the example now supplies non-authenticating placeholders and a loopback analytics host.
- Local HTTP smoke checks passed: `/` served the closure page; sign-in, OAuth callback with a synthetic code, and upgrade requests redirected to the closure page; the removed debug route returned 404.
- Build warns about PostHog/axios Node APIs in the Edge runtime and stale Browserslist data. These pre-existing warnings remain.
- No committed GitHub Actions workflows or usable automated test suite exist. Do not describe this as full CI or live integration verification.
- No production OAuth, AI, Calendar, Mailgun, Redis, billing, database, or storage operations were tested.
- No product demo was recorded: the preserved authentication/onboarding closure prevents a legitimate fresh-account walkthrough. Existing external demo embeds were not assumed synthetic or safe to republish.

## Concrete completion plan

1. Confirm Supabase PAT revocation. Assess its previous account scope before replacing any dependent integration.
2. Custom asset ownership confirmed by Noah on 2026-10-26. The Pro-derived UI inventory has been reconstructed from public previews and Git in docs/HEROUI_PROVENANCE.md, with confidence levels instead of invented certainty. Noah selected full-application publication using the explicit open-source permission in the v2 pricing FAQ, with HeroUI Pro material excluded from MIT. The LICENSE exception follows Pro-derived portions regardless of file path; no wholesale replacement or separate permission is presumed necessary.
3. Review the clean-history source snapshot and its fresh scan, setup checks, notices, and remaining dependency limitations.
4. Push only a fresh, sanitized history to the approved separate `noahyoungs/calad` repository. Keep the original private, with no force push or deletion. Do not push this preparation branch to the Vercel-linked original: historical GitHub statuses/deployments show automatic preview/production deployments.
5. Once review passes, make only the separate repository public, verify its contents/visibility, and mark it archived/read-only. No deployment or service reactivation accompanies publication.

Until those conditions are satisfied, no public repository URL or successful archival outcome should be claimed.

## Current handoff

The sanitized source candidate has been pushed to
https://github.com/noahyoungs/calad as a **private**, unarchived repository.
Its history starts from a fresh sanitized snapshot and contains only reviewed
preparation commits, not the original private history. The candidate matched
the reviewed source tree before pushing, and an extended scan of its complete
history found zero credential findings.

The original `noahyoungs/calendar-ai` repository remains private and its remote
branches have not been changed. No branch was pushed to that Vercel-linked
repository. No deployment or service reactivation was performed.

Publication and archival are pending revocation of the historical Supabase
token. Noah confirmed creation of all custom cal.ad artwork on 2026-10-26. Noah has selected full-application
publication with the HeroUI Pro exception. UI provenance is documented with
confidence levels in HEROUI_PROVENANCE.md; no exact-match certainty is invented
for the unresolved portions.
