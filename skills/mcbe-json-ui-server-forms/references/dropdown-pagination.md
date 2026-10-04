# Dropdown Pagination: 한 폼 안에서 탭과 페이지 바꾸기

필요할 때만 이 문서와 아래 예제를 읽는다. 작은 도감, 상점 목록, 설정 탭처럼 모든 데이터를 한 번에 보낼 수 있는 ModalForm에 적합하다. 서버에서 새 데이터를 받거나 구매 결과를 반영해야 한다면 별도의 서버 처리와 갱신 흐름이 필요하다.

## 확인된 근거와 적용 범위

| 자료 | 확인한 내용 | 한계 |
| --- | --- | --- |
| 사용자가 제공한 커뮤니티 설명 | 숨긴 dropdown을 첫 필드로 두고 선택된 view에 따라 내용과 이동 버튼을 표시하는 전체 아이디어 | 원본 RP/BP, 버전, 라이선스와 실행 증거가 제공되지 않았다. 전체 동작은 작성자의 보고다. |
| [Mojang server_form.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/server_form.json) | `custom_form`의 `#dropdown_option_text`, 옵션 컬렉션 `custom_dropdown`, 옵션 상태 `#custom_radio_toggled`, 텍스트 `#custom_radio_text`가 실제로 존재한다. | 바닐라 자체에 완성된 페이지 전환 시스템이 있다는 증거는 아니다. |
| [Mojang settings_common.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/settings_sections/settings_common.json) | `option_radio_dropdown_group`, `radio_with_label`, 네이티브 라디오 그룹 연결을 확인했다. | 상속한 컨트롤의 입력과 컬렉션 문맥까지 보존해야 한다. |
| [bedrock-core/ui inline_select.json](https://github.com/bedrock-core/ui/blob/6977e257cb874087b22cfc506ae9db3440d17bda/packages/resource-pack/packs/RP/ui/core-ui/hosts/form/components/inline_select.json) | 가장 가까운 공개 예제. 네이티브 dropdown 옵션을 팝업 밖의 인라인 선택 버튼으로 표현한다. `compiled_option_toggle`은 `custom_dropdown_radio_toggle`과 `#custom_radio_toggled`를 사용한다. | 페이지 gating 전체를 구현한 예제로 확인하지 않았다. 대상 클라이언트에서 직접 시험하지 않았다. [MIT](https://github.com/bedrock-core/ui/blob/6977e257cb874087b22cfc506ae9db3440d17bda/LICENSE). |
| [bedrock-core/ui dropdown.json](https://github.com/bedrock-core/ui/blob/6977e257cb874087b22cfc506ae9db3440d17bda/packages/resource-pack/packs/RP/ui/core-ui/hosts/form/components/dropdown.json) | 선택된 옵션 문자열을 읽고 표시용 텍스트로 분리하는 구현을 확인했다. | 프레임워크 전체를 설치할 필요는 없다. 이 문서는 구조만 참고한다. |
| [Skybedrock guidebook_ui.json](https://github.com/Yasser444o/Skybedrock/blob/33b6841ecf8937d88fc9c9f1ad29526ed046707d/skybedrock_rp/ui/skybedrock/guidebook_ui.json) / [BP guidebook.js](https://github.com/Yasser444o/Skybedrock/blob/33b6841ecf8937d88fc9c9f1ad29526ed046707d/skybedrock_bp/scripts/items/guidebook.js) | 책 모양의 이전/다음 UI와 설정용 dropdown이 있는 관련 예제다. BP에서 form 응답을 받아 다음 폼을 여는 경로도 확인했다. | 같은 폼의 즉시 페이지 전환 증거로 쓰지 않는다. 라이선스를 확인하지 못했으므로 링크와 분석만 제공한다. |

조사일: 2026-10-04. Mojang pin은 이 저장소의 v1.26.50.4 자료와 일치한다. 소스의 존재는 입력 성공을 증명하지 않는다. 아래 예제는 이 저장소에서 작성한 **설계용 프로토콜과 바인딩 조각**이며 설치 가능한 완성 애드온이 아니다.

`dropdown.radio_selected`는 조사한 바닐라와 공개 예제에서 확인되지 않았다. 원본 팩의 `namespace: dropdown`, 해당 정의, `_ui_defs.json`과 상속을 먼저 찾는다. 이 이름이나 새로운 버튼 이벤트를 임의로 만들어 붙이지 않는다.

## 선행 조건과 상태 소유자

현재 [ModalFormData API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdata?view=minecraft-bedrock-stable)는 dropdown, toggle, 입력 필드와 submit을 제공한다. 일반 ActionForm의 항목별 `.button()`을 ModalForm에 추가하는 API는 없다. 원문의 **ActionForm 버튼을 Modal 안에 넣는 구조**는 별도의 RP/BP 어댑터를 먼저 확보해야 한다. 어댑터의 이벤트, 응답 형식과 원래 항목 인덱스를 확인하기 전에는 상품 버튼까지 구현됐다고 말하지 않는다. 기본 Modal 필드와 탭 전환 구조는 따로 설계할 수 있다.

```text
서버: dropdown을 필드 0에 추가 + 모든 페이지 데이터 전송 → show 한 번
클라이언트: 옵션 클릭 → 네이티브 dropdown 선택값 변경
           → 상주 reader가 view 해석 → 상주 gate가 내용 표시/숨김
서버: 마지막 submit/cancel에서만 결과 수신 및 게임 상태 검증
```

- dropdown **필드 인덱스**: `custom_form[0]`. 앞에 label/header를 추가하지 않는다.
- dropdown **옵션 인덱스**: `custom_dropdown[n]`. 탭과 화살표 각각의 선택지다.
- 콘텐츠 필드 인덱스: BP가 보낸 전체 순서대로 유지한다. 숨긴 필드도 제거하거나 재번호를 매기지 않는다.
- 하이브리드 버튼 인덱스: 어댑터가 정한 별도 계약이다. 위 세 인덱스와 혼합하지 않는다.
- 선택 상태는 각 플레이어의 현재 폼 인스턴스에 속한다. 전역 상태나 다른 플레이어의 선택값을 사용하지 않는다.
- 페이지 이동에서 submit, cancel, `button.form_button_click`을 호출하지 않는다. BP의 `.show()` 재호출이 발생하면 이 패턴의 완료 조건을 충족하지 못한다.

## 원본 예제: 도감 2페이지 + 설정 탭

[프로토콜 예제](../assets/dropdown-pagination-contract.json)는 한 번에 보내는 view, navigation, field 순서를 명시한다. 옵션 문자열의 처음 네 ASCII 문자는 고정 view 키다. `a01|`, `a02|`, `b01|` 뒤에는 옵션의 고유 ID와 표시명을 둔다. view 키만 비교하므로 `a01`과 `a010`, 번역된 제목이나 상품 이름이 상태 비교에 섞이지 않는다. 실제 팩에서는 이 규약을 프로젝트 계약으로 정하고 예약 문자·길이·사용자 입력을 검증한다.

```js
// 현재 API의 options 객체 형태. 대상 팩의 server-ui 버전/타입 선언을 먼저 확인한다.
const form = new ModalFormData().title("Example Codex");
form.dropdown("페이지", contract.options.map(option => option.text), {
  defaultValueIndex: contract.defaultOptionIndex
}); // 반드시 첫 번째 필드
form.toggle("a01|발견한 항목만", { defaultValue: false });
form.toggle("a02|희귀 항목만", { defaultValue: false });
form.toggle("b01|효과음", { defaultValue: true });
const response = await form.show(player); // 이동 버튼에서는 다시 호출하지 않는다.
if (response.canceled) return;
const selected = response.formValues?.[0]; // 옵션의 정수 인덱스
if (!Number.isInteger(selected) || selected < 0 || selected >= contract.options.length) return;
const finalView = contract.options[selected].targetView;
// 나머지 필드의 타입/순서를 검증하고 서버가 소유한 상태에 적용한다.
```

이는 BP payload 순서 예제다. 기본 RP에서는 평범한 dropdown과 세 toggle이 표시된다. RP 라우트, 인라인 라디오 옵션, gate를 연결해야 페이지 UI가 된다. [defaultValueIndex 문서](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdatadropdownoptions?view=minecraft-bedrock-stable)를 참고하고, 같은 API 문서의 구형 예제에 등장하는 숫자형 세 번째 인수를 현재 타입에 그대로 복사하지 않는다.

표시 규칙:

- view 태그가 없는 헤더, 닫기, 도움말은 모든 view에서 보인다.
- 태그가 있는 필드는 정확히 해당 view에서만 보인다.
- 탭은 항상 보이고, 선택 스타일은 **현재 view가 속한 탭**으로 계산한다. 마지막 클릭한 옵션만 강조하면 다음 화살표를 누를 때 탭 강조가 사라진다.
- 다음 화살표는 `a01|`에서만 보이며 `a02|`를 선택한다. 이전 화살표는 그 반대다. 첫/끝 페이지에서 불가능한 화살표는 입력 대상에서도 제외한다.
- 같은 view를 향하는 탭/이전 화살표는 서로 다른 옵션 인덱스를 갖는다. 옵션 인덱스가 다르다고 페이지가 다른 것은 아니다.
- 미리 전송하지 않은 항목을 새로 불러올 수 없다. 서버 검색·재고·가격 갱신은 별도 계약으로 둔다.

화살표 좌표를 옵션 문자열에 넣는 확장은 필요할 때만 한다. 고정 폭 숫자, 허용 범위, 부호와 필드 순서를 계약에 추가하고 같은 parser를 BP/RP에서 검증한다. 자유 형식 JSON을 JSON UI가 파싱한다고 가정하지 않는다. 원본 예제는 RP가 고정 좌표를 소유한다.

## RP reader와 gate 연결

[바인딩 조각](../assets/dropdown-pagination-bindings.json)의 `page_state_reader`는 **필드 0의 유효한 `custom_form` 문맥 아래**에 한 번만 배치한다. 실제 컬렉션/factory가 이 문맥을 제공해야 한다. 일반 panel에 `collection_name`을 임의로 추가해서 해결하지 않는다.

1. reader가 `#dropdown_option_text`를 `always`로 읽고 `('%.4s' * #dropdown_option_text)`를 `#page_key`에 넣는다.
2. reader가 알려진 키인지 계산한다. 알 수 없는 키는 첫 view를 표시하는 fallback으로 처리한다.
3. 각 page gate는 `visible: true`인 상주 panel이다. reader의 값으로 자체 `#page_visible`을 갱신한다.
4. gate 안의 콘텐츠만 `#page_visible`에 따라 숨긴다. gate와 reader를 그 콘텐츠 안에 넣으면 다시 표시할 조건을 읽지 못할 수 있다.
5. 실체화된 인스턴스 이름으로 `source_control_name`을 연결하고 실제 control path/scope를 검증한다. 예제의 이름이 임의의 factory 인스턴스 이름에 자동 대응하는 것은 아니다.

각 gate 인스턴스의 `$view_key`를 해당 view 키로 바꾸고 첫 view에만 `$fallback: true`를 설정한다. payload binding의 `source_control_name: page_gate`도 해당 gate 인스턴스 이름으로 바꾼다. 콘텐츠 컨트롤은 비어 있는 `page_payload.controls`에 넣는다. 이 조각에는 collection owner, 네이티브 radio 옵션, 화면 라우트와 입력 어댑터가 포함되지 않는다.

`#custom_dropdown`은 네이티브 dropdown 열림 상태에 사용되는 값이다. 이를 현재 페이지로 해석하지 않는다. 현재 선택 문구는 `#dropdown_option_text`, 개별 옵션 텍스트/선택 상태는 `#custom_radio_text`/`#custom_radio_toggled`다.

네이티브 dropdown의 상태·radio group·옵션 collection을 보존하면서 표시만 인라인 버튼으로 교체한다. 숨긴다는 이유로 상태 소유자 전체를 `ignored`, `enabled: false`, `visible: false`로 끄지 않는다. reader는 페인트가 없는 panel로 유지할 수 있다. 숨긴 payload의 `always` 갱신과 focus 복귀는 실제 클라이언트에서 검사해야 한다.

bedrock-core 예제에는 특정 dropdown 하위 트리에 새 collection-details binding을 선언했을 때 클라이언트가 종료됐다는 작성자의 관찰이 있다. 그 구현의 제약으로 취급하고 컬렉션 연결을 보존한다. 모든 Bedrock 버전의 보편적 규칙이나 이 저장소의 재현 결과로 단정하지 않는다.

## 재사용 순서와 검증

처음에는 두 view와 toggle 하나씩으로 최소 실험을 만든다. 순서는 네이티브 dropdown 선택 → reader 값 → A/B gate → 인라인 탭 → 이전/다음 → 기존 하이브리드 콘텐츠 버튼이다. 한 단계가 실패하면 다음 기능을 덧붙이지 않는다. 원본 ActionForm과 ModalForm fallback도 유지한다.

정적 검사:

- `_ui_defs.json` 등록, title route, 네임스페이스·상속·실제 source control을 추적한다.
- 필드 0과 옵션 순서, 기본 인덱스, 모든 target view, 화살표 source view를 검사한다.
- 고정 view 키와 이름/번역을 분리하고 태그 없는 항목의 상시 표시를 확인한다.
- reader/gate가 상주하는지, 모든 상태 binding이 다시 활성화될 수 있는지 검사한다.
- JSON 파싱/식 평가/샘플 상태 전이는 구조 검사다. Studio 렌더링이 네이티브 dropdown 입력과 숨긴 컨트롤의 갱신을 완전히 재현한다고 가정하지 않는다.

Bedrock 완료 조건:

- 대상 BP/RP와 버전을 기록하고 fresh Content Log의 `[UI][error]`가 없어야 한다.
- **show 1회, 동일 인스턴스 유지, 이동 중 응답 0회**를 기록한다. submit/cancel에서만 한 번 응답한다.
- 기본 view → 다음 → 이전 → 다른 탭 → 원래 탭으로 복귀해 이미 숨긴 페이지가 다시 보이는지 확인한다.
- 이동 후에도 입력값을 유지하고, 숨긴 버튼/필드가 클릭·터치·컨트롤러 focus를 받지 않는지 확인한다.
- 탭 선택 스타일, 첫/끝 화살표, 빠른 연속 이동, Escape/뒤로/닫기, submit의 타입·인덱스를 확인한다.
- 마우스, 터치, 컨트롤러를 따로 확인한다. 숨긴 현재 focus를 새 view의 유효한 컨트롤로 이동하고 TTS에는 표시명을 전달한다.
- 두 플레이어의 상태가 섞이지 않아야 한다. 페이지 선택과 클라이언트 표시만으로 구매 권한/보상 조건을 인정하지 않는다.

원문의 약 75요소는 작성자 환경의 관찰이다. 보장된 상한이나 성능 기준으로 사용하지 않는다. 전체 payload 바이트, 컨트롤·텍스처 수, 최초 열림 시간과 이동 응답 시간을 대상 PC/모바일에서 측정한다. 큰 카탈로그에는 서버 페이지 전송 또는 데이터 분할을 선택한다.

현재 근거 수준: 이름과 관련 구현은 pinned 소스에서 확인했다. 첨부 조각의 파싱과 식/상태 전이는 저장소 검사로 검증할 수 있다. 완성된 Dropdown Pagination 및 ActionForm-in-Modal 입력은 **대상 Bedrock 런타임 미검증**이다.
