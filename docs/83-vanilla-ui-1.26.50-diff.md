# 바닐라 JSON UI 변경 추적: 고정 샘플 1.26.10.4 → 1.26.50.4 (preview 1.26.60.29 선행 신호 포함)

검토일: 2026-10-02. **모든 변경 사실은 Mojang `bedrock-samples`의 고정 리비전 파일을 직접 비교해 확인했다(confirmed from official bedrock-samples). 실제 Bedrock 클라이언트에서 화면·입력·TTS 동작을 실행 검증하지는 않았다(not verified).**

이 문서는 `references/official/bedrock-samples-ui/`에 커밋된 12개 선택 파일이 어느 업스트림 리비전인지, 이전 고정본과 무엇이 달라졌는지, 그리고 이 저장소의 스펙·검증기·문서가 그 변화에 맞춰 어떻게 바뀌었는지를 기록한다. 다음 동기화 때는 이 문서를 같은 형식으로 갱신한다.

## 1. 고정 리비전

| 구분 | 태그 | 커밋 | 업스트림 날짜 | 비고 |
| --- | --- | --- | --- | --- |
| 이전 고정본 | `v1.26.10.4` | `f5b651000f52b66334c968f3ccf1aca7950cd6ee` | 2026-03-24 | 2026-04-25 커밋. 12개 파일 해시가 `v1.26.10.4`와 일치했고 `v1.26.20.26`과도 동일했다 |
| 현재 고정본 | `v1.26.50.4` | `46ba6ea985fb5a92d79a9419198f10dda14c199d` | 2026-09-16 | `main` HEAD. `resource_pack/manifest.json#/header/min_engine_version` = `[1, 26, 50]` |
| preview 비교본 | `v1.26.60.29-preview` | `602eee34b6f4540ea8569a92736920aa8e897a2e` | 2026-09-30 | `preview` HEAD. 커밋하지 않음. 7절의 선행 신호 근거 |

고정 정보의 기계 판독 원본은 `references/official/bedrock-samples-ui.lock.json`이다(파일별 SHA-256, `version.json`의 `latest`, `min_engine_version`, 이전 리비전). `node tools/sync-bedrock-samples-ui.mjs --check`가 커밋된 파일과 lock의 일치를 오프라인으로 검사하고, `tests/official-samples-lock.mjs`가 같은 검사를 테스트 스위트에서 수행한다.

`config/design-research-lock.json`과 `docs/73-bedrock-source-review.md`는 이미 같은 커밋 `46ba6ea`를 참조하고 있었지만, 커밋된 샘플 파일 자체는 1.26.10.4에 머물러 있었다. 이번 작업으로 두 기준이 일치한다.

## 2. 선택 파일 변경 규모

| 파일 | 이전 줄 수 | 현재 줄 수 | 변경 줄(±) | 핵심 변경 |
| --- | ---: | ---: | ---: | --- |
| `_ui_defs.json` | 215 | 209 | 14 | 화면 4개 추가, 10개 제거 (3절) |
| `_global_variables.json` | 443 | 459 | 42 | `$9_color_format`, 트림 재질 색 11개 변경, `$party_blue_color`, `$external_link_*` 8개 추가 |
| `hud_screen.json` | 4103 | 4108 | 75 | 자막 컨테이너 factory화, 게임패드 helper 이름 변경, `cursor_renderer` 제거 |
| `chat_screen.json` | 986 | 986 | 6 | 채팅 라벨 폭 `100% - 3px`, `menu_ok` 매핑 `handle_deselect: false` |
| `server_form.json` | 531 | 633 | 186 | `custom_form` factory에 `multiselect` 추가, 들여쓰기 정규화 |
| `inventory_screen.json` | 2742 | 2699 | 209 | 탭 애니메이션 제거, 탭 가시성 바인딩, TTS 헤더, 공용 검색창 템플릿 |
| `inventory_screen_pocket.json` | 1515 | 1505 | 200 | 동일 탭 변경, 오른쪽 탭 묶음 `bottom_right_tabs` |
| `ui_common.json` | 7581 | 7633 | 134 | `tts_skip_enumeration`, `common.text_edit_control`, `gamepad_helper_face_*`, 레이아웃 토글 정리 |
| `chest_screen.json` | 277 | 277 | 0 | 변경 없음 |
| `furnace_screen.json` | 252 | 2006 | 1820 | 레시피 북(탭·검색·그리드·토글)이 화로 화면에 내장 |
| `trade_2_screen.json` | 1755 | 1756 | 3 | 인챈트 상세 버튼 텍스트가 룬 폰트용 리터럴 `dab` |
| `command_block_screen.json` | 1128 | 1128 | 0 | 변경 없음 |

