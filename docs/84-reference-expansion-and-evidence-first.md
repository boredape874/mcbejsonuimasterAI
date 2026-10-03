# 84. 레퍼런스 확장과 근거 우선 정책 (2026-10-03)

이번 보강은 세 가지를 한 번에 바꿨다. (1) 모든 스킬이 자기 본문보다 실제 근거를 먼저 조사하도록 순서를 고정했고, (2) JSON UI·attachables·GeoUI·리소스팩 자료를 커밋 고정 출처로 13개 더 등록해 분석 카드와 스킬 참조로 옮겼으며, (3) 공식 문서·공식 스키마·위키·커뮤니티 이름 목록을 고정 바닐라 1.26.50.4와 대조해 "문서에는 있으나 바닐라에 없는 이름"을 스펙 밖에 기록했다. 기존 레퍼런스와 구버전 자료는 삭제하거나 다시 쓰지 않았다. JSON UI는 하위 호환이 강하므로 추가·보강만 했고, 완전히 틀린 항목만 고쳤다.

문서 안에서 `wiki:docs/...`, `schemas:schemas/...`처럼 접두사가 붙은 경로는 이 저장소가 아니라 해당 고정 출처 안의 파일이다. 전체 경로와 해시는 `config/design-research-lock.json`, 요약과 재사용 범위는 `data/design-sources.json`에 있다.

## 1. 근거 우선, 스킬은 그다음

28개 `skills/*/SKILL.md` 전부에 `## Evidence first, skill second` 절을 본문 첫 절로 넣었고 `tests/skill-evidence-first.mjs`가 순서·문구·도구 이름을 검사한다. 순서는 다음과 같다.

1. 대상 팩 자체: `_ui_defs.json`, manifest, 요청이 지목한 파일, 현재 Content Log.
2. 고정 공식 바닐라 근거: `references/official/bedrock-samples-ui`와 `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>`, 로컬 미러 `references/upstreams/bedrock-samples`, `docs/83-vanilla-ui-1.26.50-diff.md`. 팩 스킬은 미러의 `resource_pack/attachables|entity|animations|render_controllers|models`와 `node tools/attachable-inspect.mjs`, `node tools/geoui-inspect.mjs`, `node tools/material-audit.mjs`.
3. 등록 출처와 카드: `node tools/design-library.mjs sources --source ID`, `node tools/design-library.mjs patterns --source ID`, 그다음 저장소 `docs/`.
4. 1~3단계가 답하지 못할 때만 스킬 본문. 이때 라벨은 "inferred from skill guidance"이며 "confirmed"가 아니다.

1~3단계에서 찾은 이름·오프셋·선택자·규칙은 스킬 본문보다 우선한다. `AGENTS.md` §1, `skills/mcbe-json-ui-master/SKILL.md`의 Route contract, `docs/03-skill-map.md`, `docs/22-ai-response-quality.md`의 라벨 표가 같은 순서를 쓴다.

## 2. 등록한 출처

통합 lock은 **38개 출처·1,063개 파일**이며 `node tools/design-library.mjs verify`가 크기와 SHA-256을 확인한다. 2026-10-03에 추가·확장한 항목은 다음과 같다.

