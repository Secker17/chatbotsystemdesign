import React, { useEffect, useMemo, useRef, useState } from 'react';

type Skin = 'default' | 'juleskin';
type ColorState = 'idle' | 'typing' | 'listening' | 'maintenance';

type RGB = { r: number; g: number; b: number };
type Point = { x: number; y: number };
type RuneTarget = { tx: number; ty: number };

type Sender = 'user' | 'bot' | string;

export interface GlassOrbAvatarProps {
  sender?: Sender;
  isTyping?: boolean;
  maintenance?: boolean;
  style?: React.CSSProperties;
  className?: string;
  size?: number;
  skin?: Skin;
  selected?: boolean;
}

type GoldDot = {
  x: number;
  y: number;
  vx: number;
  vy: number;

  ringAngle: number;
  ringRadius: number;
  ringSpeed: number;

  runeIndex: number;
};

type Snowflake = {
  x: number;
  y: number;
  r: number;
  s: number;
};

const GlassOrbAvatar: React.FC<GlassOrbAvatarProps> = ({
  sender,
  isTyping,
  maintenance = false,
  style,
  className,
  size = 40,
  skin = 'default',
  selected = false,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false); // only for React if you need it elsewhere
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const hoveredRef = useRef<boolean>(false);
  const colorStateRef = useRef<ColorState>('idle');
  const skinRef = useRef<Skin>(skin);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [colorState, setColorState] = useState<ColorState>('idle'); // 'idle' | 'typing' | 'listening' | 'maintenance'

  const colorPalettes = useMemo<Record<ColorState, RGB[]>>(
    () => ({
      idle: [
        { r: 0, g: 255, b: 255 },
        { r: 0, g: 240, b: 190 },
        { r: 50, g: 255, b: 255 },
        { r: 0, g: 200, b: 255 },
        { r: 0, g: 255, b: 180 },
        { r: 100, g: 255, b: 255 },
      ],
      maintenance: [
        { r: 255, g: 193, b: 7 },
        { r: 245, g: 158, b: 11 },
        { r: 255, g: 140, b: 0 },
        { r: 96, g: 165, b: 250 },
        { r: 59, g: 130, b: 246 },
        { r: 129, g: 140, b: 248 },
      ],
      typing: [
        { r: 50, g: 220, b: 50 },
        { r: 70, g: 240, b: 70 },
        { r: 100, g: 255, b: 100 },
      ],
      listening: [
        { r: 255, g: 50, b: 50 },
        { r: 255, g: 80, b: 80 },
        { r: 255, g: 120, b: 120 },
      ],
    }),
    []
  );

  useEffect(() => {
    if (maintenance) {
      setColorState('maintenance');
      return;
    }
    if (isTyping) setColorState(sender === 'user' ? 'typing' : 'listening');
    else setColorState('idle');
  }, [isTyping, sender, maintenance]);

  useEffect(() => {
    colorStateRef.current = colorState;
  }, [colorState]);

  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx2 = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;

    let sizePx = 0;
    let dpr = 1;

    let centerX = 0;
    let centerY = 0;

    let orbRadius = 0;

    // outer casing
    let casingOuter = 0;
    let casingInner = 0;

    // particle ring (donut)
    let ringOuter = 0;
    let ringInner = 0;

    // center disk
    let centerRadius = 0;

    const portal = {
      rimStroke: 'rgba(175, 185, 200, 0.70)',
      rimGlow: 'rgba(110, 130, 155, 0.35)',
      casing1: 'rgba(10, 12, 18, 1)',
      casing2: 'rgba(18, 22, 32, 1)',
      deep1: 'rgba(6, 8, 14, 1)',
      deep2: 'rgba(10, 13, 22, 1)',
      deep3: 'rgba(14, 20, 40, 1)',
    };

    const clampDpr = () => Math.min(window.devicePixelRatio || 1, 1.35);

    const updateDimensions = () => {
      // Ensure minimum size to prevent negative radius errors
      const rawSize = Math.min(container.offsetWidth, container.offsetHeight);
      sizePx = Math.max(rawSize, 40); // Minimum 40px to ensure positive radii after line width subtraction
      dpr = clampDpr();

      canvas.width = Math.floor(sizePx * dpr);
      canvas.height = Math.floor(sizePx * dpr);
      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;

      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);

      centerX = sizePx / 2;
      centerY = sizePx / 2;

      orbRadius = sizePx / 2;

      casingOuter = orbRadius * 0.995;
      casingInner = orbRadius * 0.9;

      ringOuter = orbRadius * 0.95;
      ringInner = orbRadius * 0.5;

      centerRadius = ringInner * 0.985;
    };

    updateDimensions();

    // -----------------------------
    // Color blending (green ring)
    // -----------------------------
    let colorIndex = 0;
    let colorProgress = 0;

    let currentPalette: RGB[] = colorPalettes[colorStateRef.current].map((c) => ({ ...c }));
    let targetPalette: RGB[] = colorPalettes[colorStateRef.current].map((c) => ({ ...c }));
    let paletteT = 1;

    const getRingColorRGB = (offset = 0): RGB => {
      const cols = currentPalette.map((cur, i) => {
        const tgt = targetPalette[i] || targetPalette[targetPalette.length - 1];
        return {
          r: Math.floor(cur.r + (tgt.r - cur.r) * paletteT),
          g: Math.floor(cur.g + (tgt.g - cur.g) * paletteT),
          b: Math.floor(cur.b + (tgt.b - cur.b) * paletteT),
        };
      });

      const base = (colorIndex + offset) % cols.length;
      const a = cols[base];
      const b = cols[(base + 1) % cols.length];

      return {
        r: Math.floor(a.r + (b.r - a.r) * colorProgress),
        g: Math.floor(a.g + (b.g - a.g) * colorProgress),
        b: Math.floor(a.b + (b.b - a.b) * colorProgress),
      };
    };

    const rgba = (c: RGB, a: number) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    const mix = (a: number, b: number, t: number) => a + (b - a) * t;
    const mixRGB = (a: RGB, b: RGB, t: number): RGB => ({
      r: Math.round(mix(a.r, b.r, t)),
      g: Math.round(mix(a.g, b.g, t)),
      b: Math.round(mix(a.b, b.b, t)),
    });

    // -----------------------------
    // Rune shape helpers
    // -----------------------------
    const sampleLine = (ax: number, ay: number, bx: number, by: number, steps: number): Point[] => {
      const pts: Point[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
      }
      return pts;
    };

    // -----------------------------
    // Rune shape (ᚨ / Ansuz) - SOLID (no gaps)
    // stem + two right-leaning arms, with stroke-fill thickness
    // -----------------------------
    const buildAnsuzPoints = (): Point[] => {
      const pts: Point[] = [];

      const addStroke = (linePts: Point[], dxs: number[], dys: number[]): Point[] => {
        const out: Point[] = [];
        for (const p of linePts) {
          for (const dx of dxs) for (const dy of dys) out.push({ x: p.x + dx, y: p.y + dy });
        }
        return out;
      };

      const xStem = -0.35;
      const stem = sampleLine(xStem, -0.85, xStem, 0.85, 140);

      const topArm = sampleLine(xStem, -0.35, 0.55, -0.6, 110);
      const midArm = sampleLine(xStem, 0.05, 0.45, -0.12, 95);

      const stemDX = [-0.08, -0.05, -0.025, 0, 0.025, 0.05, 0.08];
      const stemDY = [-0.03, 0, 0.03];

      const armDX = [-0.05, -0.025, 0, 0.025, 0.05];
      const armDY = [-0.03, 0, 0.03];

      pts.push(...addStroke(stem, stemDX, stemDY), ...addStroke(topArm, armDX, armDY), ...addStroke(midArm, armDX, armDY));

      return pts;
    };

    // swap rune points source:
    const runeNorm: Point[] = buildAnsuzPoints();

    const runeTargets = (): RuneTarget[] => {
      const radius = centerRadius * 0.78;
      return runeNorm.map((p) => ({
        tx: centerX + p.x * radius,
        ty: centerY + p.y * radius,
      }));
    };

    // -----------------------------
    // Ring particles (green)
    // -----------------------------
    let ringParticles: RingParticle[] = [];

    const initRingParticles = () => {
      const base = 520;
      const count = Math.max(240, Math.min(820, Math.floor(base * (sizePx / 420))));
      ringParticles = new Array(count).fill(0).map(() => new RingParticle());
    };

    class RingParticle {
      radius: number;
      angle: number;
      speed: number;
      size: number;
      colorOffset: number;

      constructor() {
        this.radius = ringInner + Math.random() * (ringOuter - ringInner);
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.010 + 0.004) * (Math.random() < 0.5 ? 1 : -1);
        this.size = (Math.random() * 2.6 + 2.0) * (sizePx / 500);
        this.colorOffset = (Math.random() * 9999) | 0;
      }

      update(speedMul: number) {
        this.angle += this.speed * speedMul;
      }

      draw(speedMul: number, hovered: boolean) {
        const x = centerX + Math.cos(this.angle) * this.radius;
        const y = centerY + Math.sin(this.angle) * this.radius;

        let baseA = 0.26;
        let glowA = 0.12;

        if (hovered) {
          baseA *= 1.06;
          glowA *= 1.25;
        }

        const rgb = getRingColorRGB(this.colorOffset);
        const fill = rgba(rgb, baseA);
        const glow = rgba(rgb, glowA);

        ctx2.shadowBlur = (14 + 6 * speedMul) * (sizePx / 500);
        ctx2.shadowColor = glow;

        ctx2.fillStyle = fill;
        ctx2.beginPath();
        ctx2.arc(x, y, this.size, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.globalAlpha = 0.12;
        ctx2.shadowBlur = 24 * (sizePx / 500);
        ctx2.fillStyle = glow;
        ctx2.beginPath();
        ctx2.arc(x, y, this.size + 2.0 * (sizePx / 500), 0, Math.PI * 2);
        ctx2.fill();
        ctx2.globalAlpha = 1;
      }
    }

    // -----------------------------
    // Gold dots (no respawn)
    // -----------------------------
    let goldDots: GoldDot[] = [];
    let goldBlend = 1; // Start with rune visible (was 0)
    let goldTargets: RuneTarget[] = runeTargets();

    const shuffleInPlace = <T,>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const initGoldDots = () => {
      const base = 400;
      const count = Math.max(260, Math.min(900, Math.floor(base * (sizePx / 420))));

      goldTargets = runeTargets();

      const idx = Array.from({ length: count }, (_, i) =>
        Math.floor((i / Math.max(1, count - 1)) * Math.max(1, goldTargets.length - 1))
      );
      shuffleInPlace(idx);

      goldDots = new Array(count).fill(0).map((_, i) => {
        const a = Math.random() * Math.PI * 2;
        const rr = ringInner + Math.random() * (ringOuter - ringInner);

        return {
          x: centerX + Math.cos(a) * rr,
          y: centerY + Math.sin(a) * rr,
          vx: 0,
          vy: 0,

          ringAngle: a,
          ringRadius: rr,
          ringSpeed: (Math.random() * 0.010 + 0.004) * (Math.random() < 0.5 ? 1 : -1),

          runeIndex: idx[i],
        };
      });
    };

    const updateGoldTargetsOnResize = () => {
      goldTargets = runeTargets();
      for (const d of goldDots) {
        d.runeIndex = Math.min(d.runeIndex, goldTargets.length - 1);
      }
    };

    const updateGoldDots = (speedMul: number, hovered: boolean) => {
      if (!goldDots.length) return;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const targetBlend = hovered ? 1 : 0;
      goldBlend += (targetBlend - goldBlend) * 0.12;

      const spring = mix(0.12, 0.18, goldBlend);
      const damp = 0.82;

      for (const d of goldDots) {
        d.ringAngle += d.ringSpeed * speedMul;

        const ringTx = centerX + Math.cos(d.ringAngle) * d.ringRadius;
        const ringTy = centerY + Math.sin(d.ringAngle) * d.ringRadius;

        const t = goldTargets[d.runeIndex] || goldTargets[0];
        const runeTx = t.tx;
        const runeTy = t.ty;

        const tx = mix(ringTx, runeTx, goldBlend);
        const ty = mix(ringTy, runeTy, goldBlend);

        if (hovered && mx !== null && my !== null && goldBlend > 0.15) {
          const dx = d.x - mx;
          const dy = d.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repelR = centerRadius * 0.26;

          if (dist < repelR && dist > 0.0001) {
            const push = (1 - dist / repelR) * (1.9 * goldBlend);
            d.vx += (dx / dist) * push;
            d.vy += (dy / dist) * push;
          }
        }

        d.vx += (tx - d.x) * spring;
        d.vy += (ty - d.y) * spring;

        d.vx *= damp;
        d.vy *= damp;

        d.x += d.vx;
        d.y += d.vy;
      }
    };

    const drawGoldDots = () => {
      if (!goldDots.length) return;

      ctx2.shadowBlur = 0;
      ctx2.shadowColor = 'transparent';

      const goldRGB: RGB = { r: 255, g: 196, b: 70 };
      const dotR = mix(3.0, 5.2, goldBlend) * (sizePx / 500);

      for (const d of goldDots) {
        const ringRGB = getRingColorRGB(d.runeIndex * 13);
        const rgb = mixRGB(ringRGB, goldRGB, goldBlend);

        const alpha = mix(0.0, 1.0, goldBlend);
        ctx2.fillStyle = rgba(rgb, alpha);

        ctx2.beginPath();
        ctx2.arc(d.x, d.y, dotR, 0, Math.PI * 2);
        ctx2.fill();
      }
    };

    // -----------------------------
    // Portal background
    // -----------------------------
    const drawPortalBase = () => {
      const g = ctx2.createRadialGradient(centerX, centerY, orbRadius * 0.08, centerX, centerY, orbRadius);
      g.addColorStop(0, portal.deep2);
      g.addColorStop(0.55, portal.deep3);
      g.addColorStop(1, portal.deep1);

      ctx2.fillStyle = g;
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      ctx2.fill();

      ctx2.save();
      const cg = ctx2.createRadialGradient(centerX, centerY, casingInner, centerX, centerY, casingOuter);
      cg.addColorStop(0, portal.casing2);
      cg.addColorStop(1, portal.casing1);

      ctx2.fillStyle = cg;
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      ctx2.arc(centerX, centerY, casingInner, 0, Math.PI * 2, true);
      ctx2.fill('evenodd');
      ctx2.restore();

      ctx2.save();
      const dg = ctx2.createRadialGradient(centerX, centerY, centerRadius * 0.05, centerX, centerY, centerRadius);
      dg.addColorStop(0, portal.deep3);
      dg.addColorStop(0.65, portal.deep2);
      dg.addColorStop(1, portal.deep1);

      ctx2.fillStyle = dg;
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();

      ctx2.save();
      ctx2.shadowBlur = 18 * (sizePx / 500);
      ctx2.shadowColor = portal.rimGlow;
      ctx2.strokeStyle = portal.rimStroke;
      ctx2.lineWidth = Math.max(2, sizePx / 140);
      const rimRadius = Math.max(0, casingOuter - ctx2.lineWidth * 0.5);
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, rimRadius, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.restore();
    };

    // clip helpers
    const clipRing = () => {
      ctx2.save();
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, ringOuter, 0, Math.PI * 2);
      ctx2.arc(centerX, centerY, ringInner, 0, Math.PI * 2, true);
      ctx2.clip('evenodd');
    };
    const clipOrb = () => {
      ctx2.save();
      ctx2.beginPath();
      ctx2.arc(centerX, centerY, casingOuter, 0, Math.PI * 2);
      ctx2.clip();
    };
    const unclip = () => ctx2.restore();

    // -----------------------------
    // Optional snow (juleskin)
    // -----------------------------
    let snowflakes: Snowflake[] = [];

    const initSnowflakes = () => {
      const count = Math.max(34, Math.min(110, Math.floor(64 * (sizePx / 260))));
      snowflakes = new Array(count).fill(0).map(() => ({
        x: Math.random() * sizePx,
        y: Math.random() * sizePx,
        r: (Math.random() * 1.2 + 0.4) * (sizePx / 220),
        s: (Math.random() * 0.33 + 0.16) * (sizePx / 240),
      }));
    };

    const drawSnow = () => {
      ctx2.save();
      ctx2.fillStyle = 'rgba(255,255,255,0.72)';
      for (const f of snowflakes) {
        f.y += f.s;
        if (f.y > sizePx + 6) {
          f.y = -10;
          f.x = Math.random() * sizePx;
        }
        ctx2.beginPath();
        ctx2.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.restore();
    };

    // -----------------------------
    // Init once
    // -----------------------------
    initRingParticles();
    initGoldDots();
    if (skinRef.current === 'juleskin') initSnowflakes();

    const ro = new ResizeObserver(() => {
      updateDimensions();
      updateGoldTargetsOnResize();
      // NOTE: optional: re-init ring particles or snowflakes on resize if you want density to match size changes
      // initRingParticles();
      // if (skinRef.current === 'juleskin') initSnowflakes();
    });
    ro.observe(container);

    // -----------------------------
    // Animation loop (NO React state inside)
    // -----------------------------
    const animate = () => {
      // Skip rendering if container has no valid dimensions yet
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // palette timing
      colorProgress += 0.0032;
      if (colorProgress >= 1) {
        colorProgress = 0;
        colorIndex = (colorIndex + 1) % Math.max(1, targetPalette.length);
      }

      // palette transition (using ref)
      const nextPalette = colorPalettes[colorStateRef.current];
      if (currentPalette[0]?.r !== nextPalette[0]?.r) {
        targetPalette = nextPalette.map((c) => ({ ...c }));
        paletteT = 0;
      }
      if (paletteT < 1) paletteT = Math.min(1, paletteT + 0.03);

      currentPalette = currentPalette.map((cur, i) => {
        const tgt = targetPalette[i] || targetPalette[targetPalette.length - 1];
        return {
          r: Math.floor(cur.r + (tgt.r - cur.r) * 0.10),
          g: Math.floor(cur.g + (tgt.g - cur.g) * 0.10),
          b: Math.floor(cur.b + (tgt.b - cur.b) * 0.10),
        };
      });

      const hovered = hoveredRef.current;
      const speedMul = hovered ? 3.0 : 1.0;

      ctx2.clearRect(0, 0, sizePx, sizePx);

      drawPortalBase();

      clipRing();
      if (skinRef.current === 'juleskin') drawSnow();
      for (const p of ringParticles) {
        p.update(speedMul);
        p.draw(speedMul, hovered);
      }
      unclip();

      clipOrb();
      updateGoldDots(speedMul, hovered);
      drawGoldDots();
      unclip();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [colorPalettes]);

  const portalBackground =
    'radial-gradient(circle at 50% 50%, ' +
    'rgba(0,0,0,0) 0%, ' +
    'rgba(30,255,190,0.10) 35%, ' +
    'rgba(30,255,190,0.05) 60%, ' +
    'rgba(0,0,0,0) 100%)';

  const portalBoxShadow =
    skin === 'juleskin'
      ? '0 0 70px rgba(255,80,80,0.22), 0 0 140px rgba(255,40,40,0.14)'
      : '0 0 70px rgba(30,255,190,0.18), 0 0 140px rgba(30,255,190,0.12)';

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerEnter={() => {
        setIsHovered(true);
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        setIsHovered(false);
        hoveredRef.current = false;
        mouseRef.current.x = null;
        mouseRef.current.y = null;
      }}
      onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }}
      style={{
        position: 'absolute',
        background: 'none',
        width: style?.width || `${selected ? 80 : size}px`,
        height: style?.height || `${selected ? 80 : size}px`,
        cursor: 'pointer',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: portalBackground,
          boxShadow: portalBoxShadow,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          background: 'none',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default GlassOrbAvatar;