줄 수는 `diff` 기준이며 들여쓰기 정규화도 포함한다. 동작 변화의 근거는 4절의 항목별 설명이다.

## 3. `_ui_defs.json` 화면 등록 변화

stable 1.26.50.4에서 추가:

- `ui/beta_feedback_qr.json`
- `ui/data_driven_container_screen.json` — DDUI 계열 컨테이너 화면. 기존 `server_form.json` 경로와 별개이며 Script API `CustomForm`/`MessageBox`와의 연결은 이 저장소에서 확인하지 않았다(not verified)
- `ui/hud_crosshair_overlay.json` — 조준선 오버레이가 별도 파일로 등록됨
- `ui/skin_pack_pdp.json`

stable 1.26.50.4에서 제거:

- `ui/gathering_info_screen.json`, `ui/manage_feed_screen.json`
- `ui/realmsPlus_screen.json`과 `ui/realmsPlus_sections/` 아래 `content_section`, `faq_section`, `landing_section`, `realmsPlus_buy_now_screen`, `realmsPlus_view_packs_screen` (`realmsPlus_purchase_warning_screen.json`은 유지)
- `ui/skin_pack_purchase_screen.json`, `ui/skin_picker_screen.json`

preview 1.26.60.29에서 추가로 제거: `ui/csb_sections/csb_view_packs_screen.json`, `ui/realms_slots_screen.json`, `ui/realms_plus_ended_screen.json`.

팩이 위 제거 파일을 덮어쓰고 있었다면 더 이상 로드되지 않는다. 등록 목록 전체는 `data/vanilla-screen-profiles.json`의 `bedrock-1.26.50.overrideFiles`에 그대로 복사돼 있어 `validate-pack`이 바닐라 덮어쓰기와 미등록 파일을 구분하는 데 쓴다.

## 4. 파일별 세부 변경

### `server_form.json`

- `/generated_contents/factory/control_ids`에 `"multiselect": "@server_form.custom_multiselect"`가 추가됐다. 기존 `label`, `toggle`, `slider`, `dropdown`, `input`, `header`, `divider`는 그대로다.
- 새 컨트롤 `custom_multiselect`: 세로 `stack_panel`. 헤더는 `settings_common.options_dropdown_toggle_control`을 `custom_form` 컬렉션의 `#custom_multiselect`로 토글하고, `options_panel`은 같은 바인딩으로 `#visible`을 받는다. 내부 `checkbox_group@settings_common.option_radio_group_control`은 `$radio_factory.control_name = server_form.custom_multiselect_checkbox`, `$radio_collection_name = custom_multiselect`, `#custom_multiselect_length -> #collection_length`를 사용한다.
- 새 컨트롤 `custom_multiselect_checkbox`: `settings_common.checkbox_with_highlight_and_label`, `$toggle_state_binding_name = #custom_multiselect_toggled`, 라벨 `#custom_multiselect_text`, 컬렉션 `custom_multiselect`, `$radio_toggle_group: false`, 높이 16px.
- 송신 측: 같은 리비전의 `metadata/script_modules/@minecraft/server-ui-bindings_2.2.0.json`과 `2.3.0-beta.json`, preview의 `2.3.0.json`과 `2.4.0-beta.json` 어디에도 `multiselect` 메서드가 없다. `ModalFormData`는 `divider, dropdown, header, label, slider, submitButton, textField, title, toggle`만 노출한다. 따라서 RP 컨트롤은 존재하지만 공개 Script API 송신자는 고정 샘플에서 확인되지 않았다(not verified). 사용자 폼 라우터는 이 컨트롤 id를 가리지 않도록 factory `control_ids`를 전부 보존하는 것이 안전하다.
- 그 외 변경은 배열 공백과 들여쓰기 정규화뿐이다. `long_form`, `custom_form`, `dynamic_button`, `button.form_button_click`, `button.submit_custom_form` 계약은 유지된다.

### `hud_screen.json`

