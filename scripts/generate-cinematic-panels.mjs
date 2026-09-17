/**
 * Generate polished comic / graphic-novel panels for Lisboa Redemption cinematic.
 * Style: semi-realistic inked comic, cyberpunk red neon, dramatic lighting.
 * Run: node scripts/generate-cinematic-panels.mjs
 */
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/cinematic');
mkdirSync(OUT, { recursive: true });

const W = 800;
const H = 520; // panel art area; UI caption sits below in-scene

// ---------- helpers ----------
function canvas(w = W, h = H) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { c, ctx };
}

function save(c, name) {
  const buf = c.toBuffer('image/png');
  writeFileSync(join(OUT, name), buf);
  console.log('wrote', name, `(${(buf.length / 1024).toFixed(1)} KB)`);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgba(hex, a = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function vignette(ctx, w, h, strength = 0.55) {
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function screentone(ctx, w, h, spacing = 5, alpha = 0.12) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += spacing) {
    for (let x = 0; x < w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x + (y % (spacing * 2) === 0 ? 0 : spacing / 2), y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function inkStroke(ctx, pathFn, width = 2.5, color = '#1a0a0a') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pathFn(ctx);
  ctx.stroke();
  ctx.restore();
}

function softGlow(ctx, x, y, r, color, alpha = 0.35) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawStars(ctx, w, h, n = 40, alpha = 0.25) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const px = Math.abs(x) * w;
    const py = Math.abs(y) * h;
    const a = alpha * (0.3 + Math.abs(Math.sin(i * 3.1)) * 0.7);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(px, py, 0.6 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function rain(ctx, w, h, n = 80, alpha = 0.25) {
  ctx.save();
  ctx.strokeStyle = `rgba(180,200,255,${alpha})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const x = ((i * 97) % w) + (i % 7) * 3;
    const y = ((i * 53) % h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 18 + (i % 10));
    ctx.stroke();
  }
  ctx.restore();
}

function speedLines(ctx, w, h, fromX, fromY, count = 24, color = '#fff', alpha = 0.35) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + 0.2;
    const r0 = 40 + (i % 5) * 8;
    const r1 = Math.min(w, h) * 0.55 + (i % 7) * 12;
    ctx.beginPath();
    ctx.moveTo(fromX + Math.cos(ang) * r0, fromY + Math.sin(ang) * r0);
    ctx.lineTo(fromX + Math.cos(ang) * r1, fromY + Math.sin(ang) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- room / environment ----------
function drawCyberRoom(ctx, w, h, { flash = false, dark = false } = {}) {
  // Walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (flash) {
    wallGrad.addColorStop(0, '#4a5570');
    wallGrad.addColorStop(1, '#2a3048');
  } else if (dark) {
    wallGrad.addColorStop(0, '#120818');
    wallGrad.addColorStop(1, '#0a0610');
  } else {
    wallGrad.addColorStop(0, '#1a1028');
    wallGrad.addColorStop(0.5, '#221433');
    wallGrad.addColorStop(1, '#140c1c');
  }
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // Perspective floor
  const floorGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  floorGrad.addColorStop(0, dark ? '#1a1220' : '#2a1a30');
  floorGrad.addColorStop(1, dark ? '#0e0a14' : '#1a1020');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.58);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Floor planks
  ctx.strokeStyle = rgba('#000000', 0.25);
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const y = h * 0.58 + i * ((h * 0.42) / 12);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y - 8);
    ctx.stroke();
  }

  // Back wall panel / posters
  ctx.fillStyle = rgba('#ce1226', 0.15);
  ctx.fillRect(40, 60, 120, 160);
  ctx.strokeStyle = rgba('#ffffff', 0.2);
  ctx.strokeRect(40, 60, 120, 160);
  // Atlético badge hint
  ctx.fillStyle = rgba('#ce1226', 0.5);
  ctx.beginPath();
  ctx.arc(100, 120, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.7);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATM', 100, 125);

  // Neon strip
  softGlow(ctx, w * 0.75, 80, 120, '#ff2244', flash ? 0.55 : 0.28);
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(w * 0.55, 40, w * 0.4, 6);
  softGlow(ctx, w * 0.75, 43, 80, '#ff6688', 0.4);

  // Window
  drawWindow(ctx, w * 0.72, 90, 180, 160, flash);

  // Side table / nightstand
  drawNightstand(ctx, 130, h * 0.62);

  // Rain outside / through window glass reflection
  if (!flash) rain(ctx, w, h * 0.5, 50, 0.12);

  screentone(ctx, w, h, 6, dark ? 0.18 : 0.08);
}

function drawWindow(ctx, x, y, ww, hh, flash) {
  ctx.save();
  // Frame
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(x, y, ww, hh);
  // Glass
  const g = ctx.createLinearGradient(x, y, x + ww, y + hh);
  if (flash) {
    g.addColorStop(0, '#c8d8ff');
    g.addColorStop(1, '#6a88bb');
  } else {
    g.addColorStop(0, '#1a2848');
    g.addColorStop(0.5, '#243050');
    g.addColorStop(1, '#152038');
  }
  ctx.fillStyle = g;
  ctx.fillRect(x + 8, y + 8, ww - 16, hh - 16);

  // City lights
  for (let i = 0; i < 18; i++) {
    const bx = x + 16 + (i % 6) * 26;
    const by = y + 20 + Math.floor(i / 6) * 40;
    const bright = flash ? 0.9 : 0.35 + (i % 3) * 0.2;
    ctx.fillStyle = `rgba(255,${160 + (i % 4) * 20},${80},${bright})`;
    ctx.fillRect(bx, by, 10, 14);
    if (i % 4 === 0) {
      ctx.fillStyle = `rgba(255,80,140,${bright})`;
      ctx.fillRect(bx + 14, by + 8, 8, 10);
    }
  }

  // Rain streaks on glass
  ctx.strokeStyle = rgba('#aaccff', flash ? 0.5 : 0.25);
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const rx = x + 12 + (i * 37) % (ww - 24);
    const ry = y + 12 + (i * 19) % (hh - 30);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 1, ry + 16);
    ctx.stroke();
  }

  // Cross bars
  ctx.strokeStyle = '#1a1420';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + ww / 2, y + 8);
  ctx.lineTo(x + ww / 2, y + hh - 8);
  ctx.moveTo(x + 8, y + hh / 2);
  ctx.lineTo(x + ww - 8, y + hh / 2);
  ctx.stroke();

  // Neon rim
  ctx.strokeStyle = rgba('#ff4466', 0.6);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, ww - 8, hh - 8);
  ctx.restore();
}

function drawNightstand(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#2a1e28';
  ctx.fillRect(x, y, 90, 70);
  ctx.fillStyle = '#3a2a35';
  ctx.fillRect(x - 4, y - 6, 98, 10);
  ctx.strokeStyle = '#0a0608';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 90, 70);
  // Drawer
  ctx.strokeStyle = rgba('#ffffff', 0.15);
  ctx.strokeRect(x + 10, y + 18, 70, 28);
  ctx.fillStyle = '#c8a070';
  ctx.beginPath();
  ctx.arc(x + 45, y + 32, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBed(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Frame
  ctx.fillStyle = '#3a2838';
  ctx.beginPath();
  ctx.moveTo(-140, 40);
  ctx.lineTo(160, 30);
  ctx.lineTo(150, 70);
  ctx.lineTo(-150, 80);
  ctx.closePath();
  ctx.fill();
  // Mattress / sheets — Atlético colors
  const sheet = ctx.createLinearGradient(-120, 0, 140, 20);
  sheet.addColorStop(0, '#ce1226');
  sheet.addColorStop(0.15, '#ffffff');
  sheet.addColorStop(0.3, '#ce1226');
  sheet.addColorStop(0.45, '#ffffff');
  sheet.addColorStop(0.6, '#ce1226');
  sheet.addColorStop(0.75, '#ffffff');
  sheet.addColorStop(1, '#ce1226');
  ctx.fillStyle = sheet;
  ctx.beginPath();
  ctx.moveTo(-120, 10);
  ctx.lineTo(140, 0);
  ctx.lineTo(145, 45);
  ctx.lineTo(-125, 55);
  ctx.closePath();
  ctx.fill();
  // Pillow
  ctx.fillStyle = '#e8e0e8';
  ctx.beginPath();
  ctx.ellipse(-70, 5, 50, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1018';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Shadow under bed
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(10, 85, 160, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- characters ----------
function skinTone() {
  return '#e8b892';
}

function drawHair(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#1a1210';
  ctx.beginPath();
  ctx.moveTo(-28, -8);
  ctx.bezierCurveTo(-30, -40, 0, -48, 28, -36);
  ctx.bezierCurveTo(34, -20, 30, -5, 22, 0);
  ctx.bezierCurveTo(10, -18, -10, -16, -28, -8);
  ctx.fill();
  // Highlight
  ctx.fillStyle = rgba('#4a3028', 0.5);
  ctx.beginPath();
  ctx.ellipse(-8, -28, 10, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFace(ctx, x, y, s = 1, { eyesOpen = true, sweaty = false, shout = false, murmur = false, angle = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);

  // Neck
  ctx.fillStyle = skinTone();
  ctx.fillRect(-10, 28, 20, 18);

  // Head
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaw shade
  ctx.fillStyle = rgba('#c48860', 0.35);
  ctx.beginPath();
  ctx.ellipse(0, 18, 26, 16, 0, 0, Math.PI);
  ctx.fill();

  drawHair(ctx, 0, -4, 1);

  // Brows
  ctx.strokeStyle = '#1a1210';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (shout) {
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-6, -16);
    ctx.moveTo(18, -12);
    ctx.lineTo(6, -16);
    ctx.stroke();
  } else if (murmur) {
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-5, -10);
    ctx.moveTo(18, -8);
    ctx.lineTo(5, -10);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(-6, -12);
    ctx.moveTo(18, -10);
    ctx.lineTo(6, -12);
    ctx.stroke();
  }

  // Eyes
  if (eyesOpen) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-12, -2, 8, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.arc(-12, -1, 3.5, 0, Math.PI * 2);
    ctx.arc(12, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-10, -3, 1.2, 0, Math.PI * 2);
    ctx.arc(14, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#1a1210';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.quadraticCurveTo(-12, 4, -6, -2);
    ctx.moveTo(6, -2);
    ctx.quadraticCurveTo(12, 4, 18, -2);
    ctx.stroke();
  }

  // Nose
  ctx.strokeStyle = rgba('#8a5a40', 0.7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(-2, 14);
  ctx.lineTo(6, 14);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = '#5a2030';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (shout) {
    ctx.fillStyle = '#2a0a10';
    ctx.ellipse(0, 24, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ce6688';
    ctx.beginPath();
    ctx.ellipse(0, 28, 7, 4, 0, 0, Math.PI);
    ctx.fill();
  } else if (murmur) {
    ctx.moveTo(-8, 22);
    ctx.quadraticCurveTo(0, 26, 8, 22);
    ctx.stroke();
  } else {
    ctx.moveTo(-10, 22);
    ctx.quadraticCurveTo(0, 28, 10, 22);
    ctx.stroke();
  }

  // Sweat
  if (sweaty) {
    ctx.fillStyle = rgba('#88ccff', 0.85);
    const drops = [
      [-22, 8],
      [24, 6],
      [-16, 20],
      [18, 18],
      [0, 36],
      [-28, -5],
      [26, 14],
    ];
    for (const [dx, dy] of drops) {
      ctx.beginPath();
      ctx.moveTo(dx, dy - 6);
      ctx.quadraticCurveTo(dx + 4, dy, dx, dy + 8);
      ctx.quadraticCurveTo(dx - 4, dy, dx, dy - 6);
      ctx.fill();
    }
  }

  // Ink outline
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 38, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawAtletiKit(ctx, x, y, s = 1, { armsOut = false, sitting = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Torso
  const tw = 55;
  const th = sitting ? 50 : 70;
  // White base
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2 - 4, th);
  ctx.lineTo(-tw / 2 + 4, th);
  ctx.closePath();
  ctx.fill();

  // Red vertical stripes
  ctx.fillStyle = '#ce1226';
  const stripeW = 9;
  for (let i = -2; i <= 2; i++) {
    if (i % 2 === 0) {
      const sx = i * stripeW - stripeW / 2;
      ctx.fillRect(sx, 0, stripeW, th);
    }
  }
  // Re-draw white between — alternate pattern red-white-red
  ctx.fillStyle = '#f5f5f5';
  for (let i = -2; i <= 2; i++) {
    if (i % 2 !== 0) {
      const sx = i * stripeW - stripeW / 2;
      ctx.fillRect(sx, 2, stripeW, th - 4);
    }
  }
  // Red stripes again for clarity
  ctx.fillStyle = '#ce1226';
  [-22, -4, 14].forEach((sx) => ctx.fillRect(sx, 0, 10, th));

  // Collar
  ctx.fillStyle = '#1a2744';
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(18, 0);
  ctx.lineTo(12, -2);
  ctx.lineTo(0, 8);
  ctx.lineTo(-12, -2);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.fillStyle = skinTone();
  if (armsOut) {
    ctx.beginPath();
    ctx.ellipse(-48, 25, 14, 28, -0.9, 0, Math.PI * 2);
    ctx.ellipse(48, 25, 14, 28, 0.9, 0, Math.PI * 2);
    ctx.fill();
    // Sleeve cuffs red
    ctx.fillStyle = '#ce1226';
    ctx.fillRect(-62, 8, 22, 12);
    ctx.fillRect(40, 8, 22, 12);
  } else {
    ctx.beginPath();
    ctx.ellipse(-38, 30, 12, 26, 0.3, 0, Math.PI * 2);
    ctx.ellipse(38, 30, 12, 26, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ce1226';
    ctx.fillRect(-48, 5, 18, 14);
    ctx.fillRect(30, 5, 18, 14);
  }

  // Outline
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2 - 4, th);
  ctx.lineTo(-tw / 2 + 4, th);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawLegs(ctx, x, y, s = 1, { standing = false, bent = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#1a1a22';
  if (standing) {
    ctx.fillRect(-18, 0, 14, 55);
    ctx.fillRect(4, 0, 14, 55);
    // Shoes
    ctx.fillStyle = '#ce1226';
    ctx.fillRect(-22, 50, 20, 10);
    ctx.fillRect(2, 50, 20, 10);
  } else if (bent) {
    ctx.beginPath();
    ctx.ellipse(-20, 20, 16, 28, 0.8, 0, Math.PI * 2);
    ctx.ellipse(25, 15, 16, 26, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Lying
    ctx.beginPath();
    ctx.ellipse(30, 10, 40, 12, 0.1, 0, Math.PI * 2);
    ctx.ellipse(90, 8, 35, 11, 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSleepingCaminero(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Body on side
  drawAtletiKit(ctx, 40, 0, 1.1, { sitting: true });
  drawLegs(ctx, 70, 40, 1.1, {});
  // Head on pillow — rotated
  drawFace(ctx, -20, -10, 1.15, { eyesOpen: false, sweaty: true, angle: -0.4 });
  // Zzz
  ctx.fillStyle = rgba('#aaccee', 0.7);
  ctx.font = 'italic 22px Georgia';
  ctx.fillText('z', 60, -50);
  ctx.font = 'italic 28px Georgia';
  ctx.fillText('z', 78, -70);
  ctx.font = 'italic 18px Georgia';
  ctx.fillText('z', 100, -55);
  ctx.restore();
}

function drawAwakeCaminero(ctx, x, y, opts = {}) {
  drawLegs(ctx, x, y + 70, 1.15, { standing: true });
  drawAtletiKit(ctx, x, y, 1.15, { armsOut: opts.armsOut });
  drawFace(ctx, x, y - 50, 1.2, {
    eyesOpen: true,
    sweaty: true,
    shout: opts.shout,
  });
}

function drawPhotoFrame(ctx, x, y, s = 1, { fallen = false, held = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (fallen) ctx.rotate(-0.45);
  ctx.scale(s, s);

  // Wood frame
  ctx.fillStyle = '#6b3e1f';
  ctx.fillRect(-40, -50, 80, 100);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(-36, -46, 72, 92);
  // Mat
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(-30, -40, 60, 72);

  // Simeone caricature
  drawCholo(ctx, 0, -8, 0.85);

  // Glass shine
  ctx.fillStyle = rgba('#ffffff', 0.15);
  ctx.beginPath();
  ctx.moveTo(-28, -38);
  ctx.lineTo(-5, -38);
  ctx.lineTo(-28, 20);
  ctx.closePath();
  ctx.fill();

  // Outer ink
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 3;
  ctx.strokeRect(-40, -50, 80, 100);

  if (held) {
    // Hand holding
    ctx.fillStyle = skinTone();
    ctx.beginPath();
    ctx.ellipse(-45, 40, 14, 20, 0.5, 0, Math.PI * 2);
    ctx.ellipse(10, 55, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0a0a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCholo(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Bald head
  ctx.fillStyle = skinTone();
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bald shine
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.beginPath();
  ctx.ellipse(-6, -12, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Intense brows
  ctx.strokeStyle = '#1a1210';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.lineTo(-4, -10);
  ctx.moveTo(16, -6);
  ctx.lineTo(4, -10);
  ctx.stroke();

  // Eyes — intense stare
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-10, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-10, 1, 3, 0, Math.PI * 2);
  ctx.arc(10, 1, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nose / mouth set
  ctx.strokeStyle = '#8a5a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(-3, 14);
  ctx.lineTo(4, 14);
  ctx.stroke();
  ctx.strokeStyle = '#5a2030';
  ctx.beginPath();
  ctx.moveTo(-8, 20);
  ctx.lineTo(8, 20);
  ctx.stroke();

  // Tracksuit shoulders
  ctx.fillStyle = '#ce1226';
  ctx.fillRect(-30, 28, 60, 28);
  ctx.fillStyle = '#1a2744';
  ctx.fillRect(-30, 28, 60, 8);
  // Navy stripes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-30, 36, 60, 2);

  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawRadio(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Body
  ctx.fillStyle = '#2a2a35';
  roundRect(ctx, -50, -30, 100, 60, 8);
  ctx.fill();
  ctx.fillStyle = '#ce1226';
  roundRect(ctx, -46, -26, 92, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#1a1a22';
  roundRect(ctx, -40, -18, 50, 36, 4);
  ctx.fill();
  // Speaker holes
  ctx.fillStyle = '#444';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      ctx.beginPath();
      ctx.arc(-32 + col * 8, -10 + row * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Dial
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.arc(28, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(28 + 10, -6);
  ctx.stroke();
  // Antenna
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, -30);
  ctx.lineTo(55, -70);
  ctx.stroke();
  ctx.fillStyle = '#ff4466';
  ctx.beginPath();
  ctx.arc(55, -70, 4, 0, Math.PI * 2);
  ctx.fill();

  // Music notes
  ctx.fillStyle = '#ff88aa';
  ctx.font = 'bold 28px Georgia';
  ctx.fillText('♪', -70, -40);
  ctx.fillText('♫', 60, -50);
  ctx.fillText('♪', 20, -80);

  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 3;
  roundRect(ctx, -50, -30, 100, 60, 8);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLightningBolt(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ffffcc';
  ctx.strokeStyle = '#ffe866';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(10, -80);
  ctx.lineTo(-20, 0);
  ctx.lineTo(5, 0);
  ctx.lineTo(-15, 90);
  ctx.lineTo(35, -10);
  ctx.lineTo(8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function comicBorder(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#e8e0d8';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.restore();
}

// ---------- PANELS ----------
function panel1_nightmare() {
  const { c, ctx } = canvas();
  drawCyberRoom(ctx, W, H, { dark: true });
  drawBed(ctx, 340, 340, 1.15);
  drawSleepingCaminero(ctx, 300, 300);
  // Nightmare inset — Ramos header ghost
  ctx.save();
  ctx.globalAlpha = 0.35;
  softGlow(ctx, 620, 140, 100, '#ffffff', 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(620, 120, 40, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(600, 110, 40, 8); // hairline
  ctx.font = 'bold 16px Georgia';
  ctx.fillStyle = rgba('#ffffff', 0.8);
  ctx.textAlign = 'center';
  ctx.fillText('93\'', 620, 200);
  ctx.restore();
  // Dream wisps
  ctx.strokeStyle = rgba('#88aacc', 0.3);
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(400 + i * 20, 200);
    ctx.bezierCurveTo(450 + i * 30, 150 - i * 10, 550, 130, 600, 120);
    ctx.stroke();
  }
  vignette(ctx, W, H, 0.65);
  comicBorder(ctx, W, H);
  save(c, 'panel1.png');
}

function panel2_closeup() {
  const { c, ctx } = canvas();
  // Dark bg
  const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 400);
  g.addColorStop(0, '#2a1830');
  g.addColorStop(1, '#0a060e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  screentone(ctx, W, H, 4, 0.2);
  // Extreme close-up face
  drawFace(ctx, W / 2, H / 2 - 20, 4.2, {
    eyesOpen: false,
    sweaty: true,
    murmur: true,
  });
  // Pillow edge
  ctx.fillStyle = '#d8d0d8';
  ctx.beginPath();
  ctx.ellipse(W / 2, H - 40, 380, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  softGlow(ctx, W / 2, H / 2, 200, '#ce1226', 0.12);
  vignette(ctx, W, H, 0.7);
  comicBorder(ctx, W, H);
  save(c, 'panel2.png');
}

function panel3_lightning() {
  const { c, ctx } = canvas();
  drawCyberRoom(ctx, W, H, { flash: true });
  drawBed(ctx, 340, 340, 1.15);
  drawSleepingCaminero(ctx, 300, 300);
  // White flash overlay
  ctx.fillStyle = rgba('#e8f0ff', 0.35);
  ctx.fillRect(0, 0, W, H);
  drawLightningBolt(ctx, 520, 160, 1.8);
  softGlow(ctx, 520, 100, 200, '#ffffff', 0.55);
  // Window blown bright
  softGlow(ctx, 650, 170, 180, '#aaccff', 0.45);
  speedLines(ctx, W, H, 520, 120, 18, '#ffffff', 0.25);
  vignette(ctx, W, H, 0.3);
  comicBorder(ctx, W, H);
  save(c, 'panel3.png');
}

function panel4_awake() {
  const { c, ctx } = canvas();
  drawCyberRoom(ctx, W, H, {});
  drawBed(ctx, 280, 360, 1.0);
  // Sitting up abruptly
  ctx.save();
  drawLegs(ctx, 400, 320, 1.2, { bent: true });
  drawAtletiKit(ctx, 400, 250, 1.25, { armsOut: false });
  drawFace(ctx, 400, 185, 1.4, { eyesOpen: true, sweaty: true, shout: false });
  ctx.restore();
  // Motion lines
  speedLines(ctx, W, H, 400, 220, 20, '#ffaabb', 0.2);
  // Sweat spray
  ctx.fillStyle = rgba('#88ccff', 0.8);
  for (let i = 0; i < 12; i++) {
    const ang = -Math.PI / 2 + (i - 6) * 0.15;
    const r = 60 + i * 5;
    ctx.beginPath();
    ctx.arc(400 + Math.cos(ang) * r, 160 + Math.sin(ang) * r, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  softGlow(ctx, 400, 200, 150, '#ce1226', 0.15);
  vignette(ctx, W, H, 0.5);
  comicBorder(ctx, W, H);
  save(c, 'panel4.png');
}

function panel5_knock() {
  const { c, ctx } = canvas();
  drawCyberRoom(ctx, W, H, {});
  drawBed(ctx, 250, 380, 0.9);
  // Arm reaching / knocking
  drawAwakeCaminero(ctx, 280, 260, {});
  // Photo falling mid-air
  drawPhotoFrame(ctx, 480, 280, 1.4, { fallen: true });
  // Impact stars
  ctx.fillStyle = '#ffe866';
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const px = 430 + Math.cos(ang) * 50;
    const py = 240 + Math.sin(ang) * 40;
    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px + 3, py - 2);
    ctx.lineTo(px + 9, py - 2);
    ctx.lineTo(px + 4, py + 2);
    ctx.lineTo(px + 6, py + 8);
    ctx.lineTo(px, py + 4);
    ctx.lineTo(px - 6, py + 8);
    ctx.lineTo(px - 4, py + 2);
    ctx.lineTo(px - 9, py - 2);
    ctx.lineTo(px - 3, py - 2);
    ctx.closePath();
    ctx.fill();
  }
  // Motion trail
  ctx.strokeStyle = rgba('#ffffff', 0.3);
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(160, 200);
  ctx.quadraticCurveTo(300, 180, 450, 250);
  ctx.stroke();
  ctx.setLineDash([]);
  // "TUM" sound effect
  ctx.fillStyle = '#ff2244';
  ctx.font = 'bold italic 42px Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 4;
  ctx.strokeText('¡TUM!', 520, 160);
  ctx.fillText('¡TUM!', 520, 160);
  vignette(ctx, W, H, 0.45);
  comicBorder(ctx, W, H);
  save(c, 'panel5.png');
}

function panel6_photo() {
  const { c, ctx } = canvas();
  const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 450);
  g.addColorStop(0, '#3a2040');
  g.addColorStop(1, '#0c0810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  screentone(ctx, W, H, 5, 0.15);
  // Large framed photo close-up
  drawPhotoFrame(ctx, W / 2, H / 2 - 10, 3.2, { held: true });
  softGlow(ctx, W / 2, H / 2, 220, '#ce1226', 0.2);
  softGlow(ctx, W / 2 - 40, H / 2 - 80, 80, '#ffffff', 0.15);
  vignette(ctx, W, H, 0.55);
  comicBorder(ctx, W, H);
  save(c, 'panel6.png');
}

function panel7_defiant() {
  const { c, ctx } = canvas();
  drawCyberRoom(ctx, W, H, {});
  // Low angle heroic pose
  ctx.save();
  // Floor perspective exaggerate
  drawAwakeCaminero(ctx, W / 2, 240, { armsOut: true, shout: true });
  drawFace(ctx, W / 2, 190, 1.35, { eyesOpen: true, sweaty: false, shout: true });
  ctx.restore();
  // Holding photo up
  drawPhotoFrame(ctx, W / 2 + 90, 300, 1.1, { held: true });
  speedLines(ctx, W, H, W / 2, 250, 28, '#ce1226', 0.3);
  softGlow(ctx, W / 2, 200, 180, '#ff2244', 0.25);
  // Dramatic rim light
  softGlow(ctx, W / 2, 100, 200, '#ff6688', 0.2);
  vignette(ctx, W, H, 0.4);
  comicBorder(ctx, W, H);
  save(c, 'panel7.png');
}

function panel8_radio() {
  const { c, ctx } = canvas();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#1a0820');
  g.addColorStop(0.5, '#2a1030');
  g.addColorStop(1, '#120818');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Neon rings
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = rgba('#ff4466', 0.15 - i * 0.02);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 80 + i * 45, 0, Math.PI * 2);
    ctx.stroke();
  }
  softGlow(ctx, W / 2, H / 2, 250, '#ce1226', 0.35);
  drawRadio(ctx, W / 2, H / 2 + 20, 2.4);
  // Equalizer bars
  ctx.fillStyle = '#ff88aa';
  for (let i = 0; i < 16; i++) {
    const bh = 20 + Math.abs(Math.sin(i * 1.3)) * 60;
    ctx.fillRect(W / 2 - 160 + i * 20, H - 80 - bh, 12, bh);
  }
  screentone(ctx, W, H, 5, 0.1);
  drawStars(ctx, W, H, 30, 0.3);
  vignette(ctx, W, H, 0.5);
  comicBorder(ctx, W, H);
  save(c, 'panel8.png');
}

// Also generate rojiblanco crawl backdrop
function crawlBackdrop() {
  const { c, ctx } = canvas(800, 600);
  // Deep crimson field
  const g = ctx.createLinearGradient(0, 0, 800, 600);
  g.addColorStop(0, '#4a0a12');
  g.addColorStop(0.35, '#6b0f1a');
  g.addColorStop(0.55, '#8b121f');
  g.addColorStop(0.75, '#5a0c16');
  g.addColorStop(1, '#2a060c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 800, 600);

  // White diagonal stripes (Atlético style)
  ctx.save();
  ctx.translate(400, 300);
  ctx.rotate(-0.55);
  for (let i = -12; i < 12; i++) {
    const alpha = i % 2 === 0 ? 0.12 : 0.04;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(-600, i * 48, 1200, 28);
  }
  // Stronger accent stripes
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = -4; i < 5; i++) {
    ctx.fillRect(-600, i * 110 - 10, 1200, 18);
  }
  ctx.restore();

  // Soft red-white panel bands
  for (let i = 0; i < 6; i++) {
    const y = i * 100;
    const pg = ctx.createLinearGradient(0, y, 800, y + 80);
    pg.addColorStop(0, rgba('#ce1226', 0.0));
    pg.addColorStop(0.5, rgba('#ffffff', i % 2 === 0 ? 0.04 : 0.02));
    pg.addColorStop(1, rgba('#ce1226', 0.0));
    ctx.fillStyle = pg;
    ctx.fillRect(0, y, 800, 80);
  }

  // Faint stars
  drawStars(ctx, 800, 600, 90, 0.35);

  // Soft vignette
  vignette(ctx, 800, 600, 0.6);

  // Subtle noise grain
  const img = ctx.getImageData(0, 0, 800, 600);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = clamp(d[i] + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  save(c, 'crawl-bg.png');
}

console.log('Generating comic panels…');
panel1_nightmare();
panel2_closeup();
panel3_lightning();
panel4_awake();
panel5_knock();
panel6_photo();
panel7_defiant();
panel8_radio();
crawlBackdrop();
console.log('Done →', OUT);
