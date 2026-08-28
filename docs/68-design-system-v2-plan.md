# mcbejsonuimasterAI v2 — 측정 기반 MCBE JSON UI 디자인 시스템

상태: 정적 구현 완료, Bedrock 런타임 검증 보류
기준일: 2026-08-28
저장소: 현재 repository root

## 1. 기준과 승인된 변경

이 문서는 v2 구현의 단일 기준이다. 이후 요구사항은 이 문서의 변경점으로만 관리한다.

- Discord 수집은 보류한다.
- 바카라 예제와 평가는 제외한다.
- 특정 서버 프레임워크 지식은 코어 스킬·문서·인덱스에서 제거한다.
- 외부 JSON UI 편집기는 초기 연구 자료로만 사용한다.
- 실제 제작과 검증은 하나의 내부 레이아웃·프리뷰 엔진으로 통일한다.
- AI가 사용할 도구는 기계 판독 가능한 계약과 스킬별 프로필로 제공한다.

## 2. 목표

기존 문서·경로 모음을 다음 흐름을 가진 MCBE JSON UI 제작 시스템으로 개편한다.

```text
동작 JSON UI와 에셋 수집
  -> 크기·간격·정렬·상태 측정
  -> 디자인 레시피 검색
  -> IR 제약 작성·solve·compile
  -> 단일 내부 엔진으로 텍스처 렌더·검사
  -> RP/BP 연결 검사
  -> 실제 Bedrock 확인
```

AI는 모든 시각적 결정에 대해 다음을 제시할 수 있어야 한다.

- 사용한 화면과 recipe ID
- 패널·버튼·라벨의 크기와 비율
- anchor, offset, padding, gap과 정렬 근거
- 기본·hover·pressed·locked 상태
- 텍스처·나인슬라이스와 BP 프로토콜 연결
- 정적 검증과 Bedrock 런타임 검증 범위

## 3. 비목표와 안전 경계

- 완전한 Bedrock 클라이언트 에뮬레이터라고 주장하지 않는다.
- 외부 편집기를 런타임 정답 판정기로 사용하지 않는다.
- development RP/BP와 에셋 라이브러리 원본을 수정하지 않는다.
- 라이선스가 불명확한 코드·에셋을 공개 저장소에 복사하지 않는다.
- 절대 로컬 경로, 비공개 소스 이름과 제한 에셋을 공개 산출물에 넣지 않는다.
- Discord와 바카라 작업은 포함하지 않는다.

## 4. 작업 보존

1. `.tmp-*`, 캐시와 생성 결과를 제외한 기존 변경을 `checkpoint/pre-design-system-2026-08-28`에 커밋한다.
2. 가치 있는 `workspace/*/ir.yaml`만 공개 가능성을 검토해 `examples/`로 승격한다.
3. `feature/mcbe-json-ui-design-system-v2`에서 구현한다.
4. 기존 자료는 체크포인트에서 복구 가능하게 유지하고 시작 단계에서 삭제하지 않는다.

## 5. 단일 레이아웃·프리뷰 엔진

### 5.1 기하 원칙

- 기본 프로필: PC 16:9, `1920 x 1080`, GUI scale 3
- 터치 상호작용이 있는 화면: 대표 터치 프로필 추가
- IR solve 단계: 절대 UI 픽셀 사용
- `%`, `%c`, `%cm`, `fill`: solve 후 실제 동작에 필요할 때만 적용
- 좌우·상하 대응 요소: `symmetric_x` 또는 `symmetric_y`
- 반복 요소: `same_size`, `equal_gap_x/y`, `center_group_x/y`
- 정렬 의도: `align_x/y`, `edge_eq`, `edge_offset`
- 기하가 틀리면 compiled JSON을 손보지 않고 IR을 수정한다.

### 5.2 측정값

각 화면에서 다음을 수집한다.

- root와 control의 위치·크기·종횡비
- anchor, offset, padding, gap, 정렬선과 대칭 관계
- label 영역, font size·scale, 줄 수와 예상 문자열 길이
- default, hover, pressed, locked 상태
- PNG 크기·alpha와 같은 stem의 나인슬라이스 JSON
- form title token, button index, collection과 BP 발신 프로토콜

정적으로 풀 수 없는 binding·collection·표현식은 추측하지 않고 `unresolved`로 기록한다.

### 5.3 지원 범위

내부 엔진은 같은 입력에 항상 같은 좌표와 이미지를 생성한다.

우선 지원:

- `panel`, `image`, `label`
- `stack_panel`, `grid`
- 일반 버튼 상태
- PNG alpha와 나인슬라이스
- clipping·overflow·텍스트 영역 검사
- PC·터치 프로필 PNG와 HTML contact sheet

지원하지 않는 속성은 무시하지 않고 `unsupported` 보고서에 기록한다.

### 5.4 정확도 게이트