- 자막: `subtitle_stack`(세로 stack, `bottom_right`, 50px 패딩)이 사라지고 `subtitle_container_host` 패널이 `subtitle_container_factory`(`max_children_size: 1`, `control_ids.subtitle_container = subtitle_container@hud.subtitle_container_content`)로 자막 컨테이너를 생성한다. 새 `subtitle_container_content`는 `30% x 100%`, `$subtitle_anchor|default = top_right`, `$subtitle_offset|default = [0, 50]`이고, `subtitle_panel`의 앵커도 `$subtitle_panel_anchor|default = top_right`로 변수화됐다. 자막 라벨에 `enable_profanity_filter: false`가 붙었다. 기본 위치가 오른쪽 아래에서 오른쪽 위로 바뀐 것으로 읽히지만 실제 화면은 확인하지 않았다(inferred, not verified).
- 채팅 라벨(`chat_text@chat_label`)에 `size: ["100% - 5px", "default"]`가 추가됐다.
- 아이템 이름 텍스트: `$localize|default: true`와 라벨의 `localize: "$localize"`가 추가됐다.
- 이모트 팁의 게임패드 helper가 `common.gamepad_helper_y/b/a/x`에서 `common.gamepad_helper_face_up/face_right/face_down/face_left`로 바뀌었다(ui_common 항목 참고).
- 루트 컨트롤 목록에서 `curor_rend@cursor_renderer`(`#show_cursor -> #visible`)가 제거됐다. `cursor_renderer`를 HUD 수정 기준점으로 쓰던 패치는 대상이 사라진다.

### `inventory_screen.json`

- `tab_offset_anim`, `tab_wait_anim`, `top_tab`의 `$anims`/`$offset`, 각 탭의 `variables[requires: $animate]` 블록이 제거됐다. `$animate|default: false`만 남는다. 상단 탭 등장 애니메이션 레시피는 이제 이 파일이 아니라 `furnace_screen.json`에서 찾아야 한다.
- 탭 TTS: `$top_tab_tts_name`이 `$toggle_tts_header`로 바뀌었고, 검색 탭은 `$toggle_tts_header_binding_type: global` + `#search_tab_tts`를 쓴다.
- 탭 패널: `construction_tab_factory` 같은 factory 래퍼가 직접 참조(`construction_tab@crafting.construction_tab`)로 바뀌고, 각 패널에 전역 가시성 바인딩 `#construction_tab_visible`, `#equipment_tab_visible`, `#items_tab_visible`, `#nature_tab_visible`이 붙었다.
- 레시피 검색창: 인라인 `text_edit_control@common.text_edit_box` 설정이 새 공용 템플릿 `common.text_edit_control`(ui_common)로 이동했다. 검색 스택의 `layer`는 11에서 1로 낮아졌다.
- 레이아웃 토글: `common.creative_layout_toggle`이 ui_common에서 사라지고 `crafting.creative_layout_toggle`로 이동했다. `crafting.recipe_book_layout_toggle`과 `crafting.survival_layout_toggle` 래퍼가 `#recipe_book_layout_toggle_tts`, `#survival_layout_toggle_tts` 헤더 바인딩을 갖는다.
- 필터 토글에 `$toggle_tts_header: accessibility.tts.toggle.filter`, `$tts_skip_enumeration: true`; 툴바 스택에 `ttsIgnoreChildrenEnumeration: true`; 도움말 버튼에 `$button_tts_header: accessibility.tts.button.howtoplay`.
- 입력: `button.menu_inventory_cancel`이 `button.menu_exit` 대신 `button.menu_inventory_exit`로 연결된다(포켓 화면도 동일). 인벤토리 닫기 매핑을 복제한 팩은 이 id를 맞춰야 한다.

### `inventory_screen_pocket.json`

- 데스크톱과 같은 탭 애니메이션 제거·가시성 바인딩·TTS 헤더 변경. 인벤토리 탭 셀 템플릿에 `tts_override_control_value: " "`가 추가됐다(빈 값으로 "Chest" 낭독을 막는 주석 포함).
- 오른쪽 탭이 `bottom_right_tabs` 세로 스택(`87px`, `ttsSectionContainer: true`)으로 묶였고, 크리에이티브가 아닐 때 자리를 채우는 `full_screen_spacer`가 `(not #is_creative_mode)`로 표시된다.
- 탭 TTS 헤더: `craftingScreen.tts.tab.fullscreen`, `#pocket_crafting_tab_tts`(global), `craftingScreen.tab.armor`, `craftingScreen.tts.tab.inventory`.