| 출처 id | 종류 | 라이선스 / 재사용 | 파일 | 담은 것 |
| --- | --- | --- | --- | --- |
| `mojang-bedrock-samples` (확장) | official | Mojang EULA / analysis-only | 322 | UI 207개에 더해 `attachables` 55개, `entity`(player, armor_stand, npc), `animations`, `animation_controllers`, `render_controllers`, `models`, `textures/ui` 메타, `@minecraft/server-ui` 스크립트 메타. UI lock과 같은 커밋 `46ba6ea985fb` |
| `microsoftdocs-minecraft-creator-reference` | official | CC-BY-4.0 문서 / MIT 샘플, reference | 91 | JSON UI 컴포넌트 레퍼런스 4쪽, attachable·client entity 레퍼런스, geometry·render controller·texture set visual 레퍼런스, Molang 쿼리 35쪽, attachables·custom item 튜토리얼, DDUI 소개 |
| `mojang-bedrock-schemas-visual` | official | MIT, reference | 36 | attachable·animation·UI form, RP attachables·entity·models·render_controllers·ui 스키마, UI 타입 선언 |
| `bedrock-wiki-entities-visuals` | community-docs | 페이지별(대부분 NOASSERTION), reference-only | 63 | attachables 두 제작 방식, player geometry, render controllers, materials, texture atlases, overwriting assets, subpacks, JSON UI 전 페이지 |
| `microsoft-custom-items` (확장) | official | MIT, reference-only | 89 | wrench에 더해 journal·journal_pencil, turret/generator kit 6종, 1.21.70 방어구 세트, robot/turret render·animation controller |
| `geyser-integrated-pack` (확장) | addon | MIT, reference-only | 37 | armor stand 전용 attachable 13종, 소유자 bone 트리를 복제한 geometry, spyglass 바인딩, 서버 플래그 애니메이션 |
| `kaweduh-player-model-renderer` | addon | MIT, optional-reuse | 7 | 제목 접두사로 바닐라 ActionForm을 커스텀 패널로 보내고 `live_player_renderer`·`paper_doll_renderer`·`name_tag_renderer`로 플레이어 모델을 표시 |
| `eniacjushi-touhou-little-maid` | addon | 코드 MIT·에셋 CC BY-NC-SA 4.0, optional-reuse(JSON 구조만) | 42 | 손·머리 attachable, 시점 처리, 제목 센티널로 분기하는 커스텀 컨테이너, 고정 `collection_index` 메뉴, 책 화면의 클라이언트 페이지 계산 |
| `world-class-engineers-collect-everything` | addon | MIT, optional-reuse | 10 | 수집 도감 ActionForm: 인벤토리 슬롯형 템플릿, `hover_text_renderer`, nine-slice 메타 |
| `glitchyturtle-avatar-addon` | addon | GPL-3.0, analysis-only | 53 | 재사용 폼 키트(glui), 쿨다운 HUD 바, 드롭다운·편집창·탭 텍스처 메타, 플레이어형 client entity. 구조만 분석, 코드·아트·식별자 복사 금지 |
| `pipangry-starlibv2` | addon | GPL-3.0, analysis-only | 18 | 폼 라이브러리의 패키지 구조(버튼·커스텀 입력·동적 크기·화면 템플릿·전역 스타일) |
| `hawariii-bedrock-ui-research` | community-docs | MIT, reference | 6 | 바인딩·버튼 id·컬렉션·컨트롤 목록. §5의 감사 결과 참고 |
| `theoristmc-json-ui-dumper` | tooling | NOASSERTION, reference-only | 10 | 바닐라 JSON UI 속성 메타데이터 덤프 도구의 파서·데이터 계약 |

각 출처는 `node tools/design-source-sync.mjs --source ID --download`로 무시되는 작업 폴더에 해시 검증 상태로 받는다. 외부 코드는 연구 목적이라도 실행하지 않는다.

## 3. 같은 커밋의 바닐라 팩 파일

UI 이름을 확인하던 커밋과 같은 리비전에서 attachable·플레이어 리그 이름을 확인할 수 있게 됐다. 55개 attachable 파일의 통계(`format_version` 분포, description 키, 재질, render controller, `parent_setup` 변수, `.player` 쌍, 활·석궁의 프레임 배열, 방패의 손별 변수)와 `humanoid.custom.geo.json`(1.21.0) bone 계층, `player.entity.json`(1.26.0)의 다섯 render controller는 `skills/mcbe-attachables-ui/references/vanilla-and-official-evidence.md`에 표로 있다. 바닐라 화면이 어떤 렌더러를 어떤 컨트롤·`property_bag`·바인딩 이름으로 쓰는지는 `skills/mcbe-geo-ui/references/renderer-and-rig-evidence.md`에 있다.

핵심 확인값(confirmed from pinned samples, 런타임 미검증):

- `description.item`은 25개 `.player.json` 방어구에만 있고 값은 `query.owner_identifier == 'minecraft:player'` 조건식이다. 짝은 파일명이 아니라 `identifier`와 `item`으로 맞춘다(`turtle_shell_helmet.json`의 식별자는 `minecraft:turtle_helmet`).
- 시점 전환은 `animate` 조건 객체(`bow.json`, `crossbow.entity.json`의 `c.is_first_person`)와 애니메이션 컨트롤러(`controller.animation.shield.wield`, `controller.animation.trident.wield`) 두 방식이 공존한다.
- 방패·삼지창·석궁 geometry는 `q.item_slot_to_bone_name(c.item_slot)` 바인딩을, 활 geometry는 bone 이름 `rightitem`만 쓴다. 망원경은 사용 중일 때 `head`로 바인딩 대상을 바꾼다.
- `live_player_renderer`는 인벤토리 두 화면의 `player_renderer`(`#look_at_cursor`), `actor_portrait_renderer`는 `npc_interact_screen.json`의 `skin_model`(컬렉션 `skins_collection`, `#skin_index`), `hud_player_renderer`는 `hud_screen.json`의 `hud_player`(`#paper_doll_visible`)에만 있다.

