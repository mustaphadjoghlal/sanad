/*
 * سند — فيديو الريلز في After Effects
 *
 * يبني هذا السكربت مشروعاً كاملاً: تركيبة 1080×1920، 28 ثانية، 30 إطاراً.
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
  var DUR = 28, FPS = 30, W = 1080, H = 1920, CX = 540;
  var here = File($.fileName).parent;
  var assets = new Folder(here.fsName + "/assets");
  if (!assets.exists) { alert("لم أجد مجلد assets بجانب السكربت.\nAssets folder not found next to the script."); return; }

  app.beginUndoGroup("Sanad Reel");

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
  var folder = app.project.items.addFolder("Sanad Reel");
  var comp = app.project.items.addComp("Sanad Reel 9x16", W, H, 1, DUR, FPS);
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
  function accent(l, from, to) {
    var a = animator(l, "Accent");
    a.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color").setValue(C.g2);
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
  function headline(name, str, y, size, start, end, acc, dimAt) {
    var lines = str.split(" | ");
    var l = text(name, lines.join("\r"), F.black, size, C.white, "c");
    anchor(l);
    var words = str.replace(/ \| /g, " ").split(" ").length;
    P(l).setValue([CX, y]);
    reveal(l, start, words);
    if (acc) accent(l, acc[0], acc[1]);
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

  /** Shared motion for everything in the crowd: restless, then pulled into the centre. */
  var crowd = [];
  function restless(l, seed, base) {
    expr(P(l),
      "var amp = " + base + " + 14 * linear(time, 7.7, 8.9, 0, 1);\n" +
      "var k = Math.pow(linear(time, 9.55, 10.05, 0, 1), 3);\n" +
      "var p = add(value, [Math.sin(time * 2.3 + " + seed + ") * amp, Math.cos(time * 1.9 + " + seed * 1.7 + ") * amp]);\n" +
      "add(p, mul(sub([540, 960], p), k));");
    expr(S(l), "var k = Math.pow(linear(time, 9.55, 10.05, 0, 1), 3); mul(value, 1 - k * 0.95);");
    expr(R(l), "var k = Math.pow(linear(time, 9.55, 10.05, 0, 1), 3); value + k * 120;");
    crowd.push(l);
  }

  // Layers stack newest on top, so they are built bottom-up.

  // ═══ Background ════════════════════════════════════════════════════
  var bg = comp.layers.addSolid(C.bg, "BG", W, H, 1, DUR);
  var glowG = ellipse("BG Glow Green", 1400, { fill: hex("#00c46a") });
  blur(glowG, 320);
  expr(P(glowG), "[540 + Math.sin(time * 0.4) * 60, 1140 + Math.cos(time * 0.33) * 80]");
  keys(O(glowG), [[0, 32], [3.2, 32], [4.0, 6], [9.8, 6], [10.3, 32]]);
  var glowR = ellipse("BG Glow Red", 1400, { fill: C.red });
  blur(glowR, 320);
  expr(P(glowR), "[540 + Math.cos(time * 0.5) * 80, 1260 + Math.sin(time * 0.45) * 100]");
  keys(O(glowR), [[3.2, 0], [4.0, 20], [9.8, 20], [10.3, 0]]);
  var i;
  for (i = 0; i < 28; i++) {
    var d = ellipse("BG Dot " + (i + 1), 6 + (i % 3) * 3, { fill: C.g2 });
    P(d).setValue([(i * 397) % W, (i * 811) % H]);
    expr(P(d), "var s = " + (20 + (i * 13) % 50) + "; [value[0] + Math.sin(time * 0.8 + " + i + ") * 14, ((value[1] - time * s) % 1920 + 1920) % 1920]");
    expr(O(d), "(15 + 35 * (0.5 + 0.5 * Math.sin(time * 2 + " + i + "))) * (1 - 0.7 * linear(time, 3.2, 4, 0, 1) * (1 - linear(time, 9.8, 10.3, 0, 1)))");
    d.shy = true;
  }

  // ═══ Scene 1 — the search (0 – 3.4) ══════════════════════════════════
  var q = text("S1 Question Mark", "؟", F.black, 900, C.g2, "c");
  anchor(q);
  P(q).setValue([CX + 40, 860]);
  keys(O(q), [[0, 0], [1.2, 7], [3.0, 7], [3.5, 0]]);
  keys(R(q), [[0, -8], [3.5, 3]], 10);
  life(q, 0, 3.6);

  var bar = rect("S1 Search Bar", 900, 150, 75, { fill: hex("#1c2a22"), stroke: C.white, sw: 2, so: 16 });
  P(bar).setValue([CX, 860]);
  keys(S(bar), [[0.05, sc(80)], [0.45, sc(104)], [0.65, sc(100)], [3.0, sc(100)], [3.4, sc(92)]]);
  keys(O(bar), [[0.05, 0], [0.35, 100], [3.0, 100], [3.4, 0]]);
  keys(P(bar), [[2.55, [CX, 860]], [2.62, [CX + 12, 860]], [2.69, [CX - 10, 860]], [2.76, [CX + 7, 860]], [2.83, [CX - 4, 860]], [2.95, [CX, 860]], [3.0, [CX, 860]], [3.4, [CX, 820]]], 30);
  life(bar, 0, 3.5);
  var sCircle = ellipse("S1 Search Icon BG", 96, { fill: C.g1 });
  child(sCircle, bar, 372, 0);
  child(icon("S1 Search Icon", "icon-search-ffffff.png", 52), sCircle, 0, 0);
  var Q = "تبحث عن فرصة في الإعلام؟";
  var typed = text("S1 Typed", Q, F.tbold, 54, C.white, "r");
  anchor(typed, "r");
  child(typed, bar, 300, 0);
  var st = typed.property("ADBE Text Properties").property("ADBE Text Document");
  for (i = 0; i <= Q.length; i++) {
    var v = st.valueAtTime(0, false);
    v.text = i === 0 ? " " : Q.substr(0, i);
    st.setValueAtTime(0.5 + 1.5 * i / Q.length, v);
  }
  var caret = rect("S1 Caret", 5, 62, 3, { fill: C.g2 });
  child(caret, bar, 0, 0);
  expr(P(caret), "var t = thisComp.layer(\"S1 Typed\"); var r = t.sourceRectAtTime(time, false);\n[t.transform.position[0] - r.width - 14, 0];");
  expr(O(caret), "var blink = Math.floor(time * 3.2) % 2 == 0 || (time > 0.5 && time < 2.0); (blink ? 100 : 0) * parent.transform.opacity / 100;");
  var lst = [bar, sCircle, typed, caret];

  var drop = rect("S1 Results", 900, 250, 40, { fill: hex("#121c16"), stroke: C.white, sw: 2, so: 10 });
  P(drop).setValue([CX, 1080]);
  keys(P(drop), [[2.0, [CX, 1040]], [2.45, [CX, 1080]], [3.0, [CX, 1080]], [3.4, [CX, 1040]]]);
  keys(O(drop), [[2.0, 0], [2.45, 100], [3.0, 100], [3.4, 0]]);
  life(drop, 1.9, 3.5);
  var widths = [0.78, 0.56, 0.68];
  for (i = 0; i < 3; i++) {
    var w = 820 * widths[i];
    var sk = rect("S1 Loading " + (i + 1), w, 34, 17, { fill: C.white, fo: 8 });
    child(sk, drop, 410 - w / 2, -62 + i * 62);
    expr(O(sk), "(60 + 40 * Math.sin(time * 6 - " + i + ")) * parent.transform.opacity / 100");
  }

  // ═══ Scene 2 — the crowd (3.4 – 7.7) ═════════════════════════════════
  // The abandoned page
  var pg = rect("S2 Abandoned Page", 640, 420, 36, { fill: C.card, stroke: C.white, sw: 2, so: 10 });
  P(pg).setValue([CX, 930]);
  child(rect("S2 Page Cover", 600, 130, 24, { fill: hex("#2a2f2c") }), pg, 0, -130);
  var av = ellipse("S2 Page Avatar", 120, { fill: hex("#3a403c"), stroke: C.card, sw: 6 });
  child(av, pg, 220, -60);
  child(icon("S2 Page Avatar Icon", "icon-radio-6b746f.png", 60), av, 0, 0);
  var pgName = text("S2 Page Name", "صفحة فرص الإعلام", F.xbold, 40, hex("#b9c2bc"), "r");
  anchor(pgName, "r"); child(pgName, pg, 140, -10);
  var pgMeta = text("S2 Page Last Post", "آخر منشور: منذ 3 سنوات", F.tbold, 34, hex("#7d8781"), "r");
  anchor(pgMeta, "r"); child(pgMeta, pg, 230, 70);
  child(icon("S2 Page Clock", "icon-clock-7d8781.png", 36), pg, 270, 70);
  child(rect("S2 Page Line 1", 520, 22, 11, { fill: C.white, fo: 7 }), pg, 24, 130);
  child(rect("S2 Page Line 2", 400, 22, 11, { fill: C.white, fo: 7 }), pg, 84, 168);
  keys(S(pg), [[3.5, sc(60)], [3.85, sc(104)], [4.05, sc(100)], [4.7, sc(100)], [5.3, sc(66)]]);
  keys(P(pg), [[4.7, [CX, 930]], [5.3, [300, 1330]]]);
  keys(R(pg), [[4.7, 0], [5.3, -9]]);
  keys(O(pg), [[3.5, 0], [3.75, 100]]);
  expr(O(pg), "var f = time < 4.7 ? 0.8 + 0.2 * Math.abs(Math.sin(time * 13)) : 0.85; value * f * (1 - 0.3 * linear(time, 9.55, 10.05, 0, 1));");
  restless(pg, 1.1, 6);
  life(pg, 3.45, 10.05);

  // The expired ad
  var ad = rect("S2 Expired Ad", 660, 330, 36, { fill: C.card, stroke: C.white, sw: 2, so: 10 });
  P(ad).setValue([CX, 920]);
  var tag = rect("S2 Ad Tag", 240, 52, 26, { fill: C.white, fo: 8 });
  child(tag, ad, 166, -105);
  var tagT = text("S2 Ad Tag Text", "إعلان توظيف", F.tbold, 30, hex("#a3aea7"), "c");
  anchor(tagT); child(tagT, tag, -18, 0);
  child(icon("S2 Ad Tag Icon", "icon-briefcase-a3aea7.png", 30), tag, 88, 0);
  var adT = text("S2 Ad Title", "مطلوب مقدّم أخبار", F.black, 54, hex("#d9e2dc"), "r");
  anchor(adT, "r"); child(adT, ad, 286, -10);
  var adD = text("S2 Ad Deadline", "آخر أجل: 12 مارس 2021", F.tbold, 34, hex("#8b958f"), "r");
  anchor(adD, "r"); child(adD, ad, 240, 80);
  child(icon("S2 Ad Clock", "icon-clock-7d8781.png", 34), ad, 270, 80);
  var stamp = rect("S2 Stamp", 220, 104, 18, { fill: C.red, fo: 8, stroke: C.red, sw: 7 });
  child(stamp, ad, -180, -70);
  R(stamp).setValue(-14);
  keys(S(stamp), [[5.3, sc(240)], [5.52, sc(100)]], 90);
  expr(O(stamp), "(time < 5.3 ? 0 : 100) * parent.transform.opacity / 100");
  var stampT = text("S2 Stamp Text", "انتهى", F.black, 64, C.red, "c");
  anchor(stampT); child(stampT, stamp, 0, 0);
  keys(S(ad), [[4.8, sc(60)], [5.15, sc(104)], [5.35, sc(100)], [6.0, sc(100)], [6.6, sc(64)]]);
  keys(P(ad), [[6.0, [CX, 920]], [6.6, [760, 1520]]]);
  keys(R(ad), [[6.0, 0], [6.6, 8]]);
  keys(O(ad), [[4.8, 0], [5.05, 100], [9.55, 100], [10.05, 70]]);
  restless(ad, 2.7, 6);
  life(ad, 4.75, 10.05);

  // Group chats
  function bubble(name, count, x, y, start, seed) {
    var nm = text("Chat " + name, name, F.tbold, 36, hex("#d2dbd5"), "c");
    var cnt = text("Chat " + name + " Count", count, F.xbold, 28, C.white, "c");
    var nw = textWidth(nm), cw = Math.max(54, textWidth(cnt) + 28);
    var total = 22 + 64 + 18 + nw + 18 + cw + 26;
    var pill = rect("Chat " + name + " Bubble", total, 100, 50, { fill: C.bub, stroke: C.white, sw: 2, so: 10 });
    P(pill).setValue([x, y]);
    var right = total / 2;
    var avc = ellipse("Chat " + name + " Avatar", 64, { fill: hex("#2b3530") });
    child(avc, pill, right - 22 - 32, 0);
    child(icon("Chat " + name + " Icon", "icon-users-9aa59f.png", 36), avc, 0, 0);
    anchor(nm); child(nm, pill, right - 22 - 64 - 18 - nw / 2, 0);
    var badge = rect("Chat " + name + " Badge", cw, 54, 27, { fill: C.red });
    child(badge, pill, -right + 26 + cw / 2, 0);
    anchor(cnt); child(cnt, badge, 0, 0);
    // the labels were made before the pill, so they belong above it
    nm.moveBefore(pill); cnt.moveBefore(badge);
    R(pill).setValue(((seed * 37) % 15) - 7);
    keys(S(pill), [[start, sc(40)], [start + 0.25, sc(106)], [start + 0.4, sc(100)]]);
    keys(O(pill), [[start, 0], [start + 0.2, 100], [9.55, 100], [10.05, 70]]);
    restless(pill, seed, 5);
    var parts = [pill, avc, nm, badge, cnt];
    for (var k = 0; k < parts.length; k++) life(parts[k], start, 10.05);
    return pill;
  }
  var groups = [
    ["فرص إعلامية DZ", "+99"], ["صحفيون جزائريون", "245"], ["وظائف الإعلام", "1.2k"], ["مونتاج وتصوير", "87"],
    ["إذاعات الجزائر", "312"], ["مجموعة المعلّقين", "56"], ["عروض عمل الإعلام", "+99"], ["طلبة الإعلام", "640"],
    ["قنوات وفرص", "128"], ["مذيعون ومقدّمون", "73"], ["فرص التدريب", "410"], ["إعلام وتواصل", "2.3k"],
    ["كتّاب المحتوى", "95"], ["مصوّرون محترفون", "188"]
  ];
  for (i = 0; i < groups.length; i++) {
    var col = i % 2, row = Math.floor(i / 2);
    var jx = ((i * 53) % 180) - 90, jy = ((i * 29) % 60) - 30;
    bubble(groups[i][0], groups[i][1], (col ? 330 : 740) + jx, 660 + row * 130 + jy, 6.2 + i * 0.085, i + 1);
  }

  // ═══ Scene 3 — the opportunity lost in the crowd (7.7 – 10.1) ════════
  var opp = rect("S3 Opportunity", 560, 104, 52, { fill: C.g1 });
  P(opp).setValue([CX, 1080]);
  glow(opp, 60, 1.2);
  var oppT = text("S3 Opportunity Text", "فرصة عمل حقيقية", F.black, 46, C.white, "c");
  anchor(oppT); child(oppT, opp, -24, 0);
  child(icon("S3 Opportunity Icon", "icon-sparkles-ffffff.png", 50), opp, 210, 0);
  keys(S(opp), [[7.9, sc(50)], [8.25, sc(106)], [8.45, sc(100)], [8.5, sc(100)], [9.4, sc(72)]]);
  keys(O(opp), [[7.9, 0], [8.15, 100], [8.5, 100], [9.4, 25]]);
  restless(opp, 0.3, 0);
  oppT.moveBefore(opp);
  life(opp, 7.85, 10.05); life(oppT, 7.85, 10.05);
  var noise = [["رسائل غير مقروءة", "3.4k"], ["منشورات قديمة", "999"], ["روابط معطّلة", "41"], ["إعلانات مكررة", "+99"],
    ["مجموعة جديدة", "12"], ["تنبيهات", "530"], ["طلبات انضمام", "77"], ["رسائل مزعجة", "1.8k"]];
  for (i = 0; i < noise.length; i++) {
    var ang = i / noise.length * Math.PI * 2 + 0.4;
    bubble(noise[i][0], noise[i][1], CX + Math.cos(ang) * (150 + (i * 31) % 90), 1080 + Math.sin(ang) * (120 + (i * 47) % 140), 8.45 + i * 0.07, 40 + i);
  }
  headline("S2 Line 1 Abandoned Pages", "صفحاتٌ مهجورة…", 430, 100, 3.4, 4.6);
  headline("S2 Line 2 Expired Ads", "إعلاناتٌ منتهية…", 430, 100, 4.75, 6.0);
  headline("S2 Line 3 Endless Groups", "ومجموعاتٌ لا تنتهي.", 430, 100, 6.15, 7.55);
  headline("S3 Line Lost In The Crowd", "والفرصة ضائعة | في الزحام.", 430, 100, 7.7, 9.45, [0, 1]);

  var flash = ellipse("S3 Flash", 1400, { fill: hex("#dcffec") });
  blur(flash, 220);
  P(flash).setValue([CX, 960]);
  keys(O(flash), [[9.9, 0], [10.08, 100], [10.8, 0]]);
  life(flash, 9.9, 10.8);

  // ═══ Scene 4 — Sanad (10.1 – 12.6) ═══════════════════════════════════
  function ring(name, y, start, from, to, op) {
    var r = ellipse(name, 420, { stroke: C.g2, sw: 4 });
    P(r).setValue([CX, y]);
    keys(S(r), [[start, sc(from)], [start + 1.6, sc(to)]], 30);
    keys(O(r), [[start, op], [start + 1.6, 0]], 30);
    life(r, start, start + 1.6);
  }
  for (i = 0; i < 3; i++) ring("S4 Ring " + (i + 1), 840, 10.15 + i * 0.28, 55, 245, 90);
  var ic1 = icon("S4 Sanad Icon", "icon-512.png", 420);
  P(ic1).setValue([CX, 840]);
  var b1 = 420 / 512 * 100;
  keys(S(ic1), [[10.12, sc(b1 * 0.3)], [10.55, sc(b1 * 1.06)], [10.82, sc(b1)], [12.25, sc(b1)], [12.75, sc(b1 * 0.6)]]);
  keys(O(ic1), [[10.12, 0], [10.35, 100], [12.25, 100], [12.75, 0]]);
  keys(R(ic1), [[10.12, -25], [10.82, 0]]);
  keys(P(ic1), [[12.25, [CX, 840]], [12.75, [CX, 680]]]);
  expr(P(ic1), "add(value, [0, Math.sin(time * 2.4) * 8])");
  life(ic1, 10.1, 12.9);

  function wordmark(name, px, y, wipeAt) {
    var l = icon(name, "logo.png", px);
    P(l).setValue([CX, y]);
    try {
      var wipe = l.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
      keys(wipe.property("ADBE Linear Wipe-0001"), [[wipeAt, 100], [wipeAt + 0.7, 0]]);
      wipe.property("ADBE Linear Wipe-0002").setValue(90);
      wipe.property("ADBE Linear Wipe-0003").setValue(60);
    } catch (e) {}
    glow(l, 40, 0.6);
    return l;
  }
  var wm = wordmark("S4 Sanad Wordmark", 680, 1150, 10.65);
  var wmS = 680 / 543 * 100;
  keys(P(wm), [[12.3, [CX, 1150]], [12.85, [CX, 290]]]);
  keys(S(wm), [[12.3, sc(wmS)], [12.85, sc(wmS * 0.52)]]);
  keys(O(wm), [[23.3, 100], [23.65, 0]]);
  life(wm, 10.6, 23.7);

  // ═══ Scene 5 — one platform (12.6 – 16.8) ════════════════════════════
  headline("S5 Line One Platform", "منصةٌ واحدة تجمع لك", 520, 90, 12.7, 16.45, [1, 2]);
  var feats = [
    ["icon-briefcase-ffffff.png", "عروض التوظيف", "مذيع · محرر · مونتير · مصوّر", "جديد"],
    ["icon-graduation-cap-ffffff.png", "الدورات", "تكوين مع محترفين في الميدان", "سجّل"],
    ["icon-trophy-ffffff.png", "المسابقات", "جوائز وفرص للظهور", "شارك"]
  ];
  for (i = 0; i < feats.length; i++) {
    var s5 = 13.2 + i * 0.45, y5 = 790 + i * 225, dir = i % 2 ? -1 : 1;
    var card = rect("S5 Card " + feats[i][1], 880, 190, 44, { fill: hex("#16231b"), stroke: C.g2, sw: 2, so: 25 });
    var tile = rect("S5 Tile " + feats[i][1], 124, 124, 34, { fill: C.g1 });
    child(tile, card, 344, 0);
    child(icon("S5 Icon " + feats[i][1], feats[i][0], 66), tile, 0, 0);
    var t1 = text("S5 Title " + feats[i][1], feats[i][1], F.black, 56, C.white, "r");
    anchor(t1, "r"); child(t1, card, 250, -26);
    var t2 = text("S5 Subtitle " + feats[i][1], feats[i][2], F.tmed, 32, hex("#9fd8b9"), "r");
    anchor(t2, "r"); child(t2, card, 250, 42);
    var bdg = rect("S5 Badge " + feats[i][1], 116, 58, 29, { fill: C.g2, fo: 15, stroke: C.g2, sw: 2, so: 40 });
    child(bdg, card, -350, 0);
    var bt = text("S5 Badge Text " + feats[i][1], feats[i][3], F.xbold, 30, C.g2, "c");
    anchor(bt); child(bt, bdg, 0, 0);
    keys(S(bdg), [[s5 + 0.55, sc(30)], [s5 + 0.8, sc(108)], [s5 + 0.95, sc(100)]]);
    expr(O(bdg), "(time < " + (s5 + 0.55) + " ? 0 : 100) * parent.transform.opacity / 100");
    var out5 = 16.35 + i * 0.06;
    keys(P(card), [[s5, [CX + 420 * dir, y5]], [s5 + 0.6, [CX, y5]], [out5, [CX, y5]], [out5 + 0.4, [CX - 380 * dir, y5]]]);
    keys(O(card), [[s5, 0], [s5 + 0.45, 100], [out5, 100], [out5 + 0.4, 0]]);
    var all5 = [card, tile, t1, t2, bdg, bt];
    for (var k5 = 0; k5 < all5.length; k5++) life(all5[k5], s5, 16.9);
  }

  // ═══ Scene 6 — your work, on show (16.8 – 19.6) ══════════════════════
  headline("S6 Line Show Your Work", "ومساحةً تعرض | فيها أعمالك.", 520, 88, 16.85, 19.3, [3, 4]);
  var works = [
    ["تقرير مصوّر", "#0f8a4a", "video", 128, 2400],
    ["تعليق صوتي", "#1f6f78", "audio", 96, 1800],
    ["صور ميدانية", "#b7791f", "photo", 214, 3100],
    ["مقال رأي", "#6b46c1", "article", 73, 950]
  ];
  for (i = 0; i < works.length; i++) {
    var wk = works[i], x6 = i % 2 ? 320 : 760, y6 = 880 + Math.floor(i / 2) * 440, s6 = 17.15 + i * 0.2;
    var wc = rect("S6 Work " + wk[0], 410, 380, 38, { fill: C.dark, stroke: C.g2, sw: 2, so: 22 });
    var th = rect("S6 Thumb " + wk[0], 410, 250, 38, { fill: hex(wk[1]) });
    child(th, wc, 0, -65);
    var parts6 = [wc, th];
    if (wk[2] === "video") {
      var pb = ellipse("S6 Play Button", 104, { fill: C.white, fo: 92 });
      child(pb, th, 0, 0);
      parts6.push(pb, child(icon("S6 Play Icon", "icon-play-006233.png", 52), pb, 4, 0));
    } else if (wk[2] === "audio") {
      for (var b6 = 0; b6 < 13; b6++) {
        var bar6 = rect("S6 Wave " + (b6 + 1), 12, 130, 6, { fill: C.white });
        child(bar6, th, (b6 - 6) * 21, 0);
        expr(S(bar6), "[100, (30 + 100 * Math.abs(Math.sin(time * 6 + " + b6 * 0.7 + "))) / 130 * 100]");
        parts6.push(bar6);
      }
    } else {
      parts6.push(child(icon("S6 Icon " + wk[0], wk[2] === "photo" ? "icon-camera-ffffff.png" : "icon-file-text-ffffff.png", 110), th, 0, 0));
    }
    var wt = text("S6 Title " + wk[0], wk[0], F.xbold, 40, C.white, "r");
    anchor(wt, "r"); child(wt, wc, 177, 95);
    parts6.push(wt);
    parts6.push(child(icon("S6 Heart", "icon-heart-ff5a7a.png", 34), wc, 160, 150));
    var lk = text("S6 Likes " + wk[0], "0", F.xbold, 32, hex("#a9cdb8"), "r");
    child(lk, wc, 132, 162);
    expr(lk.property("ADBE Text Properties").property("ADBE Text Document"),
      "var n = linear(time, " + (s6 + 0.3) + ", " + (s6 + 1.9) + ", 0, " + wk[3] + "); Math.round(n).toString();");
    parts6.push(lk);
    parts6.push(child(icon("S6 Eye", "icon-eye-a9cdb8.png", 34), wc, 40, 150));
    var vw = text("S6 Views " + wk[0], "0", F.xbold, 32, hex("#a9cdb8"), "r");
    child(vw, wc, 12, 162);
    expr(vw.property("ADBE Text Properties").property("ADBE Text Document"),
      "var n = linear(time, " + (s6 + 0.3) + ", " + (s6 + 1.9) + ", 0, " + wk[4] + "); n >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n).toString();");
    parts6.push(vw);
    P(wc).setValue([x6, y6]);
    var o6 = 19.25 + i * 0.04;
    keys(S(wc), [[s6, sc(70)], [s6 + 0.38, sc(104)], [s6 + 0.55, sc(100)], [o6, sc(100)], [o6 + 0.35, sc(90)]]);
    keys(P(wc), [[s6, [x6, y6 + 80]], [s6 + 0.5, [x6, y6]]]);
    keys(O(wc), [[s6, 0], [s6 + 0.3, 100], [o6, 100], [o6 + 0.35, 0]]);
    for (var k6 = 0; k6 < parts6.length; k6++) life(parts6[k6], s6, 19.7);
    for (var h6 = 0; h6 < 2; h6++) {
      var hs = 17.9 + i * 0.25 + h6 * 0.6, hx = x6 + ((i * 70 + h6 * 90) % 200) - 100;
      var heart = icon("S6 Floating Heart", "icon-heart-ff5a7a.png", 46);
      keys(P(heart), [[hs, [hx, y6 - 60]], [hs + 1.3, [hx + 15, y6 - 320]]], 20);
      keys(O(heart), [[hs, 0], [hs + 0.4, 100], [hs + 0.9, 100], [hs + 1.3, 0]]);
      keys(S(heart), [[hs, sc(60)], [hs + 1.3, sc(120)]], 20);
      life(heart, hs, hs + 1.3);
    }
  }

  // ═══ Scene 7 — more (19.6 – 23.6) ════════════════════════════════════
  var kin = [["فرصٌ أكثر…", 19.7], ["تدريبٌ أكثر…", 20.55], ["تواصلٌ أكثر…", 21.4]];
  for (i = 0; i < kin.length; i++) {
    headline("S7 Line " + (i + 1), kin[i][0], 640 + i * 165, 112, kin[i][1], 23.3, [1, 2], i < 2 ? kin[i + 1][1] : 22.25);
  }
  headline("S7 And Sanad For You", "وسندٌ لك.", 1200, 170, 22.3, 23.3, [0, 2]);
  var sw = shapeLayer("S7 Underline");
  var swc = contents(sw);
  var path = swc.addProperty("ADBE Vector Shape - Group");
  var shp = new Shape();
  shp.vertices = [[290, 5], [-290, -5]];
  shp.outTangents = [[-150, -30], [0, 0]];
  shp.inTangents = [[0, 0], [180, 40]];
  shp.closed = false;
  path.property("ADBE Vector Shape").setValue(shp);
  paint(swc, { stroke: C.g2, sw: 12 });
  var trim = sw.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim");
  keys(trim.property("ADBE Vector Trim End"), [[22.6, 0], [23.1, 100]]);
  P(sw).setValue([CX, 1340]);
  keys(O(sw), [[22.5, 100], [23.3, 100], [23.65, 0]]);
  life(sw, 22.5, 23.7);

  // ═══ Scene 8 — sign-off (23.6 – end) ═════════════════════════════════
  for (i = 0; i < 2; i++) ring("S8 Ring " + (i + 1), 720, 23.7 + i * 0.35, 50, 210, 80);
  var ic2 = icon("S8 Sanad Icon", "icon-512.png", 330);
  P(ic2).setValue([CX, 720]);
  var b2 = 330 / 512 * 100;
  keys(S(ic2), [[23.7, sc(b2 * 0.3)], [24.1, sc(b2 * 1.06)], [24.35, sc(b2)]]);
  keys(O(ic2), [[23.7, 0], [23.95, 100]]);
  expr(P(ic2), "add(value, [0, Math.sin(time * 2.2) * 6])");
  life(ic2, 23.65, DUR);
  var wm2 = wordmark("S8 Sanad Wordmark", 600, 975, 24.0);
  life(wm2, 24.0, DUR);
  headline("S8 Tagline 1", "المنصة الإعلامية", 1175, 80, 24.55, 99);
  headline("S8 Tagline 2", "الجزائرية الشاملة", 1280, 80, 24.9, 99, [0, 2]);
  var url = rect("S8 URL Pill", 460, 100, 50, { fill: C.g2, fo: 8, stroke: C.g2, sw: 3, so: 60 });
  P(url).setValue([CX, 1450]);
  var urlT = text("S8 URL", "sanadz.media", F.xbold, 52, hex("#e9fff3"), "c");
  try {
    var ud = urlT.property("ADBE Text Properties").property("ADBE Text Document");
    var udv = ud.value; udv.direction = ParagraphDirection.DIRECTION_LEFT_TO_RIGHT; ud.setValue(udv);
  } catch (e) {}
  anchor(urlT); child(urlT, url, 0, 0);
  keys(S(url), [[25.55, sc(60)], [25.95, sc(104)], [26.15, sc(100)]]);
  keys(O(url), [[25.55, 0], [25.8, 100]]);
  life(url, 25.5, DUR); life(urlT, 25.5, DUR);

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

  var fade = comp.layers.addSolid([0, 0, 0], "Fade In-Out", W, H, 1, DUR);
  keys(O(fade), [[0, 100], [0.25, 0], [DUR - 0.35, 0], [DUR, 100]]);
  fade.locked = true;
  bg.locked = true;
  comp.hideShyLayers = true;
  comp.openInViewer();

  app.endUndoGroup();
  alert("تم بناء المشروع: Sanad Reel 9x16\n\n" +
    "إن ظهرت الحروف العربية منفصلة: Preferences ← Type ← Text Engine ← South Asian and Middle Eastern، ثم أعد التشغيل وشغّل السكربت من جديد.\n" +
    "إن ظهر خط بديل: ثبّت Cairo و Tajawal.");
})();
