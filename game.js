(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const minimap = document.getElementById("minimap");
  const mmCtx = minimap.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;
  const HALF_H = H / 2;
  const FOV = Math.PI / 3;
  const HALF_FOV = FOV / 2;
  const NUM_RAYS = W;
  const DELTA_ANGLE = FOV / NUM_RAYS;
  const MAX_DEPTH = 22;
  const CELL = 1;
  const MOVE_SPEED = 4.2;
  const SPRINT_MULT = 1.55;
  const MOUSE_SENS = 0.0022;
  const PLAYER_RADIUS = 0.22;
  const JUMP_FORCE = 6.5;
  const GRAVITY = 18;
  const BOSS_WAVES = [3, 5];
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const MOBILE_AIM_SENS = 0.004;
  const STICK_RADIUS = 50;

  const WEAPONS = [
    { id: "knife", name: "COMBAT KNIFE", melee: true, damage: 60, fireRate: 0.42, range: 2.0, spread: 0.45, pellets: 1 },
    { id: "pistol", name: "PISTOL", magSize: 12, reserve: 48, damage: 22, fireRate: 0.28, reloadTime: 1.0, spread: 0.018, pellets: 1, auto: false, range: 18 },
    { id: "rifle", name: "ASSAULT RIFLE", magSize: 30, reserve: 90, damage: 26, fireRate: 0.1, reloadTime: 1.6, spread: 0.025, pellets: 1, auto: true, range: 22 },
    { id: "shotgun", name: "SHOTGUN", magSize: 6, reserve: 24, damage: 14, fireRate: 0.75, reloadTime: 2.2, spread: 0.12, pellets: 7, auto: false, range: 10 },
    { id: "sniper", name: "SNIPER", magSize: 5, reserve: 15, damage: 90, fireRate: 1.1, reloadTime: 2.4, spread: 0.004, pellets: 1, auto: false, range: 30 },
    { id: "smg", name: "SMG", magSize: 25, reserve: 100, damage: 17, fireRate: 0.055, reloadTime: 1.4, spread: 0.04, pellets: 1, auto: true, range: 16 },
    { id: "lmg", name: "LMG", magSize: 60, reserve: 120, damage: 24, fireRate: 0.09, reloadTime: 3.0, spread: 0.035, pellets: 1, auto: true, range: 22 },
    { id: "rocket", name: "ROCKET LAUNCHER", magSize: 1, reserve: 5, damage: 100, fireRate: 1.4, reloadTime: 2.8, spread: 0.008, pellets: 1, auto: false, range: 28, explosive: true },
  ];

  const MAPS = [
    {
      name: "FACILITY",
      spawn: { x: 2.5, y: 2.5, angle: 0.4 },
      layout: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,1,1,1,0,0,1,1,0,1],
        [1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,0,3,3,0,0,0,0,0,0,1],
        [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    },
    {
      name: "CROSSFIRE",
      spawn: { x: 7.5, y: 7.5, angle: 0 },
      layout: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    },
    {
      name: "ARENA",
      spawn: { x: 7.5, y: 7.5, angle: -0.5 },
      layout: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,2,2,0,0,0,0,0,0,2,2,0,0,1],
        [1,0,0,2,2,0,0,0,0,0,0,2,2,0,0,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
        [1,0,0,2,2,0,0,0,0,0,0,2,2,0,0,1],
        [1,0,0,2,2,0,0,0,0,0,0,2,2,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    },
    {
      name: "LABYRINTH",
      spawn: { x: 1.5, y: 1.5, angle: 0.8 },
      layout: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,1,0,1,0,1,1,1,1,1,0,1,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,0,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,3,1,3,1,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,0,0,1,1,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,0,0,1,1,1,1,1,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    },
    {
      name: "HANGAR",
      spawn: { x: 2.5, y: 7.5, angle: -1.2 },
      layout: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,1,3,3,1,1,1,0,0,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,0,0,1,1,1,0,0,1,1,1,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      ],
    },
  ];

  const WALL_COLORS = {
    1: { base: [40, 80, 140], dark: [25, 50, 90] },
    2: { base: [100, 55, 35], dark: [70, 38, 24] },
    3: { base: [90, 55, 25], dark: [55, 35, 15] },
  };

  let MAP = [];
  let MAP_H = 0;
  let MAP_W = 0;
  let currentMapIndex = 0;

  let state = "menu";
  let player, enemies, bullets, particles, pickups;
  let score, wave, keys, mouseLocked, mouseDown;
  let lastTime, shootCooldown, reloadTimer, waveBannerTimer;
  let zBuffer, gameTime, footstepTimer, pickupKeyWasDown;
  let enemySprites, pickupSprites, audio, jumpKeyWasDown;
  let stickTouchId, aimTouchId, stickCenter, aimLastX;

  const AudioEngine = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    resume() { this.init(); if (this.ctx.state === "suspended") this.ctx.resume(); },
    tone(freq, dur, type, vol, slide) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
      gain.gain.setValueAtTime(vol || 0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },
    noise(dur, vol) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t);
    },
    shoot(id) {
      if (id === "knife") { this.noise(0.04, 0.05); this.tone(200, 0.06, "sawtooth", 0.04, 100); return; }
      if (id === "pistol") { this.noise(0.06, 0.1); this.tone(180, 0.08, "square", 0.06); }
      else if (id === "rifle") { this.noise(0.04, 0.07); this.tone(120, 0.05, "sawtooth", 0.05); }
      else if (id === "shotgun") { this.noise(0.14, 0.18); this.tone(80, 0.12, "square", 0.1, 40); }
      else if (id === "sniper") { this.noise(0.1, 0.14); this.tone(60, 0.15, "sawtooth", 0.12, 30); }
      else if (id === "smg") { this.noise(0.03, 0.05); this.tone(200, 0.04, "square", 0.04); }
      else if (id === "lmg") { this.noise(0.05, 0.08); this.tone(90, 0.07, "sawtooth", 0.06); }
      else if (id === "rocket") { this.noise(0.08, 0.1); this.tone(70, 0.1, "square", 0.08, 35); }
    },
    reload() { this.tone(300, 0.06, "triangle", 0.04); setTimeout(() => this.tone(420, 0.06, "triangle", 0.04), 120); },
    hit() { this.tone(600, 0.05, "square", 0.05); },
    kill() { this.tone(200, 0.1, "sawtooth", 0.07, 80); },
    hurt() { this.tone(150, 0.15, "sawtooth", 0.08, 60); this.noise(0.08, 0.06); },
    pickup() { this.tone(520, 0.08, "sine", 0.06); setTimeout(() => this.tone(780, 0.1, "sine", 0.05), 80); },
    footstep() { this.noise(0.03, 0.025); },
    empty() { this.tone(800, 0.03, "square", 0.03); },
    wave() { this.tone(440, 0.15, "sine", 0.06); setTimeout(() => this.tone(660, 0.2, "sine", 0.06), 150); },
    switchWep() { this.tone(350, 0.04, "triangle", 0.03); },
    jump() { this.tone(280, 0.08, "sine", 0.04); },
    door() { this.tone(180, 0.12, "triangle", 0.06); setTimeout(() => this.tone(120, 0.15, "sine", 0.05), 100); },
    locked() { this.tone(100, 0.1, "square", 0.05); },
    bossRoar() { this.tone(80, 0.4, "sawtooth", 0.1, 40); this.noise(0.2, 0.08); },
    explosion() { this.noise(0.25, 0.2); this.tone(50, 0.3, "sawtooth", 0.12, 20); },
  };

  function buildEnemySprites() {
    return {
      grunt: buildAnimatedHumanoid(48, 72, "grunt", 4),
      heavy: buildAnimatedHumanoid(56, 80, "heavy", 4),
      runner: buildAnimatedHumanoid(44, 68, "runner", 4),
      boss: buildAnimatedHumanoid(72, 96, "boss", 4),
    };
  }

  function buildAnimatedHumanoid(w, h, type, frameCount) {
    const frames = [];
    const palettes = {
      grunt: { skin: "#c8956c", suit: "#2a4a6a", suitDark: "#1a3050", pants: "#1a2030", gun: "#444", helmet: "#3a5a7a" },
      heavy: { skin: "#b08050", suit: "#4a2020", suitDark: "#301010", pants: "#201010", gun: "#555", helmet: "#5a3030" },
      runner: { skin: "#d4a070", suit: "#2a5a3a", suitDark: "#1a4028", pants: "#152515", gun: "#3a3a3a", helmet: null },
      boss: { skin: "#a07050", suit: "#3a1030", suitDark: "#250820", pants: "#180818", gun: "#666", helmet: "#660022" },
    };
    const pal = palettes[type];

    for (let f = 0; f < frameCount; f++) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext("2d");
      cx.clearRect(0, 0, w, h);
      const legSwing = Math.sin((f / frameCount) * Math.PI * 2) * (type === "boss" ? 4 : 6);
      const armSwing = -legSwing * 0.6;
      const cx2 = w / 2;

      drawLimb(cx, cx2 - 10, h - 18 + legSwing, type === "boss" ? 10 : 7, type === "boss" ? 24 : 20, pal.pants, -8);
      drawLimb(cx, cx2 + 3, h - 18 - legSwing, type === "boss" ? 10 : 7, type === "boss" ? 24 : 20, pal.pants, 8);
      drawTorso(cx, cx2, h - 42, type === "boss" ? 32 : 22, type === "boss" ? 34 : 26, pal.suit, pal.suitDark, type);
      drawLimb(cx, cx2 - 14, h - 40 + armSwing, type === "boss" ? 9 : 6, type === "boss" ? 22 : 18, pal.suit, -15);
      drawLimb(cx, cx2 + 8, h - 40 - armSwing * 0.5, type === "boss" ? 9 : 6, type === "boss" ? 20 : 16, pal.suit, 10);
      drawHead(cx, cx2, h - 58, type === "boss" ? 15 : 11, pal.skin, pal.helmet, type);
      drawGun(cx, cx2 + 10, h - 36 - armSwing * 0.3, type, pal.gun);
      if (type === "boss") {
        cx.fillStyle = "#880033";
        cx.fillRect(cx2 - 20, h - 50, 40, 6);
        cx.fillStyle = "#ff0044";
        cx.fillRect(cx2 - 8, h - 52, 16, 4);
      }
      frames.push({ canvas: c, data: cx.getImageData(0, 0, w, h), w, h });
    }
    return frames;
  }

  function drawLimb(cx, x, y, lw, lh, color, angle) {
    cx.save();
    cx.translate(x, y);
    cx.rotate((angle * Math.PI) / 180);
    cx.fillStyle = color;
    cx.fillRect(-lw / 2, 0, lw, lh);
    cx.restore();
  }

  function drawTorso(cx, x, y, tw, th, color, dark, type) {
    cx.fillStyle = color;
    cx.beginPath();
    cx.moveTo(x - tw / 2, y);
    cx.lineTo(x + tw / 2, y);
    cx.lineTo(x + tw / 2 - 3, y + th);
    cx.lineTo(x - tw / 2 + 3, y + th);
    cx.closePath();
    cx.fill();
    cx.fillStyle = dark;
    cx.fillRect(x - tw / 2 + 2, y + th * 0.3, tw - 4, 4);
    if (type === "heavy" || type === "boss") {
      cx.fillStyle = type === "boss" ? "#880033" : "#666";
      cx.fillRect(x - tw / 2 - 3, y + 4, 5, th - 8);
      cx.fillRect(x + tw / 2 - 2, y + 4, 5, th - 8);
    }
  }

  function drawHead(cx, x, y, r, skin, helmet, type) {
    cx.fillStyle = skin;
    cx.beginPath();
    cx.arc(x, y, r, 0, Math.PI * 2);
    cx.fill();
    if (helmet) {
      cx.fillStyle = helmet;
      cx.beginPath();
      cx.arc(x, y - 2, r + 2, Math.PI, Math.PI * 2);
      cx.fill();
    } else if (type === "runner") {
      cx.fillStyle = "#2a5a3a";
      cx.fillRect(x - r - 1, y - 4, r * 2 + 2, 6);
    }
    cx.fillStyle = type === "boss" ? "#ff0044" : "#111";
    cx.fillRect(x - 5, y - 1, 3, 2);
    cx.fillRect(x + 2, y - 1, 3, 2);
  }

  function drawGun(cx, x, y, type, color) {
    cx.fillStyle = color;
    const len = type === "boss" ? 28 : type === "heavy" ? 22 : type === "runner" ? 14 : 18;
    cx.fillRect(x, y, len, type === "boss" ? 6 : 4);
    cx.fillRect(x + 2, y - 3, 6, 3);
    if (type === "heavy" || type === "boss") cx.fillRect(x + len - 4, y - 1, 8, 6);
  }

  function buildPickupSprites() {
    const types = ["health", "ammo", "key", "shotgun", "sniper", "smg", "lmg", "rocket"];
    const out = {};
    for (const t of types) {
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const cx = c.getContext("2d");
      cx.clearRect(0, 0, 32, 32);
      if (t === "health") {
        cx.fillStyle = "#cc2222";
        cx.fillRect(12, 6, 8, 20);
        cx.fillRect(6, 12, 20, 8);
      } else if (t === "ammo") {
        cx.fillStyle = "#ccaa44";
        for (let i = 0; i < 3; i++) cx.fillRect(8 + i * 6, 10, 4, 14);
      } else if (t === "key") {
        cx.fillStyle = "#ffcc00";
        cx.beginPath();
        cx.arc(12, 12, 8, 0, Math.PI * 2);
        cx.fill();
        cx.fillRect(18, 11, 12, 3);
        cx.fillRect(26, 11, 3, 8);
        cx.fillRect(22, 16, 3, 6);
      } else {
        cx.fillStyle = "#00ccaa";
        cx.fillRect(6, 14, 20, 6);
        cx.fillRect(18, 10, 8, 10);
        cx.fillStyle = "#008866";
        cx.fillRect(4, 18, 6, 8);
      }
      out[t] = { canvas: c, data: cx.getImageData(0, 0, 32, 32), w: 32, h: 32 };
    }
    return out;
  }

  function loadMap(index) {
    currentMapIndex = index % MAPS.length;
    const m = MAPS[currentMapIndex];
    MAP = m.layout.map((row) => row.slice());
    MAP_H = MAP.length;
    MAP_W = MAP[0].length;
    document.getElementById("map-name").textContent = m.name;
    return m.spawn;
  }

  function getCell(x, y) {
    const mx = Math.floor(x);
    const my = Math.floor(y);
    if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return 1;
    return MAP[my][mx];
  }

  function isBlocking(x, y) {
    const c = getCell(x, y);
    return c === 1 || c === 2 || c === 3;
  }

  function isWallCell(c) { return c === 1 || c === 2 || c === 3; }

  function canMove(x, y, radius) {
    return !isBlocking(x - radius, y - radius) &&
           !isBlocking(x + radius, y - radius) &&
           !isBlocking(x - radius, y + radius) &&
           !isBlocking(x + radius, y + radius);
  }

  function mapHasDoors() {
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (MAP[y][x] === 3) return true;
    return false;
  }

  function initGame() {
    const spawn = loadMap(0);
    player = {
      x: spawn.x, y: spawn.y, angle: spawn.angle,
      vx: 0, vy: 0,
      health: 100, maxHealth: 100,
      weaponIndex: 1,
      weapons: WEAPONS.map((w) => (w.melee ? null : { ammo: w.magSize, reserve: w.reserve })),
      reloading: false, damageFlash: 0,
      jumpVel: 0, jumpOffset: 0, onGround: true,
      keys: 0, knifeSwing: 0,
    };

    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];
    score = 0;
    wave = 1;
    keys = {};
    mouseDown = false;
    shootCooldown = 0;
    reloadTimer = 0;
    waveBannerTimer = 0;
    gameTime = 0;
    footstepTimer = 0;
    pickupKeyWasDown = false;
    jumpKeyWasDown = false;
    zBuffer = new Float32Array(NUM_RAYS);

    spawnWave(wave);
    spawnPickups(4);
    spawnKeyNearPlayer();
    updateHUD();
    syncWeaponSlots();
  }

  function getWeapon() { return WEAPONS[player.weaponIndex]; }

  function getWeaponState() {
    const w = WEAPONS[player.weaponIndex];
    if (w.melee) return { ammo: 1, reserve: 0 };
    return player.weapons[player.weaponIndex];
  }

  function syncWeaponSlots() {
    document.querySelectorAll(".weapon-slot").forEach((el, i) => {
      el.classList.toggle("active", i === player.weaponIndex);
    });
  }

  function spawnBoss(n, x, y) {
    enemies.push({
      x, y,
      health: 350 + n * 120,
      maxHealth: 350 + n * 120,
      speed: 0.75 + n * 0.05,
      damage: 18 + n * 4,
      attackCooldown: 1,
      hitFlash: 0,
      type: "boss",
      animFrame: 0, animTimer: 0, moving: false,
      isBoss: true,
    });
    AudioEngine.bossRoar();
  }

  function spawnWave(n) {
    if (n > 1) {
      const spawn = loadMap(n - 1);
      player.x = spawn.x;
      player.y = spawn.y;
      player.angle = spawn.angle;
      player.vx = 0;
      player.vy = 0;
      player.jumpVel = 0;
      player.jumpOffset = 0;
    }

    enemies = [];
    const spawns = [];
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (MAP[y][x] === 0) {
          const dx = x + 0.5 - player.x;
          const dy = y + 0.5 - player.y;
          if (Math.sqrt(dx * dx + dy * dy) > 5) spawns.push({ x: x + 0.5, y: y + 0.5 });
        }
      }
    }
    shuffle(spawns);

    const isBossWave = BOSS_WAVES.includes(n);
    if (isBossWave && spawns.length > 0) {
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < spawns.length; i++) {
        const d = Math.abs(spawns[i].x - MAP_W / 2) + Math.abs(spawns[i].y - MAP_H / 2);
        if (d < bestD) { bestD = d; bestIdx = i; }
      }
      spawnBoss(n, spawns[bestIdx].x, spawns[bestIdx].y);
      const minionCount = 2 + Math.floor(n / 2);
      let spawned = 0;
      for (let i = 0; i < spawns.length && spawned < minionCount; i++) {
        if (i === bestIdx) continue;
        spawnEnemy(spawns[i], n, spawned % 2 === 0 ? "runner" : "grunt");
        spawned++;
      }
    } else {
      const count = 3 + n * 2;
      for (let i = 0; i < Math.min(count, spawns.length); i++) {
        let type = "grunt";
        if (n >= 2 && i % 4 === 1) type = "runner";
        if (n >= 3 && i % 5 === 0) type = "heavy";
        spawnEnemy(spawns[i], n, type);
      }
    }

    spawnPickups(2 + n);
    spawnKeyNearPlayer();
    showWaveBanner(n, isBossWave);
    AudioEngine.wave();
    updateHUD();
  }

  function spawnEnemy(s, n, type) {
    const stats = { grunt: [30, 1.3, 8], runner: [20, 2.2, 6], heavy: [60, 0.9, 14] }[type];
    enemies.push({
      x: s.x, y: s.y,
      health: stats[0] + n * 8,
      maxHealth: stats[0] + n * 8,
      speed: stats[1] + n * 0.1,
      damage: stats[2] + n * 2,
      attackCooldown: 0, hitFlash: 0, type,
      animFrame: 0, animTimer: 0, moving: false,
    });
  }

  function spawnPickups(count) {
    const types = ["health", "ammo", "ammo", "smg", "lmg", "rocket", "shotgun", "sniper"];
    const spots = [];
    for (let y = 1; y < MAP_H - 1; y++)
      for (let x = 1; x < MAP_W - 1; x++)
        if (MAP[y][x] === 0) spots.push({ x: x + 0.5, y: y + 0.5 });
    shuffle(spots);
    for (let i = 0; i < Math.min(count, spots.length); i++) {
      pickups.push({ x: spots[i].x, y: spots[i].y, type: types[Math.floor(Math.random() * types.length)], bob: Math.random() * Math.PI * 2 });
    }
  }

  function spawnKeyNearPlayer() {
    if (!mapHasDoors()) return;
    if (pickups.some((p) => p.type === "key")) return;
    for (let r = 2; r < 6; r++) {
      for (let a = 0; a < 8; a++) {
        const x = player.x + Math.cos(a) * r * 0.5;
        const y = player.y + Math.sin(a) * r * 0.5;
        if (getCell(x, y) === 0) {
          pickups.push({ x, y, type: "key", bob: 0 });
          return;
        }
      }
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function showWaveBanner(n, isBoss) {
    const label = isBoss ? "⚠ BOSS WAVE " + n : "WAVE " + n;
    document.getElementById("wave-banner-text").textContent = label + " — " + MAPS[currentMapIndex].name;
    document.getElementById("wave-banner").classList.remove("hidden");
    waveBannerTimer = isBoss ? 3.5 : 2.5;
  }

  function showPickupToast(msg) {
    const el = document.getElementById("pickup-toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    setTimeout(() => el.classList.add("hidden"), 2000);
  }

  function getJumpShift() { return player.jumpOffset * 55; }

  function castRay(originX, originY, angle) {
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    let mapX = Math.floor(originX);
    let mapY = Math.floor(originY);
    const deltaDistX = Math.abs(1 / (cosA || 1e-10));
    const deltaDistY = Math.abs(1 / (sinA || 1e-10));
    let stepX, stepY, sideDistX, sideDistY;

    if (cosA < 0) { stepX = -1; sideDistX = (originX - mapX) * deltaDistX; }
    else { stepX = 1; sideDistX = (mapX + 1 - originX) * deltaDistX; }
    if (sinA < 0) { stepY = -1; sideDistY = (originY - mapY) * deltaDistY; }
    else { stepY = 1; sideDistY = (mapY + 1 - originY) * deltaDistY; }

    let side = 0;
    let depth = 0;
    let wallType = 1;

    for (let i = 0; i < MAX_DEPTH * 2; i++) {
      if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
      else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
      if (mapX < 0 || mapY < 0 || mapX >= MAP_W || mapY >= MAP_H) break;
      if (isWallCell(MAP[mapY][mapX])) {
        wallType = MAP[mapY][mapX];
        if (side === 0) depth = (mapX - originX + (1 - stepX) / 2) / (cosA || 1e-10);
        else depth = (mapY - originY + (1 - stepY) / 2) / (sinA || 1e-10);
        break;
      }
    }
    return { depth: Math.max(depth, 0.001), side, wallType };
  }

  function render3D() {
    const jumpShift = getJumpShift();
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, HALF_H);
    ceilGrad.addColorStop(0, "#0d1020");
    ceilGrad.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, W, HALF_H + jumpShift);

    const floorGrad = ctx.createLinearGradient(0, HALF_H, 0, H);
    floorGrad.addColorStop(0, "#2a2a3a");
    floorGrad.addColorStop(1, "#1a1520");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, HALF_H + jumpShift, W, H);

    for (let i = 0; i < NUM_RAYS; i++) {
      const rayAngle = player.angle - HALF_FOV + i * DELTA_ANGLE;
      const ray = castRay(player.x, player.y, rayAngle);
      const correctedDepth = ray.depth * Math.cos(rayAngle - player.angle);
      zBuffer[i] = correctedDepth;

      const wallHeight = Math.min((CELL / correctedDepth) * (H / 2) / Math.tan(HALF_FOV), H * 2);
      const wallTop = HALF_H - wallHeight / 2 - jumpShift;
      const colors = WALL_COLORS[ray.wallType] || WALL_COLORS[1];
      const shade = Math.max(0.15, 1 - correctedDepth / MAX_DEPTH);
      const sideShade = ray.side === 1 ? 0.72 : 1;
      const doorGlow = ray.wallType === 3 ? 1.15 : 1;
      const c = colors.base;
      ctx.fillStyle = `rgb(${Math.floor(c[0] * shade * sideShade * doorGlow)},${Math.floor(c[1] * shade * sideShade * doorGlow)},${Math.floor(c[2] * shade * sideShade * doorGlow)})`;
      ctx.fillRect(i, wallTop, 1, wallHeight);
    }

    renderBillboardSprites(pickups, 0.45, (p) => pickupSprites[p.type] || pickupSprites.ammo, 1);
    renderBillboardSprites(enemies, 0.55, (e) => {
      const frames = enemySprites[e.type] || enemySprites.grunt;
      const fi = e.moving ? Math.floor(e.animFrame) % frames.length : 0;
      return frames[fi];
    }, (e) => e.type === "boss" ? 1.1 : 1.5);
    renderParticles();
  }

  function renderBillboardSprites(list, widthRatio, getSprite, heightMultFn) {
    const sorted = list.map((item, idx) => {
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      return { item, idx, dist: dx * dx + dy * dy };
    }).sort((a, b) => b.dist - a.dist);

    for (const sp of sorted) {
      const item = sp.item;
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.2) continue;

      let spriteAngle = Math.atan2(dy, dx) - player.angle;
      while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;
      while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
      if (Math.abs(spriteAngle) > HALF_FOV + 0.4) continue;

      const sprite = getSprite(item);
      if (!sprite) continue;

      const heightMult = typeof heightMultFn === "function" ? heightMultFn(item) : heightMultFn;
      const spriteScreenX = (0.5 + spriteAngle / FOV) * W;
      const spriteHeight = Math.min((CELL / dist) * (H / heightMult) / Math.tan(HALF_FOV), H * 2);
      const spriteWidth = spriteHeight * (sprite.w / sprite.h) * widthRatio;
      const spriteTop = HALF_H - spriteHeight / 2 - getJumpShift();
      const shade = Math.max(0.25, 1 - dist / MAX_DEPTH);
      drawTexturedSprite(sprite, spriteScreenX, spriteTop, spriteWidth, spriteHeight, dist, shade, item.hitFlash > 0);

      if (item.health !== undefined && item.health < item.maxHealth) {
        const barW = spriteWidth * 0.9;
        const barX = spriteScreenX - barW / 2;
        const barY = spriteTop - 10;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(barX, barY, barW, 5);
        ctx.fillStyle = item.isBoss ? "#ff0044" : "#ff3333";
        ctx.fillRect(barX, barY, barW * (item.health / item.maxHealth), 5);
      }
    }
  }

  function drawTexturedSprite(sprite, screenX, top, width, height, dist, shade, hitFlash) {
    const data = sprite.data.data;
    const sw = sprite.w;
    const sh = sprite.h;
    const sx = Math.floor(screenX - width / 2);
    const sw2 = Math.ceil(width);

    for (let col = 0; col < sw2; col++) {
      const screenCol = sx + col;
      if (screenCol < 0 || screenCol >= W) continue;
      if (zBuffer[screenCol] && dist > zBuffer[screenCol] + 0.05) continue;
      const texCol = Math.floor((col / sw2) * sw);
      const drawH = Math.ceil(height);
      for (let row = 0; row < drawH; row++) {
        const screenRow = Math.floor(top + (row / drawH) * height);
        if (screenRow < 0 || screenRow >= H) continue;
        const texRow = Math.floor((row / drawH) * sh);
        const idx = (texRow * sw + texCol) * 4;
        if (data[idx + 3] < 20) continue;
        let r = Math.floor(data[idx] * shade);
        let g = Math.floor(data[idx + 1] * shade);
        let b = Math.floor(data[idx + 2] * shade);
        if (hitFlash) { r = Math.min(255, r + 90); g = Math.min(255, g + 60); b = Math.min(255, b + 40); }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(screenCol, screenRow, 1, 1);
      }
    }
  }

  function renderParticles() {
    for (const p of particles) {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MAX_DEPTH) continue;
      let angle = Math.atan2(dy, dx) - player.angle;
      while (angle > Math.PI) angle -= 2 * Math.PI;
      while (angle < -Math.PI) angle += 2 * Math.PI;
      const screenX = (0.5 + angle / FOV) * W;
      const size = Math.max(1, (p.size / dist) * (H / 4));
      const shade = Math.max(0, 1 - dist / 8);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${shade * p.life})`;
      ctx.fillRect(screenX - size / 2, HALF_H - size / 2 - getJumpShift(), size, size);
    }
  }

  function renderMinimap() {
    const scale = minimap.width / MAP_W;
    mmCtx.fillStyle = "rgba(5,10,20,0.9)";
    mmCtx.fillRect(0, 0, minimap.width, minimap.height);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const c = MAP[y][x];
        if (c === 1) { mmCtx.fillStyle = "#1a3a6a"; mmCtx.fillRect(x * scale, y * scale, scale, scale); }
        else if (c === 2) { mmCtx.fillStyle = "#5a3020"; mmCtx.fillRect(x * scale, y * scale, scale, scale); }
        else if (c === 3) { mmCtx.fillStyle = "#aa6622"; mmCtx.fillRect(x * scale, y * scale, scale, scale); }
      }
    }
    for (const p of pickups) {
      mmCtx.fillStyle = p.type === "health" ? "#44ff44" : p.type === "key" ? "#ffcc00" : "#ffaa00";
      mmCtx.fillRect(p.x * scale - 2, p.y * scale - 2, 4, 4);
    }
    for (const e of enemies) {
      mmCtx.fillStyle = e.isBoss ? "#ff00aa" : e.type === "heavy" ? "#ff4400" : e.type === "runner" ? "#44ff44" : "#ff2222";
      mmCtx.beginPath();
      mmCtx.arc(e.x * scale, e.y * scale, e.isBoss ? 5 : 3, 0, Math.PI * 2);
      mmCtx.fill();
    }
    mmCtx.fillStyle = "#00ffcc";
    mmCtx.beginPath();
    mmCtx.arc(player.x * scale, player.y * scale, 4, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.strokeStyle = "#00ffcc";
    mmCtx.lineWidth = 2;
    mmCtx.beginPath();
    mmCtx.moveTo(player.x * scale, player.y * scale);
    mmCtx.lineTo((player.x + Math.cos(player.angle) * 0.8) * scale, (player.y + Math.sin(player.angle) * 0.8) * scale);
    mmCtx.stroke();
  }

  function renderWeapon(dt) {
    const wpn = getWeapon();
    const moving = keys["KeyW"] || keys["KeyS"] || keys["KeyA"] || keys["KeyD"];
    const bob = Math.sin(gameTime * 10) * (moving ? 4 : 0);
    const kick = shootCooldown > wpn.fireRate * 0.5 ? 10 : 0;
    const swing = player.knifeSwing > 0 ? -20 * (player.knifeSwing / 0.3) : 0;
    const bx = W / 2 + swing;
    const by = H - 60 + bob + kick - getJumpShift() * 0.3;
    const jy = by;

    ctx.save();
    if (wpn.id === "knife") {
      ctx.fillStyle = "#aaa";
      ctx.beginPath();
      ctx.moveTo(bx, jy - 30);
      ctx.lineTo(bx + 8, jy + 10);
      ctx.lineTo(bx - 2, jy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#553311";
      ctx.fillRect(bx - 4, jy + 10, 8, 18);
    } else if (wpn.id === "pistol") {
      ctx.fillStyle = "#3a3a3a"; ctx.fillRect(bx - 8, jy, 16, 50);
      ctx.fillStyle = "#555"; ctx.fillRect(bx - 5, jy - 20, 10, 22);
      ctx.fillStyle = "#222"; ctx.fillRect(bx - 12, jy + 40, 24, 18);
    } else if (wpn.id === "rifle") {
      ctx.fillStyle = "#2a3a2a"; ctx.fillRect(bx - 14, jy - 10, 28, 70);
      ctx.fillStyle = "#444"; ctx.fillRect(bx - 6, jy - 35, 12, 30);
      ctx.fillStyle = "#666"; ctx.fillRect(bx + 10, jy + 5, 30, 8);
    } else if (wpn.id === "shotgun") {
      ctx.fillStyle = "#4a3020"; ctx.fillRect(bx - 10, jy, 20, 55);
      ctx.fillStyle = "#888"; ctx.fillRect(bx - 5, jy - 28, 10, 50);
    } else if (wpn.id === "sniper") {
      ctx.fillStyle = "#2a2a3a"; ctx.fillRect(bx - 8, jy - 5, 16, 65);
      ctx.fillStyle = "#4488aa"; ctx.fillRect(bx + 6, jy + 10, 40, 6);
    } else if (wpn.id === "smg") {
      ctx.fillStyle = "#333"; ctx.fillRect(bx - 10, jy, 20, 45);
      ctx.fillStyle = "#555"; ctx.fillRect(bx + 8, jy + 8, 22, 6);
    } else if (wpn.id === "lmg") {
      ctx.fillStyle = "#2a3a2a"; ctx.fillRect(bx - 16, jy - 5, 32, 60);
      ctx.fillStyle = "#666"; ctx.fillRect(bx - 20, jy + 15, 12, 30);
      ctx.fillStyle = "#888"; ctx.fillRect(bx + 8, jy + 10, 35, 10);
    } else if (wpn.id === "rocket") {
      ctx.fillStyle = "#3a4a3a"; ctx.fillRect(bx - 12, jy, 24, 55);
      ctx.fillStyle = "#556655"; ctx.fillRect(bx - 8, jy - 35, 16, 38);
      ctx.fillStyle = "#884422"; ctx.fillRect(bx + 10, jy + 5, 28, 10);
    }
    ctx.restore();
  }

  function update(dt) {
    if (state !== "playing") return;
    gameTime += dt;
    updatePlayerMovement(dt);
    updateJump(dt);

    if (player.knifeSwing > 0) player.knifeSwing -= dt;
    if (mouseDown && getWeapon().auto && !getWeapon().melee) tryShoot();
    if (shootCooldown > 0) shootCooldown -= dt;
    if (reloadTimer > 0) {
      reloadTimer -= dt;
      if (reloadTimer <= 0) finishReload();
    } else {
      tryAutoReload();
    }
    if (waveBannerTimer > 0) waveBannerTimer -= dt;
    if (player.damageFlash > 0) player.damageFlash -= dt;

    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updatePickups(dt);

    if (player.health <= 0) endGame(false);
    else if (enemies.length === 0) {
      wave++;
      if (wave > 5) endGame(true);
      else spawnWave(wave);
    }
    updateHUD();
  }

  function updateJump(dt) {
    const spaceDown = keys["Space"];
    if (spaceDown && !jumpKeyWasDown && player.onGround) {
      player.jumpVel = JUMP_FORCE;
      player.onGround = false;
      AudioEngine.jump();
    }
    jumpKeyWasDown = spaceDown;

    if (!player.onGround) {
      player.jumpVel -= GRAVITY * dt;
      player.jumpOffset += player.jumpVel * dt;
      if (player.jumpOffset <= 0) {
        player.jumpOffset = 0;
        player.jumpVel = 0;
        player.onGround = true;
      }
    }
  }

  function updatePlayerMovement(dt) {
    const sprint = keys["ShiftLeft"] || keys["ShiftRight"];
    const maxSpeed = sprint ? MOVE_SPEED * SPRINT_MULT : MOVE_SPEED;
    let ax = 0, ay = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) { ax += Math.cos(player.angle); ay += Math.sin(player.angle); }
    if (keys["KeyS"] || keys["ArrowDown"]) { ax -= Math.cos(player.angle); ay -= Math.sin(player.angle); }
    if (keys["KeyA"] || keys["ArrowLeft"]) { ax += Math.sin(player.angle); ay -= Math.cos(player.angle); }
    if (keys["KeyD"] || keys["ArrowRight"]) { ax -= Math.sin(player.angle); ay += Math.cos(player.angle); }

    const len = Math.sqrt(ax * ax + ay * ay);
    if (len > 0) { ax = (ax / len) * maxSpeed; ay = (ay / len) * maxSpeed; }

    const friction = len > 0 ? 12 : 18;
    player.vx += (ax - player.vx) * Math.min(1, friction * dt);
    player.vy += (ay - player.vy) * Math.min(1, friction * dt);

    const nx = player.x + player.vx * dt;
    const ny = player.y + player.vy * dt;
    if (canMove(nx, player.y, PLAYER_RADIUS)) player.x = nx;
    else player.vx = 0;
    if (canMove(player.x, ny, PLAYER_RADIUS)) player.y = ny;
    else player.vy = 0;

    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > 0.5 && player.onGround) {
      footstepTimer -= dt;
      if (footstepTimer <= 0) {
        AudioEngine.footstep();
        footstepTimer = sprint ? 0.28 : 0.4;
      }
    }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (e.hitFlash > 0) e.hitFlash -= dt;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      e.moving = false;

      if (dist > (e.isBoss ? 1.0 : 0.6)) {
        const moveX = (dx / dist) * e.speed * dt;
        const moveY = (dy / dist) * e.speed * dt;
        const rad = e.isBoss ? 0.4 : 0.28;
        if (canMove(e.x + moveX, e.y, rad)) { e.x += moveX; e.moving = true; }
        if (canMove(e.x, e.y + moveY, rad)) { e.y += moveY; e.moving = true; }
      }

      if (e.moving) {
        e.animTimer += dt;
        if (e.animTimer > 0.12) { e.animTimer = 0; e.animFrame = (e.animFrame + 1) % 4; }
      }

      e.attackCooldown -= dt;
      const range = e.isBoss ? 1.8 : e.type === "heavy" ? 1.5 : 1.1;
      const rate = e.isBoss ? 0.9 : e.type === "heavy" ? 1.3 : e.type === "runner" ? 0.6 : 0.85;
      if (dist < range && e.attackCooldown <= 0) {
        e.attackCooldown = rate;
        damagePlayer(e.damage);
      }
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += Math.cos(b.angle) * b.speed * dt;
      b.y += Math.sin(b.angle) * b.speed * dt;
      b.life -= dt;

      let hit = false;
      if (isBlocking(b.x, b.y) || b.life <= 0) hit = true;

      if (!hit) {
        for (const e of enemies) {
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          const hitR = e.isBoss ? 0.55 : e.type === "heavy" ? 0.45 : 0.35;
          if (dx * dx + dy * dy < hitR * hitR) { hit = true; break; }
        }
      }

      if (hit) {
        if (b.explosive) explode(b.x, b.y, b.damage, 2.5);
        else if (b.life > 0) {
          for (const e of enemies) {
            const dx = e.x - b.x;
            const dy = e.y - b.y;
            if (dx * dx + dy * dy < 0.4) damageEnemy(e, b.damage);
          }
        }
        bullets.splice(i, 1);
      }
    }
  }

  function explode(x, y, damage, radius) {
    spawnParticles(x, y, 35, 255, 140, 40);
    AudioEngine.explosion();
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = e.x - x;
      const dy = e.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) damageEnemy(e, Math.floor(damage * (1 - dist / radius)));
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt * 2;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    const eDown = keys["KeyE"];
    if (eDown && !pickupKeyWasDown) tryInteract();
    pickupKeyWasDown = eDown;
    for (const p of pickups) p.bob += dt * 3;
  }

  function tryInteract() {
    if (tryDoor()) return;
    tryPickup();
  }

  function tryDoor() {
    const checks = [
      { x: player.x + Math.cos(player.angle) * 0.9, y: player.y + Math.sin(player.angle) * 0.9 },
      { x: player.x + Math.cos(player.angle) * 1.3, y: player.y + Math.sin(player.angle) * 1.3 },
    ];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const mx = Math.floor(player.x + dx * 0.5);
        const my = Math.floor(player.y + dy * 0.5);
        if (mx >= 0 && my >= 0 && mx < MAP_W && my < MAP_H && MAP[my][mx] === 3) {
          if (player.keys > 0) {
            MAP[my][mx] = 0;
            player.keys--;
            AudioEngine.door();
            showPickupToast("DOOR UNLOCKED");
            updateHUD();
            return true;
          }
          showPickupToast("LOCKED — NEED KEY");
          AudioEngine.locked();
          return true;
        }
      }
    for (const c of checks) {
      const mx = Math.floor(c.x);
      const my = Math.floor(c.y);
      if (mx >= 0 && my >= 0 && mx < MAP_W && my < MAP_H && MAP[my][mx] === 3) {
        if (player.keys > 0) {
          MAP[my][mx] = 0;
          player.keys--;
          AudioEngine.door();
          showPickupToast("DOOR UNLOCKED");
          updateHUD();
          return true;
        }
        showPickupToast("LOCKED — NEED KEY");
        AudioEngine.locked();
        return true;
      }
    }
    return false;
  }

  function tryPickup() {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      if (dx * dx + dy * dy < 1.2) {
        collectPickup(p);
        pickups.splice(i, 1);
        return;
      }
    }
  }

  function collectPickup(p) {
    AudioEngine.pickup();
    if (p.type === "health") {
      player.health = Math.min(player.maxHealth, player.health + 40);
      showPickupToast("+ HEALTH");
    } else if (p.type === "key") {
      player.keys++;
      showPickupToast("+ KEY");
    } else if (p.type === "ammo") {
      for (let i = 0; i < player.weapons.length; i++)
        if (player.weapons[i]) player.weapons[i].reserve += 30;
      showPickupToast("+ AMMO");
    } else {
      const idx = WEAPONS.findIndex((w) => w.id === p.type);
      if (idx >= 0 && player.weapons[idx]) {
        switchWeapon(idx);
        player.weapons[idx].ammo = WEAPONS[idx].magSize;
        player.weapons[idx].reserve += WEAPONS[idx].reserve;
        showPickupToast("+ " + WEAPONS[idx].name);
      }
    }
    updateHUD();
  }

  function spawnParticles(x, y, count, r, g, b) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 4, r, g, b });
    }
  }

  function getEnemyHitRadius(e) {
    if (e.isBoss) return 0.28;
    if (e.type === "heavy") return 0.22;
    if (e.type === "runner") return 0.16;
    return 0.18;
  }

  function damageEnemy(e, amount) {
    e.health -= amount;
    e.hitFlash = 0.15;
    spawnParticles(e.x, e.y, 6, 255, 180, 80);
    AudioEngine.hit();
    showHitMarker();
    if (e.health <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    score += e.isBoss ? 1000 : e.type === "heavy" ? 200 : e.type === "runner" ? 120 : 100;
    spawnParticles(e.x, e.y, e.isBoss ? 40 : 18, 255, 80, 30);
    AudioEngine.kill();
    const idx = enemies.indexOf(e);
    if (idx >= 0) enemies.splice(idx, 1);
    if (Math.random() < (e.isBoss ? 0.8 : 0.25)) {
      pickups.push({ x: e.x, y: e.y, type: e.isBoss ? "rocket" : Math.random() < 0.5 ? "ammo" : "health", bob: 0 });
    }
  }

  function tryMelee() {
    const wpn = getWeapon();
    if (shootCooldown > 0) return;
    shootCooldown = wpn.fireRate;
    player.knifeSwing = 0.3;
    AudioEngine.shoot("knife");

    let hitAny = false;
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > wpn.range) continue;
      let a = Math.atan2(dy, dx) - player.angle;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      if (Math.abs(a) < wpn.spread) {
        damageEnemy(e, wpn.damage);
        hitAny = true;
      }
    }
    if (!hitAny) {
      const wallDist = castRay(player.x, player.y, player.angle).depth;
      if (wallDist < 1.5) spawnParticles(player.x + Math.cos(player.angle) * 0.8, player.y + Math.sin(player.angle) * 0.8, 3, 180, 180, 200);
    }
  }

  function tryShoot() {
    if (player.reloading || shootCooldown > 0) return;
    const wpn = getWeapon();
    if (wpn.melee) { tryMelee(); return; }

    const ws = getWeaponState();
    if (ws.ammo <= 0) {
      tryAutoReload();
      return;
    }

    ws.ammo--;
    shootCooldown = wpn.fireRate;
    AudioEngine.shoot(wpn.id);

    if (!wpn.melee) {
      const flash = document.getElementById("muzzle-flash");
      flash.classList.add("flash");
      setTimeout(() => flash.classList.remove("flash"), wpn.id === "rocket" ? 100 : 40);
    }

    for (let p = 0; p < wpn.pellets; p++) {
      const spread = (Math.random() - 0.5) * wpn.spread * 2;
      const angle = player.angle + spread;
      const hit = raycastHit(angle, wpn.range);
      if (hit) {
        if (wpn.explosive) explode(hit.x, hit.y, wpn.damage, 2.5);
        else damageEnemy(hit, wpn.damage);
      } else {
        bullets.push({
          x: player.x, y: player.y, angle, speed: wpn.explosive ? 20 : 35,
          damage: wpn.damage, life: 1.5, explosive: !!wpn.explosive,
        });
      }
    }

    if (ws.ammo <= 0) tryAutoReload();
  }

  function tryAutoReload() {
    const wpn = getWeapon();
    if (wpn.melee || player.reloading || reloadTimer > 0) return;
    const ws = getWeaponState();
    if (ws.ammo <= 0 && ws.reserve > 0) reload(true);
  }

  function raycastHit(angle, maxRange) {
    let closest = null;
    let closestDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRange) continue;
      let a = Math.atan2(dy, dx) - angle;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      if (Math.abs(a) < getEnemyHitRadius(e) && dist < closestDist) {
        const wallDist = castRay(player.x, player.y, angle).depth;
        if (dist < wallDist) { closest = e; closestDist = dist; }
      }
    }
    return closest;
  }

  function showHitMarker() {
    const hm = document.getElementById("hit-marker");
    hm.classList.add("show");
    setTimeout(() => hm.classList.remove("show"), 100);
  }

  function reload(isAuto) {
    const wpn = getWeapon();
    if (wpn.melee) return;
    const ws = getWeaponState();
    if (player.reloading || ws.ammo === wpn.magSize || ws.reserve <= 0) return;
    player.reloading = true;
    reloadTimer = wpn.reloadTime;
    AudioEngine.reload();
    document.getElementById("reload-hint").classList.remove("hidden");
    document.getElementById("reload-hint").textContent = isAuto ? "AUTO RELOADING…" : "RELOADING…";
  }

  function finishReload() {
    const wpn = getWeapon();
    const ws = getWeaponState();
    const needed = wpn.magSize - ws.ammo;
    const take = Math.min(needed, ws.reserve);
    ws.ammo += take;
    ws.reserve -= take;
    player.reloading = false;
    document.getElementById("reload-hint").classList.add("hidden");
  }

  function switchWeapon(index) {
    if (index < 0 || index >= WEAPONS.length || index === player.weaponIndex) return;
    player.weaponIndex = index;
    player.reloading = false;
    reloadTimer = 0;
    document.getElementById("reload-hint").classList.add("hidden");
    AudioEngine.switchWep();
    syncWeaponSlots();
    updateHUD();
  }

  function damagePlayer(amount) {
    player.health = Math.max(0, player.health - amount);
    player.damageFlash = 0.3;
    AudioEngine.hurt();
    document.getElementById("damage-overlay").classList.add("flash");
    setTimeout(() => document.getElementById("damage-overlay").classList.remove("flash"), 150);
  }

  function updateHUD() {
    const wpn = getWeapon();
    const ws = getWeaponState();
    document.getElementById("score").textContent = score;
    document.getElementById("wave").textContent = wave;
    document.getElementById("enemies-left").textContent = enemies.length;
    document.getElementById("key-count").textContent = player.keys;
    document.getElementById("health-text").textContent = Math.ceil(player.health);
    document.getElementById("health-bar").style.width = (player.health / player.maxHealth * 100) + "%";
    document.getElementById("weapon-name").textContent = wpn.name;

    if (wpn.melee) {
      document.getElementById("ammo-current").textContent = "—";
      document.getElementById("ammo-reserve").textContent = "—";
    } else {
      document.getElementById("ammo-current").textContent = ws.ammo;
      document.getElementById("ammo-reserve").textContent = ws.reserve;
    }
  }

  function endGame(won) {
    state = "gameover";
    document.exitPointerLock();
    mouseLocked = false;
    mouseDown = false;
    clearMoveKeys();
    setMobileControlsVisible(false);
    document.getElementById("game-over-title").textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
    document.getElementById("game-over-title").style.color = won ? "#00ffcc" : "#ff4444";
    document.getElementById("final-score").textContent = "Score: " + score + "  |  Wave: " + wave;
    document.getElementById("game-over-screen").classList.remove("hidden");
  }

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.05);
    lastTime = timestamp;
    if (state === "playing") {
      update(dt);
      render3D();
      renderWeapon(dt);
      renderMinimap();
    }
    requestAnimationFrame(gameLoop);
  }

  function requestGamePointerLock() {
    if (!isMobile) canvas.requestPointerLock();
  }

  function setMobileControlsVisible(show) {
    if (!isMobile) return;
    document.getElementById("mobile-controls").classList.toggle("hidden", !show);
  }

  function clearMoveKeys() {
    keys["KeyW"] = false;
    keys["KeyA"] = false;
    keys["KeyS"] = false;
    keys["KeyD"] = false;
    resetStickKnob();
  }

  function resetStickKnob() {
    const knob = document.getElementById("move-knob");
    if (knob) knob.style.transform = "translate(0px, 0px)";
  }

  function setMoveFromStick(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const dead = 0.25;
    keys["KeyW"] = ny < -dead;
    keys["KeyS"] = ny > dead;
    keys["KeyA"] = nx < -dead;
    keys["KeyD"] = nx > dead;
  }

  function setupMobileControls() {
    if (!isMobile) return;
    document.body.classList.add("mobile");

    const moveStick = document.getElementById("move-stick");
    const moveKnob = document.getElementById("move-knob");
    const aimZone = document.getElementById("aim-zone");
    const fireBtn = document.getElementById("btn-fire");
    const jumpBtn = document.getElementById("btn-jump");
    const sprintBtn = document.getElementById("btn-sprint");
    const reloadBtn = document.getElementById("btn-reload");
    const interactBtn = document.getElementById("btn-interact");
    const wpnPrev = document.getElementById("btn-wpn-prev");
    const wpnNext = document.getElementById("btn-wpn-next");
    const pauseBtn = document.getElementById("btn-pause-mobile");

    function bindHold(btn, code, onTap) {
      const down = (e) => {
        e.preventDefault();
        if (state !== "playing") return;
        keys[code] = true;
        btn.classList.add("active");
      };
      const up = (e) => {
        e.preventDefault();
        keys[code] = false;
        btn.classList.remove("active");
        if (onTap && state === "playing") onTap();
      };
      btn.addEventListener("touchstart", down, { passive: false });
      btn.addEventListener("touchend", up, { passive: false });
      btn.addEventListener("touchcancel", up, { passive: false });
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      btn.addEventListener("mouseleave", up);
    }

    bindHold(jumpBtn, "Space");
    bindHold(sprintBtn, "ShiftLeft");

    reloadBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state === "playing") reload(false);
    }, { passive: false });
    reloadBtn.addEventListener("click", () => { if (state === "playing") reload(false); });

    interactBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state === "playing") tryInteract();
    }, { passive: false });
    interactBtn.addEventListener("click", () => { if (state === "playing") tryInteract(); });

    wpnPrev.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state === "playing") switchWeapon((player.weaponIndex + WEAPONS.length - 1) % WEAPONS.length);
    }, { passive: false });
    wpnPrev.addEventListener("click", () => {
      if (state === "playing") switchWeapon((player.weaponIndex + WEAPONS.length - 1) % WEAPONS.length);
    });

    wpnNext.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state === "playing") switchWeapon((player.weaponIndex + 1) % WEAPONS.length);
    }, { passive: false });
    wpnNext.addEventListener("click", () => {
      if (state === "playing") switchWeapon((player.weaponIndex + 1) % WEAPONS.length);
    });

    pauseBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    }, { passive: false });
    pauseBtn.addEventListener("click", () => {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    });

    const fireDown = (e) => {
      e.preventDefault();
      if (state !== "playing") return;
      mouseDown = true;
      fireBtn.classList.add("active");
      tryShoot();
    };
    const fireUp = (e) => {
      e.preventDefault();
      mouseDown = false;
      fireBtn.classList.remove("active");
    };
    fireBtn.addEventListener("touchstart", fireDown, { passive: false });
    fireBtn.addEventListener("touchend", fireUp, { passive: false });
    fireBtn.addEventListener("touchcancel", fireUp, { passive: false });
    fireBtn.addEventListener("mousedown", fireDown);
    fireBtn.addEventListener("mouseup", fireUp);

    moveStick.addEventListener("touchstart", (e) => {
      if (state !== "playing") return;
      e.preventDefault();
      const t = e.changedTouches[0];
      stickTouchId = t.identifier;
      const rect = moveStick.getBoundingClientRect();
      stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateStick(t.clientX, t.clientY);
    }, { passive: false });

    moveStick.addEventListener("touchmove", (e) => {
      if (state !== "playing") return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === stickTouchId) updateStick(t.clientX, t.clientY);
      }
    }, { passive: false });

    const endStick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === stickTouchId) {
          stickTouchId = null;
          clearMoveKeys();
        }
      }
    };
    moveStick.addEventListener("touchend", endStick, { passive: false });
    moveStick.addEventListener("touchcancel", endStick, { passive: false });

    function updateStick(clientX, clientY) {
      if (!stickCenter) return;
      let dx = clientX - stickCenter.x;
      let dy = clientY - stickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > STICK_RADIUS) {
        dx = (dx / dist) * STICK_RADIUS;
        dy = (dy / dist) * STICK_RADIUS;
      }
      moveKnob.style.transform = "translate(" + dx + "px," + dy + "px)";
      setMoveFromStick(dx, dy);
    }

    aimZone.addEventListener("touchstart", (e) => {
      if (state !== "playing") return;
      if (aimTouchId !== null) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      aimTouchId = t.identifier;
      aimLastX = t.clientX;
    }, { passive: false });

    aimZone.addEventListener("touchmove", (e) => {
      if (state !== "playing") return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === aimTouchId) {
          player.angle += (t.clientX - aimLastX) * MOBILE_AIM_SENS;
          aimLastX = t.clientX;
        }
      }
    }, { passive: false });

    const endAim = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === aimTouchId) aimTouchId = null;
      }
    };
    aimZone.addEventListener("touchend", endAim, { passive: false });
    aimZone.addEventListener("touchcancel", endAim, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (isMobile && state === "playing") e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function startGame() {
    AudioEngine.resume();
    initGame();
    state = "playing";
    lastTime = 0;
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    setMobileControlsVisible(isMobile);
    requestGamePointerLock();
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    mouseDown = false;
    clearMoveKeys();
    keys["ShiftLeft"] = false;
    keys["Space"] = false;
    document.exitPointerLock();
    setMobileControlsVisible(false);
    document.getElementById("pause-screen").classList.remove("hidden");
  }

  function resumeGame() {
    state = "playing";
    document.getElementById("pause-screen").classList.add("hidden");
    setMobileControlsVisible(isMobile);
    requestGamePointerLock();
  }

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("resume-btn").addEventListener("click", resumeGame);
  document.getElementById("restart-btn").addEventListener("click", startGame);
  document.getElementById("retry-btn").addEventListener("click", startGame);

  document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (state === "playing") {
      if (e.code === "KeyR") reload(false);
      if (e.code === "KeyV") switchWeapon(0);
      for (let i = 0; i < 8; i++) {
        if (e.code === "Digit" + (i + 1)) switchWeapon(i);
      }
    }
    if (e.code === "Escape") {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    }
    if (e.code === "Space") e.preventDefault();
  });

  document.addEventListener("keyup", (e) => { keys[e.code] = false; });

  canvas.addEventListener("mousedown", (e) => {
    if (isMobile) return;
    if (state === "playing" && !mouseLocked) requestGamePointerLock();
    if (state === "playing" && e.button === 0) { mouseDown = true; tryShoot(); }
  });
  canvas.addEventListener("mouseup", () => { if (!isMobile) mouseDown = false; });

  document.addEventListener("pointerlockchange", () => {
    mouseLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener("mousemove", (e) => {
    if (isMobile || state !== "playing" || !mouseLocked) return;
    player.angle += e.movementX * MOUSE_SENS;
  });

  setupMobileControls();
  enemySprites = buildEnemySprites();
  pickupSprites = buildPickupSprites();
  audio = AudioEngine;
  requestAnimationFrame(gameLoop);
})();
