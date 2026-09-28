import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn, Move } from "lucide-react";
import { MAX_ZOOM, clampOffset, clampZoom, cropRect, fitScale, savedSize } from "../../lib/crop";

/**
 * Picks which part of a picture becomes the profile photo.
 *
 * Until now the uploader took the whole picture and the avatar showed its
 * middle, which is rarely where the face is — a photo taken in portrait put
 * the head above the frame. So show the frame, let it be dragged and zoomed,
 * and upload what was actually chosen.
 *
 * The preview is a canvas rather than an <img> on purpose: the crop is drawn
 * with the same call on the same source, so what gets saved is exactly what
 * was on screen, including the orientation a phone camera records in EXIF.
 */

type Source = { image: CanvasImageSource; width: number; height: number };

/** Honours EXIF orientation, and falls back for browsers without bitmaps. */
async function loadSource(file: File): Promise<Source> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { image: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
        el.src = url;
      });
      return { image, width: image.naturalWidth, height: image.naturalHeight };
    } finally {
      // The element keeps its own copy of the decoded pixels.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

export default function ImageCropper({
  file,
  onCancel,
  onDone,
  output = 800,
}: {
  file: File;
  onCancel: () => void;
  onDone: (cropped: File) => void;
  /** Longest side of the saved square, in pixels. */
  output?: number;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef(0);

  const [size, setSize] = useState(() => Math.min(320, Math.max(220, window.innerWidth - 88)));
  useEffect(() => {
    const onResize = () => setSize(Math.min(320, Math.max(220, window.innerWidth - 88)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    loadSource(file).then(
      (loaded) => { if (alive) setSource(loaded); },
      (e: Error) => { if (alive) setError(e.message); }
    );
    return () => { alive = false; };
  }, [file]);

  // The picture must never leave a gap at the edge of the frame.
  const clamp = useCallback(
    (next: { x: number; y: number }, atZoom: number) =>
      source ? clampOffset(next, source, size, atZoom) : next,
    [source, size]
  );

  const changeZoom = useCallback(
    (next: number) => {
      const bounded = clampZoom(next);
      setZoom(bounded);
      setOffset((current) => clamp(current, bounded));
    },
    [clamp]
  );

  // Redraw the frame on every change; a square this small is cheap to paint.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const scale = fitScale(source, size) * zoom;
    const width = source.width * scale;
    const height = source.height * scale;
    ctx.drawImage(source.image, size / 2 - width / 2 + offset.x, size / 2 - height / 2 + offset.y, width, height);
  }, [source, size, zoom, offset]);

  // Escape backs out, and the page behind must not scroll under the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinchDistance.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const touches = [...pointers.current.values()];

    if (touches.length >= 2) {
      // Two fingers: the distance between them sets the zoom.
      const distance = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
      if (pinchDistance.current > 0 && distance > 0) {
        changeZoom(zoom * (distance / pinchDistance.current));
      }
      pinchDistance.current = distance;
      return;
    }

    setOffset((current) =>
      clamp({ x: current.x + (e.clientX - previous.x), y: current.y + (e.clientY - previous.y) }, zoom)
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDistance.current = 0;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    changeZoom(zoom * (e.deltaY > 0 ? 0.92 : 1.08));
  };

  const save = async () => {
    if (!source) return;
    setSaving(true);
    try {
      // The square the frame is showing, in the picture's own pixels.
      const { left, top, side } = cropRect(source, size, zoom, offset);
      const saved = savedSize(side, output);
      const canvas = document.createElement("canvas");
      canvas.width = saved;
      canvas.height = saved;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("تعذّر تجهيز الصورة");
      ctx.drawImage(source.image, left, top, side, side, 0, 0, saved, saved);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
      if (!blob) throw new Error("تعذّر تجهيز الصورة");
      onDone(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
    } catch (e) {
      setError((e as Error).message || "تعذّر تجهيز الصورة");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-title"
        dir="rtl"
        className="rounded-2xl p-5 animate-fade-in-up"
        style={{
          background: "linear-gradient(145deg, #151b17, #0f130f)",
          border: "1px solid var(--p-30)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        <h2 id="cropper-title" className="font-bold mb-1" style={{ color: "var(--theme-text, #e8f5e9)" }}>
          اختر مكان الاقتصاص
        </h2>
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "var(--theme-text-muted, #78909c)" }}>
          <Move size={13} />
          اسحب الصورة لتحريكها، وكبّرها بالشريط أو بإصبعين
        </p>

        {error ? (
          <p className="text-sm py-6 text-center" style={{ color: "#f87171", width: size }}>{error}</p>
        ) : (
          <>
            <div
              className="relative mx-auto touch-none select-none"
              style={{ width: size, height: size, cursor: source ? "grab" : "wait" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              <canvas
                ref={canvasRef}
                style={{ width: size, height: size, display: "block", borderRadius: "0.75rem", background: "#080808" }}
              />
              {/* The ring shows what the round avatar will keep. */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  clipPath: `inset(0 round 0.75rem)`,
                }}
              />
            </div>

            <label className="flex items-center gap-2 mt-4" style={{ width: size }}>
              <ZoomIn size={16} style={{ color: "var(--theme-text-muted, #78909c)", flexShrink: 0 }} />
              <span className="sr-only">تكبير</span>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                disabled={!source}
                onChange={(e) => changeZoom(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--theme-accent, #00a355)" }}
              />
            </label>
          </>
        )}

        <div className="flex gap-2 mt-5" style={{ width: size }}>
          <button
            type="button"
            onClick={save}
            disabled={!source || saving || !!error}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: !source || saving || error ? "var(--p-20)" : "var(--theme-accent, #00a355)",
              color: "#fff",
              border: "none",
              cursor: !source || saving || error ? "not-allowed" : "pointer",
            }}
          >
            <Check size={15} />
            {saving ? "جاري التجهيز..." : "استخدم هذا الاقتصاص"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
            style={{
              background: "var(--p-15)",
              color: "var(--theme-text, #e8f5e9)",
              border: "1px solid var(--p-30)",
              cursor: "pointer",
            }}
          >
            <X size={15} />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
