# Logic Map

## Primary source files

- `../../references/sample-packs/form-router-sample/ui/hud_screen.json`
- `../../references/sample-packs/form-router-sample/ui/chat_screen.json`
- `../../references/sample-packs/form-router-sample/ui/server_form.json`
- `../../references/sample-packs/game-hud-sample/ui/hud_screen.json`
- `../../references/sample-packs/game-hud-sample/ui/server_form.json`
- `../../references/sample-packs/ui-variant-samples/tDAp1yJMUYo/ui/animated_bar.json`
- `../../references/mirrors/builder-sample/ui/custom_ui/binding_example.json`
- `../../references/mirrors/builder-sample/ui/custom_ui/variable_example.json`
- `../../docs/34-binding-patterns-value-index.md`
- `../../references/reference-mirrors/minecraft-bedrock-json-ui-sample/binding/binding_dump.txt`
- `../../references/reference-mirrors/minecraft-bedrock-json-ui-sample/dynamic form library/dynamic-form-library-1.0.3.3/dynamic-form-library-1.0.3.3/dynamic form library2/package_custom/common_custom.jsonc`
- optional local binding dump snapshots can confirm names such as `#text_box_item_name`, `#hover_text`, `#text`, `#text_tts`, `#texture`, and `#texture_file_system`; use them as lookup aids, not as runtime proof

## What these prove

- title text can be reused as a data channel
- actionbar text can trigger alternative UI
- server form titles can act as routing keys
- fixed-width substring extraction is a common Bedrock UI pattern
- `%.s` string formatting can trim and pad payload fields without scripts; see `mcbe-json-ui-master/references/topics/logic/text-formatting-and-slicing.md`
- first-line extraction and hover-text trimming are marker protocols and must be tested with UTF-8 section-sign markers
- progress bars often depend on preserved text panels
- binding dumps and dynamic form library examples are useful for discovering names and reusable search/slice expressions
