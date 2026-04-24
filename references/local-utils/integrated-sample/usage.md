# 통합 UI 사용법

AI로 정리한거라 조금 미포함된것도 있어용
별표별표


이 폴더에는 다음 기능만 들어 있습니다.

- 오른쪽 스코어보드 UI
- 아이템 hover 툴팁 배경/텍스트
- toptitle 자막
- NPC 대화창 UI

포함 파일:

- ui/_ui_defs.json: 통합된 UI 파일 등록
- ui/ui_common.json: hover 툴팁 공용 조각
- ui/scoreboards.json: 기본형 + Hive형 스코어보드
- ui/hud_screen.json: 스코어보드 삽입 + toptitle 자막
- ui/chat_screen.json: 채팅창에서 toptitle 메시지 숨김
- ui/form.json: server_form에서 호출하는 패널 묶음
- ui/npc.json: NPC 대화 UI 템플릿
- ui/server_form.json: 바닐라 server_form override

## 1. 스코어보드

자동으로 HUD 오른쪽에 삽입됩니다.

- hud_screen.json의 root_panel modification이 scoreboards.json의 dual_scoreboard를 삽입합니다.
- dual_scoreboard는 default_sidebar와 hive_sidebar를 모두 포함합니다.

필요 텍스처:

- textures/ui/hive/hive_scoreboard_entry.png
- textures/ui/hive/hive_scoreboard_entry.json

## 2. Toptitle 자막

채팅 메시지에 아래 접두사를 붙여 보내면 화면 상단 중앙에 자막으로 표시됩니다.

```text
!toptitle:표시할 문장
```

예시:

```mcfunction
tellraw @a {"rawtext":[{"text":"!toptitle:던전에 입장했습니다"}]}
```

동작 방식:

- hud_screen.json의 subtitle_factory가 chat_item_factory를 통해 자막을 생성합니다.
- subtitle_item이 !toptitle: 접두사를 제거하고 실제 문장만 표시합니다.
- chat_screen.json과 hud_screen.json의 chat_background가 이 메시지를 일반 채팅에서 숨깁니다.

## 3. 아이템 Hover 툴팁

사용할 슬롯/컬렉션 UI에 다음 조각을 붙여서 씁니다.

```json
{
  "tooltip@common.highlight_slot_panel": {
    "$item_collection_name": "your_collection_name"
  }
}
```

필수 컬렉션 값:

- #item_id_aux: 아이템 존재 여부 확인용
- #hover_text: 실제 툴팁 문자열

등급 접두사에 따라 배경이 바뀝니다.

- §U: uncommon
- §R: rare
- §E: epic
- §L: legendary
- §M: material
- 나머지: common

필요 텍스처:

- tooltip_assets/common_background.png
- tooltip_assets/common_background.json
- tooltip_assets/common_background.png.mcmeta
- tooltip_assets/uncommon_background.png
- tooltip_assets/uncommon_background.json
- tooltip_assets/uncommon_background.png.mcmeta
- tooltip_assets/rare_background.png
- tooltip_assets/rare_background.json
- tooltip_assets/rare_background.png.mcmeta
- tooltip_assets/epic_background.png
- tooltip_assets/epic_background.json
- tooltip_assets/epic_background.png.mcmeta
- tooltip_assets/legendary_background.png
- tooltip_assets/legendary_background.json
- tooltip_assets/legendary_background.png.mcmeta
- tooltip_assets/material_background.png
- tooltip_assets/material_background.json
- tooltip_assets/material_background.png.mcmeta

## 4. NPC 대화창

npc UI는 server_form 체인으로 동작합니다.

- server_form.json: 바닐라 server form screen의 content를 커스텀 form renderer로 교체
- form.json: long_form을 받아 npc 패널로 연결
- npc.json: 제목, 본문, 버튼 레이아웃을 그리는 실제 템플릿

연결 순서는 아래와 같습니다.

- 서버 폼 전송
- server_form.json의 third_party_server_screen
- form.json의 long_form_replacement
- npc.json의 main_panel

즉 npc.json만 등록한다고 끝나는 구조가 아니라, server_form.json과 form.json이 함께 있어야 실제 폼 화면에 붙습니다.

참고:

- hud_screen.json은 같은 팩 안에서 같이 쓰이지만, NPC 폼 렌더링 진입점은 아닙니다.
- 현재 통합은 NPC용 server_form 동작만 최소 이식한 구조라서, 참고자료의 menu/shop/boss 같은 다른 server_form 패널은 포함하지 않습니다.

주요 바인딩:

- #title_text: 대화 제목
- #form_text: 대화 본문
- form_buttons: 버튼 텍스트 컬렉션

버튼 템플릿:

- npc_button이 common_buttons.underline_button을 사용합니다.
- hover 시 textures/custom_ui/hover 텍스처를 사용합니다.
- 장식 이미지는 textures/custom_ui/design 텍스처를 사용합니다.

필요 텍스처:

- textures/custom_ui/hover.png
- textures/custom_ui/design.png

## 5. 폴더 구조

최종 배치 구조는 아래와 같습니다.

```text
통합/
  ui/
    _ui_defs.json
    ui_common.json
    scoreboards.json
    hud_screen.json
    chat_screen.json
    form.json
    npc.json
    server_form.json
  textures/
    ui/
      hive/
        hive_scoreboard_entry.png
        hive_scoreboard_entry.json
    custom_ui/
      hover.png
      design.png
  tooltip_assets/
    common_background.png
    common_background.json
    common_background.png.mcmeta
    uncommon_background.png
    uncommon_background.json
    uncommon_background.png.mcmeta
    rare_background.png
    rare_background.json
    rare_background.png.mcmeta
    epic_background.png
    epic_background.json
    epic_background.png.mcmeta
    legendary_background.png
    legendary_background.json
    legendary_background.png.mcmeta
    material_background.png
    material_background.json
    material_background.png.mcmeta
```