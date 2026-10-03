# 리소스팩·GeoUI 보강 근거

검토일: 2026-09-28. 버전 고정 출처를 읽고 일반화한 지침과 정적 검사기를 추가했다. 실제 Bedrock 렌더링·입력 성공과 모델 성능은 별도 평가 대상이다.

## 원본 조사에서 달라진 판단

| 확인한 근거 | 스킬·도구에 반영한 내용 |
| --- | --- |
| GeouiStudio의 `player.entity.json`과 `live_player_renderer` 연결 | 장착형 attachable과 플레이어 렌더러 GeoUI를 서로 다른 스킬로 라우팅 |
| GeouiStudio의 명령·아이템 사용·ActionForm 입력 | 표시용 geometry와 입력 소유자를 따로 추적하고 임의 클릭 영역으로 해석하지 않음 |
| Canvas 텍스트 stroke와 PNG 출력 | 텍스트 외곽선을 이미지로 굽는 경로를 명시하고 재질 아웃라인과 구분 |
| PNG 팔레트 변환과 alpha 처리 | 반투명은 RGBA·auto 경로 확인, 생성 코드의 alpha 0 처리도 검사 |
| 공식 attachable, render controller, texture-set 문서 | item 선택·별칭·상속·그래픽 모드별 계약과 미해결 외부 참조를 검사 |
| 제공된 장착형 스킬·로컬 에셋 인덱스의 기존 분석기 | JSONC, 실제 소유 manifest, 현재 해시, controller 본문과 연결 관계를 확인 |

GeouiStudio의 분석 revision은 `7fe110f22385b1a44ea8ba01c2a6817b888b6893`이다. Apache-2.0 출처의 생성 구조를 분석했고 외부 코드는 실행하지 않았다. 도구의 기본 단위, atlas 크기와 샘플 수를 엔진 제한으로 일반화하지 않는다. 정확한 파일·해시는 [출처 잠금 파일](../config/design-research-lock.json), 확인 수준과 사용 범위는 [출처 목록](../data/design-sources.json)에 있다.

초기 보강에서는 GeouiStudio·공식 custom item 예제·Geyser 통합 팩·attachable 커뮤니티 문서를 4개 출처로 추가하고, 고정 바닐라 revision의 장비·플레이어 관련 29개 파일을 더 확인했다. 당시 통합 캐시 27개 출처·512개 파일의 크기와 SHA-256이 일치했다. 그때 추가한 패턴 7개는 기본 스타일 카드에 자동 추가하지 않는다.

## Attachables·GeoUI 후속 검토

후속 조사에서는 문서·스키마·실제 생성기/팩의 서로 다른 주장을 비교했다. 현재 통합 캐시 **28개 출처·541개 파일·13,417,443바이트**의 크기와 SHA-256을 다시 확인했다. 3D totem은 별도 GitHub 구현의 비교 자료이며 라이선스 미확인으로 코드·아트를 공개 저장소에 복사하지 않았다.

| 재현 또는 확인 | 반영 |
| --- | --- |
| texture 배열을 geometry로 사용하거나 잘못된 transition이 검사를 통과 | 리소스 타입·중첩 배열·조건 객체 검사와 실패 회귀 |
| 따옴표 속 `Texture.*`가 실제 참조로 오인됨 | 문자열 경계 분리; 복합 Molang은 평가하지 않고 불확실성 유지 |
| geometry에서 읽는 속성의 `client_sync:false` 누락 | 연결된 geometry의 속성 소비자 검사 |
| 정상 언어 목록·flipbook 배열을 객체가 아니라는 이유로 거부 | object 요구를 그래프 정의에 한정; 그 밖의 배열은 구문 확인·범위 제외를 명시하고 malformed manifest는 계속 거부 |
| `geometry:null`, `textures:[3]` 누락과 순환 배열의 완전 해석 주장 | selector 형상 오류를 보고하고, 배열 순환·공식 예제 간 형상 차이는 dynamic으로 유지 |
| 공식 wrench의 `bb_main`과 `steve_head` bone 불일치 | 출처 신뢰와 실제 bone/pose 일치 검증을 분리 |
| 독립 totem의 offhand 보정이 기본 pose에 누적됨 | 누적 애니메이션과 상호배타적 완전 pose를 구분하는 작성 예제 |
| GeouiStudio native v6 저장/복원·export 경로 | 프로젝트 단계의 ID 충돌·미디어 복원·상태 producer 검사 도구 |
| 생성 model root와 원본 bone 충돌, 비표시 layer도 참여하는 점수 writer | 4개 독립 실패 입력으로 재현하고 이름 충돌·실제 writer 수집 경로 검사 |
| 일반 속성/보는 사람별 override의 범위와 다음 tick 계약 | [상태와 수명](81-geometry-ui-state-and-lifecycle.md)에 종료·재접속·다중 관측 절차 반영 |

