# 바니팜 분석

## 성격

`바니팜`은 단일 JSON UI 팩이 아니라 **여러 종류의 리소스팩 실험/샘플 모음**에 가깝다.

그래서 이 자료는 통째로 읽기보다, 목적에 맞는 하위 샘플을 골라 써야 한다.

## JSON UI 관점에서 중요한 샘플

### `GfE8ULhgL4I`

핵심:

- `_ui_defs.json`
- `server_form.json`
- `chest_screen.json`
- `ui_common.json`
- `scoreboards.json`

용도:

- server_form 최소 수정
- 공용 UI 레이어
- chest UI/scoreboard 결합 방식

### `tDAp1yJMUYo`

핵심:

- `_ui_defs.json`
- `animated_bar.json`
- `hud_screen.json`
- `textures/ui/bar.json`, `bar_bg.json`

용도:

- animated progress bar 템플릿
- HUD에 진행바를 붙이는 법
- 텍스처/JSON 조합 패턴

### `Y5dOnRAM7js`

핵심:

- `_ui_defs.json`
- `custom_scroll_screen.json`
- `custom_pocket_containers.json`
- `chest_screen.json`
- `README.md`

용도:

- 커스텀 컨테이너 UI
- 스크롤/포켓 컨테이너 구조

### `FwnQgFaZsHs`, `z65tCLQRo0Q`, `gPiyv-DJxGw`

용도:

- HUD/chat_screen 변형
- scoreboard/HUD 결합
- `_global_variables` 실전 예시

## 이 소스가 강한 분야

- 다양한 HUD 변형 비교
- progress bar 재사용
- chest/custom container 구조
- 샘플 간 비교 학습
