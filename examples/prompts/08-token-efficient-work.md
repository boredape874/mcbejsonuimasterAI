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

## Server protocol design

```text
Use mcbe-json-ui-master. Use `skills/mcbe-json-ui-logic/SKILL.md`, `skills/mcbe-json-ui-addon-integration/SKILL.md`, or `skills/mcbe-json-ui-server-forms/SKILL.md` according to the target screen, and open only the relevant references.

Task:
Design a BP Script API or server-driven JSON UI protocol for <HP/MP/dialog/shop/etc>.

Constraints:
- actionbar/title payload should be short
- JSON UI must parse only needed values
- include the sender flow and JSON UI target files
```
