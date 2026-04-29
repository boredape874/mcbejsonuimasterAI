---
name: mcbe-json-ui-server-forms
description: Analyze and implement Bedrock JSON UI server form customization. Use when Codex must modify `server_form.json`, long or custom form routing, chest or furnace form substitution, title-prefix based form detection, custom server form button grids, image rows inside forms, polished form shells, or multi-form factory patterns in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI Server Forms

Use this when the UI is driven by Bedrock server form screens.

## Workflow

1. Read `references/server-form-map.md`.
2. Determine the routing mechanism:
   - title prefix
   - form type suffix
   - chest or furnace special token
   - factory control id override
3. Trace how `main_screen_content` inserts the replacement form.
4. Document the exact form title conventions required on the server side.

## Output rules

- Always include the title prefix or token that activates the custom UI.
- Show which factory control id is being replaced.