- 대칭·정렬·동일 간격 오차: 1 UI 단위 이하
- 의도하지 않은 영역 침범과 잘림: 0건
- 기본·30% 긴 한국어·긴 영어 문자열 통과
- 기본·hover·pressed 상태 preview 존재
- RP/BP 참조와 프로토콜 오류: 0건
- 실제 Bedrock의 `[UI][error]`, unknown property, 누락 참조: 0건

내부 엔진까지만 통과하면 `정적·시각 검증 완료`, 실제 화면과 콘텐츠 로그까지 통과하면 `런타임 검증 완료`다.

## 6. 외부 연구 자료

연구 대상:

- <https://github.com/bedrock-core>
- <https://github.com/SebTheSigma/JSON-UI-Maker>
- <https://github.com/xRookieFight/jsonforge>
- <https://github.com/UnknownMaker-dev/json-ui-builder-web>
- <https://github.com/gamezaSRC/JSON-UI-Web-Editor>

사용 방식:

- JSON-UI-Maker: element, converter, nine-slice와 좌표 처리 아이디어 조사
- JsonForge: MIT 공개 anchor·canvas·nine-slice 구조 우선 조사
- 나머지 편집기: control tree, drag/resize, property UX 조사
- bedrock-core: 저장소별 스키마·타입·JSON UI 패턴 조사

필요한 동작은 내부 엔진에 독립 구현한다. 외부 편집기 어댑터와 다중 렌더 비교 시스템은 만들지 않는다.

## 7. 소스와 코퍼스

설정:

```text
config/sources.public.json
config/sources.local.json
config/sources.local.example.json
schemas/source.schema.json
workspace/corpus-local/
```

소스 필드:

```text
schemaVersion, id, kind, tier, redistribution,
license, licenseEvidence, revision,
rpRoot, bpRoot, include, exclude, overrides
```

등급:

- `gold`: 정적·시각·프로토콜·Bedrock 런타임 증거 완료
- `gold-candidate`: 런타임 증거만 부족
- `pattern`: 일부 동작만 신뢰하며 추천 시 경고
- `quarantine`: 라이선스·의존성·구조 문제로 로컬 검색만 허용

초기 분류:

- 주 개발 RP/BP: `local gold-candidate`
- 다른 development pack: 기본 `local pattern`
- 복호화 팩·라이선스 불명 자료: `local-only quarantine`
- 외부 편집기: `tooling-pattern`

수집 범위:

- `ui/**/*.json`, `_ui_defs.json`, `_global_variables.json`
- 실제 UI 진입 파일
- UI 코드가 직접 참조한 RP 텍스처와 나인슬라이스
- 연결된 BP JavaScript·mcfunction 발신 코드

제외:

- 일반 블록·아이템·엔티티·월드 텍스처
- 웹 편집기 장식 이미지
- `node_modules`, `dist`, cache와 생성 결과
- 현재 카탈로그를 다시 입력으로 읽는 순환 경로

## 8. 디자인 카탈로그

증거 연결:

```text
source -> pack -> screen -> control -> inherited control
control -> geometry -> text role -> state -> texture -> nineslice
screen -> protocol -> BP sender -> runtime evidence
recipe -> evidence -> preview -> validation
```

레시피 필드:

```text
id, family, role, sourceTier, targetProfiles,
rootSize, controls, padding, gap, anchors,
textRoles, states, textures, protocol,
evidence, validation, redistribution
```

범용 토큰은 같은 역할이 2개 이상 소스와 3개 이상 화면에서 반복될 때만 채택한다. 그보다 적으면 팩 전용 레시피로 유지한다.

## 9. AI 도구 계약

```text
schemas/ai-tool.schema.json
data/ai-tool-registry.json
data/skill-tool-profiles.json
tools/tool-list.mjs
tools/tool-describe.mjs
tools/skill-context.mjs
tools/skill-doctor.mjs
```

도구 필드:

```text
id, purpose, command, arguments, inputs, outputs,
preconditions, mutates, exitCodes,
evidenceProduced, failureRecovery
```

모든 CLI는 가능한 범위에서 `--help`, `--json`, `--report <path>`를 지원한다. 스킬은 전체 도구 목록이 아니라 자기 작업에 필요한 도구 프로필만 읽는다.

## 10. 스킬과 프롬프트

스킬 역할:

- `mcbe-json-ui-master`: 짧은 라우터와 성공 조건
- `mcbe-json-ui-visual-design`: 비율·간격·정렬·타이포그래피·상태
- `mcbe-json-ui-ir-authoring`: 레시피를 IR 제약으로 변환
- `mcbe-json-ui-tools-runner`: 수집·solve·compile·render·validate·eval
- reference/samples/patterns: 카탈로그와 증거 검색
- server-forms/addon-integration/debugging: 전문 연결과 검사

각 스킬은 `SKILL.md`, 필요한 `references/`, 반복 작업용 `scripts/`, `agents/openai.yaml`, 평가 자료만 가진다. 같은 규칙을 여러 스킬에 반복하지 않는다.

