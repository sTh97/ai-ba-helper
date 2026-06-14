import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, statSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(__dirname, "index.html");
const OUT_PATH = join(__dirname, "AI-BA-Helper-Technical-Overview.pdf");

// Resolve a usable Chrome binary. Prefer an explicit override, then whatever
// Puppeteer would pick, then the newest browser already in the local cache
// (avoids a fresh multi-hundred-MB download in proxied environments).
const resolveExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  try {
    const p = puppeteer.executablePath();
    if (p && existsSync(p)) return p;
  } catch {
    /* pinned build not installed — fall back to cache scan */
  }

  const cacheRoot = join(homedir(), ".cache", "puppeteer", "chrome");
  if (!existsSync(cacheRoot)) return undefined;

  const candidates = readdirSync(cacheRoot)
    .map((dir) => join(cacheRoot, dir, "chrome-win64", "chrome.exe"))
    .filter((exe) => existsSync(exe))
    .sort();

  return candidates.length ? candidates[candidates.length - 1] : undefined;
};

const footer = `
  <div style="width:100%;font-size:7px;color:#6b7689;padding:0 12mm;
              display:flex;justify-content:space-between;font-family:Segoe UI,Arial,sans-serif;">
    <span>AI BA Helper — Technical Overview</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const main = async () => {
  if (!existsSync(HTML_PATH)) {
    throw new Error(`HTML source not found at ${HTML_PATH}`);
  }

  const executablePath = resolveExecutablePath();
  if (executablePath) console.log(`Using Chrome: ${executablePath}`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") console.warn("page error:", msg.text());
    });

    await page.goto(pathToFileURL(HTML_PATH).href, {
      waitUntil: "networkidle0",
      timeout: 120000,
    });

    // Wait for every Mermaid block to render into an <svg> (or give up gracefully).
    try {
      await page.waitForFunction(
        () => {
          const blocks = Array.from(document.querySelectorAll(".mermaid"));
          if (blocks.length === 0) return true;
          return blocks.every((b) => b.querySelector("svg"));
        },
        { timeout: 45000, polling: 500 }
      );
    } catch {
      console.warn("Mermaid render wait timed out — continuing with whatever rendered.");
    }

    // Small settle delay so fonts/diagrams finish painting.
    await new Promise((r) => setTimeout(r, 1200));

    await page.pdf({
      path: OUT_PATH,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footer,
      margin: { top: "12mm", bottom: "16mm", left: "0mm", right: "0mm" },
    });

    const sizeKb = Math.round(statSync(OUT_PATH).size / 1024);
    console.log(`PDF written: ${OUT_PATH} (${sizeKb} KB)`);
  } finally {
    await browser.close();
  }
};

main().catch((err) => {
  console.error("PDF generation failed:", err.message);
  process.exit(1);
});
