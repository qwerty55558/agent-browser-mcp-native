# MIGRATION — 공식 `agent-browser mcp`로 이전

이 프로젝트(`agent-browser-mcp-native`)는 Vercel `agent-browser` CLI를 MCP 서버로 감싼 wrapper였습니다. v0.28.0(2026-06-16)부터 `agent-browser`가 MCP 서버를 공식 내장(`agent-browser mcp`)하면서 이 wrapper는 불필요해졌습니다.

## 왜 이전하나

- v0.20.0(2026-03-13): `agent-browser`가 100% 네이티브 Rust로 전환. Node.js/Playwright 데몬 완전 제거. 설치 710MB→7MB, 메모리 143MB→8MB.
- v0.28.0(2026-06-16): `agent-browser mcp` 내장 MCP 서버 추가 (typed tools, 페이지네이션, 프로토콜 협상, 프로파일).
- 공식 MCP는 이 wrapper 38개 툴의 완전한 상위호환입니다.

## 설정 이전

기존(이 wrapper):

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "agent-browser-mcp-native"]
    }
  }
}
```

신규(공식):

```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "agent-browser",
      "args": ["mcp", "--tools", "core,state,debug,tabs"],
      "env": {
        "AGENT_BROWSER_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    }
  }
}
```

- 전체 CLI 기능: `"args": ["mcp", "--tools", "all"]`
- 자체 Chromium 사용: `env` 블록 제거 후 최초 1회 `agent-browser install`
- `--native`는 넣지 마세요. v0.20.0부터 native가 기본이자 유일 모드입니다.

## 툴 커버리지 매핑

이 wrapper의 38개 `browser_*` 툴은 공식 프로파일로 아래와 같이 대응됩니다.

```
┌────────────────┬────────────────────────────────────────────────────────┐
│ 공식 프로파일  │ 이 wrapper의 대응 툴                                   │
├────────────────┼────────────────────────────────────────────────────────┤
│ core           │ navigate, go_back, go_forward, reload, click, fill,    │
│                │ type, press, hover, focus, check, uncheck, select,     │
│                │ drag, scroll, wait, snapshot, screenshot, pdf,         │
│                │ evaluate, get_text, get_html, get_attribute,           │
│                │ get_title, get_url, is_visible, is_enabled,            │
│                │ is_checked, close                                      │
│ state          │ get_cookies, clear_cookies, session_list               │
│ debug          │ get_console, get_errors                                 │
│ tabs           │ tab_list, tab_new, tab_close, tab_switch               │
│ network        │ (이 wrapper에 없음 — 공식에서 추가 확보)               │
│ react          │ (이 wrapper에 없음 — 공식에서 추가 확보)               │
│ mobile         │ (이 wrapper에 없음 — 공식에서 추가 확보)               │
└────────────────┴────────────────────────────────────────────────────────┘
```

## 주의사항

- 툴 이름이 바뀝니다(`browser_*` → 공식 명명 규칙). 에이전트가 툴명을 직접 참조하는 경우 재조정하세요. AI 에이전트가 자동 디스커버리로 사용하는 경우 영향이 거의 없습니다.
- 기존 기본값은 시스템 Chrome을 `--executable-path`로 강제했습니다. 공식은 기본적으로 자체 Chromium을 사용하며, 시스템 Chrome을 쓰려면 위처럼 `AGENT_BROWSER_EXECUTABLE_PATH` 환경변수로 지정하세요.

## 참고

- CHANGELOG: https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md
- 공식 사이트: https://agent-browser.dev
