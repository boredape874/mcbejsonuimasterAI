# String Splitting And Slicing

Read:

- `../../../../../docs/17-community-patterns-string-score-hud.md`
- `../../../../../references/community-patterns/string-splitting-notes.md`
- `../../../../../references/external/bedrock-wiki-json-ui/json-ui-intro.md`

Use this subtopic for:

- separator-based split-string experiments
- fixed-width string slicing
- Unicode byte-width padding
- title/actionbar/form payload segmentation
- deciding whether data should be preprocessed by PMMP or Script API

AI decision rule:

- use separator-based splitting only for small controlled payloads
- use fixed-width slicing for known field layouts
- use server-side preprocessing for many fields or numeric-heavy values
