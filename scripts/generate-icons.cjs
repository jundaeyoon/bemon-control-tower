const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const r = size * 0.18; // corner radius

  // ── 둥근 모서리 클리핑 경로 ────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();

  // ── 배경 (올리브그린) ──────────────────────────────────────────────────────
  ctx.fillStyle = '#6B7C45';
  ctx.fillRect(0, 0, size, size);

  // ── 대각선 해칭 패턴 (손그림 느낌) ─────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = '#4a5e2e';
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.globalAlpha = 0.55;

  const gap = size * 0.09;
  for (let i = -size; i < size * 2; i += gap) {
    // 왼쪽 위 → 오른쪽 아래 대각선
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  ctx.restore();

  // ── 큰 "B" ─────────────────────────────────────────────────────────────────
  const bSize = size * 0.62;
  ctx.fillStyle = '#FAF8F4';
  ctx.font = `900 ${bSize}px "Arial Black", "Arial Bold", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // "B" 위치: 세로 중앙보다 약간 위 (EMON 텍스트 공간 확보)
  const bY = size * 0.73;
  ctx.fillText('B', size / 2, bY);

  // ── 하단 "EMON" ────────────────────────────────────────────────────────────
  const emonSize = size * 0.155;
  ctx.font = `700 ${emonSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#FAF8F4';
  ctx.fillText('EMON', size / 2, size * 0.93);

  return canvas;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ icon-${size}.png (${buffer.length} bytes)`);
}
