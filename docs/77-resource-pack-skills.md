# 리소스팩·Attachables UI·GeoUI

기존 JSON UI 경로에 네 전문 스킬을 추가한다. 화면 모양 대신 실제 렌더링·입력·상태 소유자로 경로를 고른다.

| 대상 | 스킬 | 먼저 확인할 연결 |
| --- | --- | --- |
| 여러 RP/BP 기능 | `mcbe-resource-pack-master` | 매니페스트·팩 순서·데이터 소유자 |
| 장착 아이템 모델 UI | `mcbe-attachables-ui` | item 선택 → attachable → 리소스·시점 |
| GeouiStudio/플레이어 모델 UI | `mcbe-geo-ui` | player entity → 렌더러·HUD → 동기화 속성 |
| NPC 초상화 기반 책·도감 | `mcbe-geo-ui`의 NPC portrait 참조 | NPC scene → skins collection → 모델과 native 버튼 |
| 머테리얼·아웃라인·PBR | `mcbe-resource-pack-rendering` | 별칭·상속·텍스처 레이어·그래픽 모드 |

## 요청한 부분만 읽기

```powershell
node tools/route-task.mjs --intent '{"surface":"geo-ui","taskKinds":["geoui-studio"],"supportingKinds":["material"]}'
node tools/skill-context.mjs mcbe-geo-ui --needs asset-graph --compact --json
node tools/skill-context.mjs mcbe-geo-ui --needs geoui-project --compact --json
node tools/design-library.mjs patterns --source au12jp-geoui-studio --max-chars 6000 --json
node tools/research-context.mjs topics
node tools/research-context.mjs context --topic context-selection --max-chars 5000
```

라우터는 요청한 task kind에 맞는 참조 한 개를 선택한다. 예를 들어 `outline`은 아웃라인 문서, `chest-form`은 ActionForm 문서를 읽는다. 지원 스킬도 순서대로 하나씩 확장한다. AI/픽셀/게임 UI 자료의 적용 범위는 [연구 검토](78-skill-research.md)에 있다.

## 실제 팩 구조 검사

```powershell
node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --report workspace/graph-report.json --json
node tools/geoui-inspect.mjs --input PROJECT.geoui.json --report workspace/geoui-report.json --json
node tools/material-audit.mjs --rp RP --mode vibrant --report workspace/material-report.json --json
```

세 검사 도구의 기본 stdout 한도는 최종 줄바꿈을 포함한 6,000자이며 전체 진단은 새 보고서 파일에만 기록한다. 기존 보고서와 입력 파일을 덮어쓰지 않는다. 종료 코드 0은 검사 범위 내 오류 없음, 1은 발견한 구조 오류, 2는 인자·입출력 오류다.

`geoui-inspect`는 native v6 프로젝트의 ID 충돌, 저장된 미디어 복원과 상태 생산자 누락을 검사한다. 내보낸 RP의 그래프는 별도로 `attachable-inspect`에 전달한다. 장착 UI를 직접 작성할 때는 [작성 가이드](80-attachables-ui-authoring.md)와 [두 상태 퀘스트 지도 예제](../examples/attachables/quest-map-recipe/README.md)를 선택한다.

그래프의 `ok`와 `complete`는 다르다. 외부·동적 참조가 있으면 구조 오류가 없어도 완전한 해석을 주장하지 않는다. 이미지 픽셀, Molang 실행, 장착/해제, 네트워크 상태, 클릭과 화면 좌표는 실제 클라이언트에서 확인한다. 머테리얼 검사는 루트 `materials/`와 `textures/`를 대상으로 하며 subpack은 별도로 선택한다.

상태가 재접속 뒤 남거나 다른 플레이어에게도 표시되면 [상태와 수명](81-geometry-ui-state-and-lifecycle.md)을 선택한다. 일반 Entity Property, 보는 사람별 표시 override, scoreboard producer와 임시 애니메이션 변수를 구분한다.

## 로컬 에셋 활용

```powershell
node tools/local-asset-learn.mjs scan --root ASSET_LIBRARY --out workspace/asset-learning/catalog.json --json
node tools/local-asset-learn.mjs context --catalog workspace/asset-learning/catalog.json --need attachable --role wearable --max-chars 5000 --json
node tools/local-asset-learn.mjs evidence --catalog workspace/asset-learning/catalog.json --id asset-CONTEXT_ID --limit 8 --json
```

기본 scan은 적격 텍스트 전량을 읽는다. `--limit`를 명시한 경우만 샘플링한다. 기존 인덱스 해시와 현재 파일을 대조하고, 명명법보다 실제 JSON 정의·참조에서 패턴을 추출한다. 이미지 전량 디코딩과 원본 카탈로그 재생성은 하지 않는다.

전체 경로·원본 식별자는 무시되는 로컬 카탈로그에 남는다. context는 선택한 종류/역할의 중립 ID·집계·해시·판단 규칙만 전달한다. 읽기/파싱/해시 불일치와 누락된 조사 범위를 성공으로 숨기지 않는다. 카탈로그 검색 결과가 에셋 재배포 권한이나 Bedrock 동작 증거를 부여하지는 않는다.

evidence의 `--id`에는 context에서 받은 `asset-`와 20자리 해시를 넣는다. 선택한 원본과 소유 manifest의 현재 해시를 다시 확인한 뒤 경로·참조를 제한해서 반환한다. `privacy:local-only` 응답은 원본 확인용이며 공개 결과에 복사하지 않는다. 변경되거나 사라진 원본은 실패로 처리한다.

## 출처와 확인 수준

GeouiStudio와 제공된 attachables 스킬은 생성 구조와 실패 사례를 분석하는 근거다. 공식 자료와 바닐라 스냅샷은 별도 버전·해시로 고정한다. 외부 코드는 연구만을 위해 실행하거나 설치하지 않는다. 다운로드는 선택한 파일을 `workspace/design-library/upstreams`에 저장하는 기존 `design-source-sync`를 사용한다.

모든 신규 정적 도구는 `runtimeVerified:false`다. 스킬/도구의 검증 결과와 생성한 실제 게임 콘텐츠의 런타임 검증 결과를 구분한다.
