# فيديو سند للريلز

- `sanad-reel.mp4` — موشن جرافيك عمودي، 1080×1920، 28 ثانية، 30 إطاراً في الثانية، بلا صوت.
- `sanad-reel-cover.jpg` — صورة الغلاف (الإطار الختامي).
- `reel-source/` — مصدر التحريك: صفحة HTML تُرسم إطاراً بإطار.
- `reel-source/SanadReel.jsx` — الفيديو نفسه كمكوّن React مستقل، بأزرار تشغيل وإيقاف وشريط تقديم. يُولَّد من `index.html` بالأمر `python3 build-jsx.py`.

## إعادة التصدير بعد تعديل

النصوص والتوقيتات كلها في `reel-source/index.html`. بعد التعديل:

```bash
cd marketing/reel-source
node capture.cjs "$PWD" video ../sanad-reel-raw.mp4
ffmpeg -i ../sanad-reel-raw.mp4 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -shortest -c:v copy -c:a aac -movflags +faststart ../sanad-reel.mp4
```

يحتاج Playwright و Chromium و ffmpeg. الخطوط (Cairo و Tajawal) مرخّصة بـ SIL Open Font License.

# فيديو البورتفوليو (معرض الأعمال)

- `sanad-portfolio-reel.mp4` — 1080×1920، 52 ثانية، بلا صوت. يشرح النشر في المعرض، وكيف يظهر العمل في المعرض وفي صفحته وعلى الملف الشخصي، ونصائح الاستغلال.
- `sanad-portfolio-reel-cover.jpg` — صورة الغلاف.
- `portfolio-reel/` — مصدر التحريك. يُصدَّر بنفس الطريقة: `node capture.cjs "$PWD" video ../out.mp4`.

## المؤثرات الصوتية

الفيديوهان فيهما مؤثرات صوتية من مكتبة `motion-studio` (مجلد `public/audio`، رخصة MIT أو أصوات مولّدة أصلية)، موضوعة على لحظة كل حركة.
- جدول المؤثرات: `reel-source/sfx-cues.json` و`portfolio-reel/sfx-cues.json`.
- المسار منفصلاً لبرامج المونتاج: `sanad-reel-sfx.wav` و`sanad-portfolio-reel-sfx.wav`.
- لإعادة بنائه بعد تعديل التوقيت:
  `python3 <motion-studio>/tools/audio/sfx-pipeline/build_track.py reel-source/sfx-cues.json OUT --video sanad-reel.mp4 --mix`
