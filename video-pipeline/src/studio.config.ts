// The studio's settings. Every episode renders at this size and frame rate.
export const STUDIO = {
  fps: 30,
  width: 1080,
  height: 1920,
  /** Vertical safe area used by the review checks (px from each edge). */
  safe: { top: 120, bottom: 260, left: 64, right: 64 },
  /** A local display face for titles, as a file in public/. null uses the bundled Anton. */
  titleFont: null as null | { family: string; file: string; weight: string },
};
