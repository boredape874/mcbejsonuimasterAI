# JSON UI Rules

These are the repository-wide rules for answering and implementing MCBE JSON UI work.

## Structure rules

- Start from `_ui_defs.json` before touching a screen file.
- Treat namespace, modifications, factories, and insertions as part of one chain.
- Confirm that the edited screen is actually registered.

## Logic rules

- Prefer exact binding and property names from documentation or working files.
- Keep parsing logic simple when possible.
- Reduce operator count and control count where a simpler equivalent exists.

## HUD and chat rules

- Treat title, subtitle, actionbar, and chat based protocols as data channels.
- Identify the exact source binding, delimiter, and update condition before editing.
- Preserve unrelated vanilla HUD behavior unless the task explicitly replaces it.

## Server form rules

- Confirm whether the pack uses title prefixes, factories, or screen substitution.
- Distinguish between standard server forms and custom chest or furnace screen routing.
- Trace the full path from title text to rendered control tree.

## Vanilla asset rules

- Validate all vanilla texture paths against Ztech upstream.
- Prefer upstream file existence over memory.
- If a path cannot be verified, state that clearly and recommend shipping a custom texture.

## Research rules

- Use local sample packs first for patterns.
- Use Mojang samples for official screen structure.
- Use Bedrock Wiki for behavior and technique details.
- Use Ztech for vanilla asset truth.

## Output rules

- Prefer file-level changes.
- Name exact files and exact JSON paths.
- State whether a value is confirmed, inferred from pattern, or unverified.
