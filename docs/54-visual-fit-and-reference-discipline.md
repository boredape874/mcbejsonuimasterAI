# Visual Fit And Reference Discipline

This document exists because Bedrock JSON UI work fails most often on sizing, spacing, text scale, and agents skipping the reference files they claim to use.

Use these rules as hard constraints for HUD, server form, chat, loading screen, inventory, and custom overlay work.

## Reference-First Rule

Before editing a JSON UI screen, the agent must identify the closest working reference and open it.

Minimum reference choices:

- Vanilla screen behavior: `references/verified-samples/bedrock-samples-ui/<screen>.json`
- HUD, chat, title, actionbar, scoreboard: `references/sample-packs/*/ui/hud_screen.json`, `references/local-examples/*/ui/hud_screen.json`
- Animated progress bars: `references/local-examples/*/ui/animated_bar.json`
- Server forms: `docs/39-design-recommendation-catalog.md`, `docs/40-server-form-example-index.md`, `docs/53-premium-ui-pattern-reference.md`
- Control names/properties: `docs/48-json-ui-field-catalogue.md` and schema references

The final answer or work log should name the reference path used. If no reference was opened, the implementation should be treated as a draft, not a finished UI.

## Layout Source Of Truth

For any request involving size, position, alignment, symmetry, spacing, or image matching:

1. Use IR/tools when creating a new layout or heavily reworking one.
2. Use direct JSON patching only for small local adjustments.
3. Do not hand-place repeated controls unless their sizes and gaps are declared as a repeated pattern.
4. Every repeated row/column must have same item size, same gap, stable parent size, and predictable anchors.
5. Never mix random offsets in the same group. Pick one anchor model and keep it.

## Text Fit Rules

Text fit must be designed, not guessed.

Use this table as the starting point:

| UI role | Typical `font_size` | Typical `font_scale_factor` | Minimum height |
| --- | --- | --- | --- |
| Tiny slot key, cooldown, tag | `small` | `0.55` to `0.72` | `8` to `10` |
| HUD stat label | `small` | `0.65` to `0.8` | `10` to `12` |
| HUD numeric value | `small` or `normal` | `0.65` to `0.85` | `10` to `14` |
| Server form body text | `normal` | `0.75` to `0.95` | `12` per line plus padding |
| Panel title | `normal` + `MinecraftTen` only if short | `0.75` to `1.05` | `14` to `22` |
| Large hero/title text | `normal` or `large` | `0.9` to `1.25` | test against longest word |

Hard rules:

- Use `MinecraftTen` only for short labels, short titles, and compact HUD headings. Do not use it for long dynamic strings.
- Give every label an explicit `size`.
- For one-line labels, height should usually be at least `10 * font_scale_factor + 4`.
- For multi-line labels, height should be at least `line_count * (10 * font_scale_factor + line_padding) + 4`.
- If text is centered inside a button/card, leave at least 4px horizontal padding and 2px vertical padding.
- For translated or user-provided text, size for the longest expected string, not the sample string.
- If a label is bound to actionbar/title/chat data, keep it in a larger container than the visible test text requires.

## Bedrock HUD Specific Rules

HUD edits must preserve the vanilla renderer graph unless the user explicitly asks to remove it.

- Restore hotbar by not overriding `hotbar_renderer`, `hotbar_panel`, `hotbar_grid`, `hotbar_chooser`, or `exp_progress_bar_and_hotbar`.
- Hide survival icons by overriding only the specific renderer needed, such as `heart_renderer`, `hunger_renderer`, `armor_renderer`, `bubbles_renderer`, or `horse_heart_renderer`.
- If actionbar/title is used as a data protocol, document the exact packet format.
- If raw title text should not appear, override `hud_title_text` carefully and keep the binding source available for preserved-value parsing.
- Always inspect vanilla `hud_screen.json` around the target renderer before overriding it.

## Progress Bar Rules

For progress bars:

- Prefer a reusable `animated_bar` component.
- Use `clip_direction: "left"` and validate whether the chosen pattern expects `clip_ratio = value / max` or `clip_ratio = 1 - value / max`.
- Bind from a preserved title/actionbar panel only after confirming the binding source exists.
- Use a background, fill, optional trail, and text as separate layers.
- Text inside bars must be optional for small bars; do not force unreadable labels into bars under 10px high.

## Final Visual Pass

Before calling UI work complete, check:

- Are all reference files used listed in the final answer?
- Did the implementation avoid invented texture paths?
- Are hotbar/chat/title side effects intentional?
- Do repeated controls have equal size and equal spacing?
- Does every label have explicit size and a font scale appropriate for its height?
- Is dynamic text given enough width?
- Did JSON parse successfully?
- If a pack was generated, was the archive rebuilt after changes?
