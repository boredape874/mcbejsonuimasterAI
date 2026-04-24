# Debugging Prompts

## 1. Invisible control

```text
Use mcbe-json-ui-debugging.
This control does not render.
Debug it in this order: _ui_defs.json loading, namespace ownership, modification insertion point, bindings, visibility logic, and texture path.
Return the likely root cause and the exact patch.
```

## 2. Broken pack merge

```text
Use mcbe-json-ui-debugging and mcbe-json-ui-foundations.
Two JSON UI systems were merged and now one of them stopped working.
Find the collision points in namespaces, entry points, additional_screen_content usage, and shared template references.
```
