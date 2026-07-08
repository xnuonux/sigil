// the ground ... obsidian into seal-wax violet, drifting. low-res domain-warped
// fbm, bayer-dithered, upscaled chunky. 2d canvas, strictmode-safe, pauses when
// hidden, still under prefers-reduced-motion.
import { useEffect, useRef } from 'react';

const W = 192;
const H = 108;
const FPS = 20;

type RGB = [number, number, number];
const STOPS: RGB[] = [
  [10, 9, 16],
  [16, 14, 24],
  [30, 18, 52],
  [58, 30, 96],
  [104, 70, 160],
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const LEVELS = 5;

function makeNoise(seed: number) {
  let a = seed >>> 0;
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number, x: number, y: number) => {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return (x1 + v * (x2 - x1)) * 0.7071 + 0.5;
  };
}

function ramp(t: number): RGB {
  const c = Math.min(0.999, Math.max(0, t));
  const seg = c * (STOPS.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const a = STOPS[i], b = STOPS[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export function Ground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const noise = makeNoise(0x516c);
    const img = ctx.createImageData(W, H);
    const data = img.data;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let last = 0;

    const paint = (tMs: number) => {
      const t = tMs * 0.000016;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = (x / W) * 3.0 * (W / H);
          const ny = (y / H) * 3.0;
          const qx = noise(nx * 0.65 + t * 2.0, ny * 0.65 - t * 1.3);
          const qy = noise(nx * 0.65 - t * 1.6, ny * 0.65 + t * 2.4);
          let f = 0, amp = 0.5, fx = nx + 1.6 * qx + t * 2.6, fy = ny + 1.6 * qy;
          for (let o = 0; o < 3; o++) {
            f += amp * noise(fx, fy);
            fx *= 2.02; fy *= 2.02; amp *= 0.5;
          }
          f = Math.pow(f, 1.8) * 0.85;
          const dx = x / W - 0.5, dy = y / H - 0.4;
          const vg = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 1.4) * 0.62;
          let val = f * vg;
          const bay = BAYER[(x & 3) + ((y & 3) << 2)] / 16;
          val = Math.floor((val + (bay - 0.5) / LEVELS) * LEVELS) / LEVELS;
          const [r, g, b] = ramp(val);
          const i = (y * W + x) * 4;
          data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    if (still) {
      paint(32_000);
      return;
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - last < 1000 / FPS) return;
      last = now;
      paint(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        imageRendering: 'pixelated',
        opacity: 0.9,
      }}
    />
  );
}
