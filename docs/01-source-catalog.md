# 소스 카탈로그

이 저장소에 포함된 참고 소스의 성격과 용도를 정리한다.

## `references/source-packs/1seulbi`

핵심 성격:

- JSON UI 구조 학습용으로 매우 좋음
- `_ui_defs.json`가 체계적임
- HUD, chat, scoreboard, server_form이 함께 있음
- `pause_utils`, `utils`, `neroluna/form`처럼 재사용 단위가 분리되어 있음

주요 파일:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/chat_screen.json`
- `ui/scoreboards.json`
- `ui/server_form.json`
- `ui/neroluna/form/*.json`

## `references/source-packs/bunnyfarm`

핵심 성격:

- 여러 독립 리소스팩 샘플 묶음
- JSON UI뿐 아니라 attachable/entity/resource pack 전반을 포함
- JSON UI 관점에서는 특정 하위 팩만 골라 보는 게 맞음

포함한 주요 하위 샘플:

- `GfE8ULhgL4I`
  - server form, chest, ui_common, scoreboard
- `tDAp1yJMUYo`
  - animated progress bar, HUD, `_ui_defs`
- `Y5dOnRAM7js`
  - chest/custom pocket container, scroll UI
- `FwnQgFaZsHs`
  - HUD/chat 변형
- `gPiyv-DJxGw`
  - `_global_variables`, scoreboard, HUD
- `z65tCLQRo0Q`
  - HUD/chat pair

## `references/source-packs/custom-crops-reference`

핵심 성격:

- 애드온 리소스팩과 UI가 결합된 실전형 참고자료
- UI만 따로 떼서 볼 수 없고, 텍스처/블록/엔티티/attachable과 같이 봐야 함

주요 파일:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/server_form.json`
- `ui/chest_server_form.json`
- `ui/chest_inventory_system.json`
- `ui/animated_bar.json`
- `textures/ui/*`
- `blocks.json`
- `manifest.json`

## `references/vanilla`

핵심 성격:

- 바닐라 텍스처 경로 환각 방지
- `textures/ui/*`, `textures/items/*`, `textures/blocks/*` 검증용

주요 파일:

- `mcbe-ui-icon-reference.md`
