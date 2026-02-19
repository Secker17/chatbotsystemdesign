import { useEffect, useRef, useState, useMemo } from 'react';

const GlassOrbAvatar = ({
  sender,
  isTyping,
  maintenance = false,
  style,
  className,
  size = 40,
  skin = 'default', // 'default' | 'juleskin'
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  const [colorState, setColorState] = useState('idle'); // 'idle' | 'typing' | 'listening'

  const colorPalettes = useMemo(() => ({
    idle: [
      { r: 80, g: 150, b: 255 },
      { r: 90, g: 170, b: 255 },
      { r: 100, g: 190, b: 255 },
      { r: 130, g: 170, b: 255 },
      { r: 160, g: 150, b: 255 },
      { r: 200, g: 130, b: 255 },
      { r: 230, g: 120, b: 255 },
    ],
    maintenance: [
      { r: 255, g: 193, b: 7 },
      { r: 245, g: 158, b: 11 },
      { r: 255, g: 140, b: 0 },
      { r: 96, g: 165, b: 250 },
      { r: 59, g: 130, b: 246 },
      { r: 129, g: 140, b: 248 },
    ],
    // Green for user typing
    typing: [
      { r: 50, g: 220, b: 50 },   // Bright green
      { r: 70, g: 240, b: 70 },   // Lighter green
      { r: 100, g: 255, b: 100 }, // Lightest green
    ],
    // Red for AI typing/responding
    listening: [
      { r: 255, g: 50, b: 50 },   // Bright red
      { r: 255, g: 80, b: 80 },   // Lighter red
      { r: 255, g: 120, b: 120 }, // Lightest red
    ],
  }), []);

  useEffect(() => {
    if (maintenance) {
      setColorState('maintenance');
      return;
    }

    if (isTyping) {
      setColorState(sender === 'user' ? 'typing' : 'listening');
    } else {
      setColorState('idle');
    }
  }, [isTyping, sender, maintenance]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // fysikk-konstanter (oppdateres ved resize)
    let centerX = 0;
    let centerY = 0;
    let orbRadius = 0;
    let minRadius = 0;
    let maxRadius = 0;
    let pullAngleRange = 0.9;
    let maxPullAmount = 0;
    let pullRingThickness = 0;
    let mouseRepelRadius = 0;
    let maxPushStrength = 0;

    const updatePhysicsConstants = (sizePx) => {
      centerX = sizePx / 2;
      centerY = sizePx / 2;
      orbRadius = sizePx / 2;
      minRadius = orbRadius * 0.06;
      maxRadius = orbRadius * 0.9;

      pullAngleRange = 0.9;
      maxPullAmount = orbRadius * 0.45;

      const basePullThicknessPx = 300; // som i HTML
      pullRingThickness = basePullThicknessPx * (sizePx / 400);

      mouseRepelRadius = orbRadius * 0.25;
      maxPushStrength = orbRadius * 0.06;
    };

    const updateDimensions = () => {
      const sizePx = Math.min(container.offsetWidth, container.offsetHeight);
      canvas.width = sizePx;
      canvas.height = sizePx;
      updatePhysicsConstants(sizePx);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    let particles = [];
    let snowflakes = [];
    let explosions = [];
    let mouseX = null;
    let mouseY = null;
    let colorIndex = 0;
    let colorProgress = 0;

    let currentPaletteColors = colorPalettes[colorState].map((c) => ({ ...c }));
    let targetPaletteColors = colorPalettes[colorState].map((c) => ({ ...c }));
    let colorTransitionProgress = 1;

    const getCurrentColor = (alpha = 0.25, variant = 'normal', offset = 0) => {
      const colors = currentPaletteColors.map((current, i) => {
        const target = targetPaletteColors[i];
        return {
          r: Math.floor(
            current.r + (target.r - current.r) * colorTransitionProgress
          ),
          g: Math.floor(
            current.g + (target.g - current.g) * colorTransitionProgress
          ),
          b: Math.floor(
            current.b + (target.b - current.b) * colorTransitionProgress
          ),
        };
      });

      const baseIndex = (colorIndex + offset) % colors.length;
      const current = colors[baseIndex];
      const next = colors[(baseIndex + 1) % colors.length];

      let r, g, b;

      if (variant === 'pulled') {
        r = Math.min(255, Math.floor(current.r * 1.2));
        g = Math.min(255, Math.floor(current.g * 1.2));
        b = Math.min(255, Math.floor(current.b * 1.2));
      } else if (variant === 'pushed') {
        r = 255;
        g = 35;
        b = 35;
      } else {
        r = Math.floor(current.r + (next.r - current.r) * colorProgress);
        g = Math.floor(current.g + (next.g - current.g) * colorProgress);
        b = Math.floor(current.b + (next.b - current.b) * colorProgress);
      }

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };


    // ---------- JULE-SKIN: Juletre + blinkende lys + stjerne ----------

    // Litt grov tekstur til treet (som barnåler/uregelmessigheter)
    const addTreeTexture = (base, nx, ny) => {
    const noise1 =
        (Math.sin(nx * 15) + Math.sin((ny + 0.7) * 21)) * 0.10;
    const noise2 =
        (Math.cos(nx * 27 - ny * 9) + Math.sin(nx * 9 + ny * 13)) * 0.06;
    const shade = 0.9 + noise1 + noise2; // ca 0.74–1.06
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return {
        r: clamp(base.r * shade),
        g: clamp(base.g * shade),
        b: clamp(base.b * shade),
    };
    };

    // Felles geometri for treet og stjerna
const STAR_Y = -0.48;
const STAR_RADIUS = 0.14;
const TREE_TOP = -0.30;      // topp av treet
const TREE_BOTTOM = 0.50;    // nederste kant på det grønne
const TREE_BASE_WIDTH = 0.55;
const TREE_TOP_WIDTH = 0.12;


const isInTree = (nx, ny) => {
  if (ny < TREE_TOP || ny > TREE_BOTTOM) return false;
  const t = (ny - TREE_TOP) / (TREE_BOTTOM - TREE_TOP); // 0 top → 1 bunn
  const halfWidth =
    TREE_TOP_WIDTH + (TREE_BASE_WIDTH - TREE_TOP_WIDTH) * t;
  return Math.abs(nx) < halfWidth;
};

const isInStar = (nx, ny) => {
  const dx = nx;
  const dy = ny - STAR_Y;
  const r = Math.sqrt(dx * dx + dy * dy);
  return r < STAR_RADIUS * 0.7; // tydelig, men litt "myk" stjerne-kjerne
};

const getChristmasBaseColor = (x, y) => {
  const nx = (x - centerX) / orbRadius;
  const ny = (y - centerY) / orbRadius;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Utenfor kula → mørk bakgrunn
  if (dist > 1) return { r: 8, g: 10, b: 25 };

  // Litt mørk blå nattehimmel inne i kula
  const skyBase = { r: 15, g: 20, b: 45 };

  // ░░░ STJERNE ░░░
  if (isInStar(nx, ny)) {
    const twinkle = 0.9 + 0.1 * Math.sin(colorProgress * 10);
    return {
      r: Math.round(255 * twinkle),
      g: Math.round(245 * twinkle),
      b: Math.round(210 * twinkle),
    };
  }

    // ░░░ STAMME – tydelig, lysere og med svak outline ░░░
    if (ny > TREE_BOTTOM + 0.02 && ny < TREE_BOTTOM + 0.26 && Math.abs(nx) < 0.09) {
    const w = 0.09;
    const t = Math.abs(nx) / w; // 0 i midten → 1 ved kanten

    // Lysere og mer "tre-aktig" brun
    const base = { r: 140, g: 95, b: 55 };

    // Sentrumslys → stammen ser avrundet og mer synlig ut
    const centerLight = 1 - t * 0.45;

    // Gjør stammen litt mer synlig mot bakgrunnen
    const visibilityBoost = 1.12;

    return {
        r: Math.min(255, Math.round(base.r * centerLight * visibilityBoost)),
        g: Math.min(255, Math.round(base.g * centerLight * visibilityBoost)),
        b: Math.min(255, Math.round(base.b * centerLight * visibilityBoost)),
    };
    }

  // ░░░ JULETRE (ren trekant-form) ░░░
  if (isInTree(nx, ny)) {
    // klar grønn base
    let green = { r: 30, g: 140, b: 70 };
    green = addTreeTexture(green, nx * 1.7, ny * 1.7);

    // litt mørkere på høyre side for "lysretning"
    const sideShade = 0.9 + (nx > 0 ? -0.06 : 0.04);
    green = {
      r: Math.round(green.r * sideShade),
      g: Math.round(green.g * sideShade),
      b: Math.round(green.b * sideShade),
    };

    // ░░ JULEKULER ░░
    const baubleSeed =
      Math.sin(nx * 30 + ny * 42) +
      Math.cos(nx * 55 - ny * 17);

    if (Math.abs(baubleSeed) > 1.9) {
      const palettes = [
        { r: 220, g: 40, b: 55 },   // rød
        { r: 210, g: 180, b: 60 },  // gull
        { r: 70,  g: 120, b: 220 }, // blå
      ];
      const idx =
        Math.abs(Math.floor(baubleSeed * 10)) % palettes.length;
      const p = palettes[idx];

      const sparkle =
        0.85 + 0.15 * Math.sin(colorProgress * 7 + baubleSeed * 3);

      return {
        r: Math.round(p.r * sparkle),
        g: Math.round(p.g * sparkle),
        b: Math.round(p.b * sparkle),
      };
    }

    // ░░ VARME LYS ░░
    const lightSeed =
      Math.sin(nx * 50 - ny * 33) +
      Math.cos(nx * 18 + ny * 29);

    if (Math.abs(lightSeed) > 1.7) {
      const baseLight = { r: 255, g: 235, b: 190 };
      const blink =
        0.7 + 0.3 * Math.sin(colorProgress * 14 + lightSeed * 2);

      return {
        r: Math.round(baseLight.r * blink),
        g: Math.round(baseLight.g * blink),
        b: Math.round(baseLight.b * blink),
      };
    }

    return green;
  }

  // ░░ SNØ / BAKKE ░░
  if (ny > 0.65) {
    const snow = 0.7 + 0.3 * (1 - Math.min(1, (ny - 0.65) / 0.4));
    return {
      r: Math.round(225 * snow),
      g: Math.round(235 * snow),
      b: Math.round(250 * snow),
    };
  }

  // ░░ HIMMEL ░░ – vi lysner litt så prikkene blir mer hvite
  const fade = 0.6 + 0.4 * (1 - dist);
  const mixWithWhite = 0.35; // 0.0 = ren mørk, 1.0 = helt hvit
  const baseR = skyBase.r * fade;
  const baseG = skyBase.g * fade;
  const baseB = skyBase.b * fade;

  return {
    r: Math.round(baseR * (1 - mixWithWhite) + 255 * mixWithWhite),
    g: Math.round(baseG * (1 - mixWithWhite) + 255 * mixWithWhite),
    b: Math.round(baseB * (1 - mixWithWhite) + 255 * mixWithWhite),
  };
};






    const applyVariantToBase = (base, variant) => {
      let { r, g, b } = base;
      if (variant === 'pulled') {
        r = Math.max(0, Math.floor(r * 0.8));
        g = Math.max(0, Math.floor(g * 0.8));
        b = Math.max(0, Math.floor(b * 0.8));
      } else if (variant === 'pushed') {
        r = 255;
        g = Math.floor(g * 0.3);
        b = Math.floor(b * 0.3);
      }
      return { r, g, b };
    };

    // ---------- SNØ ----------

    const initSnowflakes = () => {
      const sizePx = Math.min(canvas.width, canvas.height);
      const count = Math.floor(80 * (sizePx / 200));
      snowflakes = [];
      for (let i = 0; i < count; i++) {
        snowflakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: (Math.random() * 1.2 + 0.4) * (sizePx / 200),
          speed: (Math.random() * 0.4 + 0.2) * (sizePx / 200),
        });
      }
    };

    const updateSnow = () => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      snowflakes.forEach((flake) => {
        flake.y += flake.speed;
        if (flake.y > canvas.height + 5) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    // ---------- PARTICLES (HTML-stil) ----------
    const initParticles = () => {
      const sizePx = Math.min(canvas.width, canvas.height);
      const baseCount = 1400;
      const count = Math.floor(baseCount * (sizePx / 500));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    class Particle {
      constructor() {
        const sizePx = Math.min(canvas.width, canvas.height);
        this.baseRadius =
          minRadius + Math.random() * (maxRadius - minRadius);
        this.angle = Math.random() * Math.PI * 2;
        this.speed =
          (Math.random() * 0.01 + 0.005) * (Math.random() < 0.5 ? 1 : -1);
        this.size = (Math.random() * 4 + 3) * (sizePx / 500);
        this.radiusOffset = 0;
        this.angleOffset = 0;
        this.effect = 'none';
        this.colorOffset = Math.floor(Math.random() * 9999);
      }

      update() {
        this.angle += this.speed;

        let currentRadius = this.baseRadius + this.radiusOffset;
        let currentAngle = this.angle + this.angleOffset;

        const particleX = centerX + Math.cos(currentAngle) * currentRadius;
        const particleY = centerY + Math.sin(currentAngle) * currentRadius;

        let targetRadiusOffset = 0;
        let targetAngleOffset = 0;
        let effect = 'none';

        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - centerX;
          const dy = mouseY - centerY;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);

          // INSIDE ORB – push
          if (distFromCenter < orbRadius - 10) {
            const distToMouse = Math.sqrt(
              (particleX - mouseX) ** 2 +
                (particleY - mouseY) ** 2
            );

            if (distToMouse < mouseRepelRadius) {
              const pushAngle = Math.atan2(
                particleY - mouseY,
                particleX - mouseX
              );
              const falloff = 1 - distToMouse / mouseRepelRadius;
              const pushStrength = falloff * falloff;

              const pushDx =
                Math.cos(pushAngle) * maxPushStrength * pushStrength;
              const pushDy =
                Math.sin(pushAngle) * maxPushStrength * pushStrength;

              const newX = particleX + pushDx;
              const newY = particleY + pushDy;

              const newDx = newX - centerX;
              const newDy = newY - centerY;
              const newRadius = Math.sqrt(newDx * newDx + newDy * newDy);
              const newAngle = Math.atan2(newDy, newDx);

              targetRadiusOffset =
                Math.max(minRadius, Math.min(maxRadius, newRadius)) -
                this.baseRadius;
              targetAngleOffset = newAngle - this.angle;
              effect = 'pushed';
            }
          }
          // OUTSIDE ORB – pull
          else if (distFromCenter >= orbRadius) {
            const mouseAngle = Math.atan2(dy, dx);
            const particleAngle = Math.atan2(
              particleY - centerY,
              particleX - centerX
            );

            let angleDiff = Math.abs(mouseAngle - particleAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            const radialFromBorder = distFromCenter - orbRadius;

            if (
              angleDiff < pullAngleRange &&
              radialFromBorder >= 0 &&
              radialFromBorder <= pullRingThickness
            ) {
              const t = radialFromBorder / pullRingThickness;

              let pullStrength = 1 - t;
              pullStrength = Math.pow(pullStrength, 1.5);

              const angleFactor = 1 - angleDiff / pullAngleRange;
              pullStrength *= angleFactor;

              targetRadiusOffset = maxPullAmount * pullStrength;
              effect = 'pulled';
            }
          }
        }

        // Explosions
        explosions.forEach((explosion) => {
          const distToExplosion = Math.sqrt(
            (particleX - explosion.x) ** 2 +
              (particleY - explosion.y) ** 2
          );
          if (distToExplosion < explosion.radius) {
            const explosionAngle = Math.atan2(
              particleY - explosion.y,
              particleX - explosion.x
            );
            const falloff =
              1 - distToExplosion / explosion.radius;
            const explosionPush =
              falloff * falloff * explosion.strength * 0.6;

            const pushDx =
              Math.cos(explosionAngle) * explosionPush;
            const pushDy =
              Math.sin(explosionAngle) * explosionPush;

            const newX = particleX + pushDx;
            const newY = particleY + pushDy;

            const newDx = newX - centerX;
            const newDy = newY - centerY;
            const newRadius = Math.sqrt(newDx * newDx + newDy * newDy);
            const newAngle = Math.atan2(newDy, newDx);

            targetRadiusOffset =
              Math.max(minRadius, Math.min(maxRadius, newRadius)) -
              this.baseRadius;
            targetAngleOffset = newAngle - this.angle;
            effect = 'pushed';
          }
        });

        this.radiusOffset +=
          (targetRadiusOffset - this.radiusOffset) * 0.15;
        this.angleOffset +=
          (targetAngleOffset - this.angleOffset) * 0.15;

        this.radiusOffset *= 0.95;
        this.angleOffset *= 0.95;
        this.effect = effect;
      }

      draw() {
        const currentRadius = this.baseRadius + this.radiusOffset;
        const currentAngle = this.angle + this.angleOffset;

        const x = centerX + Math.cos(currentAngle) * currentRadius;
        const y = centerY + Math.sin(currentAngle) * currentRadius;

        const nx = (x - centerX) / orbRadius;
        const ny = (y - centerY) / orbRadius;

        let variant = 'normal';
        if (this.effect === 'pulled') variant = 'pulled';
        if (this.effect === 'pushed') variant = 'pushed';

        let color, glowColor;
        let baseAlpha = 0.25;
        let glowAlpha = 0.15;

        if (skin === 'juleskin') {
            const inTree = isInTree(nx, ny);
            const inStar = isInStar(nx, ny);

            // tre + stjerne skal POPPE
            if (inTree || inStar) {
            baseAlpha = 0.65;
            glowAlpha = 0.40;
            } else {
            baseAlpha = 0.16;
            glowAlpha = 0.08;
            }

            // nederst fortsatt litt ekstra transparent
            if (ny > 0.90) {
            baseAlpha *= 0.6;
            glowAlpha *= 0.6;
            }

            const base = getChristmasBaseColor(x, y);
            const final = applyVariantToBase(base, variant);
            const { r, g, b } = final;
            color = `rgba(${r}, ${g}, ${b}, ${baseAlpha})`;
            glowColor = `rgba(${r}, ${g}, ${b}, ${glowAlpha})`;
        } else {
            if (variant === 'pushed') {
              baseAlpha = Math.min(0.65, baseAlpha * 2.4);
              glowAlpha = Math.min(0.55, glowAlpha * 3.0);
            }

            color = getCurrentColor(baseAlpha, variant, this.colorOffset);
            glowColor = getCurrentColor(glowAlpha, variant, this.colorOffset);
        }

        const sizePx = Math.min(canvas.width, canvas.height);

        ctx.shadowBlur = (variant === 'pushed' ? 32 : 20) * (sizePx / 500);
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 35 * (sizePx / 500);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(
            x,
            y,
            this.size + 3 * (sizePx / 500),
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        }

    }

    initParticles();
    if (skin === 'juleskin') initSnowflakes();

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleClick = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const dx = clickX - centerX;
      const dy = clickY - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      if (distFromCenter < orbRadius - 10) {
        explosions.push({
          x: clickX,
          y: clickY,
          radius: orbRadius * 0.25,
          strength: orbRadius * 0.08,
          decay: 0.85,
        });
      }
    };

    const animate = () => {
      if (!canvasRef.current) return;

      colorProgress += 0.003;
      if (colorProgress >= 1) {
        colorProgress = 0;
        colorIndex = (colorIndex + 1) % targetPaletteColors.length;
      }

      if (colorTransitionProgress < 1) {
        colorTransitionProgress = Math.min(
          1,
          colorTransitionProgress + 0.02
        );
      }

      const targetPalette = colorPalettes[colorState];
      if (targetPaletteColors !== targetPalette) {
        currentPaletteColors = currentPaletteColors.map((current, i) => {
          const target = targetPaletteColors[i];
          return {
            r: Math.floor(
              current.r + (target.r - current.r) * colorTransitionProgress
            ),
            g: Math.floor(
              current.g + (target.g - current.g) * colorTransitionProgress
            ),
            b: Math.floor(
              current.b + (target.b - current.b) * colorTransitionProgress
            ),
          };
        });
        targetPaletteColors = targetPalette;
        colorTransitionProgress = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // snø først, under partiklene
      if (skin === 'juleskin') {
        updateSnow();
      }

      explosions = explosions.filter((explosion) => {
        explosion.strength *= explosion.decay;
        return explosion.strength > 0.3;
      });

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
    };
  }, [colorState, skin, colorPalettes]);

  // glasskule–look fra HTML
  const glassBackground =
    'radial-gradient(circle at 30% 30%, ' +
    'rgba(255,255,255,0.2) 0%, ' +
    'rgba(150,200,255,0.1) 30%, ' +
    'rgba(100,150,255,0.05) 60%, ' +
    'rgba(50,100,200,0.1) 100%)';

  const glassBoxShadow =
    skin === 'juleskin'
      ? 'inset 0 0 50px rgba(255,255,255,0.18), ' +
        'inset 20px 20px 60px rgba(255,255,255,0.08), ' +
        '0 0 80px rgba(255,80,80,0.45), ' +
        '0 0 120px rgba(255,40,40,0.3)'
      : 'inset 0 0 50px rgba(255,255,255,0.1), ' +
        'inset 20px 20px 60px rgba(255,255,255,0.05), ' +
        '0 0 80px rgba(100,150,255,0.3), ' +
        '0 0 120px rgba(100,150,255,0.2)';

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        background: 'none',
        width: style?.width || `${size}px`,
        height: style?.height || `${size}px`,
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
          background: glassBackground,
          boxShadow: glassBoxShadow,
          border: '2px solid rgba(255, 255, 255, 0.15)',
          pointerEvents: 'none',
          overflow: 'hidden',
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
