# 마스터리 맵

MCBE JSON UI를 마스터하려면 아래 순서로 보는 게 맞다.

## 1. 진입점과 구조

먼저 이해할 것:

- `_ui_defs.json`
- 어떤 화면 JSON이 등록되는가
- namespace 분리
- modifications / factory가 어디에 삽입되는가

추천 소스:

- `1seulbi/ui/_ui_defs.json`
- `custom-crops-reference/ui/_ui_defs.json`
- `bunnyfarm/*/_ui_defs.json`

## 2. HUD와 채팅

다음에 이해할 것:

- root_panel 주입
- hud_content 확장
- chat_screen 필터
- title/actionbar를 데이터 채널로 쓰는 방식

추천 소스:

- `1seulbi/ui/hud_screen.json`
- `1seulbi/ui/chat_screen.json`
- `custom-crops-reference/ui/hud_screen.json`
- `bunnyfarm/z65tCLQRo0Q/ui/hud_screen.json`

## 3. 서버 폼

다음에 이해할 것:

- `server_form` namespace
- long_form/custom_form 교체
- title prefix를 이용한 분기
- factory 기반 form routing

추천 소스:

- `1seulbi/ui/server_form.json`
- `custom-crops-reference/ui/server_form.json`
- `bunnyfarm/GfE8ULhgL4I/ui/server_form.json`

## 4. 패턴 재사용

다음에 이해할 것:

- animated progress bar 템플릿
- chest/custom container
- scoreboard 분기
- tooltip 및 hover

추천 소스:

- `custom-crops-reference/ui/animated_bar.json`
- `bunnyfarm/tDAp1yJMUYo/ui/animated_bar.json`
- `1seulbi/ui/scoreboards.json`
- `bunnyfarm/Y5dOnRAM7js/ui/custom_pocket_containers.json`

## 5. 애드온 결합

마지막에 이해할 것:

- UI가 텍스처/블록/폰트/attachable과 연결되는 방식
- 순수 UI 수정과 애드온 리소스 수정의 경계

추천 소스:

- `custom-crops-reference/`
- `bunnyfarm/`의 비-UI 하위 자료
