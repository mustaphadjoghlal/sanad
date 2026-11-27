/*
 * سند — فيديو «لا تعلّق مهتم… تواصل» في After Effects
 *
 * يبني مشروعاً كاملاً: تركيبة 1080×1920، 45.5 ثانية، 30 إطاراً، مع المؤثرات الصوتية.
 * كل نص طبقة نص تعدّلها، وكل بطاقة طبقات شكل، وكل حركة مفاتيح على الخط الزمني.
 *
 * قبل التشغيل:
 *   1. ثبّت الخطين Cairo و Tajawal (من Google Fonts).
 *   2. Preferences ← Type ← Text Engine: اختر
 *      "South Asian and Middle Eastern" ثم أعد تشغيل After Effects،
 *      وإلا ظهرت الحروف العربية منفصلة.
 *
 * التشغيل: File ← Scripts ← Run Script File… ثم اختر هذا الملف.
 * يجب أن يبقى مجلد assets بجانبه.
 *
 * ExtendScript (ES3): no let/const, arrow functions, template strings,
 * Array.map/forEach/indexOf or JSON — keep it that way.
 */
(function () {
  var DUR = 45.5, FPS = 30, W = 1080, H = 1920, CX = 540;
  var here = File($.fileName).parent;
  var assets = new Folder(here.fsName + "/assets");
  if (!assets.exists) { alert("لم أجد مجلد assets بجانب السكربت.\nAssets folder not found next to the script."); return; }

  app.beginUndoGroup("Sanad Apply Reel");

  // ── colours ────────────────────────────────────────────────────────
  function hex(h) {
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }
  var C = {
    bg: hex("#06110b"), g1: hex("#00a355"), g2: hex("#2ee6a0"), g3: hex("#006233"), red: hex("#ef4444"),
    white: [1, 1, 1], card: hex("#151b17"), bub: hex("#1b2420"), dark: hex("#121a15")
  };

  // ── fonts: look them up when this version of AE can, else use the usual names
  function font(family, style, ps) {
    try {
      if (app.fonts && app.fonts.getFontsByFamilyNameAndStyleName) {
        var found = app.fonts.getFontsByFamilyNameAndStyleName(family, style);
        if (found && found.length) return found[0].postScriptName;
      }
    } catch (e) {}
    return ps;
  }
  var F = {
    black: font("Cairo", "Black", "Cairo-Black"),
    xbold: font("Cairo", "ExtraBold", "Cairo-ExtraBold"),
    bold: font("Cairo", "Bold", "Cairo-Bold"),
    tbold: font("Tajawal", "Bold", "Tajawal-Bold"),
    tmed: font("Tajawal", "Medium", "Tajawal-Medium")
  };

  // ── project ────────────────────────────────────────────────────────
  var folder = app.project.items.addFolder("Sanad Apply Reel");
  var comp = app.project.items.addComp("Sanad Apply Reel 9x16", W, H, 1, DUR, FPS);
  comp.parentFolder = folder;
  comp.bgColor = C.bg;

  var footage = {};
  function img(name) {
    if (!footage[name]) {
      var f = app.project.importFile(new ImportOptions(new File(assets.fsName + "/" + name)));
      f.parentFolder = folder;
      footage[name] = f;
    }
    return footage[name];
  }

  // ── keyframes ──────────────────────────────────────────────────────
  function dims(prop) {
    var t = prop.propertyValueType;
    if (t === PropertyValueType.TwoD) return 2;
    if (t === PropertyValueType.ThreeD) return 3;
    return 1;
  }
  /** keys(prop, [[time, value], ...], influence) — eased in and out. */
  function keys(prop, list, infl) {
    var i;
    for (i = 0; i < list.length; i++) prop.setValueAtTime(list[i][0], list[i][1]);
    var n = dims(prop), e = [];
    for (i = 0; i < n; i++) e.push(new KeyframeEase(0, infl || 75));
    for (i = 1; i <= prop.numKeys; i++) {
      try { prop.setTemporalEaseAtKey(i, e, e); } catch (err) {}
    }
  }
  function tr(l, name) { return l.property("ADBE Transform Group").property(name); }
  function P(l) { return tr(l, "ADBE Position"); }
  function S(l) { return tr(l, "ADBE Scale"); }
  function O(l) { return tr(l, "ADBE Opacity"); }
  function R(l) { return tr(l, "ADBE Rotate Z"); }
  function sc(v) { return [v, v]; }
  function life(l, a, b) { l.inPoint = a; l.outPoint = Math.min(b, DUR); }
  function expr(prop, e) { try { prop.expression = e; } catch (err) {} }

  /** A child follows its parent's opacity, which parenting alone does not do. */
  function child(l, parent, x, y) {
    l.parent = parent;
    P(l).setValue([x, y]);
    expr(O(l), "parent.transform.opacity * value / 100");
    return l;
  }

  // ── shapes ─────────────────────────────────────────────────────────
  function shapeLayer(name) {
    var l = comp.layers.addShape();
    l.name = name;
    P(l).setValue([CX, H / 2]);
    return l;
  }
  function contents(l) {
    var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    return g.property("ADBE Vectors Group");
  }
  function paint(c, o) {
    if (o.stroke) {
      var st = c.addProperty("ADBE Vector Graphic - Stroke");
      st.property("ADBE Vector Stroke Color").setValue(o.stroke);
      st.property("ADBE Vector Stroke Width").setValue(o.sw || 2);
      st.property("ADBE Vector Stroke Opacity").setValue(o.so === undefined ? 100 : o.so);
      try { st.property("ADBE Vector Stroke Line Cap").setValue(2); } catch (e) {}
    }
    if (o.fill) {
      var f = c.addProperty("ADBE Vector Graphic - Fill");
      f.property("ADBE Vector Fill Color").setValue(o.fill);
      f.property("ADBE Vector Fill Opacity").setValue(o.fo === undefined ? 100 : o.fo);
    }
  }
  function rect(name, w, h, r, o) {
    var l = shapeLayer(name), c = contents(l);
    var s = c.addProperty("ADBE Vector Shape - Rect");
    s.property("ADBE Vector Rect Size").setValue([w, h]);
    s.property("ADBE Vector Rect Roundness").setValue(r);
    paint(c, o);
    return l;
  }
  function ellipse(name, d, o) {
    var l = shapeLayer(name), c = contents(l);
    c.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([d, d]);
    paint(c, o);
    return l;
  }
  function blur(l, amount) {
    try {
      var b = l.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
      b.property(1).setValue(amount);
      try { b.property(3).setValue(1); } catch (e) {} // repeat edge pixels
    } catch (e) {}
  }
  function glow(l, radius, intensity) {
    try {
      var g = l.property("ADBE Effect Parade").addProperty("ADBE Glo2");
      g.property("ADBE Glo2-0003").setValue(radius);
      g.property("ADBE Glo2-0004").setValue(intensity);
    } catch (e) {}
  }

  // ── text ───────────────────────────────────────────────────────────
  var JUST = { c: ParagraphJustification.CENTER_JUSTIFY, r: ParagraphJustification.RIGHT_JUSTIFY };
  function text(name, str, f, size, color, just) {
    var l = comp.layers.addText(str);
    l.name = name;
    var sp = l.property("ADBE Text Properties").property("ADBE Text Document");
    var td = sp.value;
    try { td.resetCharStyle(); td.resetParagraphStyle(); } catch (e) {}
    td.font = f;
    td.fontSize = size;
    td.applyFill = true;
    td.fillColor = color;
    td.applyStroke = false;
    td.justification = JUST[just || "c"];
    try { td.autoLeading = false; td.leading = Math.round(size * 1.3); } catch (e) {}
    try { td.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; } catch (e) {}
    sp.setValue(td);
    return l;
  }
  /** Moves the anchor to the middle of the text (or its right edge), so position means what it says. */
  function anchor(l, side) {
    var r = l.sourceRectAtTime(l.inPoint, false);
    var x = side === "r" ? r.left + r.width : r.left + r.width / 2;
    tr(l, "ADBE Anchor Point").setValue([x, r.top + r.height / 2]);
    return r;
  }
  function textWidth(l) { return l.sourceRectAtTime(0, false).width; }

  function animator(l, name) {
    var a = l.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    a.name = name;
    return a;
  }
  function selector(a) {
    var s = a.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    try { s.property("ADBE Text Range Advanced").property("ADBE Text Range Type2").setValue(3); } catch (e) {} // based on words
    return s;
  }
  /** Colours words [from, to) — counted in reading order, from 0. */
  function accent(l, from, to, color) {
    var a = animator(l, "Accent");
    a.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color").setValue(color || C.g2);
    var s = selector(a);
    try {
      s.property("ADBE Text Range Advanced").property("ADBE Text Range Units").setValue(2); // index
      s.property("ADBE Text Index Start").setValue(from);
      s.property("ADBE Text Index End").setValue(to);
    } catch (e) {}
  }
  /** Words rise in one after another. */
  function reveal(l, start, words) {
    var a = animator(l, "Reveal");
    var p = a.property("ADBE Text Animator Properties");
    p.addProperty("ADBE Text Opacity").setValue(0);
    p.addProperty("ADBE Text Position 3D").setValue([0, 60, 0]);
    try { p.addProperty("ADBE Text Blur").setValue([12, 12]); } catch (e) {}
    var s = selector(a);
    keys(s.property("ADBE Text Percent Start"), [[start, 0], [start + 0.25 + words * 0.09, 100]], 40);
  }

  /** A headline: words rise in, then it leaves upward. `|` breaks the line. */
  function headline(name, str, y, size, start, end, acc, dimAt, accColor) {
    var lines = str.split(" | ");
    var l = text(name, lines.join("\r"), F.black, size, C.white, "c");
    anchor(l);
    var words = str.replace(/ \| /g, " ").split(" ").length;
    P(l).setValue([CX, y]);
    reveal(l, start, words);
    if (acc) accent(l, acc[0], acc[1], accColor);
    var o = [[start, 100]];
    if (dimAt) o.push([dimAt, 100], [dimAt + 0.4, 50]);
    if (end < DUR) {
      o.push([end, dimAt ? 50 : 100], [end + 0.35, 0]);
      keys(P(l), [[end, [CX, y]], [end + 0.35, [CX, y - 50]]]);
    }
    keys(O(l), o);
    life(l, start, end + 0.4);
    return l;
  }

  function icon(name, file, px, parent, x, y) {
    var l = comp.layers.add(img(file));
    l.name = name;
    var f = px / l.source.width * 100;
    S(l).setValue([f, f]);
    if (parent) child(l, parent, x, y);
    return l;
  }

  // ── building blocks for this reel ──────────────────────────────────
  var RED = hex("#ef4444"), GREY = hex("#7f8a84");

  /** Pops in at `a` (rising `dy`, sliding `dx`), leaves upward at `b`. `s` is the resting scale in %. */
  function popIn(l, x, y, a, b, s, dy, dx) {
    s = s || 100; dy = dy === undefined ? 60 : dy; dx = dx || 0;
    keys(S(l), [[a, sc(s * 0.85)], [a + 0.4, sc(s * 1.03)], [a + 0.6, sc(s)]]);
    var o = [[a, 0], [a + 0.3, 100]], pk = [[a, [x + dx, y + dy]], [a + 0.6, [x, y]]];
    if (b < DUR) { o.push([b, 100], [b + 0.4, 0]); pk.push([b, [x, y]], [b + 0.4, [x, y - 40]]); }
    keys(O(l), o);
    keys(P(l), pk);
    life(l, a, b + 0.4);
    return l;
  }
  /** Text placed by its right edge, as Arabic lines are aligned. */
  function rtext(name, str, f, size, color, parent, x, y) {
    var l = text(name, str, f, size, color, "r");
    anchor(l, "r");
    return child(l, parent, x, y);
  }
  function ctext(name, str, f, size, color, parent, x, y) {
    var l = text(name, str, f, size, color, "c");
    anchor(l);
    return child(l, parent, x, y);
  }
  function ltr(l) {
    try {
      var d = l.property("ADBE Text Properties").property("ADBE Text Document");
      var v = d.value; v.direction = ParagraphDirection.DIRECTION_LEFT_TO_RIGHT; d.setValue(v);
    } catch (e) {}
    return l;
  }
  /** A rounded label sized to its text, with an optional icon on its right. */
  function pill(name, str, iconFile, size, o) {
    var t = text(name + " Text", str, o.font || F.xbold, size, o.color || C.white, "c");
    var tw = textWidth(t), pad = Math.round(size * 0.8), gap = iconFile ? size + 12 : 0;
    var w = tw + gap + pad * 2, h = Math.round(size * 2.1);
    var r = rect(name, w, h, h / 2, { fill: o.fill || hex("#0f2a1b"), fo: o.fo === undefined ? 100 : o.fo,
      stroke: o.stroke, sw: o.sw || 2, so: o.so === undefined ? 55 : o.so });
    anchor(t);
    child(t, r, iconFile ? w / 2 - pad - gap - tw / 2 : 0, 0);
    t.moveBefore(r);
    if (iconFile) icon(name + " Icon", iconFile, size, r, w / 2 - pad - size / 2, 0);
    return r;
  }
  /** A shape's width as drawn — layers cannot carry extra fields in ExtendScript. */
  function wOf(l) { return l.sourceRectAtTime(0, false).width; }
  function stepChip(n, label, a, b) {
    var t = text("Step " + n + " Label", label, F.black, 36, hex("#c9f5dd"), "c");
    var tw = textWidth(t), w = tw + 58 + 14 + 30 + 16;
    var c = rect("Step " + n, w, 76, 38, { fill: C.g2, fo: 10, stroke: C.g2, sw: 2, so: 35 });
    anchor(t); child(t, c, -w / 2 + 30 + tw / 2, 0); t.moveBefore(c);
    var num = ellipse("Step " + n + " Number", 58, { fill: C.g1 });
    child(num, c, w / 2 - 16 - 29, 0);
    ctext("Step " + n + " Number Text", String(n), F.black, 34, C.white, num, 0, 0);
    popIn(c, CX, 250, a, b, 100, 30);
  }
  function windowBar(win, w, top, title) {
    var bar = rect(win.name + " Bar", w, 70, 36, { fill: hex("#e3ebe6") });
    child(bar, win, 0, top + 35);
    child(rect(win.name + " Bar Base", w, 36, 0, { fill: hex("#e3ebe6") }), win, 0, top + 52);
    var cols = ["#ef4444", "#f59e0b", "#22c55e"];
    for (var k = 0; k < 3; k++) child(ellipse(win.name + " Dot " + (k + 1), 18, { fill: hex(cols[k]) }), win, -w / 2 + 38 + k * 28, top + 35);
    rtext(win.name + " Title", title, F.xbold, 26, hex("#4a5a51"), win, w / 2 - 30, top + 35);
  }
  function divider(win, w, y) { child(rect(win.name + " Divider", w, 2, 0, { fill: hex("#dfe6e2") }), win, 0, y); }

  // Layers stack newest on top, so each scene is built bottom-up.

  // ═══ Background ════════════════════════════════════════════════════
  var bg = comp.layers.addSolid(C.bg, "BG", W, H, 1, DUR);
  var glowG = ellipse("BG Glow Green", 1400, { fill: hex("#00c46a") });
  blur(glowG, 320);
  expr(P(glowG), "[540 + Math.sin(time * 0.4) * 60, 1140 + Math.cos(time * 0.33) * 80]");
  keys(O(glowG), [[0.3, 32], [1.1, 8], [10.2, 8], [11.0, 32]]);
  var glowR = ellipse("BG Glow Red", 1400, { fill: RED });
  blur(glowR, 320);
  expr(P(glowR), "[540 + Math.cos(time * 0.5) * 80, 1260 + Math.sin(time * 0.45) * 100]");
  keys(O(glowR), [[0.3, 0], [1.1, 20], [10.2, 20], [11.0, 0]]);
  var i;
  for (i = 0; i < 28; i++) {
    var d = ellipse("BG Dot " + (i + 1), 6 + (i % 3) * 3, { fill: C.g2 });
    P(d).setValue([(i * 397) % W, (i * 811) % H]);
    expr(P(d), "var s = " + (20 + (i * 13) % 50) + "; [value[0] + Math.sin(time * 0.8 + " + i + ") * 14, ((value[1] - time * s) % 1920 + 1920) % 1920]");
    expr(O(d), "(15 + 35 * (0.5 + 0.5 * Math.sin(time * 2 + " + i + "))) * (1 - 0.7 * linear(time, 0.3, 1.1, 0, 1) * (1 - linear(time, 10.2, 11, 0, 1)))");
    d.shy = true;
  }

  // ═══ Scene 1 — the job post and its comments (0 – 4.2) ═══════════════
  var post = rect("S1 Job Post", 900, 500, 40, { fill: hex("#161c18"), stroke: C.white, sw: 2, so: 8 });
  var pav = ellipse("S1 Post Avatar", 84, { fill: hex("#0e1611"), stroke: C.g2, sw: 2, so: 40 });
  child(pav, post, 376, -180);
  icon("S1 Post Avatar Icon", "icon-512.png", 62, pav, 0, 0);
  rtext("S1 Post Name", "منصة سند الإعلامية", F.xbold, 32, C.white, post, 314, -196);
  rtext("S1 Post Time", "منذ ساعتين", F.tmed, 24, GREY, post, 314, -156);
  var tagP = pill("S1 Post Tag", "فرصة عمل", "icon-megaphone-2ee6a0.png", 26, { fill: C.g2, fo: 12, so: 0, color: C.g2 });
  child(tagP, post, 418 - wOf(tagP) / 2, -95);
  rtext("S1 Post Title", "مطلوب: محرّر أخبار", F.black, 52, C.white, post, 418, -25);
  icon("S1 Post Briefcase", "icon-briefcase-8b958f.png", 28, post, 402, 40);
  rtext("S1 Post Line", "قناة تلفزيونية — الجزائر العاصمة", F.tbold, 30, hex("#b9c2bc"), post, 378, 40);
  icon("S1 Post Mail", "icon-mail-8b958f.png", 28, post, 402, 92);
  var contactL = rtext("S1 Post Contact Label", "للتواصل:", F.tbold, 30, hex("#b9c2bc"), post, 378, 92);
  var mail1 = ltr(rtext("S1 Post Email", "recruitment@example.com", F.xbold, 30, hex("#9fe3c0"), post, 378 - textWidth(contactL) - 14, 92));
  child(rect("S1 Post Divider", 900, 2, 0, { fill: C.white, fo: 8 }), post, 0, 160);
  icon("S1 Post Comment Icon", "icon-message-circle-8b958f.png", 26, post, 402, 206);
  var cc = rtext("S1 Post Comment Count", "248 تعليق", F.xbold, 26, hex("#8b958f"), post, 378, 206);
  expr(cc.property("ADBE Text Properties").property("ADBE Text Document"),
    "Math.round(248 * (1 - Math.pow(1 - linear(time, 0.9, 3.9, 0, 1), 3))) + ' تعليق'");
  icon("S1 Post Like Icon", "icon-thumbs-up-8b958f.png", 26, post, -410, 206);
  ctext("S1 Post Likes", "64", F.xbold, 26, hex("#8b958f"), post, -376, 206);
  keys(S(post), [[0.15, sc(85)], [0.55, sc(103)], [0.75, sc(100)], [4.2, sc(100)], [4.8, sc(68)]]);
  keys(P(post), [[0.15, [CX, 750]], [0.75, [CX, 690]], [4.2, [CX, 690]], [4.8, [CX, 640]]]);
  keys(O(post), [[0.15, 0], [0.45, 100], [4.2, 100], [4.8, 55], [7.8, 55], [8.2, 0]]);
  life(post, 0.15, 8.2);

  // The comments hang off one null, so they move and fade as one feed.
  var feed = comp.layers.addNull(DUR);
  feed.name = "S1 Comments (move me)";
  P(feed).setValue([CX, 1300]);
  keys(P(feed), [[4.2, [CX, 1300]], [4.8, [CX, 1080]]]);
  keys(S(feed), [[4.2, sc(100)], [4.8, sc(68)]]);
  keys(O(feed), [[4.2, 100], [4.8, 45], [7.8, 45], [8.2, 0]]);
  life(feed, 0.8, 8.2);
  var NAMES = [["أمين", "#3b82f6"], ["سارة", "#a855f7"], ["يوسف", "#f59e0b"], ["ليلى", "#ec4899"], ["كريم", "#14b8a6"],
    ["نور الهدى", "#ef4444"], ["رياض", "#6366f1"], ["مريم", "#84cc16"], ["إسلام", "#f97316"]];
  var SAY = ["مهتم", "مهتمة", "مهتم", "مهتمة", "مهتم", "مهتمة", "مهتم", "مهتمة", "مهتم"];
  var CT = [0.9, 1.2, 1.45, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7];
  var ctList = "[" + CT.join(",") + "]";
  for (i = 0; i < NAMES.length; i++) {
    var nmT = text("Comment " + (i + 1) + " Name", NAMES[i][0], F.xbold, 24, hex("#cfd8d2"), "r");
    var sayT = text("Comment " + (i + 1) + " Text", SAY[i], F.tbold, 36, C.white, "r");
    var bw = Math.max(textWidth(nmT), textWidth(sayT)) + 52;
    var av = ellipse("Comment " + (i + 1) + " (" + SAY[i] + ")", 70, { fill: hex(NAMES[i][1]) });
    av.parent = feed;
    // a new comment pushes the older ones up, and those above the feed fade out
    expr(P(av), "var ct = " + ctList + ", n = 0;\nfor (var k = 0; k < ct.length; k++) if (time >= ct[k]) n = k + 1;\n" +
      "[415, -225 + " + i + " * 150 - Math.max(0, n - 3) * 150];");
    expr(O(av), "var ct = " + ctList + ", n = 0;\nfor (var k = 0; k < ct.length; k++) if (time >= ct[k]) n = k + 1;\n" +
      "var y = -225 + " + i + " * 150 - Math.max(0, n - 3) * 150;\n" +
      "linear(time, " + CT[i] + ", " + (CT[i] + 0.25) + ", 0, 100) * (y < -240 ? 0 : 1) * parent.transform.opacity / 100;");
    keys(S(av), [[CT[i], sc(80)], [CT[i] + 0.25, sc(104)], [CT[i] + 0.35, sc(100)]]);
    ctext("Comment " + (i + 1) + " Initial", NAMES[i][0].substr(0, 1), F.black, 32, C.white, av, 0, 0);
    var bub = rect("Comment " + (i + 1) + " Bubble", bw, 110, 30, { fill: hex("#222a25") });
    child(bub, av, -35 - 16 - bw / 2, 20);
    anchor(nmT, "r"); child(nmT, bub, bw / 2 - 26, -24); nmT.moveBefore(bub);
    anchor(sayT, "r"); child(sayT, bub, bw / 2 - 26, 18); sayT.moveBefore(bub);
  }
  headline("S1 Line Interested", "مهتم… مهتم… مهتم…", 250, 84, 0.5, 2.3, [0, 3], null, RED);
  headline("S1 Line No Application", "مئات التعليقات… | ولا طلبٌ واحد.", 260, 88, 2.45, 4.05, [3, 5], null, RED);

  // ═══ Scene 2 — the inbox stays empty (4.2 – 8.0) ════════════════════
  var inbox = rect("S2 Inbox", 820, 270, 40, { fill: hex("#141b17"), stroke: C.white, sw: 2, so: 9 });
  icon("S2 Inbox Icon", "icon-inbox-9fd8b9.png", 46, inbox, 350, -70);
  rtext("S2 Inbox Title", "صندوق الوارد — جهة التوظيف", F.black, 36, C.white, inbox, 315, -70);
  var zero = rect("S2 Inbox Count", 70, 50, 25, { fill: C.white, fo: 8 });
  child(zero, inbox, -350, -70);
  ctext("S2 Inbox Count Text", "0", F.black, 28, hex("#9aa59f"), zero, 0, 0);
  child(rect("S2 Inbox Empty Row", 740, 110, 26, { fill: C.white, fo: 3, stroke: C.white, sw: 2, so: 12 }), inbox, 0, 55);
  ctext("S2 Inbox Empty Text", "لا توجد طلبات ترشّح بعد", F.tbold, 32, GREY, inbox, 0, 55);
  popIn(inbox, CX, 1460, 4.9, 7.8);
  var cut = shapeLayer("S2 Dashed Line");
  var cutC = contents(cut);
  var cutPath = cutC.addProperty("ADBE Vector Shape - Group");
  var cutShape = new Shape();
  cutShape.vertices = [[0, -100], [0, 100]];
  cutShape.closed = false;
  cutPath.property("ADBE Vector Shape").setValue(cutShape);
  paint(cutC, { stroke: hex("#f87171"), sw: 5, so: 70 });
  try {
    var dashes = cutC.property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Dashes");
    dashes.addProperty("ADBE Vector Stroke Dash 1").setValue(14);
    dashes.addProperty("ADBE Vector Stroke Gap 1").setValue(12);
  } catch (e) {}
  var cutTrim = cut.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim");
  keys(cutTrim.property("ADBE Vector Trim End"), [[5.3, 0], [5.8, 100]]);
  P(cut).setValue([CX, 1290]);
  keys(O(cut), [[7.8, 100], [8.2, 0]]);
  life(cut, 5.3, 8.2);
  var xMark = ellipse("S2 X", 92, { fill: RED });
  glow(xMark, 40, 0.8);
  icon("S2 X Icon", "icon-x-ffffff.png", 58, xMark, 0, 0);
  popIn(xMark, CX, 1290, 5.7, 7.8, 100, 0);
  headline("S2 Line Never Reaches", "لأنّ «مهتم» | لا تصل إلى صندوق الوارد.", 260, 84, 4.3, 7.8, [1, 2], null, RED);

  // ═══ Scene 3 — don't stop at the comment (8.0 – 11.0) ════════════════
  headline("S3 Line Dont Stop", "لا تكتفِ بالتعليق.", 560, 110, 8.1, 10.85);
  var cName = text("S3 Comment Name", "أمين", F.xbold, 28, hex("#cfd8d2"), "r");
  var cSay = text("S3 Comment Text", "مهتم", F.tbold, 52, C.white, "r");
  var cbw = Math.max(textWidth(cName), textWidth(cSay)) + 72;
  var cBub = rect("S3 Comment", cbw, 140, 34, { fill: hex("#222a25") });
  anchor(cName, "r"); child(cName, cBub, cbw / 2 - 36, -30); cName.moveBefore(cBub);
  anchor(cSay, "r"); child(cSay, cBub, cbw / 2 - 36, 22); cSay.moveBefore(cBub);
  var cAv = ellipse("S3 Comment Avatar", 90, { fill: hex("#3b82f6") });
  child(cAv, cBub, cbw / 2 + 16 + 45, -10);
  ctext("S3 Comment Initial", "أ", F.black, 42, C.white, cAv, 0, 0);
  // the strike grows from its right end, across the comment
  var strike = shapeLayer("S3 Strike");
  var stC = contents(strike);
  var stR = stC.addProperty("ADBE Vector Shape - Rect");
  stR.property("ADBE Vector Rect Size").setValue([420, 12]);
  stR.property("ADBE Vector Rect Position").setValue([-210, 0]);
  stR.property("ADBE Vector Rect Roundness").setValue(6);
  paint(stC, { fill: RED });
  child(strike, cBub, cbw / 2 + 130, 0);
  R(strike).setValue(-8);
  keys(S(strike), [[8.95, [0, 100]], [9.3, [100, 100]]]);
  popIn(cBub, CX - 40, 900, 8.3, 10.85, 115);
  headline("S3 Line Contact", "تواصل مع الجهة | المنظّمة مباشرةً.", 1230, 92, 9.35, 10.85, [0, 1]);
  popIn(pill("S3 Address Hint", "العنوان موجود في الإعلان نفسه", "icon-mail-2ee6a0.png", 34, { stroke: C.g2 }), CX, 1460, 9.9, 10.85);

  // ═══ Scene 4 — three steps (11.0 – 12.6) ═════════════════════════════
  headline("S4 Line Three Steps", "في ثلاث خطوات:", 760, 116, 11.0, 12.35, [1, 2]);
  for (i = 0; i < 3; i++) {
    var nb = ellipse("S4 Step " + (i + 1), 150, { fill: C.g1 });
    ctext("S4 Step " + (i + 1) + " Text", String(i + 1), F.black, 84, C.white, nb, 0, 0);
    popIn(nb, [760, 540, 320][i], 1060, 11.4 + i * 0.18, 12.35, 100, 40);
  }

  // ═══ Step 1 — the message (12.6 – 20.4) ══════════════════════════════
  stepChip(1, "رسالة رسمية", 12.6, 20.1);
  headline("Step 1 Line", "اكتب رسالةً رسميةً ومنظّمة", 380, 74, 12.75, 20.1, [2, 4]);
  var SUBJ = "طلب ترشّح لمنصب محرّر أخبار";
  var win = rect("Step 1 Email", 940, 720, 36, { fill: hex("#f4f7f5") });
  windowBar(win, 940, -360, "رسالة جديدة");
  rtext("Step 1 To Label", "إلى:", F.xbold, 28, hex("#6b7b72"), win, 436, -252);
  ltr(rtext("Step 1 To", "recruitment@example.com", F.xbold, 28, hex("#17231c"), win, 306, -252));
  divider(win, 940, -214);
  rtext("Step 1 Subject Label", "الموضوع:", F.xbold, 28, hex("#6b7b72"), win, 436, -176);
  var subj = rtext("Step 1 Subject", SUBJ, F.xbold, 28, hex("#17231c"), win, 306, -176);
  function typeOn(l, str, a, b) {
    var sp = l.property("ADBE Text Properties").property("ADBE Text Document");
    for (var k = 0; k <= str.length; k++) {
      var v = sp.valueAtTime(0, false);
      v.text = k === 0 ? " " : str.substr(0, k);
      sp.setValueAtTime(a + (b - a) * k / str.length, v);
    }
  }
  typeOn(subj, SUBJ, 13.25, 14.0);
  function check(name, str, parent, y, at) {
    var c = pill(name, str, "icon-check-0b6b3a.png", 22, { fill: hex("#dcfce7"), stroke: hex("#86efac"), so: 100, color: hex("#0b6b3a") });
    child(c, parent, -440 + wOf(c) / 2, y);
    keys(S(c), [[at, sc(60)], [at + 0.25, sc(106)], [at + 0.4, sc(100)]]);
    expr(O(c), "(time < " + at + " ? 0 : 100) * parent.transform.opacity / 100");
  }
  check("Step 1 Check Subject", "موضوع واضح", win, -176, 14.0);
  divider(win, 940, -138);
  var BODY = [
    ["السيد المسؤول عن التوظيف المحترم،", "تحية رسمية"],
    ["تحية طيبة وبعد،", null],
    ["أتقدّم بطلب الترشّح لمنصب محرّر أخبار", "سبب التواصل"],
    ["المعلن عنه على منصة سند.", null],
    ["لديّ خبرة ثلاث سنوات في تحرير الأخبار", "خبرتك باختصار"],
    ["وإعداد التقارير الميدانية.", null],
    ["تجدون مرفقاً سيرتي الذاتية ورابط معرض أعمالي.", "المرفقات"],
    ["مع فائق الاحترام،", null],
    ["أمين بن علي — 0550 12 34 56", "توقيع ورقم هاتف"]
  ];
  var tStart = 14.15;
  for (i = 0; i < BODY.length; i++) {
    var ly = -100 + i * 48, dur = 0.2 + BODY[i][0].length * 0.0098;
    var line = rtext("Step 1 Line " + (i + 1), BODY[i][0], F.tmed, 30, hex("#1b2a21"), win, 436, ly);
    typeOn(line, BODY[i][0], tStart, tStart + dur);
    if (BODY[i][1]) check("Step 1 Check " + BODY[i][1], BODY[i][1], win, ly, tStart + dur);
    tStart += dur + 0.1;
  }
  popIn(win, CX, 1070, 12.85, 20.1);

  // ═══ Step 2 — the CV (20.4 – 26.0) ═══════════════════════════════════
  stepChip(2, "سيرة ذاتية", 20.4, 25.75);
  headline("Step 2 Line", "جهّز سيرةً ذاتيةً واضحة", 380, 78, 20.55, 25.75, [3, 4]);
  var cv = rect("Step 2 CV", 620, 860, 20, { fill: hex("#fbfdfc") });
  var pdf = rect("Step 2 PDF Badge", 120, 60, 12, { fill: RED });
  child(pdf, cv, -250, -400);
  ctext("Step 2 PDF Text", "PDF", F.black, 30, C.white, pdf, 0, 0);
  rtext("Step 2 Name", "أمين بن علي", F.black, 46, hex("#17231c"), cv, 264, -360);
  rtext("Step 2 Title", "محرّر أخبار", F.xbold, 28, C.g1, cv, 264, -305);
  rtext("Step 2 Contact", "0550 12 34 56   ·   الجزائر العاصمة", F.tbold, 20, hex("#55665c"), cv, 264, -265);
  function cvSection(title, y) {
    var t = rtext("Step 2 Section " + title, title, F.black, 26, hex("#0b3d24"), cv, 264, y);
    var w = textWidth(t);
    child(rect("Step 2 Underline " + title, w, 3, 0, { fill: C.g2 }), cv, 264 - w / 2, y + 22);
  }
  function cvLines(ys, pcts) {
    for (var k = 0; k < ys.length; k++) {
      var w = 528 * pcts[k] / 100;
      child(rect("Step 2 Line", w, 14, 7, { fill: hex("#dfe7e2") }), cv, 264 - w / 2, ys[k]);
    }
  }
  cvSection("الخبرة المهنية", -205); cvLines([-160, -132, -104, -76], [92, 80, 86, 60]);
  cvSection("التكوين", -30); cvLines([12, 40], [84, 58]);
  cvSection("المهارات", 95);
  var skills = [["تحرير الأخبار", "التقارير الميدانية"], ["المونتاج", "التقديم"]];
  for (var sr = 0; sr < 2; sr++) {
    var sx = 264;
    for (var sk = 0; sk < 2; sk++) {
      var sp2 = pill("Step 2 Skill " + skills[sr][sk], skills[sr][sk], null, 20, { fill: hex("#e3f5ea"), so: 0, color: hex("#0b6b3a") });
      child(sp2, cv, sx - wOf(sp2) / 2, 145 + sr * 54);
      sx -= wOf(sp2) + 10;
    }
  }
  cvSection("اللغات", 270); cvLines([310], [70]);
  expr(R(cv), "-2 + Math.sin(time * 0.9) * 0.6");
  popIn(cv, 640, 1080, 20.75, 25.75);
  var cvTips = [["صفحة واحدة أو اثنتان", 21.6, 820], ["معلومات صحيحة ومحدّثة", 22.4, 1060], ["بصيغة PDF", 23.2, 1300], ["باسمك: CV_اسمك.pdf", 24.0, 1540]];
  for (i = 0; i < cvTips.length; i++) {
    popIn(pill("Step 2 Tip " + (i + 1), cvTips[i][0], "icon-check-2ee6a0.png", 32, { stroke: C.g2 }), 290, cvTips[i][2], cvTips[i][1], 25.75, 100, 0, -120);
  }

  // ═══ Step 3 — the portfolio (26.0 – 31.2) ════════════════════════════
  stepChip(3, "معرض الأعمال", 26.0, 30.95);
  headline("Step 3 Line", "وأرفق رابط | معرض أعمالك", 410, 82, 26.15, 30.95, [2, 4]);
  var bro = rect("Step 3 Portfolio", 900, 640, 36, { fill: hex("#0e0e0e"), stroke: C.g2, sw: 2, so: 25 });
  child(rect("Step 3 URL Bar", 852, 76, 22, { fill: hex("#1a221d") }), bro, 0, -262);
  icon("Step 3 URL Icon", "icon-link-2ee6a0.png", 30, bro, -390, -262);
  var urlT = ltr(text("Step 3 URL", "sanadz.media/profile/amine", F.xbold, 30, hex("#b6f0d2"), "c"));
  anchor(urlT); child(urlT, bro, -360 + textWidth(urlT) / 2, -262);
  var pAv = ellipse("Step 3 Avatar", 110, { fill: C.g1 });
  child(pAv, bro, 360, -150);
  ctext("Step 3 Avatar Initial", "أ", F.black, 56, C.white, pAv, 0, 0);
  rtext("Step 3 Name", "أمين بن علي", F.black, 42, C.white, bro, 290, -172);
  var wn = rtext("Step 3 Works Count", "محرّر أخبار · 12 عملاً منشوراً", F.tbold, 26, hex("#81c784"), bro, 290, -124);
  expr(wn.property("ADBE Text Properties").property("ADBE Text Document"),
    "'محرّر أخبار · ' + Math.round(linear(time, 26.8, 28, 0, 12)) + ' عملاً منشوراً'");
  var tiles = [["#00a355", "icon-play-ffffff.png"], ["#d69e2e", "icon-camera-ffffff.png"], ["#1f8a70", "icon-mic-ffffff.png"], ["#6b46c1", "icon-file-text-ffffff.png"]];
  for (i = 0; i < 4; i++) {
    var tl = rect("Step 3 Work " + (i + 1), 411, 170, 22, { fill: hex(tiles[i][0]) });
    child(tl, bro, i % 2 ? -214.5 : 214.5, 20 + Math.floor(i / 2) * 188);
    icon("Step 3 Work " + (i + 1) + " Icon", tiles[i][1], 70, tl, 0, 0);
    var ta = 26.9 + i * 0.15;
    keys(S(tl), [[ta, sc(70)], [ta + 0.3, sc(104)], [ta + 0.45, sc(100)]]);
    expr(O(tl), "linear(time, " + ta + ", " + (ta + 0.2) + ", 0, 100) * parent.transform.opacity / 100");
  }
  popIn(bro, CX, 1080, 26.35, 30.95);
  popIn(pill("Step 3 Hint", "أعمالك تتحدّث عنك… قبل المقابلة", "icon-sparkles-2ee6a0.png", 34, { stroke: C.g2 }), CX, 1600, 28.4, 30.95, 100, 30);

  // ═══ Step 4 — send (31.2 – 36.4) ═════════════════════════════════════
  headline("Send Line", "ثمّ… أرسل.", 330, 120, 31.3, 36.15, [1, 2]);
  var sw = rect("Send Email", 900, 570, 36, { fill: hex("#f4f7f5") });
  windowBar(sw, 900, -285, "رسالة جديدة");
  rtext("Send To Label", "إلى:", F.xbold, 28, hex("#6b7b72"), sw, 416, -177);
  ltr(rtext("Send To", "recruitment@example.com", F.xbold, 28, hex("#17231c"), sw, 286, -177));
  divider(sw, 900, -139);
  rtext("Send Subject Label", "الموضوع:", F.xbold, 28, hex("#6b7b72"), sw, 416, -101);
  rtext("Send Subject", SUBJ, F.xbold, 28, hex("#17231c"), sw, 286, -101);
  divider(sw, 900, -63);
  rtext("Send Greeting", "السيد المسؤول عن التوظيف المحترم، تحية طيبة وبعد…", F.tmed, 28, hex("#55665c"), sw, 416, -25);
  var atts = [["CV_Amine_BenAli.pdf", "icon-paperclip-1f3a2a.png", 40, 31.95], ["sanadz.media/profile/amine", "icon-link-1f3a2a.png", 110, 32.25]];
  for (i = 0; i < 2; i++) {
    var at = pill("Send Attachment " + (i + 1), atts[i][0], atts[i][1], 24, { fill: hex("#e7efe9"), stroke: hex("#cfdcd3"), so: 100, color: hex("#1f3a2a") });
    var ax = 416 - wOf(at) / 2;
    at.parent = sw;
    keys(P(at), [[atts[i][3], [ax - 60, atts[i][2]]], [atts[i][3] + 0.4, [ax, atts[i][2]]]]);
    expr(O(at), "linear(time, " + atts[i][3] + ", " + (atts[i][3] + 0.25) + ", 0, 100) * parent.transform.opacity / 100");
  }
  var sendB = pill("Send Button", "إرسال", "icon-send-ffffff.png", 34, { fill: C.g1, so: 0, font: F.black });
  child(sendB, sw, 416 - wOf(sendB) / 2, 200);
  keys(S(sendB), [[32.95, sc(100)], [33.05, sc(93)], [33.15, sc(100)]]);
  keys(S(sw), [[31.45, sc(85)], [31.85, sc(103)], [32.05, sc(100)], [33.3, sc(100)], [33.7, sc(40)]]);
  keys(O(sw), [[31.45, 0], [31.75, 100], [33.35, 100], [33.75, 0]]);
  keys(P(sw), [[31.45, [CX, 1060]], [32.05, [CX, 1000]], [33.3, [CX, 1000]], [33.7, [CX, 940]]]);
  life(sw, 31.45, 33.75);
  var btnX = CX + 416 - wOf(sendB) / 2, btnY = 1200;
  var tap = ellipse("Send Tap", 74, { fill: C.white, fo: 85 });
  keys(P(tap), [[32.65, [btnX + 60, btnY + 90]], [33.0, [btnX, btnY]]]);
  keys(O(tap), [[32.65, 0], [32.9, 95], [33.2, 95], [33.4, 0]]);
  keys(S(tap), [[33.0, sc(100)], [33.1, sc(78)], [33.2, sc(100)]]);
  life(tap, 32.65, 33.4);
  var rip = ellipse("Send Ripple", 74, { stroke: C.white, sw: 4 });
  P(rip).setValue([btnX, btnY]);
  keys(S(rip), [[33.05, sc(100)], [33.55, sc(260)]]);
  keys(O(rip), [[33.05, 100], [33.55, 0]]);
  life(rip, 33.05, 33.55);
  var plane = icon("Send Paper Plane", "icon-send-2ee6a0.png", 120);
  keys(P(plane), [[33.4, [CX, 1000]], [33.95, [770, 520]], [34.5, [1000, 260]]]);
  keys(O(plane), [[33.4, 100], [34.3, 100], [34.6, 0]]);
  keys(S(plane), [[33.4, sc(120 / 256 * 100)], [34.5, sc(60 / 256 * 100)]]);
  keys(R(plane), [[33.4, 0], [34.5, -20]]);
  life(plane, 33.4, 34.6);
  popIn(pill("Send Sent", "تم الإرسال", "icon-check-2ee6a0.png", 38, { stroke: C.g2, font: F.black }), CX, 900, 34.0, 34.9, 100, 30);
  var inbox2 = rect("Send Inbox", 820, 270, 40, { fill: hex("#141b17"), stroke: C.g2, sw: 2, so: 40 });
  icon("Send Inbox Icon", "icon-inbox-9fd8b9.png", 46, inbox2, 350, -70);
  rtext("Send Inbox Title", "صندوق الوارد — جهة التوظيف", F.black, 36, C.white, inbox2, 315, -70);
  var newB = pill("Send Inbox New", "1 جديد", null, 28, { fill: C.g2, so: 0, color: hex("#04210f"), font: F.black });
  child(newB, inbox2, -370 + wOf(newB) / 2, -70);
  var row = rect("Send Inbox Row", 740, 110, 26, { fill: C.g2, fo: 10, stroke: C.g2, sw: 2, so: 45 });
  child(row, inbox2, 0, 55);
  var rAv = ellipse("Send Inbox Avatar", 70, { fill: hex("#3b82f6") });
  child(rAv, row, 320, 0);
  ctext("Send Inbox Avatar Initial", "أ", F.black, 32, C.white, rAv, 0, 0);
  rtext("Send Inbox Name", "أمين بن علي", F.black, 30, C.white, row, 268, -18);
  rtext("Send Inbox Subject", SUBJ, F.tbold, 24, hex("#9fd8b9"), row, 268, 22);
  icon("Send Inbox Clip", "icon-paperclip-9fd8b9.png", 30, row, -300, 0);
  icon("Send Inbox Link", "icon-link-9fd8b9.png", 30, row, -340, 0);
  popIn(inbox2, CX, 1200, 34.75, 36.15);

  // ═══ The difference (36.4 – 40.6) ════════════════════════════════════
  headline("Difference Line", "الفرصة لا تأتي بتعليق… | بل برسالة.", 380, 84, 36.5, 40.35, [5, 6]);
  function vsCard(name, y, fillC, strokeC, so, tileC, iconFile, title, titleC, sub, subC, markFile) {
    var c = rect(name, 900, 170, 40, { fill: fillC, stroke: strokeC, sw: 2, so: so });
    var tile = rect(name + " Tile", 100, 100, 30, { fill: tileC });
    child(tile, c, 360, 0);
    icon(name + " Icon", iconFile, 56, tile, 0, 0);
    rtext(name + " Title", title, F.black, 42, titleC, c, 290, -24);
    rtext(name + " Subtitle", sub, F.tbold, 28, subC, c, 290, 30);
    icon(name + " Mark", markFile, 60, c, -390, 0);
    return c;
  }
  var greyC = vsCard("Difference Comment", 850, hex("#161b18"), C.white, 8, hex("#2a302c"), "icon-message-circle-7f8a84.png",
    "تعليق «مهتم»", hex("#9aa59f"), "يضيع بين مئات التعليقات", hex("#6b746f"), "icon-x-ef4444.png");
  keys(S(greyC), [[36.8, sc(85)], [37.2, sc(103)], [37.4, sc(100)], [37.8, sc(100)], [38.3, sc(94)]]);
  keys(O(greyC), [[36.8, 0], [37.1, 100], [37.8, 100], [38.3, 60], [40.35, 60], [40.75, 0]]);
  keys(P(greyC), [[36.8, [CX, 910]], [37.4, [CX, 850]], [40.35, [CX, 850]], [40.75, [CX, 810]]]);
  life(greyC, 36.8, 40.75);
  var greenC = vsCard("Difference Message", 1110, hex("#0f2a1b"), C.g2, 55, C.g1, "icon-send-ffffff.png",
    "رسالة + سيرة ذاتية + معرض أعمال", C.white, "طلبٌ يُقرأ… ويُتذكَّر", hex("#9fe3c0"), "icon-check-2ee6a0.png");
  glow(greenC, 50, 0.6);
  popIn(greenC, CX, 1110, 37.6, 40.35);

  // ═══ Sign-off (40.6 – end) ═══════════════════════════════════════════
  for (i = 0; i < 2; i++) {
    var rg = ellipse("End Ring " + (i + 1), 420, { stroke: C.g2, sw: 4 });
    P(rg).setValue([CX, 640]);
    keys(S(rg), [[40.75 + i * 0.35, sc(45)], [42.35 + i * 0.35, sc(195)]], 30);
    keys(O(rg), [[40.75 + i * 0.35, 80], [42.35 + i * 0.35, 0]], 30);
    life(rg, 40.75 + i * 0.35, 42.35 + i * 0.35);
  }
  // The wordmark carries the icon already: it is the only logo here.
  var wm = icon("End Wordmark", "logo.png", 640);
  var wmS = 640 / 543 * 100;
  P(wm).setValue([CX, 640]);
  keys(S(wm), [[40.75, sc(wmS * 0.6)], [41.2, sc(wmS * 1.04)], [41.4, sc(wmS)]]);
  keys(O(wm), [[40.75, 0], [41.0, 100]]);
  try {
    var wipe = wm.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
    keys(wipe.property("ADBE Linear Wipe-0001"), [[40.8, 100], [41.5, 0]]);
    wipe.property("ADBE Linear Wipe-0002").setValue(90);
    wipe.property("ADBE Linear Wipe-0003").setValue(60);
  } catch (e) {}
  glow(wm, 40, 0.6);
  life(wm, 40.72, DUR);
  headline("End Line", "جهّز معرض أعمالك على سند | وكن جاهزاً للفرصة القادمة.", 930, 70, 41.35, 99, [6, 7]);
  var url = rect("End URL Pill", 460, 100, 50, { fill: C.g2, fo: 8, stroke: C.g2, sw: 3, so: 60 });
  ctext("End URL", "sanadz.media", F.xbold, 52, hex("#e9fff3"), url, 0, 0);
  P(url).setValue([CX, 1170]);
  keys(S(url), [[42.35, sc(60)], [42.75, sc(104)], [42.95, sc(100)]]);
  keys(O(url), [[42.35, 0], [42.6, 100]]);
  life(url, 42.3, DUR);

  // ═══ Finishing ═══════════════════════════════════════════════════════
  try {
    var vig = comp.layers.addSolid([0, 0, 0], "Vignette", W, H, 1, DUR);
    vig.adjustmentLayer = true;
    vig.property("ADBE Effect Parade").addProperty("CC Vignette").property(1).setValue(60);
  } catch (e) {}
  // A child must live exactly as long as the card it belongs to, or its
  // pieces outlive it.
  for (i = 1; i <= comp.numLayers; i++) {
    var L = comp.layer(i), top = L;
    while (top.parent) top = top.parent;
    if (top !== L) { L.inPoint = top.inPoint; L.outPoint = top.outPoint; }
  }
  // Sound effects from the motion-studio library, already placed on their hits.
  try {
    var sfxFile = new File(assets.fsName + "/sanad-apply-reel-sfx.wav");
    if (sfxFile.exists) {
      var sfxLayer = comp.layers.add(app.project.importFile(new ImportOptions(sfxFile)));
      sfxLayer.name = "SFX (motion-studio)";
      sfxLayer.startTime = 0;
      sfxLayer.moveToEnd();
    }
  } catch (e) {}
  var fade = comp.layers.addSolid([0, 0, 0], "Fade In-Out", W, H, 1, DUR);
  keys(O(fade), [[0, 100], [0.25, 0], [DUR - 0.35, 0], [DUR, 100]]);
  fade.locked = true;
  bg.locked = true;
  comp.hideShyLayers = true;
  comp.openInViewer();

  app.endUndoGroup();
  alert("تم بناء المشروع: Sanad Apply Reel 9x16\n\n" +
    "إن ظهرت الحروف العربية منفصلة: Preferences ← Type ← Text Engine ← South Asian and Middle Eastern، ثم أعد التشغيل وشغّل السكربت من جديد.\n" +
    "إن ظهر خط بديل: ثبّت Cairo و Tajawal.");
})();
