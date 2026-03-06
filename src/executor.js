import { spawn } from "child_process";

const AGENT_BROWSER_PATH =
  process.env.AGENT_BROWSER_PATH || "agent-browser";

const USE_NATIVE = process.env.AGENT_BROWSER_NATIVE !== "false";
const CHROME_PATH =
  process.env.AGENT_BROWSER_EXECUTABLE_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const DEFAULT_TIMEOUT = 30_000;

export function exec(args, { env = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const fullArgs = USE_NATIVE
    ? ["--native", "--executable-path", CHROME_PATH, ...args]
    : args;
  console.error(`[debug] ${AGENT_BROWSER_PATH} ${fullArgs.join(" ")}`);
  return new Promise((resolve, reject) => {
    const proc = spawn(AGENT_BROWSER_PATH, fullArgs, {
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      reject(new Error(`Timeout after ${timeout}ms: ${fullArgs.join(" ")}`));
    }, timeout);

    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) return;
      if (code === 0) {
        resolve(stdout.trim() || "OK");
      } else {
        const msg = stderr.trim() || stdout.trim();
        reject(new Error(`Exit ${code}: ${msg}`));
      }
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      if (killed) return;
      reject(new Error(err.message));
    });
  });
}
