import { cardiacCycles } from '../engine/physiologyEngine.js';
import {
  clamp, ecgSample, respirationSample, plethSample, abnormalSample,
  flatlineEnvelope, feverLevel, seededNoise, transmissionGeometry,
} from './signals.js';

const W = 440;
const H = 190;
const branches = transmissionGeometry();
const samples = new Float32Array(W + 1);
const noiseTiles = new Map();
const colors = { ecg: '#75ffab', resp: '#f1d270', pleth: '#76e3ef', fever: '#ffd16b',
  dna: '#75ffab', flatline: '#98e3a7', reanimation: '#ff4e60', transmission: '#ff4e60', outbreak: '#ff4e60' };

function stroke(ctx, path, color, width = 1.5, glow = 5, alpha = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.stroke(path);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function dot(ctx, x, y, color, radius = 2, glow = 8) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawGrid(ctx) {
  ctx.fillStyle = '#06100b';
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = .5;
  for (let major = 0; major <= 1; major++) {
    ctx.strokeStyle = major ? '#294b3a' : '#173323';
    ctx.globalAlpha = major ? .48 : .7;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) {
      if ((x % 100 === 0) !== Boolean(major)) continue;
      ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H);
    }
    for (let y = 12; y < H; y += 20) {
      if (((y - 12) % 100 === 0) !== Boolean(major)) continue;
      ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWave(ctx, state, reduced) {
  const { time, phase, vitals } = state;
  const type = phase.signal;
  const color = colors[type] || phase.color || colors.ecg;
  const sweep = (time * 64 + W * .81) % W;
  const cycles = cardiacCycles(time);
  const rate = Math.max(.2, vitals.hr / 60);
  const collapse = type === 'flatline' ? flatlineEnvelope(time) : 1;
  const dead = type === 'flatline' && collapse === 0;
  const baseline = type === 'resp' || type === 'pleth' ? 148 : 112;

  for (let x = 0; x <= W; x++) {
    const lag = ((sweep - x + W) % W) / 64;
    const sampled = time - lag;
    const beat = sampled < 0 ? sampled * 1.2 : cardiacCycles(sampled);
    let value;
    if (type === 'resp') value = respirationSample(sampled) * 103;
    else if (type === 'pleth') value = plethSample(cycles - lag * rate, clamp((98 - vitals.spo2) / 20)) * 83;
    else if (type === 'reanimation' || type === 'outbreak') {
      value = abnormalSample(cycles - lag * rate, time) * (type === 'outbreak' ? 65 : 61);
    } else {
      value = ecgSample(beat) * 70 * collapse;
      if (type === 'ecg' && time >= 35.5 && time < 35.8) {
        value += Math.exp(-((x - sweep + 22) ** 2) / 13) * 48 * (1 - (time - 35.5) / .3);
      }
    }
    samples[x] = baseline - value;
  }

  const drawTrace = (offset = 0, tone = color, alpha = 1) => {
    for (let start = 0; start < W; start += 20) {
      const path = new Path2D();
      const distance = (sweep - start + W) % W;
      const opacity = dead ? .8 : .36 + .64 * (1 - distance / W);
      let drawing = false;
      for (let x = start; x <= Math.min(W, start + 20); x++) {
        const dropout = !reduced && !dead && (state.glitch?.tear || 0) > 1
          && seededNoise(Math.floor(x / 12) + Math.floor(time * 12) * 29) > .94;
        if (dropout) { drawing = false; continue; }
        if (!drawing || Math.abs(x - sweep) < 2) path.moveTo(x + offset, samples[x]);
        else path.lineTo(x + offset, samples[x]);
        drawing = true;
      }
      stroke(ctx, path, tone, 1.55, dead ? 3 : 5, opacity * alpha);
    }
  };
  if (!reduced && state.glitch?.rgb > .35) {
    drawTrace(-state.glitch.rgb, '#ff3155', .4);
    drawTrace(state.glitch.rgb, '#64ddff', .35);
  }
  drawTrace();
  const sx = Math.floor(sweep);
  if (!dead) {
    const gradient = ctx.createLinearGradient(sweep - 15, 0, sweep + 2, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(.9, color + '12');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(sweep - 15, 15, 17, 150);
    dot(ctx, sweep, samples[sx], '#e4fff0', 1.8, 9);
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = .45;
  ctx.font = '8px monospace';
  ctx.fillText(type === 'resp' ? 'RR 16 / MIN' : type === 'pleth' ? 'PERFUSION INDEX  4.2' : '25 mm/s   10 mm/mV', 8, 182);
  ctx.globalAlpha = 1;
}

function drawFever(ctx, time) {
  const elapsed = time - 20;
  const end = 20 + clamp(elapsed / 6.1) * 405;
  const path = new Path2D();
  path.moveTo(15, 150);
  let previous = 150;
  for (let x = 15; x <= end; x += 2) {
    const y = 150 - feverLevel(((x - 15) / 405) * 6.1) * 110;
    path.lineTo(x, previous);
    path.lineTo(x, y);
    previous = y;
  }
  stroke(ctx, path, colors.fever, 1.8, 5);
  dot(ctx, end, previous, '#fff3bf', 2, 8);
  ctx.fillStyle = '#b99d52';
  ctx.font = '9px monospace';
  ctx.fillText('42°', 405, 20);
  ctx.fillText('37°', 405, 158);
  ctx.font = '8px monospace';
  ctx.fillText('CORE TEMPERATURE / °C', 8, 182);
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = '#b8773155';
  ctx.beginPath(); ctx.moveTo(12, 47); ctx.lineTo(420, 47); ctx.stroke();
  ctx.setLineDash([]);
}

function drawDNA(ctx, time) {
  const elapsed = time - 26.5;
  const progress = clamp(elapsed / 5.7);
  const mutations = Math.min(16, 2 ** (1 + Math.floor(progress * 3.99)));
  const rotation = elapsed * 1.65;
  const center = 90;
  const amplitude = 36;
  const wave = x => Math.sin(x * .039 - rotation) * amplitude;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#88bda0';
  ctx.fillText('MUTATIONS', 10, 18);
  ctx.fillStyle = '#b3ffb9';
  ctx.fillText(String(mutations).padStart(2, '0') + ' OF 16', 79, 18);
  ctx.fillStyle = '#e35762';
  ctx.font = '8px monospace';
  ctx.fillText('SEQUENCE REWRITING', 327, 18);
  for (let i = 0; i < 18; i++) {
    const x = 25 + i * 23;
    const y = wave(x);
    const mutated = i < mutations;
    const highlighted = mutated && (Math.floor(elapsed * 4) + i) % 7 < 2;
    ctx.beginPath(); ctx.moveTo(x, center - y); ctx.lineTo(x, center + y);
    ctx.strokeStyle = highlighted ? '#ff5c70' : '#5abd83';
    ctx.lineWidth = highlighted ? 1.6 : .8;
    ctx.globalAlpha = highlighted ? .9 : .4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (highlighted) dot(ctx, x, center + y, '#ff6979', 2, 7);
    ctx.font = '9px monospace';
    ctx.fillStyle = highlighted ? '#ff6d7d' : '#5b9772';
    ctx.fillText('ACGT'[(i + (mutated ? 1 : 0)) % 4], x - 3, 151);
  }
  for (const side of [-1, 1]) {
    const path = new Path2D();
    for (let x = 12; x <= 428; x++) {
      const y = center + wave(x) * side;
      if (x === 12) path.moveTo(x, y); else path.lineTo(x, y);
    }
    stroke(ctx, path, side === 1 ? '#9dffb3' : '#42b77b', side === 1 ? 1.8 : 1.3, 4);
  }
  ctx.font = '8px monospace';
  ctx.fillStyle = '#648c70';
  ctx.fillText('HOST GENOME  /  SEQUENCING ACTIVE', 8, 182);
}

function drawTransmission(ctx, time) {
  const elapsed = time - 53.5;
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ff6977';
  ctx.fillText('R₀ = 3', 8, 18);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#b7787c';
  ctx.fillText('TRANSMISSION MODEL', 312, 14);
  dot(ctx, 23, 94, '#ff8490', 3.5, 12);
  for (let generation = 1; generation <= 4; generation++) {
    const stage = clamp((elapsed - .12 - (generation - 1) * 1.25) / 1.1);
    const nodes = branches[generation];
    for (const node of nodes) {
      const spreadDelay = (node.index / nodes.length) * .3;
      const amount = clamp((stage - spreadDelay) / .7);
      if (amount <= 0) continue;
      const x = node.parent.x + (node.x - node.parent.x) * amount;
      const y = node.parent.y + (node.y - node.parent.y) * amount;
      const path = new Path2D();
      path.moveTo(node.parent.x, node.parent.y);
      path.lineTo(x, y);
      stroke(ctx, path, '#e94b5d', generation === 4 ? .6 : .85, generation < 3 ? 3 : 0, .4 + amount * .35);
      if (amount < 1) dot(ctx, x, y, '#ffbfbd', 1.3, 4);
      else dot(ctx, node.x, node.y, '#ff6974', generation < 3 ? 2.3 : 1.2, 3);
    }
    ctx.fillStyle = stage > 0 ? '#eb7b84' : '#533a3c';
    ctx.font = '8px monospace';
    ctx.fillText('GEN ' + generation, nodes[0].x - 14, 185);
  }
}

function noiseTile(frame) {
  const index = frame % 8;
  if (noiseTiles.has(index)) return noiseTiles.get(index);
  const tile = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(96, 64) : document.createElement('canvas');
  tile.width = 96; tile.height = 64;
  const context = tile.getContext('2d');
  const pixels = context.createImageData(96, 64);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = seededNoise(i + index * 7001);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = noise > .65 ? 190 : 15;
    pixels.data[i + 3] = noise > .65 ? 120 : 80;
  }
  context.putImageData(pixels, 0, 0);
  noiseTiles.set(index, tile);
  return tile;
}

function drawCRT(ctx, state, reduced) {
  const { time, glitch = {} } = state;
  const frame = Math.floor(time * 12);
  ctx.save();
  ctx.globalAlpha = reduced ? .025 : (glitch.noise || .035);
  ctx.imageSmoothingEnabled = false;
  const tile = noiseTile(frame);
  for (let x = 0; x < W; x += 96) for (let y = 0; y < H; y += 64) ctx.drawImage(tile, x, y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#00000018';
  for (let y = 1; y < H; y += 3) ctx.fillRect(0, y, W, .7);
  if (!reduced && glitch.tear > .5) {
    for (let i = 0; i < 3; i++) {
      const y = 15 + seededNoise(frame * 31 + i * 7) * 155;
      const x = seededNoise(frame * 19 + i) * W * .6;
      const width = 30 + seededNoise(frame * 13 + i) * 220;
      ctx.fillStyle = i % 2 === 0 ? '#05100de0' : '#4bd4be33';
      ctx.fillRect(x + glitch.tear, y, width, 1 + seededNoise(frame + i) * 4);
      ctx.fillStyle = time >= 47 ? '#ff445c66' : '#6be5c644';
      ctx.fillRect(x, y, width * .6, .65);
    }
  }
  const shade = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 250);
  shade.addColorStop(0, 'transparent'); shade.addColorStop(1, '#00000038');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  if (glitch.blackout && !reduced) {
    ctx.fillStyle = '#020805'; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

export function renderMonitor(ctx, width, height, state, reduced = false) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.scale(width / W, height / H);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  drawGrid(ctx);
  switch (state.phase.signal) {
    case 'dna': drawDNA(ctx, state.time); break;
    case 'transmission': drawTransmission(ctx, state.time); break;
    case 'fever': drawFever(ctx, state.time); break;
    default: drawWave(ctx, state, reduced);
  }
  drawCRT(ctx, state, reduced);
  ctx.restore();
}
