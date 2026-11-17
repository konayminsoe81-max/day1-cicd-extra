/**
 * Cyber Arcade: Neon Defender
 * Pure JavaScript HTML5 Canvas Arcade Game
 */
(function() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // DOM Elements
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-high-score');
  const hudWave = document.getElementById('hud-wave');
  const hudLives = document.getElementById('hud-lives');
  const releaseVersion = document.getElementById('release-version');
  const systemStatus = document.getElementById('system-status');
  const buildNumber = document.getElementById('build-number');
  const toggleCrt = document.getElementById('toggle-crt');

  // Touch control elements
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');

  // Default Game Configuration (overridden by game-config.json)
  let CONFIG = {
    game_title: "CYBER ARCADE: NEON DEFENDER",
    version: "v1.0.0",
    difficulty: "medium",
    initial_lives: 3,
    player_speed: 6,
    fire_rate_ms: 180,
    score_multiplier: 10,
    system_status: "Operational"
  };

  // Web Audio Synthesizer (Zero external dependencies)
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playLaser() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    },
    playExplosion() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    },
    playHit() {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }
  };

  // Game State
  const state = {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('cyber_arcade_high') || '0', 10),
    wave: 1,
    lives: 3,
    lastFire: 0,
    keys: { left: false, right: false, fire: false }
  };

  // Particles & Entities
  const stars = [];
  const player = { x: 300, y: 640, width: 34, height: 28, speed: 6 };
  let lasers = [];
  let enemies = [];
  let particles = [];

  // Generate Starfield
  for (let i = 0; i < 75; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() < 0.2 ? 2 : 1,
      color: Math.random() < 0.3 ? '#ff007f' : '#00f3ff'
    });
  }

  // Load configuration and build info
  async function loadConfig() {
    try {
      const res = await fetch('./game-config.json');
      if (res.ok) {
        const data = await res.json();
        CONFIG = Object.assign(CONFIG, data);
        player.speed = CONFIG.player_speed || 6;
        state.lives = CONFIG.initial_lives || 3;
        releaseVersion.textContent = CONFIG.version || 'v1.0.0';
        systemStatus.textContent = CONFIG.system_status || 'Operational';
        if (CONFIG.system_status !== 'Operational') {
          systemStatus.classList.add('degraded');
        }
      }
    } catch (e) {
      console.warn('Failed to load game-config.json, using defaults', e);
    }

    try {
      const res = await fetch('./build-info.json');
      if (res.ok) {
        const buildData = await res.json();
        buildNumber.textContent = buildData.run ? `#${buildData.run}` : 'local';
      }
    } catch (_) {}
  }

  function spawnWave(waveNum) {
    enemies = [];
    const rows = Math.min(2 + Math.floor(waveNum / 2), 5);
    const cols = 7;
    const startX = 60;
    const startY = 60;
    const spacingX = 70;
    const spacingY = 44;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width: 26,
          height: 22,
          type: r % 2 === 0 ? 'drone' : 'scout',
          color: r % 2 === 0 ? '#ff007f' : '#00f3ff',
          hp: 1,
          points: (rows - r) * 10 * (CONFIG.score_multiplier / 10)
        });
      }
    }
  }

  function createExplosion(x, y, color) {
    AudioEngine.playExplosion();
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        color: color
      });
    }
  }

  function fireLaser() {
    const now = Date.now();
    if (now - state.lastFire < (CONFIG.fire_rate_ms || 180)) return;
    state.lastFire = now;
    AudioEngine.init();
    AudioEngine.playLaser();

    lasers.push({
      x: player.x,
      y: player.y - 14,
      width: 4,
      height: 12,
      speed: 9
    });
  }

  function resetGame() {
    state.score = 0;
    state.wave = 1;
    state.lives = CONFIG.initial_lives || 3;
    state.gameOver = false;
    state.running = true;
    player.x = canvas.width / 2;
    lasers = [];
    particles = [];
    spawnWave(state.wave);
    updateHUD();
  }

  function updateHUD() {
    hudScore.textContent = String(state.score).padStart(5, '0');
    hudHighScore.textContent = String(state.highScore).padStart(5, '0');
    hudWave.textContent = String(state.wave).padStart(2, '0');
    hudLives.textContent = '❤️'.repeat(Math.max(0, state.lives)) || '💀';
  }

  // Update loop
  let enemyDirection = 1;
  let enemyStepDownTimer = 0;

  function update() {
    if (!state.running || state.paused || state.gameOver) return;

    // Move Player
    if (state.keys.left && player.x > player.width / 2 + 10) {
      player.x -= player.speed;
    }
    if (state.keys.right && player.x < canvas.width - player.width / 2 - 10) {
      player.x += player.speed;
    }
    if (state.keys.fire) {
      fireLaser();
    }

    // Move Stars
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Move Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].y -= lasers[i].speed;
      if (lasers[i].y < -20) {
        lasers.splice(i, 1);
      }
    }

    // Move Enemies
    let hitWall = false;
    const enemySpeed = 1.0 + state.wave * 0.2;
    enemies.forEach(e => {
      e.x += enemySpeed * enemyDirection;
      if (e.x > canvas.width - 30 || e.x < 30) {
        hitWall = true;
      }
    });

    if (hitWall) {
      enemyDirection *= -1;
      enemies.forEach(e => { e.y += 14; });
    }

    // Laser - Enemy Collisions
    for (let l = lasers.length - 1; l >= 0; l--) {
      const laser = lasers[l];
      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        if (
          laser.x > enemy.x - enemy.width / 2 &&
          laser.x < enemy.x + enemy.width / 2 &&
          laser.y > enemy.y - enemy.height / 2 &&
          laser.y < enemy.y + enemy.height / 2
        ) {
          createExplosion(enemy.x, enemy.y, enemy.color);
          state.score += enemy.points;
          if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('cyber_arcade_high', state.highScore);
          }
          enemies.splice(e, 1);
          lasers.splice(l, 1);
          updateHUD();
          break;
        }
      }
    }

    // Enemy - Player / Bottom Boundary Collisions
    for (let e = enemies.length - 1; e >= 0; e--) {
      const enemy = enemies[e];
      if (enemy.y >= player.y - 15) {
        AudioEngine.playHit();
        state.lives--;
        createExplosion(player.x, player.y, '#00f3ff');
        enemies.splice(e, 1);
        updateHUD();
        if (state.lives <= 0) {
          state.gameOver = true;
          break;
        }
      }
    }

    // Wave cleared
    if (enemies.length === 0) {
      state.wave++;
      spawnWave(state.wave);
      updateHUD();
    }

    // Particles
    for (let p = particles.length - 1; p >= 0; p--) {
      particles[p].x += particles[p].vx;
      particles[p].y += particles[p].vy;
      particles[p].life--;
      if (particles[p].life <= 0) {
        particles.splice(p, 1);
      }
    }
  }

  // Render loop
  function draw() {
    ctx.fillStyle = '#060410';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(star => {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    ctx.shadowBlur = 0;

    // Draw Lasers
    lasers.forEach(laser => {
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
    });
    ctx.shadowBlur = 0;

    // Draw Enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      // Retro pixel invaders
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.height / 2);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      ctx.lineTo(enemy.x, enemy.y + enemy.height / 4);
      ctx.lineTo(enemy.x - enemy.width / 2, enemy.y + enemy.height / 2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Player Ship
    if (state.lives > 0) {
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.height / 2);
      ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
      ctx.lineTo(player.x, player.y + player.height / 4);
      ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit Glow
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(player.x - 2, player.y - 2, 4, 6);
      ctx.shadowBlur = 0;
    }

    // Overlay Screens
    if (!state.running) {
      renderBanner('CYBER ARCADE', 'PRESS [SPACE] OR TAP FIRE TO START', '#00f3ff');
    } else if (state.gameOver) {
      renderBanner('GAME OVER', 'PRESS [R] OR TAP FIRE TO RETRY', '#ff007f');
    } else if (state.paused) {
      renderBanner('PAUSED', 'PRESS [P] TO RESUME', '#ffaa00');
    }
  }

  function renderBanner(title, prompt, color) {
    ctx.fillStyle = 'rgba(6, 4, 16, 0.75)';
    ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 160);

    ctx.font = '900 32px "Orbitron", sans-serif';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(prompt, canvas.width / 2, canvas.height / 2 + 35);
  }

  // Animation Loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Event Listeners
  window.addEventListener('keydown', e => {
    AudioEngine.init();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.running || state.gameOver) {
        resetGame();
      } else {
        state.keys.fire = true;
      }
    }
    if (e.code === 'KeyP' && state.running && !state.gameOver) {
      state.paused = !state.paused;
    }
    if (e.code === 'KeyR') {
      resetGame();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = false;
    if (e.code === 'Space') state.keys.fire = false;
  });

  // Touch Controls
  function bindTouch(element, onDown, onUp) {
    if (!element) return;
    const start = (e) => { e.preventDefault(); AudioEngine.init(); onDown(); };
    const end = (e) => { e.preventDefault(); onUp(); };
    element.addEventListener('touchstart', start, { passive: false });
    element.addEventListener('touchend', end, { passive: false });
    element.addEventListener('mousedown', start);
    element.addEventListener('mouseup', end);
    element.addEventListener('mouseleave', end);
  }

  bindTouch(btnLeft, () => { state.keys.left = true; }, () => { state.keys.left = false; });
  bindTouch(btnRight, () => { state.keys.right = true; }, () => { state.keys.right = false; });
  bindTouch(btnFire, () => {
    if (!state.running || state.gameOver) resetGame();
    else state.keys.fire = true;
  }, () => {
    state.keys.fire = false;
  });

  // CRT Toggle Button
  toggleCrt.addEventListener('click', () => {
    document.body.classList.toggle('crt-off');
    toggleCrt.textContent = document.body.classList.contains('crt-off') ? 'CRT: OFF' : 'CRT: ON';
  });

  // Init
  loadConfig().then(() => {
    updateHUD();
    requestAnimationFrame(loop);
  });
})();
