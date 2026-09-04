# Local final-RP inspector and research mirrors

The inspector is a localhost-only, read-only client for the same backend used by the MCP server. It resolves and renders the final resource pack rather than the IR preview.

```powershell
node tools/inspector-server.mjs
```

Open `http://127.0.0.1:4177`. Enter an RP root and either a qualified control or a server-form title token. For collection-driven forms, load the complete local form-fixture JSON before resolving or rendering; the inspector reads it locally and never copies it into the RP. Reference and Bedrock PNG/JPEG evidence can be imported into the ignored inspector workspace, then compared with independent opacity controls. Render artifacts are written only under ignored `workspace/inspector-output/`. The server binds to `127.0.0.1`; it is not a remote service and performs no uploads.

The current interface and MCP share the integrated v2 backend for resolved control trees, state switching, render overlays, layout reports, Minecraft-font measurement, screenshot calibration, and pinned upstream compatibility checks. Control-tree search and JSON-pointer selection expose declared rect, alpha bbox, baseline, hitbox, and property origin. The x/y/w/h nudge controls return a read-only RFC6902 `test + replace` proposal bound to the source hash and project revision; they never apply it. Missing local inputs are reported explicitly; the inspector never fabricates a fallback result.

Pixel-level work has a hard gate. Record an available installed-vanilla profile and its available font profile, run the offline compatibility fixtures, render all relevant states, and calibrate the target viewport/GUI scale/safe area against an actual Bedrock screenshot. Until those records exist, the inspector may diagnose but must not guess coordinates or claim text-fit or pixel accuracy. The UI edits no RP files; correction output remains an evidence-backed, project-revision-bound proposal.

## Pinned upstream research

`config/research-lock.json` records exact commits, license evidence, intended use, and copying policy. Synchronize them once:

```powershell
node tools/research-sync.mjs --refresh
node tools/research-sync.mjs --id jsonforge --refresh
node tools/research-sync.mjs --dry-run
```

Mirrors live in ignored `workspace/upstreams-local/`. Renderer and inspector operation does not require these mirrors or network access after installation. Sources without redistribution evidence are research and compatibility-fixture inputs only; their code must not be copied. External editors and `bedrock-core/ui` can exercise parser, anchor, import, nine-slice, and serialization behavior, but remain fixture evidence rather than runtime dependencies or visual authorities.

Validate the committed black-box fixtures offline:

```powershell
node tools/upstream-compat.mjs --strict --captures workspace/upstream-captures
```

Committed `baseline-verified` records and reviewed, hash-bound `local-capture-verified` observations support compatibility evidence. `pending-local` remains unresolved. A local observation is recorded below ignored `workspace/` with `tools/upstream-compat-capture.mjs`; it never authorizes copying upstream code or automatic promotion into the committed catalog.

The lock is intentionally advanced by review, never implicitly. Updating a commit requires rechecking repository license, recording the new revision, and running the affected compatibility fixtures.

The target RP and installed vanilla/font profile are stronger static evidence than editor output. Actual Bedrock state screenshots and a clean content log are the final authority.
