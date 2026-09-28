import { describe, it, expect } from "vitest";
import { cropRect, clampOffset, clampZoom, panLimits, savedSize, fitScale } from "../crop";

const FRAME = 300;
const landscape = { width: 2000, height: 1000 };
const portrait = { width: 1000, height: 2000 };
const square = { width: 1200, height: 1200 };

describe("the crop frame", () => {
  it("fills the frame with the shorter side at zoom 1", () => {
    expect(fitScale(landscape, FRAME)).toBeCloseTo(0.3);
    expect(fitScale(portrait, FRAME)).toBeCloseTo(0.3);
  });

  it("takes the middle square when nothing has been moved", () => {
    const { left, top, side } = cropRect(landscape, FRAME, 1, { x: 0, y: 0 });
    expect(side).toBeCloseTo(1000);
    expect(left).toBeCloseTo(500); // centred across the wide side
    expect(top).toBeCloseTo(0);    // the short side is fully used
  });

  it("moves the crop towards the part dragged into view", () => {
    // Dragging the picture right shows what was off its left edge.
    const dragged = cropRect(landscape, FRAME, 1, { x: 60, y: 0 });
    expect(dragged.left).toBeCloseTo(300);
    expect(cropRect(landscape, FRAME, 1, { x: -60, y: 0 }).left).toBeCloseTo(700);
  });

  it("keeps a portrait photo's head in frame when dragged down", () => {
    // A phone portrait: the centred square misses a face near the top.
    expect(cropRect(portrait, FRAME, 1, { x: 0, y: 0 }).top).toBeCloseTo(500);
    expect(cropRect(portrait, FRAME, 1, { x: 0, y: 150 }).top).toBeCloseTo(0);
  });

  it("shrinks the square as the zoom grows", () => {
    expect(cropRect(square, FRAME, 1, { x: 0, y: 0 }).side).toBeCloseTo(1200);
    expect(cropRect(square, FRAME, 2, { x: 0, y: 0 }).side).toBeCloseTo(600);
    expect(cropRect(square, FRAME, 4, { x: 0, y: 0 }).side).toBeCloseTo(300);
  });

  it("never reads outside the picture, however far it is dragged", () => {
    for (const picture of [landscape, portrait, square]) {
      for (const zoom of [1, 1.5, 2, 4]) {
        for (const offset of [{ x: 9999, y: 9999 }, { x: -9999, y: -9999 }]) {
          const clamped = clampOffset(offset, picture, FRAME, zoom);
          const { left, top, side } = cropRect(picture, FRAME, zoom, clamped);
          expect(left).toBeGreaterThanOrEqual(0);
          expect(top).toBeGreaterThanOrEqual(0);
          expect(left + side).toBeLessThanOrEqual(picture.width + 1e-6);
          expect(top + side).toBeLessThanOrEqual(picture.height + 1e-6);
        }
      }
    }
  });
});

describe("the limits", () => {
  it("allows no sideways movement for a square photo at zoom 1", () => {
    expect(panLimits(square, FRAME, 1)).toEqual({ x: 0, y: 0 });
  });

  it("allows movement along the longer side only", () => {
    const limit = panLimits(landscape, FRAME, 1);
    expect(limit.x).toBeGreaterThan(0);
    expect(limit.y).toBe(0);
  });

  it("holds the zoom between fitting the frame and four times in", () => {
    expect(clampZoom(0.2)).toBe(1);
    expect(clampZoom(2.5)).toBe(2.5);
    expect(clampZoom(99)).toBe(4);
  });
});

describe("the saved file", () => {
  it("does not enlarge a small crop", () => {
    expect(savedSize(400, 800)).toBe(400);
  });

  it("caps a large crop at the output size", () => {
    expect(savedSize(4000, 800)).toBe(800);
  });

  it("stays usable for a deeply zoomed crop", () => {
    expect(savedSize(80, 800)).toBe(256);
  });
});