추가 패턴 4개도 선택한 출처에만 속한다. `design-library.mjs patterns --source ID`로 한 출처의 요약·경로·revision·라이선스만 받는다. 짧은 출력은 전체 카드를 생략하고 수를 보고하며, 최종 줄바꿈도 출력 한도에 포함한다.

GeoUI 보고서가 진단을 하나씩 제거하며 직렬화를 반복하던 비용도 수정했다. 동일한 65KB·경고 4,040개 합성 입력의 로컬 1회 비교에서 출력 축약은 3,242ms → 14ms, 결과는 동일한 2,416자였다. 진단 우선순위와 생략 개수를 유지한 prefix 이진 탐색 결과이며, 전체 프로젝트 처리나 모델 성능의 일반적인 개선율은 아니다.

원본 바닐라 242문서·9 owner를 이전 검사기와 비교했을 때 기존 누락 참조 오류 수는 45로 같고 신규 오류는 없었다. 더 엄밀해진 검사로 복합 Molang의 미확정 참조는 dynamic 2건에서 15건으로 늘었다. 이 샘플은 전체 vanilla 의존성 묶음이 아니므로 오류 수를 게임 오류 개수로 해석하지 않는다.

## 로컬 자료 전체 검사 범위

- 인덱스 69,830개 중 자기 참조·생성물 26,208개 제외.
- 적격 텍스트 **21,530/21,530개** 현재 SHA-256 확인. 기존 인덱스가 놓친 `.material` 34개를 추가 발견.
- 해시 불일치, 읽기·파싱 오류, 검색 불완전 모두 0.
- JSON UI 445, geometry 3,430, attachable 6,410, entity 2,185, animation 6,406, render controller 580, nine-slice 993, material 34개. 종류는 중복될 수 있다.
- 현재 텍스트 연결 51,807건. 미해결 참조는 추가 팩·바닐라·동적 조건이 필요할 수 있으며 게임 오류로 단정하지 않는다.

이 수치는 해당 인덱스의 적격 텍스트와 추가 material 탐색 범위다. 이미지 전량 디코딩, 모든 BP 동작과 Bedrock 실행을 포함하지 않는다. 원본 파일은 수정하지 않았으며 원본 경로·팩 이름·식별자는 ignored 조사 기록에만 남겼다. 재배포 권한이 확인되지 않은 원본은 공개 자료에 포함하지 않았다.

## 작은 문맥으로 연결하기

`scan`은 전량 조사하고, `context`는 필요한 종류·역할 카드만 반환한다. `evidence`는 선택한 한 원본과 소유 manifest의 현재 해시를 다시 검증한다. 일반 카드는 중립 해시·수치·판단 규칙을 담으며, 원본 경로를 반환하는 evidence는 로컬 확인 전용이다.

이번 전량 카탈로그에서 9개 종류별 조회 결과는 각각 최종 줄바꿈을 포함해 2,548자 이하였다. 구형 `geometry.child:geometry.parent` 선언도 자식 ID와 부모 참조로 나누며, 실제 bone 병합·렌더링은 검증 범위에 넣지 않는다.

AI·픽셀·게임 UI 연구는 8개 1차 출처를 5개 선택 주제로 정리했다. 기본 5,000자 한도에서 주제별 실제 출력은 2,296~3,943자다. 논문의 점수·과제 수가 서로 어긋나거나 적용 조건이 다르면 한계를 함께 기록한다. [연구 검토와 평가 설계](78-skill-research.md)의 72회 모델 비교는 제안이며 실행 결과가 아니다.

