# agent-browser-mcp-native

> Vercel `agent-browser` CLI를 Native(CDP) 모드로 실행하는 MCP 서버
> **npx로 바로 실행 가능** — 별도 클론/빌드 불필요

---

## Quick Start

### 1. 사전 준비

```bash
# agent-browser CLI 설치 (전역)
npm install -g agent-browser

# Chromium 바이너리 설치 (최초 1회)
agent-browser install
```

### 2. 실행

```bash
npx agent-browser-mcp-native
```

끝. stdio로 MCP 서버가 기동된다.

---

## MCP Client 설정

### Claude Desktop / Claude Code

`claude_desktop_config.json` 또는 `.mcp.json`에 추가:

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

### Headful 모드 (브라우저 창 표시)

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "agent-browser-mcp-native"],
      "env": {
        "AGENT_BROWSER_HEADED": "true"
      }
    }
  }
}
```

### Linux / 커스텀 Chrome 경로

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "agent-browser-mcp-native"],
      "env": {
        "AGENT_BROWSER_EXECUTABLE_PATH": "/usr/bin/google-chrome"
      }
    }
  }
}
```

### Playwright 모드 (native 비활성화)

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "agent-browser-mcp-native"],
      "env": {
        "AGENT_BROWSER_NATIVE": "false"
      }
    }
  }
}
```

---

## Overview

```
┌──────────────────────────────────────────────────────────┐
│  AI Agent (Claude, GPT, etc.)                            │
│                                                          │
│  MCP Tool Call                                           │
│    browser_navigate({ url: "..." })                      │
└────────────────┬─────────────────────────────────────────┘
                 │ stdio (JSON-RPC)
                 ▼
┌──────────────────────────────────────────────────────────┐
│  agent-browser-mcp-native  ← npx로 실행                  │
│                                                          │
│  ┌─────────────┐  ┌───────────┐  ┌────────────────────┐  │
│  │  index.js   │→ │  tools.js │→ │   executor.js      │  │
│  │  MCP Server │  │  30 tools │  │   spawn + timeout  │  │
│  └─────────────┘  └───────────┘  └────────┬───────────┘  │
└────────────────────────────────────────────┼──────────────┘
                                             │ child_process.spawn
                                             ▼
┌──────────────────────────────────────────────────────────┐
│  agent-browser CLI (Rust native daemon)                  │
│                                                          │
│  첫 호출 시 데몬 기동 → 이후 호출은 데몬에 명령 전달     │
└────────────────┬─────────────────────────────────────────┘
                 │ CDP (Chrome DevTools Protocol)
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Chrome / Chromium                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

```
┌───────────────────┬──────────────────────────────────────┐
│ 항목              │ 내용                                 │
├───────────────────┼──────────────────────────────────────┤
│ Runtime           │ Node.js >= 18 (ESM)                  │
│ MCP SDK           │ @modelcontextprotocol/sdk ^1.0.0     │
│ Schema Validation │ zod ^3.23.0                          │
│ Browser CLI       │ agent-browser (Rust native daemon)   │
│ Transport         │ stdio (JSON-RPC over stdin/stdout)   │
│ Browser Engine    │ Chrome/Chromium via CDP               │
└───────────────────┴──────────────────────────────────────┘
```

---

## Project Structure

```
agent-browser-mcp-native/
├── package.json        # bin 엔트리포인트, npm 메타데이터
├── doc.md              # 이 문서
└── src/
    ├── index.js        # MCP 서버 부트스트랩 (진입점)
    ├── tools.js        # 30개 MCP 도구 등록 + timeout 분류
    └── executor.js     # agent-browser CLI spawn 래퍼 + timeout
```

### src/index.js — 서버 진입점

- `McpServer` 인스턴스 생성 (name: `agent-browser-mcp-native`)
- `StdioServerTransport`로 stdio 기반 JSON-RPC 통신
- `registerTools(server)` 호출로 모든 도구 등록
- `package.json`의 `bin` 필드로 `npx` 실행 가능

### src/executor.js — CLI 실행 엔진

- `child_process.spawn`으로 `agent-browser` CLI 호출
- Native 모드 기본 활성화: `--native --executable-path <Chrome경로>` 자동 추가
- Timeout 메커니즘: 지정 시간 초과 시 `SIGTERM`으로 프로세스 정리
- stdout → 결과 반환, exit code !== 0 → Error throw