## 4. 공식 문서·스키마·위키 표를 스펙과 대조한 결과

`data/jsonui-spec.json`은 계속 단일 허용 어휘다. 대조 결과는 `_confirmed_extensions.docs_cross_check_2026_10_03`에 기록했고 `tests/jsonui-spec-vanilla-coverage.mjs`가 고정한다.

| 자료 | 결과 | 스펙 반영 |
| --- | --- | --- |
| Microsoft `ui_element.md` (`ai-usage: ai-assisted`, 2025-02-11) | 요소 속성 77개 중 72개가 이미 스펙에 있음. `nine_slice_buttom`(오타)·`nine_slice_left/right/top`·`slider_range`는 바닐라 207개 파일에서 0회. 모든 열거값 표가 `undefined`. `font_scale_factor` boolean, `grid_item_template` integer, `locked_control` boolean 등 타입 오류 | 추가하지 않고 기록만. 테스트가 "추가되지 않음"을 단언 |
| Microsoft `ui_element.md`의 bindings·button_mappings 하위 키 | bindings 8개는 모두 스펙에 있음. button_mappings 4개 외에 바닐라는 `scope`(127)·`handle_select`(50)·`handle_deselect`(48)·`ignored`(46)·`button_up_right_of_first_refusal`(25)·`consume_event`(9)·`ignore_input_scope`(4)를 더 씀 | `button_mapping_entry_keys` 11개 신설. `variables` 배열의 `requires`(505회)는 `variables_entry_keys`로 신설. 고정 파일이 스펙에 없는 entry key를 쓰면 테스트 실패 |
| 공식 스키마 `UiElement.d.ts`·`ui_element.form.json` | creator 페이지와 같은 5개 미존재 이름과 같은 타입 오류, `nineslice_size` 누락, `index.schema.json`은 `namespace`만 검증 | 이름 체크리스트로만 사용 |
| 위키 `json-ui-documentation.md` | 요소 타입 20종 중 `scrollbar_track`은 위키 전용(바닐라·스펙은 `scroll_track`). 위키가 legacy로 표시한 `tab`·`carousel_label`·`grid_item`, `z_order`·`alignment`는 바닐라 사용 0~1회 | 구버전 레퍼런스가 쓰므로 스펙에 유지. `scrollbar_track`은 추가하지 않음 |
| 공식 `actor_resource_definition.v1.10.0/.v1.26.0` | 전용 `attachable.md`가 빠뜨린 `hide_armor`·`held_item_ignores_lighting`·`queryable_geometry`·`particle_emitters`·`scripts.initialize`·`scripts.variables`·축별 `scale`, 1.26.0의 `scripts.hide_held_items`와 `{}` 스코프, `item`의 Object/String/Molang 세 형태 | attachables 스킬 참조의 키 표 |

이 비교의 재현 스크립트는 저장소에 두지 않았다. 같은 결과를 얻으려면 미러의 `resource_pack/ui`를 `tools/_lib/json-dialect.mjs`의 `parseUiSource`로 읽어 키를 집계하고, 문서 표의 `| name |` 행을 추출해 `Object.values(spec.properties).flat()`과 비교한다.

## 5. 커뮤니티 이름 목록 감사

`hawariii-bedrock-ui-research`의 목록을 `node tools/vanilla-name-check.mjs`(고정 15개 파일 + 미러, 222개 파일 색인)로 확인했다.

| 목록 | 확인 | 바닐라 1.26.50에 있음 | 없음 |
| --- | --- | --- | --- |
| `bindings.md` + `button-ids.md` | 78 | 59 | 19 (`#is_hovered`, `#is_checked`, `#value`, `#max`, `#min`, `#progress`, `#current_index`, `#inventory_selected_slot`, `#item_count`, `#item_icon`, `#item_durability`, `#recipe_selected`, `#recipe_name`, `#collection_selected`, `#paperdoll_visible`, `#chat_message`, `#chat_input`, `#setting_value`, `#setting_name`) |
| `collections.md` | 47 | 6 | 41 |
| `controls.md` | 19 | 11 | 8은 JSON UI 타입이 아님 (`scroll_panel`, `checkbox`, `radio_button`, `item_renderer`, `inventory_grid`, `hotbar`, `slot`, `progress_bar`) |

