# فيديو سند للريلز

- `sanad-reel.mp4` — موشن جرافيك عمودي، 1080×1920، 28 ثانية، 30 إطاراً في الثانية، بلا صوت.
- `sanad-reel-cover.jpg` — صورة الغلاف (الإطار الختامي).
- `reel-source/` — مصدر التحريك: صفحة HTML تُرسم إطاراً بإطار.

## إعادة التصدير بعد تعديل

النصوص والتوقيتات كلها في `reel-source/index.html`. بعد التعديل:

```bash
cd marketing/reel-source
node capture.cjs "$PWD" video ../sanad-reel-raw.mp4
ffmpeg -i ../sanad-reel-raw.mp4 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -shortest -c:v copy -c:a aac -movflags +faststart ../sanad-reel.mp4
```

يحتاج Playwright و Chromium و ffmpeg. الخطوط (Cairo و Tajawal) مرخّصة بـ SIL Open Font License.
