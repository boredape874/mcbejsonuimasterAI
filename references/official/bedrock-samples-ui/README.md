# Official bedrock-samples UI mirror (selected files)

These JSON files (the screens listed in `SELECTED_FILES` of `tools/sync-bedrock-samples-ui.mjs`:
HUD, chat, server form, inventory, container, trade and command block screens, `ui_common`,
the `common_dialogs`/`common_buttons` template files, the NPC dialogue screen, plus
`_ui_defs.json` and `_global_variables.json`) are verbatim copies of `resource_pack/ui/*.json` from the Mojang
`bedrock-samples` repository at the revision pinned in
`references/official/bedrock-samples-ui.lock.json` (currently `v1.26.50.4`,
commit `46ba6ea985fb`, upstream date 2026-09-16, `min_engine_version` 1.26.50).
They establish the current vanilla structure that docs and tools cite.

Rules:

- Do not hand-edit any file here. Regenerate with `node tools/sync-bedrock-samples-ui.mjs`
  (needs a local sparse mirror under `references/upstreams/bedrock-samples`; the
  PowerShell wrapper `scripts/sync-bedrock-samples-ui.ps1 -Ref <ref>` creates it).
- `node tools/sync-bedrock-samples-ui.mjs --check` and `node tools/doctor.mjs --quick`
  verify these files against the lock without network access.
- Older revisions are not deleted from history. The previous pin (`v1.26.10.4`) is
  recorded under `previous` in the lock and is retrievable with
  `git show b04e77d:references/official/bedrock-samples-ui/<file>` or from the
  upstream commit named there. Packs written against older revisions normally keep
  loading on newer clients; what changed between the pins is listed in
  `docs/83-vanilla-ui-1.26.50-diff.md`.
- Mojang's `LICENSE.md` for `bedrock-samples` applies to these files. They are
  reference material, not redistributable assets.
