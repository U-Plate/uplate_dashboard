---
name: UPlate Dashboard
description: Internal admin surface for the UPlate campus nutrition app. Manages sections, restaurants, foods, and menu items.
colors:
  primary-50: "#f4f8ff"
  primary-100: "#dcedff"
  primary-200: "#c5dcf7"
  primary-300: "#aac6ea"
  primary-400: "#94b0da"
  primary-500: "#7596c5"
  primary-600: "#5b7bad"
  primary-700: "#44608d"
  bg: "#f3f8ff"
  bg-gradient-end: "#e9f1fc"
  surface: "#ffffff"
  surface-muted: "#f7faff"
  surface-hover: "#eef5ff"
  text: "#1f2a44"
  text-muted: "#5a6a8a"
  text-soft: "#8595b5"
  text-inverse: "#ffffff"
  border: "#dbe6f5"
  border-strong: "#c2d1ea"
  divider: "#e7eef8"
  danger: "#d9534f"
  danger-soft: "#fdecec"
  danger-border: "#f3c5c5"
  danger-dark: "#b03a36"
  success: "#3fa57a"
  success-soft: "#e6f6ee"
  warning: "#c98a3b"
  warning-soft: "#fbf1de"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "2.15rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.93rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.005em"
  eyebrow:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
  data:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
  "4xl": "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary-400}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-500}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-700}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  button-secondary-hover:
    backgroundColor: "{colors.primary-100}"
    textColor: "{colors.primary-700}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-dark}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.65rem 0.85rem"
  input-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.65rem 0.85rem"
  card-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "1.75rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1.1rem"
  nav-link-active:
    backgroundColor: "{colors.primary-400}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1.1rem"
  data-table-header:
    backgroundColor: "{colors.primary-50}"
    textColor: "{colors.primary-700}"
    rounded: "0"
    padding: "0.95rem 1.1rem"
  data-table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "0"
    padding: "0.95rem 1.1rem"
  stat-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-700}"
    rounded: "{rounded.lg}"
    padding: "0.9rem 1.5rem"
  modal-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1.25rem 1.5rem"
---

# Design System: UPlate Dashboard

## 1. Overview

**Creative North Star: "The Operator's Console"**

UPlate Dashboard is the back office for a campus nutrition app. The interface is operated by a small internal team that spends hours at a time entering and reconciling restaurant menus and roughly fifteen-field nutrition records per food. The system is therefore built like a piece of equipment, not like a product page: tight typographic hierarchy, predictable structure, visible state, with one or two committed choices that give it identity. It rewards familiarity. The tool should disappear into the task.

The current snapshot, captured in the frontmatter above, is the system as it exists today: a temperate pastel-blue admin shell built on Inter, with white card surfaces lifted over a soft blue gradient. Pleasant and explicitly not the destination. PRODUCT.md names "Generic SaaS blue plus soft gradient cards" as an anti-reference. The visual identity is now headed toward Linear-level composure paired with the color and motion presence of Arc and Framer dashboards. Forward visual work should bias toward stronger hue commitment, denser type, and fewer decorative surfaces than this snapshot shows.

The system rejects four neighbors by name: university CMS gray-on-gray enterprise (Banner, Canvas, PeopleSoft); neon dark-mode terminal dashboards (eye-burning over an hour-long session); marketing-page energy (gradient headlines, scroll choreography, hero animation); and consumer food-delivery softness (orange warmth, food emoji, illustrated empty states). UPlate Dashboard is none of these. It is a precise tool.

**Key Characteristics:**
- Light theme on a faint blue-tinted background. No dark-mode counterpart today.
- Single typeface (Inter) carrying every role from display to caption.
- Curved, not pillowed: medium and large radii (10–22px) on surfaces; pill radius reserved for nav and badges.
- Two-tone neutral system: white content surfaces floating on a tinted page atmosphere.
- Forms and tables are first-class. The Dashboard tile grid is a thin entry surface, not the product.
- Density is moderate today; the redesign brief allows it to increase.

## 2. Colors

A cool, low-chroma blue palette in eight steps (`primary-50` through `primary-700`), four neutrals layered for surface depth, and a four-color semantic vocabulary (danger, success, warning, plus inverse). The palette today is restrained to the point of timidity: the primary action color (`primary-400`, `#94b0da`) is muted enough that it reads neutral in screenshot. The redesign trajectory is committed, not restrained, so identity comes through hue rather than through gradient and shadow.

