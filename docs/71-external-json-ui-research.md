# External JSON UI research corpus

외부 자료는 완성품을 복사하기 위한 저장소가 아니라 JSON UI의 구조, 배치, 상태, 텍스처 사용과 BP/RP 연결을 측정하기 위한 로컬 증거 코퍼스다.

## 저장 및 승격 경계

- 원본 저장소와 배포 패키지는 `workspace/corpus-local/research`에만 저장하며 Git에 포함하지 않는다.
- 압축 파일은 경로 순회 항목을 먼저 검사한 뒤 별도 폴더에 푼다. 포함된 스크립트와 실행 파일은 실행하지 않는다.
- MIT, GPL, CC, Public Domain도 각각의 조건을 그대로 적용한다. `All Rights Reserved`, 라이선스 불명 자료는 `quarantine`이며 원본 JSON, 텍스처, 고유 명칭을 공개 결과에 넣지 않는다.
- 공개 레시피 승격은 라이선스 확인, 정적 파싱, 참조 연결, 독립된 두 소스 이상의 반복 증거를 모두 요구한다.
- 유출본, 재업로드, 게임 데이터 아카이브, 다른 서버 플랫폼 전용 자료, Ore UI 전용 자료와 JSON UI 증거가 없는 팩은 제외한다.

재현 가능한 URL, revision, CurseForge file ID와 내려받은 파일의 SHA-256은 `config/research-sources.public.json`에 기록한다.

## 2026-08-29 수집 결과

GitHub 저장소 17개와 CurseForge 패키지 8개를 내려받아 분리 검사했다.

| 구분 | 소스 | 파일 | JSON UI | 컨트롤 | 텍스처 | 레시피 후보 | 파싱 오류 |
|---|---:|---:|---:|---:|---:|---:|---:|
| GitHub | 17 | 13,545 | 102 | 2,236 | 5,029 | 77 | 16 |
| 배포 패키지 | 8 | 865 | 172 | 3,208 | 567 | 87 | 7 |

확인된 실제 화면군은 서버 폼, HUD와 디버그 오버레이, 전체 메뉴 스킨, 책·가이드, 스킬 트리, 카메라·신문·미니맵, 동적 JSX 문자열 디코더다. 편집기, LSP, 생성기와 렌더러는 화면 레시피 소스가 아니라 도구 기능 연구 대상으로 분리한다.

초기 검사에서 JSON UI가 없었던 CurseForge UI Builder는 레시피 입력에서 제외했다. BOM과 `__MACOSX` AppleDouble 파일은 수집 단계에서 정리했다. 남은 오류는 잘린 JSON, JSON 뒤의 비공백 데이터, 손상되거나 비표준인 PNG로 보고서에 그대로 보존한다.

## 사용 순서

```powershell
npm run corpus:inventory -- --root workspace/corpus-local/research/github --out workspace/corpus-local/research-corpus/github --json
npm run corpus:inventory -- --root workspace/corpus-local/research/extracted --out workspace/corpus-local/research-corpus/packages --json
```

생성되는 전체 카탈로그와 private source map은 local-only다. 스킬에는 source-redacted 측정치와 여러 자료에서 반복 검증된 규칙만 반영한다. `gold` 판단은 별도의 Bedrock 런타임 화면과 콘텐츠 로그 증거가 생긴 뒤에만 가능하다.