### `ui_common.json`

- TTS: `toggle`, `text_edit_box`, `close_button`에 `$tts_skip_enumeration|default: false`와 `tts_skip_enumeration` 속성이 추가됐다. `light_close_button`은 `$close_button_visible_binding_type: global`, `$button_tts_name`, `$button_tts_header`, `$tts_skip_enumeration: true`를 기본으로 갖는다. 컨테이너 아이템 셀(`focus_magnet_enabled` 블록)에 `$tts_name`, `$tts_control_header`, `$tts_header_binding_type`과 대응 바인딩이 추가됐다.
- 텍스트 입력: `text_edit_box_label`에 `$text_edit_box_label_hide_hyphen` → `hide_hyphen`; placeholder 라벨에 `$place_holder_tts` → `tts_override_control_value`; `$text_edit_box_label_anims`, `$text_edit_box_label_animation_reset_name`가 라벨의 `anims`/`animation_reset_name`에 연결된다.
- 새 템플릿 `common.text_edit_control`(검색창: `#text_box_item_name`, `button.search_bar_*` 이벤트, 지우기 버튼 15x15, 돋보기 8x8, `$focus_id: recipe_search_bar`, `$text_edit_type_name: accessibility.tts.searchbar`).
- 새 게임패드 helper `gamepad_helper_face_down/face_right/face_left/face_up`는 `#controller_fixed_face_*_icon` 텍스처 바인딩을 쓴다. 기존 `gamepad_helper_a/b/x/y`와 `_14` 변형은 유지된다.
- `non_interact_focus_border`의 색이 `$border_color|default: $non_interact_border_color`로 변수화됐다.
- `layout_toggle`에 `$toggle_tts_name: accessibility.toggle.view.tts.title`; `recipe_book_layout_toggle`/`survival_layout_toggle`의 `$toggle_tts_header` 기본값이 제거됐고(화면별 래퍼가 공급), `creative_layout_toggle`, `furnace_recipe_book_layout_toggle`, `furnace_survival_layout_toggle`은 ui_common에서 삭제됐다.

### `furnace_screen.json`

- 기존 14개 최상위 선언(`flame_panel`, `furnace_arrow_*`, `furnace_*_panel`, `furnace_screen@common.inventory_screen_common`)은 그대로이고 48개 선언이 추가됐다: 게임패드 helper 4종과 트리거 2종, `food/blocks/items/search_tab@furnace.top_tab`, `tab_offset_anim`/`tab_wait_anim`, `filter_toggle@common_toggles.switch_toggle`, `cell_image_*`, `inventory_container_slot_button@common.container_slot_button_prototype`, `scroll_grid`, `recipe_book_panel`, `right_panel`, `recipe_book_layout_toggle@common.recipe_book_layout_toggle`, `survival_layout_toggle@common.survival_layout_toggle`, `toolbar_panel@common.crafting_root_input_panel`, `screen_stack_panel`.
- 화로를 "진행 표시 참고용 단순 화면"으로 설명하던 기존 문서 문구는 더 이상 정확하지 않다. 화로형 커스텀 화면이나 `furnace_server_form` 계열을 만들 때는 레시피 북 패널의 크기·포커스 경로를 함께 봐야 한다.

### `_global_variables.json`

- `$9_color_format`(§9 Blue): `[0.333, 0.333, 1.0]` → `[0.267, 0.499, 1.0]`. 채팅·라벨에서 §9 색을 흉내 내던 팩의 색 상수가 바닐라와 어긋난다.
- `$material_quartz_color` ~ `$material_resin_color` 11개 트림 재질 색이 모두 바뀌었다(예: diamond `[0.173, 0.729, 0.659]` → `[0.373, 0.926, 1.0]`).
- 추가: `$party_blue_color = [0.549, 0.702, 1.0]`, `$external_link_color`, `$external_link_visited_color`, `$external_link_hovered_color`, `$external_link_pressed_color`, `$external_link_lighthovered_*` 4종(주석에 hex와 대비 검사 안내 포함).

### `chat_screen.json`, `trade_2_screen.json`

- 채팅 메시지 라벨 `size`가 `["100%", "default"]`에서 `["100% - 3px", "default"]`로 바뀌었다. `button.menu_ok`의 `pressed`/`global` 매핑 두 개가 `handle_deselect: false`가 됐다.
- 거래 화면 `enchantment_details_button`의 `$button_text`가 `trade.mysteriousText`에서 리터럴 `dab`로 바뀌었고 "룬 폰트로 변환되므로 로컬라이즈하지 않는다"는 주석이 붙었다.

