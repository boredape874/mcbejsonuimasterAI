# IR Examples

These are runnable IR YAML files. From the repo root:

```
node tools/init-project.mjs <name>          # create your own
# or copy any file from here into workspace/<name>/ir.yaml, then:
node tools/run.mjs workspace/<name>/ir.yaml
```

Files:

- `centered_modal.yaml` — small modal with title, body, two symmetric buttons
- `symmetric_button_row.yaml` — 4 buttons aligned horizontally with equal gaps
- `top_tab_row.yaml` — 4 tabs pinned to the top with equal gaps
- `bottom_dialogue.yaml` — bottom dialogue panel with header label and continue button
- `sidebar_cards.yaml` — sidebar list of equal-width cards with vertical gaps

Every file is **layout-only**. Bindings/animations/Script API are out of scope; add them to the compiled `ui.json` afterward via the knowledge-layer skills.
