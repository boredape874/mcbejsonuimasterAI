# MCBE JSON UI Master AI

Minecraft Bedrock JSON UI를 깊게 다루기 위한 **Codex 스킬 저장소**다.

목표는 단순한 JSON UI 설명 모음이 아니라, 다음을 모두 처리할 수 있는 포터블 스킬 세트를 제공하는 것이다.

- `_ui_defs.json` 기반 화면 구조 파악
- HUD, 채팅, 액션바, 타이틀 기반 UI 해석
- 서버 폼 커스터마이징
- 바인딩, 변수, 문자열 파싱, 조건 렌더링 해석
- 진행바, 스코어보드, 툴팁, 체스트 UI 패턴 재사용
- 애드온 리소스팩과 UI의 연결 관계 분석
- 바닐라 텍스처 경로 검증
- 실전 팩 구조 역분석 및 디버깅

## 저장소 구성

- `skills/`
  - 실제 Codex 스킬
- `docs/`
  - 학습 체계, 소스 분류, 팩 분석 문서
- `references/`
  - 이 저장소 안에서 바로 읽을 수 있는 참고 소스
- `scripts/`
  - 설치 스크립트

## 포함된 주요 참고 소스

### 1. 1슬비

- 서버 폼
- 커스텀 HUD
- 채팅 패널
- 스코어보드
- 커스텀 버튼 프리셋

위치:

- `references/source-packs/1seulbi/ui/`

### 2. 바니팜

포함 범위:

- HUD/chat 변형 샘플
- animated bar 템플릿
- chest/custom pocket container UI
- server form 변형

위치:

- `references/source-packs/bunnyfarm/`

### 3. 커스텀 농작물 플러그인 참고자료

포함 범위:

- HUD/서버폼/체스트 인벤토리 시스템
- 애드온 리소스팩 구조
- 커스텀 UI 텍스처
- 블록 및 애드온 연동 참고

위치:

- `references/source-packs/custom-crops-reference/`

### 4. 바닐라 아이콘/텍스처 검증 자료

- `references/vanilla/mcbe-ui-icon-reference.md`

## 주요 스킬

- `mcbe-json-ui-master`
- `mcbe-json-ui-foundations`
- `mcbe-json-ui-logic`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-patterns`
- `mcbe-json-ui-debugging`
- `mcbe-json-ui-addon-integration`
- `mcbe-json-ui-vanilla-assets`

## 설치

PowerShell:

```powershell
.\scripts\install-skills.ps1
```

기본적으로 이 저장소의 `skills/` 아래 스킬을 `~/.codex/skills/`로 복사한다.

## 문서 시작점

- [개요](docs/00-overview.md)
- [소스 카탈로그](docs/01-source-catalog.md)
- [마스터리 맵](docs/02-mastery-map.md)
- [스킬 맵](docs/03-skill-map.md)
- [1슬비 분석](docs/pack-analyses/1seulbi.md)
- [바니팜 분석](docs/pack-analyses/bunnyfarm.md)
- [커스텀 농작물 참고자료 분석](docs/pack-analyses/custom-crops-reference.md)
