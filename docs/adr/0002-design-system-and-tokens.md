# ADR 0002: Own design system with design tokens, on headless primitives

Status: accepted

## Context
We need a consistent, accessible (WCAG 2.2 AA), themeable UI that the client's team can maintain without paying for licenses. Styled component kits couple visuals to a vendor and can bring license keys or subscriptions.

## Decision
- Tokens in `frontend/tokens/tokens.json` (primitive, semantic light and dark, contrast pairs) generate CSS custom properties and a typed map.
- Components in `src/design-system` use semantic tokens only. Behaviour-heavy parts (dialog, radio group) use Reka UI (MIT); icons are Lucide (ISC); the font is Inter (OFL). Native elements are preferred (`select`, `input`, `table`).
- Palette: graphite neutrals, cobalt blue as the single action color, amber for "needs attention", red for blocked, green for applied.
- Tests enforce the system: contrast per pair in both themes, no raw hex, no unknown or primitive tokens in components. Storybook documents tokens and components, with the a11y addon set to fail.

## Consequences
More components to own, but no vendor lock-in, no license risk, and visual changes happen in one JSON file.