## 5. 새 이름·변경된 이름 (바인딩, 버튼 id, 변수)

| 분류 | 이름 | 파일 | 상태 |
| --- | --- | --- | --- |
| 전역 바인딩 | `#construction_tab_visible`, `#equipment_tab_visible`, `#items_tab_visible`, `#nature_tab_visible` | `inventory_screen.json`, `inventory_screen_pocket.json` | stable 1.26.50 |
| 전역 바인딩(TTS) | `#search_tab_tts`, `#recipe_book_layout_toggle_tts`, `#survival_layout_toggle_tts`, `#pocket_crafting_tab_tts` | 위와 같음 | stable 1.26.50 |
| 컬렉션 바인딩 | `#custom_multiselect`, `#custom_multiselect_length`(custom_form), `#custom_multiselect_toggled`, `#custom_multiselect_text`(custom_multiselect) | `server_form.json` | stable 1.26.50, 송신자 미확인 |
| 컬렉션 바인딩 | `#multiselect_option_text` | `server_form.json` | preview 1.26.60 |
| 텍스처 바인딩 | `#controller_fixed_face_up/right/down/left_icon` | `ui_common.json` | stable 1.26.50 |
| 전역 바인딩 | `#editor_chat_layout_active`, `#editor_chat_visible`, `#editor_chat_offset` | `hud_screen.json` | preview 1.26.60 |
| 버튼 id | `button.menu_inventory_exit`(이전 `button.menu_exit`) | 인벤토리 두 화면 | stable 1.26.50 |
| 템플릿 | `common.text_edit_control`, `common.gamepad_helper_face_*`, `hud.subtitle_container_content`, `crafting.creative_layout_toggle`, `server_form.custom_multiselect(_checkbox)` | 각 파일 | stable 1.26.50 |
| 제거 | `common.creative_layout_toggle`, `common.furnace_recipe_book_layout_toggle`, `common.furnace_survival_layout_toggle`, `crafting.tab_offset_anim`, `crafting.tab_wait_anim`, HUD의 `curor_rend@cursor_renderer`, `hud.subtitle_stack` | 각 파일 | stable 1.26.50 |
| 전역 변수 | `$party_blue_color`, `$external_link_*` 8종 | `_global_variables.json` | stable 1.26.50 |
| 렌더러 | `hotbar_slots_renderer` | `hud_screen.json` | preview 1.26.60만 |

`docs/19-bindings-and-hardcoded-values.md`와 `docs/34-binding-patterns-value-index.md`에 같은 표의 요약을 넣었다.

## 6. 이 저장소의 스펙·검증기 보강

고정 샘플 전체(207개 `resource_pack/ui/*.json`)를 `tools/validate.mjs`의 규칙으로 검사했을 때 1,331건의 오류가 났다. 원인은 두 가지였다.

1. `data/jsonui-spec.json`이 바닐라가 실제로 쓰는 속성과 값을 빠뜨리고 있었다. 추가한 항목: 컨트롤 타입 `tooltip_trigger`; `font_size` `medium`; `grid_rescaling_type`/`grid_fill_direction`의 `vertical`; TTS 속성(`tts_skip_enumeration`, `tts_skip_children`, `tts_ignore_count`, `tts_value_order_priority`, `tts_value_changed`, `tts_play_on_unchanged_focus_control`, `tts_ignore_subsections`, `ttsSectionContainer`, `ttsIgnoreChildrenEnumeration`, `text_tts`, `use_priority`, `priority`); 포커스 속성(`focus_navigation_mode_*`, `focus_container_custom_*`, `focus_mapping`); 입력(`gesture_tracking_button`, `analog_button_name`, `gamepad_deflection_mode`); 화면(`send_telemetry`, `load_screen_immediately`, `gamepad_cursor_deflection_mode`, `should_be_skipped_during_automation`, `vr_mode`); 컨트롤(`property_bag_for_children`, `ignoreCollectionItem`, `debug`, `replaced_while_inactive`, `default_size_scales_to_ratio`, `color_corrected`); 렌더러 색상·회전(`rotation_x/y`, `always_rotate`, `rotate_speed`, `primary_color`, `secondary_color`, `text_color`, `background_color`, `full_storage_color`, `hover_*`, `pressed_*`, `use_custom_pocket_toast`); 툴팁 그룹(`tooltip_name`, `tooltip_top/bottom_content_control`, `tooltip_area`, `tooltip_tts_value`, `hover_text_max_width`, `indent_control`); 사이클러 그룹(`images`, `text_labels`, `target_cycler_to_compare`, `grid_item_when_(not_)current`, `cycler_manager_size_control_target`, `next/prev_sub_page_button_name`); `factory_variables`; `place_holder_text_hover_color`; 애니메이션 `wait_until_rendered_to_play`; 바인딩 항목 키 `binding_collection_prefix`, `ignored`. 각 항목의 근거 파일은 스펙의 `_confirmed_extensions.vanilla_1_26_50.evidence`에 있다.
2. `tools/_lib/ui-validator.mjs`가 최상위 `$변수` 배열(`_global_variables.json`의 색 배열)을 컨트롤로 취급해 `Unknown property "0"` 오류를 냈다. 최상위 `$` 키와 배열 값은 건너뛰도록 고쳤다.
3. `tools/_lib/pack-validator.mjs`가 네임스페이스가 없는 바닐라 `_global_variables.json`을 오류로 보고했다. `_ui_defs.json`처럼 네임스페이스 검사에서 제외했다(속성 검사는 유지).

