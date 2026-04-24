# 개요

이 저장소는 **MCBE JSON UI를 마스터하기 위한 Codex 스킬 저장소**다.

핵심 방향:

- 로컬 절대경로 의존 금지
- 이 저장소 하나만 복제해도 바로 쓸 수 있게 구성
- 이론 설명보다 실제 리소스팩 구조와 샘플 기반 해석 우선
- PMMP/서버 애드온 문맥까지 포함해 “클라이언트 UI가 실제로 어떻게 작동하는가”에 집중

## 다루는 범위

- `_ui_defs.json`
- HUD
- chat_screen
- title/actionbar 기반 프로토콜성 UI
- server_form
- chest/custom container UI
- animated progress bar
- scoreboard
- tooltip
- bindings / variables / string parsing
- custom texture / font / addon asset integration

## 이 저장소가 해결하려는 문제

일반적인 JSON UI 자료는 다음 문제를 자주 남긴다.

- 파일 구조 설명이 약함
- 실제 작동하는 샘플과 연결이 약함
- UI와 텍스처/폰트/애드온 의존성이 분리되어 있음
- AI가 바닐라 텍스처 경로를 지어냄
- server form과 HUD를 따로 봐서 실전 구조를 놓침

이 저장소는 그 반대로 간다.

- 스킬마다 언제 어떤 소스를 읽어야 하는지 적는다.
- 샘플 팩 구조를 직접 포함한다.
- 바닐라 경로 검증 자료를 별도 스킬로 둔다.
- JSON UI를 리소스팩 전체 구조 안에서 다루게 만든다.
