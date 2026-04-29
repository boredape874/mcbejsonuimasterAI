# AI Response Quality Rules

This repository exists to make Codex better at MCBE JSON UI. Responses should follow these rules.

## Required labels

When relevant, label claims as:

- confirmed from community reference docs
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
- reference file paths used for visual sizing or behavior
- target screen, feature family, data source, and closest reference for broad JSON UI tasks
- design family, layout skeleton, and state pattern for visual design tasks
- a short text-fit and spacing check when UI layout was edited

Avoid:

- generic UI advice
- invented vanilla paths
- unsupported binding names
- large rewrites when a small `modifications` patch works
- saying a skill or reference was used without naming the actual file opened
- publishing restricted reference pack names, comments, credits, or texture paths when a neutral pattern summary is enough

## PMMP and server context

When the UI depends on server text:

- define the exact title/actionbar/chat/form payload
- say where PMMP or Script API sends it
- state if JSON UI is parsing or only displaying it
- when the user asks for a visual design but does not specify a style, offer 2-3 concrete design references before implementing the final look

When the user wants to plan a new JSON UI but has not supplied a complete spec:

- use `docs/52-json-ui-intake-questionnaire.md`
- ask beginner-friendly intent questions first
- translate answers into target files, data protocol, layout constraints, and validation steps
- for layout-heavy work, treat IR/tools output as the geometry source of truth and hand-finish Bedrock-specific logic afterward
- explicitly ask whether size, color, visibility, progress fill, animation, or list count changes with values
- when dynamic size exists, define fixed safe bounds first and then describe the inner dynamic JSON UI behavior
- ask whether buttons, scrollbars, panels, progress bars, and icon buttons should use vanilla textures, target RP textures, custom textures, or simple panels
- for buttons, capture whether default/hover/pressed/locked/selected states are needed
- for broad tasks, use `docs/57-hierarchical-task-router.md` and record major topic, mid topic, subtopic, closest reference, and patch target before editing
- for visual tasks, use `docs/58-design-reference-atlas.md` and `docs/59-diagrammatic-workflows.md`; do not edit before choosing a design family and layout skeleton

## Risk flags

Always mention these when applicable:

- separator-based string splitting is fragile
- collection-heavy score HUDs can be costly
- interactable HUD menus need input-mode testing
- GPL or unlicensed tooling should not be copied blindly
- restricted local references under `references/restricted/` are pattern evidence only unless license and distribution scope are explicitly cleared