### src/tools.js — MCP 도구 등록

- 30개 도구를 카테고리별로 등록
- 공통 `sessionId` 파라미터 → `--session <name>` 플래그 변환
- 도구별 timeout 차등 적용 (fast / normal / slow)

---

## Environment Variables

### MCP 서버 설정

```
┌──────────────────────────────────┬──────────────────────────────────────────┬───────────────────────────────────────────┐
│ 변수명                           │ 기본값                                   │ 설명                                      │
├──────────────────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────┤
│ AGENT_BROWSER_PATH               │ "agent-browser"                          │ CLI 바이너리 경로                         │
│ AGENT_BROWSER_NATIVE             │ (활성화)                                 │ "false" 설정 시 native 모드 비활성화      │
│ AGENT_BROWSER_EXECUTABLE_PATH    │ /Applications/Google Chrome.app/...      │ Chrome 실행 파일 경로                     │
└──────────────────────────────────┴──────────────────────────────────────────┴───────────────────────────────────────────┘
```

### agent-browser CLI pass-through 환경변수

executor.js가 `process.env`를 그대로 전달하므로, CLI 환경변수도 전부 사용 가능:

```
┌──────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
│ 변수명                                   │ 설명                                                     │
├──────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ AGENT_BROWSER_SESSION                    │ 세션 이름 (기본: "default")                              │
│ AGENT_BROWSER_HEADED                     │ 브라우저 창 표시 (headless 아닌 모드)                    │
│ AGENT_BROWSER_DEBUG                      │ 디버그 출력 활성화                                       │
│ AGENT_BROWSER_JSON                       │ JSON 형식 출력                                           │
│ AGENT_BROWSER_PROFILE                    │ 영구 브라우저 프로필 경로                                │
│ AGENT_BROWSER_PROXY                      │ 프록시 서버 URL                                          │
│ AGENT_BROWSER_USER_AGENT                 │ 커스텀 User-Agent                                        │
│ AGENT_BROWSER_COLOR_SCHEME               │ 색상 스키마 (dark / light / no-preference)               │
│ AGENT_BROWSER_DOWNLOAD_PATH              │ 다운로드 디렉토리                                        │
│ AGENT_BROWSER_DEFAULT_TIMEOUT            │ Playwright 기본 timeout (ms, 기본 25000)                 │
│ AGENT_BROWSER_ALLOWED_DOMAINS            │ 내비게이션 허용 도메인 (콤마 구분)                       │
│ AGENT_BROWSER_MAX_OUTPUT                 │ 페이지 출력 최대 문자수                                  │
│ AGENT_BROWSER_SESSION_NAME               │ 자동 저장/복원용 세션 상태 이름                          │
│ AGENT_BROWSER_ENCRYPTION_KEY             │ AES-256-GCM 세션 암호화 키 (64자 hex)                    │
│ AGENT_BROWSER_IGNORE_HTTPS_ERRORS       │ HTTPS 인증서 에러 무시                                   │
│ AGENT_BROWSER_CONFIG                     │ 커스텀 설정 파일 경로                                    │
└──────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## How It Works

### Daemon Architecture

`agent-browser`는 데몬 방식으로 동작한다. 매 spawn이 새로운 Chrome을 여는 게 아님.

```
첫 번째 호출                     이후 호출
──────────────────               ──────────────────
spawn("agent-browser")    →      spawn("agent-browser")
  ↓                                ↓
데몬 프로세스 기동               기존 데몬에 연결
Chrome 실행 + CDP 연결             명령만 전달 (경량)
  ↓                                ↓
결과 반환                        결과 반환
```

- 2번째 호출부터 `--native, --executable-path ignored: daemon already running` 경고 출력
- `browser_close` 도구로 데몬 종료 가능
- spawn 오버헤드는 데몬이 흡수하므로 무시할 수준

### Session Isolation

모든 도구에 선택적 `sessionId` 파라미터:

```
browser_navigate({ url: "...", sessionId: "work" })
  → agent-browser ... open <url> --session work

browser_navigate({ url: "...", sessionId: "personal" })
  → agent-browser ... open <url> --session personal
