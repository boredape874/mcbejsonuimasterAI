# Token-Efficient Work Prompts

Use these when the pack is large and Codex should inspect only the relevant files.

## Minimal targeted fix

```text
Use mcbe-json-ui-master. Token-efficient mode: read the router, choose the smallest matching topic, then inspect only the files needed.

Task:
Fix this JSON UI issue: <describe issue>

Pack path:
<path>

Rules:
- do not scan every sample pack
- start from _ui_defs.json and the target screen only
- open external references only if local files are not enough
- return changed files, validation command, and remaining assumptions
```

## Broad audit without loading everything

```text
Use mcbe-json-ui-master. Use docs/27-token-efficient-routing.md first.

Task:
Audit this resource pack's JSON UI architecture and list only actionable risks.

Pack path:
<path>

Inspect only:
- ui/_ui_defs.json
- ui/_global_variables.json if present
- hud_screen.json
- server_form.json
- chat_screen.json
- files directly referenced by those files
```

## PMMP bridge design

```text
Use mcbe-json-ui-master. Use docs/25-pmmp-json-ui-bridge.md and only the relevant HUD/form topic files.

Task:
Design a PMMP-driven JSON UI protocol for <HP/MP/dialog/shop/etc>.

Constraints:
- actionbar/title payload should be short
- JSON UI must parse only needed values
- include PMMP send flow and JSON UI target files
```

