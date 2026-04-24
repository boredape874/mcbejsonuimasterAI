# 1슬비 분석

## 성격

`1슬비`는 JSON UI 구조 학습용으로 매우 좋은 샘플이다.

이유:

- `_ui_defs.json`가 역할별로 나뉘어 있음
- `pause_utils`, `utils`, `neroluna/form`으로 서브모듈화돼 있음
- HUD, chat, scoreboard, inventory, server_form이 한 묶음 안에 있음

## 핵심 포인트

### 1. server form 라우팅

`ui/server_form.json`은 `customUI_` 접두사와 form type suffix를 이용해 특정 폼 디자인으로 라우팅한다.

이 구조는 다음 용도에 좋다.

- 서버별 커스텀 액션폼
- modal form 분기
- UI 스킨별 폼 전환

### 2. HUD 확장

`ui/hud_screen.json`은 다음을 보여준다.

- 커스텀 scoreboard 교체
- title 문자열 기반 HP 바
- 우측 title display
- 커스텀 chat panel

즉 “서버 메시지 포맷”과 “HUD 시각화”를 연결하는 실전 구조다.

### 3. preset 기반 설계

`pause_utils/*`, `utils/*`는 반복되는 버튼/콘텐츠 UI를 preset처럼 구성한다.

이건 스킬 관점에서 중요하다.

- 새 UI를 매번 처음부터 짜지 않고
- 공용 패널과 버튼 프리셋을 재사용하게 만들 수 있다

## 이 소스가 강한 분야

- server_form
- scoreboard
- custom chat panel
- HUD title parsing
- reusable button preset
