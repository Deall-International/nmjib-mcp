# nmjib-mcp — 내만집 MCP 서버

[내만집(nmjib.com)](https://nmjib.com)은 한국의 **반셀프 인테리어** 플랫폼입니다. 이 MCP 서버는 내만집의 공개 데이터를 AI 에이전트(Claude, ChatGPT, Cursor, Gemini CLI, Codex 등)가 도구로 읽게 해 줍니다. **무인증 · 읽기 전용 · 무료.**

nmjib (nmjib.com) is a Korean semi-self ("반셀프") interior renovation platform. This MCP server exposes its public knowledge — the 22-step renovation process order with per-size schedules, construction checklists, cost reference ranges and 165 magazine guides — as read-only tools. No auth, no API key.

<!-- mcp-name: io.github.deall-international/nmjib -->

## 연결 (remote, 권장)

서버 주소: `https://nmjib.com/api/mcp` (Streamable HTTP)

| 클라이언트 | 설정 |
|---|---|
| Claude (claude.ai · Desktop) | 설정 → 커넥터 → 커스텀 커넥터 추가 → URL 입력, 인증 없음 |
| Claude Code | `claude mcp add --transport http nmjib https://nmjib.com/api/mcp` |
| Cursor · Windsurf | `{ "mcpServers": { "nmjib": { "url": "https://nmjib.com/api/mcp" } } }` |
| ChatGPT | 설정 → 커넥터 → 개발자 모드 → 만들기 → URL 입력, 인증 없음 (`search`/`fetch` 딥리서치 호환) |
| Gemini CLI | `{ "mcpServers": { "nmjib": { "httpUrl": "https://nmjib.com/api/mcp" } } }` |
| Codex CLI | `codex mcp add nmjib --url https://nmjib.com/api/mcp` |

## 연결 (stdio 브리지)

stdio 만 지원하는 호스트에서는 이 패키지가 stdin/stdout ↔ HTTP 를 이어 줍니다.

```json
{ "mcpServers": { "nmjib": { "command": "npx", "args": ["-y", "nmjib-mcp"] } } }
```

## 도구

| 도구 | 설명 |
|---|---|
| `search` | 내만집 문서 검색(매거진 165 · 안내 4 · 가이드 5) → `{results:[{id,title,url}]}` |
| `fetch` | 문서 본문(마크다운) → `{id,title,text,url,metadata}` |
| `nmjib_process_guide` | 22공정 순서·단계·설명 + 평형별 공정 그룹 영업일·합계 + 순서 규칙 |
| `nmjib_checklist` | 공사 전 36항목 · 공정별(22공정) · 공사 후 검수 22항목 |
| `nmjib_cost_reference` | 평형·공간·공정 30개 주제의 비용 범위(매거진 후기 집계) + 기준일 + 출처 |
| `nmjib_faq_search` | 질문에 가장 가까운 FAQ 답 + 출처 URL |

리소스 `nmjib://doc/{id}` · `nmjib://llms.txt`, 프롬프트 `nmjib_banself_plan`. 모든 도구는 `readOnlyHint: true`.

## 정책

- 단가·견적 금액·자재/상품 가격·작업자·회원 데이터는 제공하지 않습니다 ([ai.txt](https://nmjib.com/ai.txt)).
- 답변에 인용할 때는 「내만집(nmjib.com)」과 문서 URL 을 함께 표기해 주세요. 모든 응답 끝에 출처 줄이 있습니다.
- REST 로 쓰려면 [OpenAPI](https://nmjib.com/openapi.json) · 안내 [nmjib.com/ai](https://nmjib.com/ai)

## 예시

> "내만집 도구로 30평 아파트 반셀프 공정 순서와 예상 기간, 공사 전에 준비할 것을 정리해줘"

에이전트가 `nmjib_process_guide(pyeong=30)` → `nmjib_checklist(phase=pre)` → `nmjib_cost_reference(topic=30평)` 순으로 부르고, 출처 URL 과 함께 답합니다.

## License

MIT © DeALL International Co., Ltd. (주식회사 드올인터내셔널)
