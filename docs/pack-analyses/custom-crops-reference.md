# 커스텀 농작물 참고자료 분석

## 성격

이 자료는 “순수 JSON UI 샘플”이라기보다 **애드온 리소스팩 전체 참고자료**다.

UI뿐 아니라 다음을 같이 가진다.

- blocks
- attachables
- entity
- models
- particles
- textures
- font
- sounds

따라서 이 자료는 “UI가 애드온 전체와 어떻게 연결되는가”를 배우는 데 적합하다.

## 핵심 JSON UI 포인트

### 1. `_ui_defs.json`

등록된 UI:

- chest/furnace server form
- animated bar
- form/menu/stat/guild/gmenu/ginfo/quest/skill/craft/npc/shop/boss

이 구성은 하나의 리소스팩이 게임 전반 UI를 얼마나 많이 덮어쓸 수 있는지 보여준다.

### 2. `hud_screen.json`

중요 패턴:

- actionbar 값 `levelup` 감지 후 레벨업 이미지 출력
- `#hud_title_text_string`에서 hp/xp/mp/lv/gold 값 문자열 파싱
- 고정 텍스처형 progress bar 다중 배치

즉, title/actionbar를 UI 데이터 버스로 재활용한다.

### 3. `server_form.json`

중요 패턴:

- title 텍스트에 특정 제어 문자열 삽입
- chest/furnace/custom form을 제목 접두사로 분기

이건 PMMP/플러그인 쪽에서 보낼 폼 제목이 UI 프로토콜 역할을 한다는 뜻이다.

## 이 소스가 강한 분야

- addon 전체 구조와 UI 연결
- HUD에 여러 스탯 바 배치
- custom texture 기반 progress bar
- chest/furnace/server form 개조
- block/entity/texture와 UI의 결합 관점