보강 후 207개 파일과 커밋된 12개 파일 모두 스펙 오류 0건이다. `tests/jsonui-spec-vanilla-coverage.mjs`가 이 상태를 고정하므로, 다음 동기화에서 새 어휘가 들어오면 테스트가 먼저 실패한다. `hotbar_slots_renderer`는 preview 전용으로 `_confirmed_extensions.preview_1_26_60`에 분리해 두었다.

`validate-pack`의 기본 바닐라 프로필은 `bedrock-1.21.100`(덮어쓰기 파일 6개)에서 `bedrock-1.26.50`(고정 `_ui_defs.json`의 204개 전부)으로 바뀌었고 기본 다이얼렉트는 `bedrock-json@1.26.50`이다. 이전 게이트가 필요하면 `--vanilla-profile=bedrock-1.21.100 --dialect bedrock-json@1.21.100`을 넘긴다. 두 다이얼렉트의 파서 규칙(BOM, 주석, 후행 쉼표 허용)은 같다.

## 7. preview 1.26.60.29 선행 신호 (커밋하지 않음)

- HUD 핫바: 새 커스텀 렌더러 `hotbar_slots_renderer`(`size: [0, 22]`, `#hotbar_visible -> #visible`)가 슬롯을 절대 좌표로 직접 그리고, `hotbar_grid_frame`(`100%c x 22`)이 그 렌더러와 `hotbar_grid`를 감싼다. `hotbar_panel` 안의 `hotbar_renderer@hotbar_renderer` 자식은 제거됐지만 `hotbar_renderer` 템플릿 자체와 선택 슬롯 오버레이 용도(`$hotbar_renderer_size: ["105%", "105%"]`)는 남아 있다. `edu_hotbar_grid`도 같은 구조의 패널이 됐다. 핫바를 덮어쓰는 팩은 preview에서 재검증이 필요하다.
- HUD 에디터 채팅: `paper_doll`과 `hud_visible_not_centered` 패널이 `#editor_chat_layout_active`를 함께 읽는 view 바인딩으로 바뀌고, `chat_panel`은 `#editor_chat_visible`과 `#editor_chat_offset`을 받는다.
- `server_form.json`: `custom_multiselect`가 `settings_common.option_generic`을 상속하는 래퍼(`$control_name: server_form.custom_multiselect_control`, 라벨 `#custom_text`, 툴팁 바인딩)와 내부 컨트롤로 나뉘고, 토글 라벨 바인딩이 `#multiselect_option_text`가 된다. stable에서 `custom_multiselect`를 직접 참조하면 preview에서 구조가 달라진다.
- `ui_common.json`: `text_edit_box`에 `$text_edit_clip_offset|default: [0, 0]` → 클리핑 패널 `clip_offset`; `multiline_text_edit_box`는 `[0, -3]`.
- `_ui_defs.json` 제거 3건(3절). 그 밖에 `toast_screen.json`(+567줄, 매치메이킹/파티 팝업), `pdp_screen.json`, `gameplay_common.json`, `realms_settings_screen.json`(-1713줄), `settings_sections/*` 변경이 있으나 이 저장소의 선택 파일 밖이다.
- Script API 메타데이터: preview에는 `@minecraft/server-ui` `2.3.0`(정식)과 `2.4.0-beta`가 추가됐다. 둘 다 `multiselect`를 노출하지 않는다.

