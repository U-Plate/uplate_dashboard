# Product

## Register

product

## Users

The UPlate team. A small internal group doing bulk catalog upkeep for the consumer-facing UPlate nutrition app: entering and editing restaurants, foods, and menu items across schools (Purdue today, multi-school in the data model). Sessions are long and repetitive: dozens of food records at a time, each carrying ~15 nutrition fields plus ingredients. The tool is gated by an admin key, used on a laptop or desktop in normal indoor lighting, often for an hour or more in one sitting.

The job to be done is *catalog throughput*: keep the consumer app fed with accurate, complete records without the dashboard becoming the bottleneck. Speed, density, and keyboard flow matter more than friendliness; clarity and composure matter more than personality.

## Product Purpose

Internal admin surface for UPlate. It manages the core domain (Sections → Restaurants → Foods + Menu Items) behind the consumer nutrition app at `u-plate.com`. Every record entered here flows downstream into a student-facing experience, so the dashboard's job is to make accurate data entry fast and confident, and to make destructive operations obvious.

Success is invisible: the team should enter a full restaurant's menu without thinking about the tool itself. Failure looks like the current state, generic SaaS scaffolding the user has to push through rather than work with.

## Brand Personality

Sharp, confident, quietly serious.

Voice is direct. No exclamation marks, no "Welcome back!" warmth, no helper-bot tone, no decorative emoji. Headings are short. Buttons say what they do. Empty states explain what to do next in one line.

Emotional goal is trust and control. The user should feel like they're operating a precise tool, not visiting a product page. The interface earns its identity through restraint plus one or two committed visual choices, not through ornamentation.

Reference register: Linear-level craft and composure, with the visual presence of Arc and Framer dashboards. That means tight typographic hierarchy, intentional motion, and a real color identity that ties to UPlate, not the default SaaS-admin neutral palette.

## Anti-references

The dashboard explicitly should not feel like any of these:

- **University CMS / institutional admin.** Banner, Canvas, PeopleSoft. Gray-on-gray, dense but ugly, 2008-era enterprise. UPlate is a campus tool but must not adopt campus-tool aesthetics.
- **Neon dark-mode terminal dashboard.** Cyan and magenta on near-black. Screenshot-friendly, eye-burning over an hour-long data-entry session. The wrong register for sustained focus work.
- **Loud marketing-page energy.** Hero animations, gradient headlines, scroll-triggered reveals, big rounded buttons. This is an internal tool; that energy belongs on `u-plate.com`, not here.
- **Generic SaaS blue plus soft gradient cards.** The current state of the dashboard: pastel-blue background, rounded white cards, default-Inter, gentle shadows. Pleasant and entirely forgettable. The redesign moves away from this; new work should not regress toward it.

## Design Principles

1. **Built for the operator, not the visitor.** Every screen optimizes for someone who already knows the model and uses the tool daily. No onboarding scaffolding, no decorative tiles, no "Welcome back" hero on the main view. Friction lives where it belongs (destructive actions), not where it doesn't (data entry).

2. **Identity over neutrality.** A real color and typographic identity is the goal, not safe neutral gray. Pick committed visual choices and apply them consistently, even when "safe" would be easier. Reads as a tool with a point of view.

3. **Composure reads as confidence.** Sharp, quietly serious means the interface does not jitter, bounce, decorate, or perform. Hierarchy carries the weight. Motion is precise, rare, and short. When in doubt, remove rather than add.

4. **Earn every element.** A tile, header, badge, gradient, or icon that isn't doing work for the operator gets cut. Decoration is the enemy of throughput. Density is not clutter when the density is meaningful.

5. **Forms and tables are the product.** They are the surfaces the team spends 95% of their time on. They get the most craft, the strongest typographic system, the best keyboard behavior, and the most edge-case attention. Everything else (dashboard, navigation, modals) is supporting infrastructure.

## Accessibility & Inclusion

Working baseline (the user didn't specify, so adjust on request):

- WCAG 2.1 AA contrast as the minimum across text, icons, and interactive borders. The current pastel-blue palette already sails close to the line on muted text; the redesign needs to clear it.
- Keyboard-first throughout: every action reachable via tab order, visible focus rings on every interactive element, Enter / Esc behavior on forms and modals, no mouse-only affordances.
- `prefers-reduced-motion` respected. Decorative motion disabled, functional motion (focus, state change) kept short and non-parallax.
- No color-only signals. Status (success, danger, warning) carries an icon or label alongside any color cue.
- Long data-entry sessions assumed: avoid pure white surfaces at full brightness, avoid hue choices that cause sustained eye strain.