프롬프트 형식:

```text
목표 -> 화면 프로필 -> 제공 자료 -> 측정 근거 -> 제약
     -> recipe와 도구 -> 생성 파일 -> 검증 조건 -> 미검증 항목
```

구현:

```text
schemas/task-envelope.schema.json
prompts/task-envelope.yaml
tools/prompt-build.mjs
tools/prompt-lint.mjs
```

## 11. 완전한 공개 예제

1. 텍스트·버튼 상태·나인슬라이스 갤러리
2. 일일 보상 카드 행
3. 서버 폼 버튼 그리드
4. HUD 미니맵·마커
5. 책·퀘스트 화면
6. 카지노 릴·베팅 패널
7. PC·터치 안전 반응형 셸

모든 예제는 RP/BP manifest, `_ui_defs`, JSON UI, 실제 텍스처, 나인슬라이스, IR, preview, 측정 overlay, 긴 문자열 결과와 검증 보고서를 포함한다. 동적 예제에는 최소 BP 발신 코드도 포함한다.

## 12. 명령 인터페이스

```text
npm run source:scan
npm run catalog:build
npm run design:search -- <조건>
npm run preview -- <recipe-or-ui>
npm run validate:sources
npm run eval:offline
npm run eval:live

npm run tools:list -- --skill <skill>
npm run tools:describe -- <tool-id>
npm run skill:context -- <skill>
npm run skill:doctor -- <skill>
npm run prompt:build -- <task-envelope>
npm run prompt:lint -- <prompt-or-envelope>
```

## 13. 평가

고정 과제:

- 일일 보상, 5 x 3 슬롯, 책 퀘스트, 미니맵
- 서버 폼 그리드, 긴 한국어·영어 문자열
- 버튼 상속·hover·pressed 상태

오프라인 평가는 JSON, `_ui_defs`, namespace, 텍스처, 나인슬라이스, 프로토콜, 기하, 문자열, preview, pixel diff와 미지원 속성을 검사한다.

스킬 평가는 `스킬 없음`, `기존 스킬`, `v2 스킬`, `v2 스킬 + 도구`를 비교한다. 실제 개선이 없는 장문 지침은 축소하거나 제거한다. 자동 검사를 LLM 평가로 대체하지 않는다.

## 14. 구현 순서

### 단계 0 — 보존

- [x] ignore 규칙 보강
- [x] 기존 변경 체크포인트 (`9b6f865`)
- [x] 기능 브랜치 생성 (`feature/mcbe-json-ui-design-system-v2`)

### 단계 1 — 공통 계약

- [x] source, recipe, tool, task schema
- [x] 공통 경로·JSONC·보고서 유틸리티

### 단계 2 — 병렬 구현

- [x] 소스 scanner, evidence graph, recipe catalog
- [x] 단일 geometry·texture·nineslice renderer
- [x] 스킬·프롬프트·예제·평가

### 단계 3 — 통합 검증

- [x] package scripts와 AI tool profile 연결
- [x] pack/source validation
- [x] offline eval 전체 통과
- [x] private path·asset 유출 검사
- [x] 특정 서버 프레임워크 코어 참조 제거

### 단계 4 — Bedrock 확인

- [ ] PC 화면·상태·binding 확인
- [ ] 필요한 터치 화면 확인
- [ ] 콘텐츠 로그 오류 확인
- [ ] gold 또는 gold-candidate 확정

## 15. 완료 조건

- 공개 파일의 절대 경로·비공개 소스·제한 에셋 0건
- 코어의 특정 서버 프레임워크 참조 0건
- 모든 공개 예제가 독립 실행 가능한 RP/BP
- 모든 도구가 입력·출력·실패·증거 계약 제공
- 모든 스킬이 필요한 도구 프로필과 성공 조건 제공
- 정렬·대칭·간격 오차 1 UI 단위 이하
- 영역 침범·잘림·참조 오류 0건
- 전체 offline eval 통과
- 모든 시각 결정이 recipe와 실제 근거 파일까지 추적 가능
- Bedrock 미검증 결과를 런타임 완료로 표시하지 않음

## 16. 연구 기준

- OpenAI Skills: <https://developers.openai.com/codex/skills>
- OpenAI Prompting: <https://developers.openai.com/codex/prompting>
- OpenAI Codex: <https://github.com/openai/codex>
- Anthropic Skills: <https://github.com/anthropics/skills>
- SWE-Skills-Bench: <https://arxiv.org/abs/2603.15401>
- PromptWizard: <https://arxiv.org/abs/2405.18369>

원칙은 짧은 스킬, 점진적 공개, 명확한 입력·출력, 결정론적 도구와 고정 평가다. 외부 편집기는 초기 연구에만 사용하고 제작과 검증은 단일 내부 엔진으로 수행한다.
