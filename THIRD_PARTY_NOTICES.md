# Third-party notices and license scope

## Original contributions

Noah Youngs' original code is available under the MIT grant in [LICENSE](LICENSE),
with the explicit third-party exclusions there. This is an application source
release with mixed license terms, not an all-MIT component collection.

## HeroUI Pro v2

HeroUI Pro (v2) components, templates, designs, and derived portions remain
subject to [HeroUI Pro's v2 license](https://v2.heroui.pro/license). They are
excluded from the project's MIT grant, including modifications mixed into
application files. NextUI Inc. retains its rights in that material. No independent
license to extract or redistribute Pro code is granted by this repository.

The [v2 pricing FAQ](https://v2.heroui.pro/pricing), reviewed on 2026-10-26,
expressly permits use in open-source applications subject to its restriction
against products primarily repackaging components. The license permits end
products while retaining restrictions on Pro components and their derivatives.
The owner has chosen to publish cal.ad as a complete calendar application with
this exception, rather than as a UI kit, library, theme, or starter for extracting
Pro components. This is our application of the v2 guidance, not an individual
approval from HeroUI or a claim that Pro material is MIT-licensed.

### Source identification and review boundaries

The evidence-based file inventory is in [docs/HEROUI_PROVENANCE.md](docs/HEROUI_PROVENANCE.md).
It identifies strong Settings Layout, theme/plan selector, marketing, and pricing
lineages, and separates probable or unresolved chat/helper matches. The owner
could not recall exact imports; this inventory was reconstructed from public
previews and Git rather than asking the owner to supply that mapping. The Pro
exception follows the material regardless of its path or confidence label.

The free `@heroui/react` library is separate from HeroUI Pro templates and
is MIT-licensed at the pinned 2.7.8 version; its notice is retained in
`docs/licenses/heroui-MIT.txt`. This notice does not impose Pro restrictions
on that library or on unrelated permissively licensed code.

## Starter and other UI code

The project began from the Next.js `examples/with-supabase` starter, as recorded
in its initial README. It also previously included shadcn/ui-style components.
Upstream MIT notices are retained in `docs/licenses/nextjs-MIT.txt` (Next.js
15.1.7) and `docs/licenses/shadcn-ui-MIT.txt` (shadcn/ui). Sources:
https://github.com/vercel/next.js/blob/v15.1.7/license.md and
https://github.com/shadcn-ui/ui/blob/main/LICENSE.md. These notices remain
applicable to copied material; the HeroUI Pro exception does not supersede them.

## Images, artwork, and brand assets

Ownership and redistribution rights for custom files under `public/` (including
logos, the avatar, email graphics, and Open Graph images) and application icons
still require owner confirmation. Google and Supabase brand graphics retain
their owners' rights. Project MIT licensing does not grant third-party trademark
rights or establish ownership of artwork.

## Dependencies

Dependencies are recorded in `package-lock.json` and retain their individual
licenses; installed `node_modules` are not vendored into this source release.
A lockfile-based metadata inventory is in `docs/DEPENDENCY_LICENSES.json`.
It distinguishes packages installed for validation from platform-optional entries.
Package metadata does not establish rights for unrelated copied code or assets.
