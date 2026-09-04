# Logic Map

## Primary source files

- `references/source-packs/modern-cloud-ui-reference/ui/hud_screen.json`
- `references/source-packs/modern-cloud-ui-reference/ui/chat_screen.json`
- `references/source-packs/modern-cloud-ui-reference/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/hud_screen.json`
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json`
- `references/source-packs/farm-ui-variants/tDAp1yJMUYo/ui/animated_bar.json`
- `references/external/EasyUIBuilder/ui/custom_ui/binding_example.json`
- `references/external/EasyUIBuilder/ui/custom_ui/variable_example.json`
- `docs/34-binding-patterns-value-index.md`
- `references/upstreams/minecraft-bedrock-json-ui-sample/binding/binding_dump.txt`
- `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/StarLibV2-1.0.3.3/StarLibV2-1.0.3.3/starlib2/package_custom/common_custom.jsonc`
- optional local binding dump snapshots can confirm names such as `#text_box_item_name`, `#hover_text`, `#text`, `#text_tts`, `#texture`, and `#texture_file_system`; use them as lookup aids, not as runtime proof

## What these prove

- title text can be reused as a data channel
- actionbar text can trigger alternative UI
- server form titles can act as routing keys
- fixed-width substring extraction is a common Bedrock UI pattern
- `%.s` string formatting can trim and pad payload fields without scripts; see `mcbe-json-ui-master/references/topics/logic/text-formatting-and-slicing.md`
- first-line extraction and hover-text trimming are marker protocols and must be tested with UTF-8 section-sign markers
- Java Locate Command parsing shows how `chat_screen.json` can parse `The nearest ... is at block ...` locate messages into coordinates and a `/tp @s` edit-box command; see `references/topics/logic/java-locate-command-bindings.md`
- progress bars often depend on preserved text panels
- binding dumps and dynamic form library examples are useful for discovering names and reusable search/slice expressions
