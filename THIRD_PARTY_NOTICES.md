# Third-party provenance review

The project began from the Next.js `examples/with-supabase` starter, as recorded
in its initial README. It also previously included shadcn/ui-style components.
Upstream MIT notices are retained in `docs/licenses/nextjs-MIT.txt` (Next.js
15.1.7) and `docs/licenses/shadcn-ui-MIT.txt` (shadcn/ui). Sources:
https://github.com/vercel/next.js/blob/v15.1.7/license.md and
https://github.com/shadcn-ui/ui/blob/main/LICENSE.md. The new project MIT license
does not replace upstream notices; exact copied-component provenance still
requires review.

Historical `components/landing/hero/app-screenshot.tsx` references HeroUI Pro.
That reference is a provenance lead, not proof that all HeroUI-based code is
restricted. Confirm whether paid templates were copied into the current landing,
pricing, settings, or other components, and establish redistribution rights or
replace affected material before publication. The open-source `@heroui/react`
package and paid HeroUI Pro templates must be evaluated separately.

Confirm ownership and redistribution rights for custom files under `public/`
(including logos, the avatar, email graphics, and Open Graph images), application
icons, and historical binary versions. Google and Supabase brand graphics retain
their owners' rights; inspect their source and applicable brand-use terms before
redistributing. Do not treat dependency licenses as permission for unrelated
images or templates.

Dependencies are recorded in `package-lock.json` and retain their individual
licenses. Dependencies and installed `node_modules` are not vendored into this
source release. A lockfile-based metadata inventory is in `docs/DEPENDENCY_LICENSES.json`.
It distinguishes packages installed for validation from platform-optional entries.
Package metadata does not establish rights for unrelated copied code/assets.