## 8. 이번 작업으로 저장소에서 바뀐 것

- `references/official/bedrock-samples-ui/*.json` 12개를 `v1.26.50.4`로 교체하고 `references/official/bedrock-samples-ui.lock.json`을 추가했다.
- `tools/sync-bedrock-samples-ui.mjs`(npm `sync:bedrock-samples-ui`, 레지스트리 id `vanilla.samples-sync`)를 추가했다. 네트워크를 쓰지 않고 로컬 스파스 미러에서 복사·lock 생성·`--check` 검사를 한다. `scripts/sync-bedrock-samples-ui.ps1`은 미러 생성과 `-Ref` 체크아웃만 맡고 복사는 이 도구에 위임한다.
- `data/jsonui-spec.json` 보강, `tools/_lib/ui-validator.mjs` 수정, `data/vanilla-screen-profiles.json`에 `bedrock-1.26.50` 추가, `tools/_lib/json-dialect.mjs`에 `bedrock-json@1.26.50`과 기본값 상수 추가, `validate-pack` 기본값 변경.
- 테스트 `official-samples-lock`, `jsonui-spec-vanilla-coverage` 추가와 `data/test-manifest.json`, `data/test-impact-map.json` 등록.
- 문서 갱신: `docs/01`, `docs/16`, `docs/19`, `docs/21`, `docs/34`, `docs/37`, `docs/40`, `docs/42`, `docs/45`, `docs/48`, `docs/54`, `docs/55`, `README.md`, `AGENTS.md`, `skills/mcbe-json-ui-server-forms/references/server-form-map.md`.

## 9. 실제 클라이언트에서 확인할 항목

1. 자막 기본 위치(오른쪽 위 50px 아래)와 팩이 자막 패널을 옮긴 경우의 충돌.
2. 인벤토리 닫기 매핑을 복제한 팩의 `button.menu_inventory_exit` 동작과, `cursor_renderer`를 기준점으로 삽입하던 HUD 패치의 로드 여부(Content Log의 `UI control reference not found`).
3. 화로 화면을 덮어쓰는 팩에서 레시피 북 탭·검색·토글이 가려지거나 포커스 경로가 끊기는지.
4. `§9` 파란색과 트림 재질 색을 바닐라 상수로 맞춘 팩의 색 차이.
5. 1.26.50에서 제거된 화면(3절)을 덮어쓰던 파일이 남아 `UI_DEFS_ORPHAN`이나 로드 실패로 이어지는지.
6. 커스텀 폼 `multiselect`의 실제 송신 API와 `formValues` 응답 형태(아직 공개 메타데이터에 없음).

## 10. 다음 동기화 절차

```powershell
# 1. 미러 생성/갱신과 선택 파일 복사 + lock 갱신 (네트워크는 이 스크립트만 사용)
.\scripts\sync-bedrock-samples-ui.ps1 -Ref main        # 또는 -Ref v1.26.60.x / -Ref preview
# 2. 오프라인 검사와 로컬 인덱스
node tools/sync-bedrock-samples-ui.mjs --check
node tools/build-vanilla-index.mjs --force
# 3. 스펙 어휘 격차와 lock 일치를 테스트로 확인
node tests/jsonui-spec-vanilla-coverage.mjs
node tests/official-samples-lock.mjs
npm run check
```

PowerShell이 없는 환경에서는 `git clone --depth 1 --filter=blob:none --sparse https://github.com/Mojang/bedrock-samples.git references/upstreams/bedrock-samples` 후 `git -C references/upstreams/bedrock-samples sparse-checkout set resource_pack/ui`를 실행하고 `node tools/sync-bedrock-samples-ui.mjs --ref main`을 호출한다. 이어서 이 문서의 1~7절을 새 리비전 기준으로 갱신하고, 바뀐 이름을 `docs/19`, `docs/34`, `docs/16`, `docs/37`에 반영한다. `data/vanilla-screen-profiles.json`의 새 프로필은 lock의 커밋과 `_ui_defs.json` 목록을 그대로 복사해야 `tests/official-samples-lock.mjs`가 통과한다.
