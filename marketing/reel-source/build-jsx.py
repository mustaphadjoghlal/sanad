"""Builds SanadReel.jsx — one self-contained React component — from index.html.

index.html stays the source of truth (it is what capture.cjs renders to MP4);
run this after changing it:  python3 build-jsx.py
"""
import base64, io, json, re
from PIL import Image

html = open("index.html", encoding="utf-8").read()

def webp_uri(path, width):
    im = Image.open(path).convert("RGBA")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=88, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()

# ── CSS: drop the local @font-face rules and the page-level ones, and scope
#    every selector under .sr so nothing leaks into the host app. ──────────
css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
out = []
for line in css.split("\n"):
    if "@font-face" in line or line.strip().startswith("html, body"):
        continue
    m = re.match(r"^(\s*)([^@{}\s][^{]*?)\s*\{(.*)$", line)
    if m:
        indent, sels, rest = m.groups()
        scoped = ", ".join(".sr" if s.strip() == ":root" else ".sr " + s.strip() for s in sels.split(","))
        line = f"{indent}{scoped} {{{rest}"
    out.append(line)
css = "\n".join(out).strip()

# ── Script: the scene, as a function of the stage element. ────────────────
js = re.search(r"<script>\n(.*?)</script>", html, re.S).group(1)
js = js.replace('const stage = document.getElementById("stage");\n', "")
js = js.replace("document.getElementById(", "$(")
js = js.replace("[...document.images]", "[...stage.querySelectorAll(\"img\")]")
js = js.replace('src="icon-512.png"', 'src="${ICON_SRC}"').replace('src="logo.png"', 'src="${LOGO_SRC}"')
js = js.replace("window.DURATION = 28.0;", "const DURATION = 28.0;")
js = js.replace("window.DURATION", "DURATION")
js = js.replace("window.render = (t) => {", "const render = (t) => {")
js = js.replace("window.render(0);", "render(0);")
js = js.replace("window.ready = (async () => {", "const ready = (async () => {")
assert "window." not in js, [l for l in js.split("\n") if "window." in l]
js = "\n".join("  " + l if l else l for l in js.rstrip().split("\n"))

stage_inner = re.search(r'<div id="stage">(.*?)\n</div>\n<script', html, re.S).group(1).strip()
icons = open("icons.js", encoding="utf-8").read().strip()
icons = icons.replace("window.ICONS = ", "").rstrip(";")

jsx = f'''/**
 * SanadReel — the Sanad social reel as one React component.
 *
 * 1080×1920 (9:16), 28 seconds. Scaled to fit its container, with play,
 * pause and a scrubber. Fonts come from Google Fonts; the two logos are
 * embedded, so the file needs nothing beside it.
 *
 * Usage:  import SanadReel from "./SanadReel";   <SanadReel />
 *
 * Generated from marketing/reel-source/index.html by build-jsx.py — change
 * the scene there and rebuild, so the MP4 and this component stay the same.
 */
import {{ useEffect, useRef, useState }} from "react";

const ICON_SRC = "{webp_uri("icon-512.png", 420)}";
const LOGO_SRC = "{webp_uri("logo.png", 543)}";

const ICONS = {icons};

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Tajawal:wght@500;700&display=block");
{css}
`;

const STAGE_HTML = `{stage_inner}`;

/** Builds the scene inside `stage` and returns {{ render(t), DURATION, ready }}. */
function buildScene(stage) {{
  const $ = (id) => stage.querySelector("#" + id);
{js}

  return {{ render, DURATION, ready }};
}}

const W = 1080, H = 1920;

export default function SanadReel({{ autoPlay = true, loop = true }}) {{
  const boxRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const timeRef = useRef(0);
  const playingRef = useRef(autoPlay);
  const [playing, setPlaying] = useState(autoPlay);
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(0.3);
  const [ready, setReady] = useState(false);

  // Build the scene once, and run the clock.
  useEffect(() => {{
    const stage = stageRef.current;
    stage.innerHTML = STAGE_HTML;
    const scene = buildScene(stage);
    sceneRef.current = scene;
    let raf = 0, last = 0, lastUi = 0, alive = true;

    scene.ready.then(() => {{
      if (!alive) return;
      setReady(true);
      const tick = (now) => {{
        const dt = last ? (now - last) / 1000 : 0;
        last = now;
        if (playingRef.current) {{
          let t = timeRef.current + dt;
          if (t >= scene.DURATION) {{
            if (loop) t %= scene.DURATION;
            else {{ t = scene.DURATION; playingRef.current = false; setPlaying(false); }}
          }}
          timeRef.current = t;
          scene.render(t);
        }}
        if (now - lastUi > 100) {{ lastUi = now; setTime(timeRef.current); }}
        raf = requestAnimationFrame(tick);
      }};
      raf = requestAnimationFrame(tick);
    }});

    return () => {{ alive = false; cancelAnimationFrame(raf); stage.innerHTML = ""; }};
  }}, [loop]);

  // Fit 1080×1920 into whatever space the component is given.
  useEffect(() => {{
    const box = boxRef.current;
    const fit = () => {{
      const maxH = Math.min(window.innerHeight * 0.82, H);
      setScale(Math.min(box.clientWidth / W, maxH / H));
    }};
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    window.addEventListener("resize", fit);
    return () => {{ ro.disconnect(); window.removeEventListener("resize", fit); }};
  }}, []);

  const toggle = () => {{
    const scene = sceneRef.current;
    if (!scene) return;
    if (!playingRef.current && timeRef.current >= scene.DURATION) timeRef.current = 0;
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }};

  const seek = (t) => {{
    timeRef.current = t;
    sceneRef.current?.render(t);
    setTime(t);
  }};

  const fmt = (s) => `0:${{String(Math.floor(s)).padStart(2, "0")}}`;

  return (
    <div ref={{boxRef}} className="sr" style={{{{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}}}>
      <style>{{CSS}}</style>
      <div
        onClick={{toggle}}
        style={{{{ width: W * scale, height: H * scale, borderRadius: 16, overflow: "hidden", position: "relative", cursor: "pointer", background: "#000", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}}}
      >
        <div ref={{stageRef}} id="stage" style={{{{ transform: `scale(${{scale}})`, transformOrigin: "top left" }}}} />
        {{!ready && (
          <div style={{{{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#2ee6a0", fontFamily: "sans-serif" }}}}>
            …
          </div>
        )}}
      </div>
      <div dir="ltr" style={{{{ width: W * scale, display: "flex", alignItems: "center", gap: 12, fontFamily: "system-ui, sans-serif", color: "#cfe9db", fontSize: 13 }}}}>
        <button
          type="button"
          onClick={{toggle}}
          aria-label={{playing ? "إيقاف مؤقت" : "تشغيل"}}
          style={{{{ width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#00a355,#2ee6a0)", color: "#fff", fontSize: 15, flexShrink: 0 }}}}
        >
          {{playing ? "❚❚" : "▶"}}
        </button>
        <input
          type="range"
          min={{0}}
          max={{28}}
          step={{0.01}}
          value={{time}}
          onChange={{(e) => seek(Number(e.target.value))}}
          aria-label="موضع الفيديو"
          style={{{{ flex: 1, accentColor: "#00a355" }}}}
        />
        <span style={{{{ fontVariantNumeric: "tabular-nums", minWidth: 70, textAlign: "right" }}}}>{{fmt(time)}} / 0:28</span>
      </div>
    </div>
  );
}}
'''
open("SanadReel.jsx", "w", encoding="utf-8").write(jsx)
print(len(jsx))