### Primary
- **Lifted Blue** (`#94b0da`, `primary-400`): the primary action color. Filled buttons, active nav, focused input border. Currently undersaturated for the role; treat as a placeholder anchor.
- **Settled Blue** (`#7596c5`, `primary-500`): primary hover. One step deeper than the default.
- **Anchored Blue** (`#5b7bad`, `primary-600`): links and the hero eyebrow. The first hue saturated enough to read as "blue" rather than "blue-tinted."
- **Deep Blue** (`#44608d`, `primary-700`): heading-strength accents on tinted surfaces, link hover, secondary-button text, brand mark. The palette's structural anchor.

### Tertiary (the cool tints)
- **Atmosphere Tints** (`#f4f8ff` `primary-50`, `#dcedff` `primary-100`, `#c5dcf7` `primary-200`, `#aac6ea` `primary-300`): tinted surfaces (table headers, nav pill rail) and hover halos. Atmosphere, never type.

### Neutral
- **Page Atmosphere** (`#f3f8ff` `bg`, fading to `#e9f1fc` at the bottom of the viewport): the gradient background under everything. Cool, not white.
- **Surface** (`#ffffff`): every content card, modal, input, and table.
- **Surface Muted** (`#f7faff`): modal footers, occasionally interior zones. One nudge above surface.
- **Surface Hover** (`#eef5ff`): row and item hover wash.
- **Ink** (`#1f2a44` `text`): body and heading text. Deep navy, not black.
- **Ink Muted** (`#5a6a8a` `text-muted`): subtitles, descriptions, table-cell prose.
- **Ink Soft** (`#8595b5` `text-soft`): placeholders, separators, low-priority metadata.
- **Border** (`#dbe6f5`) and **Strong Border** (`#c2d1ea`): card edges and input edges respectively. Two weights only.
- **Divider** (`#e7eef8`): horizontal hairlines inside cards, tables, modals.

### Semantic
- **Danger** (`#d9534f`): destructive actions, error icons, error-state input borders. Backed by soft (`#fdecec`), border (`#f3c5c5`), and dark (`#b03a36`, used for hover ink).
- **Success** (`#3fa57a`) plus soft (`#e6f6ee`): saves, confirmations.
- **Warning** (`#c98a3b`) plus soft (`#fbf1de`): non-blocking warnings.

### Named Rules
**The Atmosphere Rule.** The page background is never pure white. The viewport carries the `bg` gradient at all times so that white surfaces float on a tinted field. Removing the tint flattens the system into default Bootstrap admin.

**The Two-Border Rule.** Borders come in exactly two weights, `border` (cards, dividers) and `border-strong` (inputs, secondary buttons). A third weight or a tinted side-stripe accent is forbidden.

**The Hue Commitment Rule (forward-looking).** Per PRODUCT.md, the redesign moves toward an identity hue and away from the current undersaturated blues. Until a new anchor is chosen, treat `primary-400` as a stand-in, not a target. Do not generate new surfaces that lean further into this exact muted blue.

## 3. Typography

**Display Font:** Inter (with system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif fallback)
**Body Font:** Inter (same family throughout)
**Label/Mono Font:** none distinct. UPlate Dashboard runs on one family across every role.

**Character:** Inter is the cross-platform default for a reason. It is neutral, legible at small sizes, and disappears into the task. UPlate Dashboard relies on it to carry every role from display to caption. Hierarchy is built with scale and weight, not with a second family. Negative tracking (`-0.01em` to `-0.02em`) on display sizes tightens the headings; uppercase with extra tracking replaces a small-caps face for eyebrows and table headers.

### Hierarchy
- **Display** (800, 2.15rem, line-height 1.15, tracking -0.02em): hero titles on landing surfaces (Dashboard, lock screen). One per surface, never two.
- **Headline** (700, 2rem, line-height 1.2, tracking -0.01em): page-level `h1` for index pages (Restaurants, Sections, Foods).
- **Title** (700, 1.25rem, line-height 1.3, tracking -0.01em): card-level titles (Dashboard tile name, modal title at 1.2rem).
- **Body** (400, 1rem, line-height 1.5): paragraph text and primary input copy. Long prose is rare in this app; cap any body block at 65–75ch.
- **Body Small** (400, 0.93–0.95rem, line-height 1.5): table cells, tile descriptions, modal body prose. Button labels at 0.92rem/600.
- **Label** (600, 0.88rem, line-height 1.4, tracking 0.005em): form-field labels.
- **Data** (800, 1.75rem, line-height 1.1, tracking -0.02em): the count value in stat tiles. The only place display weight meets display size outside the hero.
- **Eyebrow** (700, 0.78rem, uppercase, tracking 0.1em): hero eyebrow. A second eyebrow variant at 600/0.82rem/tracking 0.06em serves tile metadata, table column headers, and stat labels. The two are siblings; both serve the same small uppercase rail role.