```

각 세션은 독립된 브라우저 컨텍스트로 격리.

### Timeout Strategy

```
┌──────────┬─────────┬────────────────────────────────────────────────────────────┐
│ 등급     │ timeout │ 적용 도구                                                  │
├──────────┼─────────┼────────────────────────────────────────────────────────────┤
│ fast     │ 10s     │ snapshot, get(text/html/attr/url/title),                   │
│          │         │ is(visible/enabled/checked), cookies, console,             │
│          │         │ errors, tab(list/close/switch), session list               │
├──────────┼─────────┼────────────────────────────────────────────────────────────┤
│ normal   │ 30s     │ click, fill, type, press, hover, scroll,                  │
│          │         │ select, check, uncheck, focus, drag, eval                  │
├──────────┼─────────┼────────────────────────────────────────────────────────────┤
│ slow     │ 60s     │ navigate, back, forward, reload, screenshot,              │
│          │         │ pdf, wait, tab new, close                                  │
└──────────┴─────────┴────────────────────────────────────────────────────────────┘
```

timeout 초과 시 `SIGTERM`으로 프로세스 강제 종료하여 좀비 프로세스 방지.

---

## MCP Tool Reference

### Navigation

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool            │ CLI Command                  │ Parameters                   │
├─────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_navigate    │ open <url>                   │ url, sessionId?              │
│ browser_go_back     │ back                         │ sessionId?                   │
│ browser_go_forward  │ forward                      │ sessionId?                   │
│ browser_reload      │ reload                       │ sessionId?                   │
└─────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Interaction

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool            │ CLI Command                  │ Parameters                   │
├─────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_click       │ click <selector>             │ selector, sessionId?         │
│ browser_fill        │ fill <selector> <value>      │ selector, value, sessionId?  │
│ browser_type        │ type <selector> <text>       │ selector, text, sessionId?   │
│ browser_press       │ press <key>                  │ key, sessionId?              │
│ browser_hover       │ hover <selector>             │ selector, sessionId?         │
│ browser_scroll      │ scroll <dir> [amount]        │ direction, amount?, sessionId│
│ browser_select      │ select <selector> <value>    │ selector, value, sessionId?  │
│ browser_check       │ check <selector>             │ selector, sessionId?         │
│ browser_uncheck     │ uncheck <selector>           │ selector, sessionId?         │
│ browser_focus       │ focus <selector>             │ selector, sessionId?         │
│ browser_drag        │ drag <source> <target>       │ source, target, sessionId?   │
└─────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Information

```
┌──────────────────────┬──────────────────────────────┬─────────────────────────────────┐
│ MCP Tool             │ CLI Command                  │ Parameters                      │
├──────────────────────┼──────────────────────────────┼─────────────────────────────────┤
│ browser_snapshot     │ snapshot [-i] [-c]           │ interactive?, compact?, session │
│ browser_get_text     │ get text [selector]          │ selector?, sessionId?           │
│ browser_get_html     │ get html [selector]          │ selector?, sessionId?           │
│ browser_get_attribute│ get attr <name> <selector>   │ selector, attribute, sessionId? │
│ browser_get_url      │ get url                      │ sessionId?                      │
│ browser_get_title    │ get title                    │ sessionId?                      │
└──────────────────────┴──────────────────────────────┴─────────────────────────────────┘
```

### State Checks

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool            │ CLI Command                  │ Parameters                   │
├─────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_is_visible  │ is visible <selector>        │ selector, sessionId?         │
│ browser_is_enabled  │ is enabled <selector>        │ selector, sessionId?         │
│ browser_is_checked  │ is checked <selector>        │ selector, sessionId?         │
└─────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Screenshot / PDF

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────────────┐
│ MCP Tool            │ CLI Command                  │ Parameters                           │
├─────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ browser_screenshot  │ screenshot [path] [--full]   │ path?, fullPage?, annotate?,session  │
│ browser_pdf         │ pdf <path>                   │ path, sessionId?                     │
└─────────────────────┴──────────────────────────────┴──────────────────────────────────────┘
```

### JavaScript / Wait

```
┌─────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool            │ CLI Command                  │ Parameters                   │
├─────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_evaluate    │ eval <script>                │ script, sessionId?           │
│ browser_wait        │ wait <target>                │ target, sessionId?           │
└─────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Cookies / Console / Errors

```
┌──────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool             │ CLI Command                  │ Parameters                   │
├──────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_get_cookies  │ cookies get                  │ sessionId?                   │
│ browser_clear_cookies│ cookies clear                │ sessionId?                   │
│ browser_get_console  │ console                      │ sessionId?                   │
│ browser_get_errors   │ errors                       │ sessionId?                   │
└──────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Tabs / Session

