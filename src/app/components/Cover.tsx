import { useState } from "react";
import { AspectRatio } from "radix-ui";

/**
 * Covers for job ads, competitions and news.
 *
 * One shape everywhere: 1200×630 (1.91:1), the size Facebook, WhatsApp and
 * LinkedIn use for link previews, which is where these same images go when a
 * page is shared.
 *
 * Nothing is cropped away when an image is another shape. A square or
 * portrait poster is shown whole, centred, over a blurred and darkened copy of
 * itself that fills the rest of the frame. Only an image already close to
 * 1.91:1 fills the frame edge to edge, where trimming a few pixels shows
 * nothing a reader would miss.
 */
export const COVER_RATIO = 1200 / 630;

/** How far from the frame's shape an image may be and still fill it. */
const FILL_TOLERANCE = 0.1;

function fitFor(img: HTMLImageElement, ratio: number): "cover" | "contain" {
  if (!img.naturalWidth || !img.naturalHeight) return "contain";
  const r = img.naturalWidth / img.naturalHeight;
  return Math.abs(r / ratio - 1) <= FILL_TOLERANCE ? "cover" : "contain";
}

function Backdrop({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.2)",
        filter: "blur(22px) brightness(0.45) saturate(1.2)",
        pointerEvents: "none",
      }}
    />
  );
}

interface CardCoverProps {
  src?: string;
  alt: string;
  ratio?: number;
  /** Shown in the frame when there is no image. */
  fallback?: React.ReactNode;
  /** Badges and the like, laid over the image. */
  children?: React.ReactNode;
  imgClassName?: string;
}

/** A fixed-shape cover for cards. */
export function CardCover({ src, alt, ratio = COVER_RATIO, fallback, children, imgClassName = "" }: CardCoverProps) {
  const [fit, setFit] = useState<"cover" | "contain">("contain");
  return (
    <AspectRatio.Root ratio={ratio}>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(15,166,89,0.14), rgba(15,166,89,0.04))" }}
      >
        {src ? (
          <>
            {fit === "contain" && <Backdrop src={src} />}
            <img
              loading="lazy"
              decoding="async"
              src={src}
              alt={alt}
              onLoad={(e) => setFit(fitFor(e.currentTarget, ratio))}
              className={imgClassName}
              style={{ position: "relative", width: "100%", height: "100%", objectFit: fit }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">{fallback}</div>
        )}
        {children}
      </div>
    </AspectRatio.Root>
  );
}

/**
 * The cover at the top of a detail page: the whole image, never cropped,
 * at most 70% of the screen tall, with the blurred fill either side.
 */
export function DetailCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ background: "#060a07" }}>
      <Backdrop src={src} />
      <img
        decoding="async"
        src={src}
        alt={alt}
        style={{
          position: "relative",
          display: "block",
          margin: "0 auto",
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          maxHeight: "min(70vh, 640px)",
        }}
      />
    </div>
  );
}
