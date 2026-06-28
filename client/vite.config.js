import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function getGitCommitCount() {
  try {
    return execSync("git rev-list --count HEAD", { encoding: "utf-8", cwd: repoRoot }).trim();
  } catch {
    return "0";
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_COMMIT_COUNT__: JSON.stringify(getGitCommitCount()),
  },
});