```
┌──────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ MCP Tool             │ CLI Command                  │ Parameters                   │
├──────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ browser_tab_list     │ tab list                     │ sessionId?                   │
│ browser_tab_new      │ tab new [url]                │ url?, sessionId?             │
│ browser_tab_close    │ tab close [index]            │ tabIndex?, sessionId?        │
│ browser_tab_switch   │ tab <index>                  │ tabIndex, sessionId?         │
│ browser_session_list │ session list                 │ (none)                       │
│ browser_close        │ close                        │ sessionId?                   │
└──────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## Error Handling

```
┌─────────────────────────────┬──────────────────────────────────────────────────┐
│ 상황                        │ 동작                                             │
├─────────────────────────────┼──────────────────────────────────────────────────┤
│ CLI exit code === 0         │ stdout 반환 (빈 문자열이면 "OK")                │
│ CLI exit code !== 0         │ Error("Exit <code>: <stderr or stdout>") throw  │
│ Timeout 초과                │ SIGTERM 후 Error("Timeout after Nms: ...") throw│
│ spawn 실패 (binary 없음 등) │ Error(err.message) throw                        │
└─────────────────────────────┴──────────────────────────────────────────────────┘
```

---

## Unmapped CLI Commands (확장 가능)

`agent-browser`가 지원하지만 현재 MCP 도구로 매핑되지 않은 커맨드:

```
┌──────────────────────────────┬─────────────────────────────────────────┐
│ CLI Command                  │ 설명                                    │
├──────────────────────────────┼─────────────────────────────────────────┤
│ dblclick <sel>               │ 더블클릭                                │
│ keyboard type/inserttext     │ 셀렉터 없는 키보드 입력                 │
│ upload <sel> <files>         │ 파일 업로드                             │
│ download <sel> <path>        │ 파일 다운로드                           │
│ scrollintoview <sel>         │ 엘리먼트까지 스크롤                     │
│ connect <port|url>           │ CDP로 브라우저 연결                     │
│ find <locator> <value>       │ 엘리먼트 검색                           │
│ mouse move/down/up/wheel     │ 마우스 저수준 제어                      │
│ set viewport/device/geo/...  │ 브라우저 설정                           │
│ network route/unroute/...    │ 네트워크 가로채기                       │
│ storage local/session        │ 웹 스토리지 관리                        │
│ diff snapshot/screenshot/url │ 비교 (스냅샷, 스크린샷, URL)            │
│ trace start/stop             │ Playwright 트레이스 기록                │
│ profiler start/stop          │ Chrome DevTools 프로파일                │
│ record start/stop            │ 비디오 녹화                             │
│ highlight <sel>              │ 엘리먼트 하이라이트                     │
│ auth save/login/list/...     │ 인증 프로필 관리                        │
└──────────────────────────────┴─────────────────────────────────────────┘
```

---

## Design Decisions

### Why thin wrapper?

`agent-browser` CLI가 이미 모든 복잡한 로직(CDP 연결, 데몬 관리, 세션 격리)을 처리.
MCP 서버는 프로토콜 변환만 담당하므로 유지보수 부담 최소화.

### Why native mode default?

- Native Rust 데몬은 Node.js/Playwright 경유보다 빠름
- CDP 직접 연결로 중간 레이어 제거
- `npx agent-browser`(Node.js 모드)보다 cold start가 빠름

### Why spawn per call?

`agent-browser`가 데몬 아키텍처를 채택하고 있어서,
각 spawn은 데몬에 명령을 전달하는 얇은 클라이언트 역할만 수행.
실제 CDP 연결 비용은 데몬이 흡수하므로 spawn 오버헤드는 무시할 수준.

---

## Publish

```bash
# npm 로그인
npm login

# 퍼블리시
npm publish

# 이후 어디서든
npx agent-browser-mcp-native
```

---

## Version

- **Package**: `0.1.0`
- **agent-browser CLI**: `0.16.3` (테스트 기준)
- **MCP SDK**: `^1.0.0`
