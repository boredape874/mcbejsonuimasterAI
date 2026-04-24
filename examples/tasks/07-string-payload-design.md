# Task: Design String Payloads For JSON UI

## Goal

Design a title, actionbar, chat, or form-text payload that JSON UI can consume safely.

## Recommended skills

- `mcbe-json-ui-logic`
- `mcbe-json-ui-patterns`
- `mcbe-json-ui-hud-and-chat`

## Inspect first

- `docs/17-community-patterns-string-score-hud.md`
- `references/community-patterns/string-splitting-notes.md`
- the target `hud_screen.json`, `chat_screen.json`, or `server_form.json`

## Expected workflow

1. count how many fields the payload needs
2. decide separator-based split vs fixed-width slicing
3. reject separator splitting for large or numeric-heavy payloads
4. define server-side preprocessing rules
5. write the JSON UI binding extraction shape

## Expected result

- payload format
- PMMP or Script API formatting rule
- JSON UI binding strategy
- limitations and failure modes