기준 커밋 `5d9e315`와 비교해 기존 24개 프로필의 기본 도구 선택·계약·완료 기준·경계가 같음을 확인했다. 6개 기본 스타일 카드도 검토일을 제외한 내용과 문자 수가 같다. 신규 need 하나를 지정한 실제 compact 도구 안내는 983~1,240자로 도구 하나만 선택했다. 문자 수 측정이며 실제 토큰 수나 모델 품질 개선율로 환산하지 않는다.

후속 보강의 시작점 `4d38edb`와 비교해서도 28개 스킬의 기본 compact 문맥과 6개 스타일 카드가 모두 같았다. 새 `geoui-project` 및 두 전문 스킬의 `source-patterns` 문맥은 각각 1,037·1,005·1,013자로 도구 하나만 선택한다. 전체 프로젝트/출처 보고서는 명시적으로 요청할 때만 읽는다.

## 2026-10-03 후속: 같은 커밋의 바닐라 팩 파일과 공식·위키 자료

`mojang-bedrock-samples` 출처를 UI 207개 파일에 더해 `attachables`·`entity`·`animations`·`animation_controllers`·`render_controllers`·`models` 115개 파일까지 322개로 넓혔고(UI lock과 같은 커밋 `46ba6ea985fb`), 공식 creator 레퍼런스(`microsoftdocs-minecraft-creator-reference`, 91개), 공식 스키마(`mojang-bedrock-schemas-visual`, 36개), 위키 entities/visuals 스냅샷(`bedrock-wiki-entities-visuals`, 63개)과 애드온 예제 다섯 개를 추가했다. 통합 lock은 38개 출처·1,063개 파일이며 `node tools/design-library.mjs verify`가 크기와 SHA-256을 확인한다.

| 확인한 근거 | 반영 |
| --- | --- |
| 바닐라 attachable 55개 전수: `.player` 쌍, `parent_setup`의 `*_layer_visible`, `controller.render.armor` 51개, bow/crossbow 프레임 배열 | attachables 스킬 참조의 구조 통계와 "파일명이 아니라 identifier·item으로 짝을 맞춘다" 규칙 |
| `humanoid.custom.geo.json`(1.21.0) bone 계층, `player.entity.json`(1.26.0)의 다섯 render controller와 `enable_attachables` | geo-ui·attachables 참조의 리그 표 |
| 공식 `actor_resource_definition.v1.10.0/.v1.26.0`: `item` Object/String/Molang, `hide_armor`, `queryable_geometry`, `scripts.hide_held_items`, 1.26.0 `{}` 스코프 | 전용 `attachable.md`가 빠뜨린 키를 보완한 키 표 |
| 공식 `ui_element.md`·스키마 `UiElement.d.ts`의 `nine_slice_*`·`slider_range`는 바닐라 0회, 타입 오류 다수 | 스펙에 추가하지 않고 `_confirmed_extensions.docs_cross_check_2026_10_03`에 기록, 테스트로 고정 |
| 커뮤니티 이름 목록(`hawariii-bedrock-ui-research`)의 78개 중 19개, 컬렉션 47개 중 41개가 바닐라에 없음 | 발견 보조 자료로 격하하고 `vanilla-name-check` 선행을 의무화 |

세부 표와 라벨은 [84. 레퍼런스 확장과 근거 우선 정책](84-reference-expansion-and-evidence-first.md)에 있다.

## 검증과 남은 범위

회귀 검사는 누락 경로, JSONC, alias, property 상태, item selector, subpack, material 상속, 텍스처 레이어, 원본 보존과 출력 한도를 다룬다. 독립 검토에서 발견한 잘못된 manifest의 성공 처리, 외부 manifest 링크, 짧은 출력의 오류 누락도 회귀 사례로 고정했다.

원본 다운로드·해시 확인은 라이선스나 런타임 성공을 대신하지 않는다. Classic/Vibrant Visuals/RTX 외형, first/third person, 실제 입력, 서버 상태 동기화와 재접속은 대상 팩·클라이언트에서 확인한다.
