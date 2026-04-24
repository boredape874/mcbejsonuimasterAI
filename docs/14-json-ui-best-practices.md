# JSON UI Best Practices

This document collects practical rules the AI should follow when building or modifying Bedrock JSON UI.

Primary-source basis:

- Bedrock Wiki `best-practices`
- Bedrock Wiki `add-hud-elements`
- Bedrock Wiki `json-ui-intro`
- local working packs and local utility mirrors in this repository

## Compatibility and breakage control

### Modify only what is necessary

Prefer the smallest possible modification surface.

Good:

- add one control to `root_panel`
- add one reusable utility file and one small screen patch

Bad:

- copying a large chunk of vanilla UI into the pack just to move one label

## Prefer modification strategies over deep replacement

Bedrock Wiki best-practices emphasizes modification-based insertion.

Practical rule:

- prefer `modifications` on existing parents
- avoid replacing large nested vanilla trees unless there is no practical alternative

## Prefer a single entry point when possible

For HUD work, try to merge custom additions through one parent entry point instead of scattering multiple unrelated insertion points.

Reason:

- fewer break points on version updates
- easier debugging
- easier pack merging

## Avoid working directly in vanilla namespaces unless necessary

Prefer adding your own named controls and referencing them through insertions.

Reason:

- lower conflict risk
- clearer ownership
- easier updates

## Performance rules

Bedrock Wiki best-practices also emphasizes that JSON UI is expensive.

### Minimize operators

Do not build long expression chains when a simpler expression or a server-side encoded string can do the job.

Prefer:

- simpler prefix parsing
- preformatted text from PMMP or BP code

Over:

- excessive nested math and string operators inside the UI

## Minimize bindings

Only keep bindings that contribute to the actual behavior.

If a value can be:

- encoded once in title text
- routed once by prefix
- shared through one utility control

that is often better than repeating many similar bindings.

## Avoid unnecessary controls

Do not add empty wrapper panels unless they solve a real layout or insertion problem.

Every extra control adds cost and complexity.

## Reuse utility patterns

If a pattern already exists in:

- `references/local-utils/json-ui-utils/`
- `references/source-packs/`
- `references/external/json-ui-examples/`

prefer adapting it over inventing a fresh version.

## Use server-side formatting intentionally

For PMMP and BP-driven UI systems, it is often better to make the server send cleaner, more structured text tokens.

Examples:

- `!topbar:<icon>;<message>`
- `customTitle_AniHPBar_<value>`
- `dialog:<bg>\t<avatar>\t<line1>\t<line2>\t<line3>`

This usually reduces UI complexity and makes debugging easier.

## Keep screen responsibilities clear

Use the right file for the right job:

- `hud_screen.json` for gameplay overlays
- `chat_screen.json` for chat-linked behavior
- `server_form.json` for server forms
- `ui_common.json` or utility files for reusable shared controls

Do not cram unrelated systems into one screen file if a shared utility file is the cleaner fit.

## Prefer verified vanilla assets

If a design can use a vanilla texture or screen pattern, verify it first through the Ztech vanilla pack.

If it cannot be verified:

- say so
- prefer shipping a custom texture

## Explain source quality

When answering, label whether the recommendation is:

- confirmed from Bedrock Wiki
- confirmed from Ztech vanilla pack
- inferred from a working sample
- an implementation recommendation

## Good AI behavior summary

When writing JSON UI changes, the AI should:

1. start from the smallest viable patch
2. reuse working patterns
3. keep namespaces and insertion points explicit
4. avoid fake vanilla paths
5. avoid fake fixed-resolution advice
6. keep runtime cost in mind
