# Diagrammatic Workflows

Use this when AI behavior must be systematic. These diagrams are the mandatory process shapes for broad Bedrock JSON UI work.

## New UI Creation

```mermaid
flowchart TD
  A[User asks for UI] --> B{Enough spec?}
  B -- no --> C[Use docs/52 intake questions]
  B -- yes --> D[Classify target surface]
  C --> D
  D --> E[Choose design family from docs/58]
  E --> F[Choose major/mid/subtopic from docs/57]
  F --> G[Open one closest reference]
  G --> H{Layout-heavy?}
  H -- yes --> I[Build IR and use tools]
  H -- no --> J[Patch JSON UI directly]
  I --> K[Hand-finish bindings/factories/animations]
  J --> K
  K --> L[Validate JSON and _ui_defs]
  L --> M[Report references and visual checks]
```

## Server Form Design

```mermaid
flowchart TD
  A[Server form request] --> B{Feature type}
  B -->|quest/NPC/story| C[dialogue or framed NPC]
  B -->|shop/items/kits| D[item grid/shop]
  B -->|stats/skills| E[compact RPG panel]
  B -->|large modern menu| F[modern cloud panel]
  C --> G[docs/39 + docs/40]
  D --> G
  E --> G
  F --> G
  G --> H{Routing needed?}
  H -- yes --> I[server_form router + hidden title token]
  H -- no --> J[vanilla-safe long/custom form skin]
  I --> K[Preserve vanilla fallback]
  J --> K
  K --> L[Patch RP/ui/server_form.json and _ui_defs if needed]
```

## HUD Work

```mermaid
flowchart TD
  A[HUD request] --> B{What changes?}
  B -->|bars/status| C[RPG/status bar route]
  B -->|hotbar| D[hotbar relayout route]
  B -->|chat/actionbar/title| E[HUD/chat bridge route]
  B -->|interactive/minimap| F[advanced overlay route]
  C --> G[Open vanilla hud + closest pattern]
  D --> G
  E --> G
  F --> G
  G --> H[Check hotbar hearts hunger XP chat crosshair]
  H --> I{Needs BP/PMMP data?}
  I -- yes --> J[Define payload protocol]
  I -- no --> K[Static RP layout]
  J --> L[Patch UI + sender code]
  K --> L
```

## Special Device Form

```mermaid
flowchart TD
  A[Device/phone/special form request] --> B[Open docs/62]
  B --> C[Choose shell size and design family]
  C --> D[Open docs/61 file route]
  D --> E[Open one restricted device page]
  E --> F[Map visual regions]
  F --> G[Define neutral hidden markers]
  G --> H[Patch server_form router]
  H --> I[Patch device page controls]
  I --> J[Replace restricted textures/names]
  J --> K[Test form_buttons click indexes]
```

Use this for phone/PDA/profile/guidebook forms. It is a server-form route with a device shell, not a normal long-form skin.

## Design Fit Loop

```mermaid
flowchart LR
  A[Reference] --> B[Extract skeleton]
  B --> C[Set dimensions]
  C --> D[Set labels]
  D --> E[Set gaps]
  E --> F[Bind data]
  F --> G[Check overflow]
  G --> H{Looks/behaves wrong?}
  H -- yes --> C
  H -- no --> I[Finalize]
```

Checklist:

- label has explicit `size`
- text scale fits height
- repeated controls use one item size and one gap
- scroll panels have explicit viewport, content, and scrollbar size
- state controls do not shift layout
- texture paths are verified or target-owned

## Debug Flow

```mermaid
flowchart TD
  A[UI bug] --> B{Visible?}
  B -- no --> C[Check _ui_defs, namespace, syntax, insertion]
  B -- partial --> D[Check parent size/layer/visible/bindings]
  B -- wrong data --> E[Check binding source and payload]
  B -- ugly layout --> F[Use docs/54 + docs/58]
  C --> G[Validate JSON]
  D --> G
  E --> G
  F --> G
  G --> H[Test in smallest target screen]
```

## restricted Reference Handling

```mermaid
flowchart TD
  A[Need local restricted reference] --> B[Select neutral ID from docs/56 or docs/60]
  B --> C[Open one raw restricted JSON]
  C --> D[Extract control pattern]
  D --> E[Rename namespace/control/variables]
  E --> F[Replace restricted texture paths]
  F --> G[Document neutral pattern only]
```

Never expose original archive names, server names, source comments, credits, or restricted texture paths in public docs.
