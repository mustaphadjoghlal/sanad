/**
 * The geometry behind the profile-photo cropper, kept apart from the component
 * so it can be checked without a browser. Getting it wrong does not throw —
 * it saves the wrong part of the picture — so it is worth testing.
 *
 * The frame is a square of `size` screen pixels. The picture is drawn centred
 * in it, scaled so its shorter side fills the frame at zoom 1, then moved by
 * `offset` screen pixels.
 */

export interface Picture { width: number; height: number }
export interface Offset { x: number; y: number }

export const MAX_ZOOM = 4;

/** The scale at which the shorter side exactly fills the frame. */
export function fitScale(picture: Picture, size: number): number {
  return size / Math.min(picture.width, picture.height);
}

/** How far the picture may be moved before a gap would show at an edge. */
export function panLimits(picture: Picture, size: number, zoom: number): Offset {
  const scale = fitScale(picture, size) * zoom;
  return {
    x: Math.max(0, (picture.width * scale - size) / 2),
    y: Math.max(0, (picture.height * scale - size) / 2),
  };
}

/** Keeps the picture covering the frame. */
export function clampOffset(offset: Offset, picture: Picture, size: number, zoom: number): Offset {
  const limit = panLimits(picture, size, zoom);
  return {
    x: Math.min(limit.x, Math.max(-limit.x, offset.x)),
    y: Math.min(limit.y, Math.max(-limit.y, offset.y)),
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(1, zoom));
}

/**
 * The square the frame is showing, in the picture's own pixels — the rectangle
 * to hand to `drawImage`.
 */
export function cropRect(
  picture: Picture,
  size: number,
  zoom: number,
  offset: Offset
): { left: number; top: number; side: number } {
  const scale = fitScale(picture, size) * zoom;
  const side = size / scale;
  return {
    side,
    left: Math.min(Math.max(0, (picture.width - side) / 2 - offset.x / scale), Math.max(0, picture.width - side)),
    top: Math.min(Math.max(0, (picture.height - side) / 2 - offset.y / scale), Math.max(0, picture.height - side)),
  };
}

/** Never enlarge past what the picture holds — that only costs bytes. */
export function savedSize(side: number, output: number): number {
  return Math.max(256, Math.min(output, Math.round(side)));
}