### Named Rules
**The One Family Rule.** Inter carries every role. No second display face, no monospace counterpart, no serif accent. Hierarchy comes from scale and weight; never a font swap.

**The Negative Tracking Rule.** Sizes above 1.2rem use negative tracking (`-0.01em` minimum, `-0.02em` at 2rem+). Default Inter at display sizes reads loose and consumer. Tighten it.

**The Uppercase Eyebrow Rule.** Uppercase plus 0.06–0.1em tracking is the only place uppercase is permitted. Section eyebrows, table column labels, stat labels, tile metadata. Never on body, button, or input text.

## 4. Elevation

A hybrid: most surfaces sit nearly flat, lifted by a single soft shadow against the tinted background; modal and dropdown surfaces lift further; focus is signaled by a glow ring rather than a stroke shift. The system reads "considered" rather than "stacked" today. The redesign should sharpen this further: less ambient glow, more intentional state-driven lift.

### Shadow Vocabulary
- **shadow-sm** (`box-shadow: 0 1px 2px rgba(31, 42, 68, 0.05)`): cards, data tables, stat tiles at rest. The "is a surface" hint.
- **shadow-md** (`box-shadow: 0 4px 14px rgba(94, 128, 178, 0.12)`): hover on tiles, the lock card at rest, the target lift for primary buttons in active states.
- **shadow-lg** (`box-shadow: 0 18px 40px rgba(64, 96, 144, 0.18)`): modals only. The single biggest lift in the system.
- **shadow-focus** (`box-shadow: 0 0 0 4px rgba(148, 176, 218, 0.35)`): focus-visible ring. Replaces a stroke change on inputs, buttons, links.

### Named Rules
**The Tinted Shadow Rule.** Every shadow is tinted toward the primary hue, never pure black-on-transparency. Black shadows on this tinted background read as dirty.

**The State-Driven Lift Rule.** Surfaces sit at `shadow-sm` at rest and lift only on hover, focus, or temporary state (modal, dropdown). No surface is born at `shadow-md`. Elevation is not decoration.

**The Glow-Ring Rule.** Focus uses `shadow-focus`, not a 2px stroke shift. The ring sits outside the element so it stacks cleanly over hover backgrounds.

## 5. Components

### Buttons
- **Shape:** medium radius (10px). Solid blocks with a 1px transparent border that becomes visible on secondary and danger variants. Weight 600, size 0.92rem, 0.5rem icon gap.
- **Primary:** `primary-400` background, inverse text, soft tinted shadow at rest, deeper background plus lifted shadow on hover. Press translates 1px down.
- **Secondary:** white surface, `primary-700` text, `border-strong` outline. Hover fills with `primary-100` and intensifies the border.
- **Danger:** white surface, `danger` text, `danger-border` outline. Hover fills with `danger-soft` and shifts text to `danger-dark`. Filled-red destructive buttons are reserved for confirmation modals.
- **Disabled:** opacity 0.5, shadow removed, cursor disabled. Uniform across variants.

### Inputs
- **Style:** `border-strong` (`#c2d1ea`) 1px stroke on white, 10px radius, padding 0.65rem 0.85rem, text 0.95rem. Placeholders use `text-soft`.
- **Hover (idle):** stroke shifts to `primary-300`.
- **Focus:** stroke shifts to `primary-400` and the focus glow ring (`shadow-focus`) appears outside the field.
- **Error:** stroke shifts to `danger`, background tints to `danger-soft`, and the helper text below renders in `danger-dark`.
- **Textarea:** vertical resize only, 110px min-height, line-height 1.5.

