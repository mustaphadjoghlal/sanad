const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const [, , dir, mode, out, ...rest] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("CONSOLE", m.text()));
  await page.goto("file://" + path.join(dir, "index.html"));
  await page.evaluate(() => window.ready);
  const stage = await page.$("#stage");
  if (mode === "stills") {
    for (const t of rest.map(Number)) {
      await page.evaluate((t) => window.render(t), t);
      await stage.screenshot({ path: `${out}/still-${String(t).padStart(5, "0")}.jpg`, type: "jpeg", quality: 80 });
    }
  } else {
    const fps = 30;
    const dur = await page.evaluate(() => window.DURATION);
    const n = Math.round(dur * fps);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", out],
      { stdio: ["pipe", "inherit", "inherit"] });
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => window.render(t), f / fps);
      const buf = await stage.screenshot({ type: "jpeg", quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % 150 === 0) console.log(`frame ${f}/${n}`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
  }
  await browser.close();
})();
