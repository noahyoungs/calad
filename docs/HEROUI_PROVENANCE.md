# HeroUI source provenance — 2026-10-26

## Method and confidence

Compared current cal.ad source and historical imports with the public
[HeroUI Pro v2 catalog](https://v2.heroui.pro/components) and its rendered
examples. No gated source downloads or paid-code access were used. Inspected
catalog entries across marketing, application layouts/sidebars, AI inputs,
containers, and messages. Public preview behavior and distinctive markup,
SVG shapes, layout values, and Git lineage provide the evidence below.

**Strong** means distinctive matching artifacts and/or an identifiable imported
example followed through Git into current code. **Probable** means several
similarities but insufficient evidence to identify an exact upstream component.
**Unresolved** means a category resemblance or library import alone; it is not
proof of Pro origin. These are provenance findings, not claims of authorship
for every line in a mixed application file.

## Strong matches

| Current source | Pro v2 example | Evidence and lineage |
| --- | --- | --- |
| `components/settings/settings-layout-base.tsx` | [Settings Layout](https://v2.heroui.pro/components/application/layouts#component-settings-layout) | Same distinctive settings subtitle, heading structure, and tabbed composition. Present in cal.ad at `b0acfc3`; later customized with calendar/email data and routing. |
| `components/settings/theme-custom-radio.tsx` | Settings Layout → Appearance | All 12 distinct SVG path shapes match the rendered Pro theme thumbnails. Matching 132px card height and 32px/37px thumbnail offsets provide additional evidence. Present at `b0acfc3`. |
| `components/settings/plan-custom-radio.tsx` | Settings Layout → Billing | Rendered plan radio wrappers match the distinctive combined padding, width, border, selected-state, and layout classes in cal.ad's custom radio. Present at `b0acfc3`. |
| `components/landing/CaladFAQ.tsx` | [Two Columns Faqs](https://v2.heroui.pro/components/marketing/faqs#component-two-columns-faqs) | Historical `780ccfc:components/landing/faqs/App.tsx` matches the split heading, responsive two-column wrapper, and plus-indicator accordion. Reworked into CaladFAQ in `edae718`; current code retains that layout lineage while replacing behavior/styling. It is not the catalog's Faqs With Divider variant. |
| `components/landing/CaladFooter.tsx` | [Basic Footer With Theme Switch](https://v2.heroui.pro/components/marketing/footers#component-basic-footer-with-theme-switch) | Historical `780ccfc:components/landing/footer/App.tsx` has the same demo identity/status/copyright composition and responsive ordering. Consolidated in `edae718`; the current footer retains the distinctive wrapper/order structure with different branding/social content. |
| `components/landing/CaladHero.tsx` | [Hero Section With Bottom App Screenshot](https://v2.heroui.pro/components/marketing/hero-sections#component-hero-section-with-bottom-app-screenshot) | Historical `780ccfc:components/landing/hero/App.tsx` matches demo wording, unusual button dimensions, 18px section spacing, and bottom screenshot wrapper. The companion historical screenshot source explicitly referenced HeroUI Pro. Consolidated in `edae718`; current CaladHero retains the section/button lineage with product content and demo embeds. |
| `components/landing/PromoBanner.tsx` | [Basic Banner](https://v2.heroui.pro/components/marketing/banners#component-basic-banner) | Historical `780ccfc:components/landing/banners/App.tsx` matches the public demo release text, translucent/backdrop wrapper, Explore action, and close control. Current PromoBanner descends from its consolidation in `edae718`, adding brand styling, animation, and dismissal state. The original example is Basic Banner, not Gradient Banner. |

### Pricing lineage

Historical `780ccfc:components/landing/pricing/App.tsx` strongly matches
[Pricing With Blurred Background](https://v2.heroui.pro/components/marketing/pricing#component-pricing-with-blurred-background):
its unusual polygon geometry, demo headings, yearly/quarterly selection, and
frequency/tier data structure match the public preview. It became the now-deleted
`components/landing/CaladPricing.tsx` at `edae718`.

Current `components/landing/CaladPricingComparison.tsx` and
`components/landing/pricing/pricing-types.ts` / `pricing-tiers.ts` retain portions
of that pricing scaffold: frequency/tier types, data shapes, frequency-index
selection, and card/tab composition. Treat those inherited portions as Pro-derived.
The current feature-comparison extension is substantially customized; no exact
single upstream Pricing Comparison variant was established. Product prices,
feature descriptions, and original billing behavior are not automatically Pro
material just because they are used by this scaffold.

## Probable or unresolved areas

| Source | Assessment |
| --- | --- |
| `components/settings/switch-cell.tsx` | Probable settings-template helper. Introduced alongside the matching theme/plan controls in `b0acfc3`; same kind of reverse-layout labeled switch as the Pro appearance screen. No unique SVG or exact source match established. Treat possible inherited portions conservatively under the Pro exception. |
| Other `components/settings/*.tsx` | Mixed application-specific forms and template composition. Settings-template ancestry is supported, but backend wiring, calendar/email settings, and account behavior must not all be attributed to Pro. |
| `components/chat/chat-input/PromptInput.tsx`, `AttachmentsPreview.tsx`, and `components/chat/ChatInput.tsx` | Possible relation to [Prompt Inputs](https://v2.heroui.pro/components/ai/prompt-inputs), including the uploaded-images example. The historical ChatInput at `75049f3` contains a similar textarea wrapper and badge/removal previews; current files came from modularization. These are also common library patterns. Exact Pro-source attribution is unproven. |
| `components/chat/message-ui/MessageUI.tsx`, `components/chat/chat-container.tsx`, `components/chat/sidebar/`, `components/client-chat-layout.tsx` | Examined against Pro Messages, Prompt Containers, and Sidebars categories. Category resemblance is insufficient to identify an exact template. Do not label all chat logic as Pro-derived. |
| `components/landing/CaladNavbar.tsx` | Historical navigation existed alongside the imported hero, but the current file is a small replacement introduced by the closure change. Do not assume the old navigation template survives in the current source. |
| `components/landing/CaladFeatures.tsx`, `CaladContact.tsx`, `LandingChatInput.tsx` and remaining application UI | No distinctive exact Pro match established during this review. Imports from the free library are not evidence of paid-template origin. The material-based LICENSE exception still applies if inherited portions are later identified. |

This bounded inventory replaces the request for the owner to remember the exact
imports. It does not certify that every possible copied line can be reconstructed
from Git. The license exception follows Pro-derived material regardless of path,
so uncertain UI attribution does not silently turn Pro code into MIT code.

## The free HeroUI library is separate

The locked and installed `@heroui/react` version is **2.7.8**. Its package metadata
and shipped LICENSE say **MIT**, with copyright attributed to Next UI Inc.
The package's notice is preserved at `docs/licenses/heroui-MIT.txt`. No evidence
was found that this pinned package is Apache-2.0 licensed. This conclusion applies
to the actual package version here; other dependencies retain their own terms.

Ordinary use of its Button, Tabs, Textarea, Radio, Switch, and other primitives
does not establish Pro provenance. The component library and the Pro template
catalog are distinct sources with separate terms.

## Remaining release facts

Noah selected a full-application source release with original contributions
under MIT and Pro-derived material excluded from that grant. The v2 FAQ supports
qualifying open-source applications. This inventory does not require replacing
those components or obtaining a new blanket permission merely because they
were identified. Noah confirmed ownership of all custom cal.ad artwork on 2026-10-26. Revocation
of the historical Supabase PAT remains the unresolved release fact.
