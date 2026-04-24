---
name: mcbe-json-ui-debugging
description: Diagnose Bedrock JSON UI failures. Use when Codex must find why a screen does not render, a server form does not replace, a HUD panel stays hidden, a binding-derived value is wrong, a chat or actionbar protocol is misparsed, or a texture path or pack dependency breaks Minecraft Bedrock JSON UI behavior.
---

# MCBE JSON UI Debugging

Treat failures as layered diagnosis.

## Workflow

1. Read `references/debugging-map.md`.
2. Identify the failing layer:
   - registration
   - namespace or insertion point
   - factory routing
   - binding or string parsing
   - texture path
   - addon asset dependency
3. Compare against the closest included working sample.
4. Return an ordered suspect list plus the minimal fix set.

## Checklist

- Is the file registered in `_ui_defs.json`?
- Is the namespace correct?
- Is the control inserted into the right panel?
- Is the activation text or form title exact?
- Is the texture path valid and present?
- Is the sample copied without its dependent assets?