### Cards / Containers
- **DashboardTile (signature card):** 22px radius, white surface, 1px `border`, `shadow-sm` at rest. 1.75rem padding. Three-column grid: 56px rounded icon panel (`primary-100` background, `primary-700` glyph), title + description column, chevron column. Hover lifts 3px, raises shadow to `shadow-md`, deepens border to `primary-300`, and slides the chevron 4px right.
- **Data table:** 16px radius outer shell, 1px `border`, `shadow-sm` at rest. Header row tinted with `primary-50`, body rows divided by `divider` hairlines. Header cells use the uppercase eyebrow rail (0.78rem, 600, tracking 0.06em, `primary-700`).
- **Modal:** 16px radius shell, `shadow-lg`, scrollable body capped at 85vh. Overlay is `rgba(31, 42, 68, 0.45)` with a 4px backdrop blur. Animation: 200ms fade for the overlay, 250ms slide-up for the content. Footer sits on `surface-muted` to read as a separate action zone.
- **Lock card (auth gate):** 22px radius, `shadow-md` at rest (not `sm`). A small `primary-100` badge sits above the title. This is the only persistent surface that breaks "born at `shadow-sm`," because it is the only surface for the user while triggered.

### Navigation
- **Style:** sticky top bar, white at 85% opacity with a 12px backdrop blur. 1280px max content width. `divider` hairline at the bottom. The brand mark "UPlate" renders in `primary-700` at 1.4rem / 800 / -0.02em.
- **Links:** sit inside a pill-shaped container filled with `primary-50`. Default link: `text-muted`, weight 600, 0.92rem. Hover shifts to `primary-700` over a soft `primary-100` halo. Active fills the pill with `primary-400` background, inverse text, and a small tinted shadow.
- **Mobile (<768px):** the bar collapses vertical; the link group expands to full width and distributes evenly.

### Stat Tile (signature pattern)
- A small white card sitting inside the Dashboard hero. 16px radius, 1px `border`, `shadow-sm`. Renders a single large data value (1.75rem, 800, `primary-700`, tracking -0.02em) above a tiny uppercase label (`text-muted`, 0.78rem, tracking 0.06em). This is the smallest legitimate "metric" surface in the system. Do not replicate it into a six-up hero-metric grid (see Don'ts).

## 6. Do's and Don'ts

### Do:
- **Do** keep the background tinted (`bg` or the full `bg-gradient`). White-on-white surfaces lose the cool atmosphere that distinguishes this from default Bootstrap admin.
- **Do** use Inter for everything: display, body, button labels, table data. One family, two-step weight contrast (600 vs. 700–800 for emphasis).
- **Do** apply negative tracking (-0.01em to -0.02em) on every type role above 1.2rem.
- **Do** lead destructive actions with a `danger`-outlined button on white. Filled red is reserved for confirmation modals where the action is the only path forward.
- **Do** tint shadows toward the primary hue. Black shadows on this tinted background read as dirty.
- **Do** lift on state, not at rest. Surfaces born at `shadow-md` over-decorate the page.
- **Do** route focus through `shadow-focus` (the 4px glow ring), not a stroke shift. Keyboard navigation is a first-class affordance per PRODUCT.md.
- **Do** keep the nav as a single horizontal pill rail. A second column or sidebar is out of scope until the catalog grows enough to need a tree.

### Don't:
- **Don't** ship anything that reads as **generic SaaS blue plus soft gradient cards** (PRODUCT.md anti-reference). The current snapshot already sails near this line; further pastel-on-pastel layering pushes it over.
- **Don't** introduce **university CMS gray-on-gray density** (PRODUCT.md anti-reference). Density yes, institutional drabness no.
- **Don't** introduce a **neon dark-mode terminal** counterpart (PRODUCT.md anti-reference). If dark mode is added later, it is calm and tonal, never neon.
- **Don't** import **marketing-page energy** (PRODUCT.md anti-reference): no gradient headlines, no scroll-driven reveals, no hero animation, no oversized rounded CTAs.
- **Don't** use the **hero-metric template** (sweeping gradient banner with a row of big-number tiles). The Dashboard hero stops at two stat tiles; do not balloon it into a six-up grid.
- **Don't** use **side-stripe borders** (`border-left` greater than 1px as a colored accent on cards, list items, alerts). Rewrite as a full border, a background tint, or a leading icon.
- **Don't** apply **gradient text** (`background-clip: text` with a gradient). One solid color; emphasis through weight or size.
- **Don't** decorate with **glassmorphism**. The navigation already uses a single intentional 12px backdrop blur; do not multiply it onto cards or modals.
- **Don't** add **identical card grids**. The DashboardTile pattern is for two-to-four entry points, not for paginated content.
- **Don't** introduce a **second typeface**. The One Family Rule is non-negotiable; bring contrast through size and weight.
- **Don't** raise body or button text above their fixed rem sizes via `clamp()`. Fixed scale only; fluid type does not serve admin density.
- **Don't** reach for a **modal as the first thought**. Modals are for confirmations and form context, not for inline editing.
