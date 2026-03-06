import { z } from "zod";
import { exec as _exec } from "./executor.js";

const TIMEOUT = {
  fast: 10_000,    // snapshot, get, is, console, errors, cookies, tab, session
  normal: 30_000,  // click, fill, type, press, hover, scroll, select, check, focus, drag, eval, wait
  slow: 60_000,    // navigate, screenshot, pdf, close
};

function exec(args, timeout = TIMEOUT.normal) {
  return _exec(args, { timeout });
}

const sessionOpt = z
  .string()
  .optional()
  .describe("Browser session name for isolation");

function s(sessionId) {
  return sessionId ? ["--session", sessionId] : [];
}

export function registerTools(server) {
  // --- Navigation ---

  server.tool(
    "browser_navigate",
    "Navigate to a URL",
    { url: z.string().describe("URL to navigate to"), sessionId: sessionOpt },
    async ({ url, sessionId }) => {
      const r = await exec(["open", url, ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_go_back",
    "Go back in browser history",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["back", ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_go_forward",
    "Go forward in browser history",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["forward", ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_reload",
    "Reload the current page",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["reload", ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Interaction ---

  server.tool(
    "browser_click",
    "Click an element (CSS selector or @ref from snapshot)",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["click", selector, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_fill",
    "Clear and fill a text input",
    {
      selector: z.string().describe("CSS selector or @ref"),
      value: z.string().describe("Text to fill"),
      sessionId: sessionOpt,
    },
    async ({ selector, value, sessionId }) => {
      const r = await exec(["fill", selector, value, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_type",
    "Type text character by character (triggers key events)",
    {
      selector: z.string().describe("CSS selector or @ref"),
      text: z.string().describe("Text to type"),
      sessionId: sessionOpt,
    },
    async ({ selector, text, sessionId }) => {
      const r = await exec(["type", selector, text, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_press",
    "Press a keyboard key (Enter, Tab, Control+a, etc.)",
    {
      key: z.string().describe("Key to press"),
      sessionId: sessionOpt,
    },
    async ({ key, sessionId }) => {
      const r = await exec(["press", key, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_hover",
    "Hover over an element",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["hover", selector, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_scroll",
    "Scroll the page",
    {
      direction: z
        .enum(["up", "down", "left", "right"])
        .describe("Scroll direction"),
      amount: z.number().optional().describe("Pixels to scroll"),
      sessionId: sessionOpt,
    },
    async ({ direction, amount, sessionId }) => {
      const args = ["scroll", direction];
      if (amount != null) args.push(String(amount));
      args.push(...s(sessionId));
      const r = await exec(args);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_select",
    "Select a dropdown option",
    {
      selector: z.string().describe("CSS selector or @ref"),
      value: z.string().describe("Option value or label"),
      sessionId: sessionOpt,
    },
    async ({ selector, value, sessionId }) => {
      const r = await exec(["select", selector, value, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_check",
    "Check a checkbox",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["check", selector, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_uncheck",
    "Uncheck a checkbox",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["uncheck", selector, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_focus",
    "Focus an element",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["focus", selector, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_drag",
    "Drag and drop",
    {
      source: z.string().describe("Source selector"),
      target: z.string().describe("Target selector"),
      sessionId: sessionOpt,
    },
    async ({ source, target, sessionId }) => {
      const r = await exec(["drag", source, target, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Information ---

  server.tool(
    "browser_snapshot",
    "Get accessibility tree snapshot (AI-friendly element refs)",
    {
      interactive: z
        .boolean()
        .optional()
        .describe("Only interactive elements"),
      compact: z
        .boolean()
        .optional()
        .describe("Remove empty structural elements"),
      sessionId: sessionOpt,
    },
    async ({ interactive, compact, sessionId }) => {
      const args = ["snapshot"];
      if (interactive) args.push("-i");
      if (compact) args.push("-c");
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_text",
    "Get text content from an element or page",
    {
      selector: z
        .string()
        .optional()
        .describe("CSS selector or @ref (full page if omitted)"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const args = ["get", "text"];
      if (selector) args.push(selector);
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_html",
    "Get HTML content from an element or page",
    {
      selector: z
        .string()
        .optional()
        .describe("CSS selector or @ref (full page if omitted)"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const args = ["get", "html"];
      if (selector) args.push(selector);
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_attribute",
    "Get an attribute value from an element",
    {
      selector: z.string().describe("CSS selector or @ref"),
      attribute: z.string().describe("Attribute name"),
      sessionId: sessionOpt,
    },
    async ({ selector, attribute, sessionId }) => {
      const r = await exec([
        "get",
        "attr",
        attribute,
        selector,
        ...s(sessionId),
      ], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_url",
    "Get the current page URL",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["get", "url", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_title",
    "Get the current page title",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["get", "title", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- State checks ---

  server.tool(
    "browser_is_visible",
    "Check if an element is visible",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["is", "visible", selector, ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_is_enabled",
    "Check if an element is enabled",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["is", "enabled", selector, ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_is_checked",
    "Check if a checkbox/radio is checked",
    {
      selector: z.string().describe("CSS selector or @ref"),
      sessionId: sessionOpt,
    },
    async ({ selector, sessionId }) => {
      const r = await exec(["is", "checked", selector, ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Screenshot / PDF ---

  server.tool(
    "browser_screenshot",
    "Take a screenshot",
    {
      path: z
        .string()
        .optional()
        .describe("File path to save (returns base64 if omitted)"),
      fullPage: z.boolean().optional().describe("Capture full scrollable page"),
      annotate: z
        .boolean()
        .optional()
        .describe("Annotated screenshot with numbered labels"),
      sessionId: sessionOpt,
    },
    async ({ path, fullPage, annotate, sessionId }) => {
      const args = ["screenshot"];
      if (path) args.push(path);
      if (fullPage) args.push("--full");
      if (annotate) args.push("--annotate");
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_pdf",
    "Save page as PDF",
    {
      path: z.string().describe("File path to save"),
      sessionId: sessionOpt,
    },
    async ({ path, sessionId }) => {
      const r = await exec(["pdf", path, ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Wait ---

  server.tool(
    "browser_wait",
    "Wait for an element or time (ms)",
    {
      target: z
        .string()
        .describe("CSS selector, @ref, or milliseconds"),
      sessionId: sessionOpt,
    },
    async ({ target, sessionId }) => {
      const r = await exec(["wait", target, ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- JavaScript ---

  server.tool(
    "browser_evaluate",
    "Execute JavaScript in the browser context",
    {
      script: z.string().describe("JavaScript code"),
      sessionId: sessionOpt,
    },
    async ({ script, sessionId }) => {
      const r = await exec(["eval", script, ...s(sessionId)]);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Cookies ---

  server.tool(
    "browser_get_cookies",
    "Get browser cookies",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["cookies", "get", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_clear_cookies",
    "Clear all cookies",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["cookies", "clear", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Console / Errors ---

  server.tool(
    "browser_get_console",
    "Get console log messages",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["console", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_get_errors",
    "Get page errors",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["errors", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Tabs ---

  server.tool(
    "browser_tab_list",
    "List open tabs",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["tab", "list", ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_tab_new",
    "Open a new tab",
    {
      url: z.string().optional().describe("URL to open in new tab"),
      sessionId: sessionOpt,
    },
    async ({ url, sessionId }) => {
      const args = ["tab", "new"];
      if (url) args.push(url);
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_tab_close",
    "Close a tab",
    {
      tabIndex: z.number().optional().describe("Tab index to close"),
      sessionId: sessionOpt,
    },
    async ({ tabIndex, sessionId }) => {
      const args = ["tab", "close"];
      if (tabIndex != null) args.push(String(tabIndex));
      args.push(...s(sessionId));
      const r = await exec(args, TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_tab_switch",
    "Switch to a tab by index",
    {
      tabIndex: z.number().describe("Tab index to switch to"),
      sessionId: sessionOpt,
    },
    async ({ tabIndex, sessionId }) => {
      const r = await exec(["tab", String(tabIndex), ...s(sessionId)], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  // --- Session ---

  server.tool(
    "browser_session_list",
    "List active browser sessions",
    {},
    async () => {
      const r = await exec(["session", "list"], TIMEOUT.fast);
      return { content: [{ type: "text", text: r }] };
    }
  );

  server.tool(
    "browser_close",
    "Close the browser",
    { sessionId: sessionOpt },
    async ({ sessionId }) => {
      const r = await exec(["close", ...s(sessionId)], TIMEOUT.slow);
      return { content: [{ type: "text", text: r }] };
    }
  );
}
