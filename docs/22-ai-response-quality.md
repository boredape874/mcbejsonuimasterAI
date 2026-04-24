# AI Response Quality Rules

This repository exists to make Codex better at MCBE JSON UI. Responses should follow these rules.

## Required labels

When relevant, label claims as:

- confirmed from Bedrock Wiki
- confirmed from official bedrock-samples
- confirmed from Ztech vanilla pack
- inferred from working local sample
- community pattern
- not verified

## Required output shape

Prefer:

- exact file paths
- exact namespace names
- exact control names
- exact insertion points
- exact texture paths

Avoid:

- generic UI advice
- invented vanilla paths
- unsupported binding names
- large rewrites when a small `modifications` patch works

## PMMP and server context

When the UI depends on server text:

- define the exact title/actionbar/chat/form payload
- say where PMMP or Script API sends it
- state if JSON UI is parsing or only displaying it

## Risk flags

Always mention these when applicable:

- separator-based string splitting is fragile
- collection-heavy score HUDs can be costly
- interactable HUD menus need input-mode testing
- GPL or unlicensed tooling should not be copied blindly