없는 이름 일부는 그 저장소가 "✅ Confirmed / Source: Vanilla UI"로 표시한다. 그래서 이 출처는 발견 보조 자료로만 쓰고, 인용 전 반드시 바닐라 확인을 거친다. `data/design-sources.json`의 요약, `docs/04-source-priority.md`, `docs/19-bindings-and-hardcoded-values.md`, `skills/mcbe-json-ui-reference/references/official-docs-cross-check.md`에 같은 결과를 적었다. 출처 자체는 삭제하지 않았다.

## 6. 스킬에 추가한 참조와 분석 카드

| 스킬 | 새 참조 | 내용 |
| --- | --- | --- |
| `mcbe-attachables-ui` | `skills/mcbe-attachables-ui/references/vanilla-and-official-evidence.md` | 바닐라 attachable 통계, 플레이어 리그, 슬롯→bone, context 변수, 공식 키 표, 버전 게이트, 위키 두 제작 방식, 등록 애드온 예제의 결함 목록 |
| `mcbe-geo-ui` | `skills/mcbe-geo-ui/references/renderer-and-rig-evidence.md` | 바닐라 렌더러 사용표, 세 컨트롤 본문, geometry 1.21.0 `item_display_transforms`·`query.is_in_ui`, MIT 플레이어 모델 폼 예제 |
| `mcbe-resource-pack-rendering` | `skills/mcbe-resource-pack-rendering/references/render-controller-and-material-evidence.md` | render controller 키, 바닐라 컨트롤러 형태, 방어구 슬롯 인덱스, texture set 규칙, 위키 머테리얼 주의점 |
| `mcbe-resource-pack-master` | `skills/mcbe-resource-pack-master/references/official-and-community-evidence.md` | 교체/병합 규칙, 동일 identifier의 `min_engine_version` 선택, Molang 버전 선택, subpack·atlas |
| `mcbe-json-ui-reference` | `skills/mcbe-json-ui-reference/references/official-docs-cross-check.md` | §4·§5의 대조 표와 결과 라벨 |
| `mcbe-json-ui-samples` | `skills/mcbe-json-ui-samples/references/community-ui-packs.md` | 등록한 JSON UI 애드온·라이브러리·도구의 구조 요약과 재사용 경계 |

`data/bedrock-source-patterns.json`의 카드는 21개에서 늘어났다(검토일 2026-10-03). 새 카드는 모두 `contextPolicy: explicit-source-only`이므로 스타일 문맥에 자동으로 섞이지 않고 `node tools/design-library.mjs patterns --source ID`로만 읽는다. 카드의 `paths`는 lock에 고정된 파일만 가리키며 `node tools/design-library.mjs verify`가 검사한다. 각 카드의 `limitations`에 라이선스와 미검증 범위가 있다.

## 7. 바꾸지 않은 것

- 기존 `references/`, `docs/`, 예제 팩, 이전 스냅샷(`microsoftdocs-minecraft-creator`, `bedrock-wiki-attachables`, `mojang-bedrock-schemas` 등)은 그대로 둔다. 새 리비전은 별도 id로 등록했다.
- 스펙의 legacy 이름(`tab`, `grid_item`, `z_order`, `alignment`)과 구버전 패턴 문서는 유지한다. 바닐라에서 이름이 옮겨졌다는 이유로 삭제하지 않는다.
- 바닐라 텍스처 경로 검증용 `resource_pack/textures/ui` 전체 미러 확장은 하지 않았다. 텍스처는 `vanilla-index/textures.json`과 lock에 고정된 개별 파일로만 확인한다.

## 8. 실제 클라이언트에서 확인할 항목

- 1.26.0 `{}` 스코프와 `scripts.hide_held_items`의 실제 동작.
- 바인딩된 bone의 음수 Y 오프셋(위키 보고)과 attachable locator 결함(위키 1.21.1 보고).
- `item_display_transforms.gui`가 어떤 렌더 경로(핫바, 인벤토리 슬롯, 아이템 프레임)에 적용되는지.
- `query.is_in_ui`가 paper doll·live renderer별로 1.0을 돌려주는지.
- 공식 wrench 샘플의 `steve_head`/`bb_main` 불일치가 실제로 어떻게 보이는지.

## 9. 재현 명령

```sh
node tools/sync-bedrock-samples-ui.mjs --check
node tools/design-library.mjs verify
node tools/design-library.mjs patterns --source mojang-bedrock-samples --max-chars 8000
node tools/vanilla-name-check.mjs "#is_hovered" "#paper_doll_visible" live_player_renderer
node tests/jsonui-spec-vanilla-coverage.mjs
node tests/skill-evidence-first.mjs
node tools/skill-lint.mjs --json
node tools/audit.mjs
```
