import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const wasmBinding = path.join(
  root,
  "node_modules",
  "@rolldown",
  "binding-wasm32-wasi",
  "rolldown-binding.wasi.cjs",
);
const vitestBin = path.join(root, "node_modules", "vitest", "vitest.mjs");

const env = { ...process.env };

if (existsSync(wasmBinding) && !env.NAPI_RS_NATIVE_LIBRARY_PATH) {
  env.NAPI_RS_NATIVE_LIBRARY_PATH = wasmBinding;
}

const child = spawn(process.execPath, [vitestBin, ...process.argv.slice(2)], {
  cwd: root,
  env,
  shell: false,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
