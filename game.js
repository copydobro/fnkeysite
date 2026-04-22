// --- Generalized Typewriter Engine ---

(function () {
    class HeaderTypewriter {
        constructor(el) {
            this.el = el;
            this.text = el.getAttribute('data-text') || '';
            this.i = 0;
            this.isRevealed = false;
            this.isErasing = false;
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.isRevealed) {
                        this.isRevealed = true;
                        this.type();
                        observer.unobserve(this.el); // "Fix the time" until reload
                    }
                });
            }, { threshold: 0.9 });
            observer.observe(this.el);
        }

        getDelay(ch) {
            if (ch === '.' || ch === ',' || ch === '!' || ch === '?' || ch === '$') return 150 + Math.random() * 100;
            if (ch === ' ') return 40 + Math.random() * 40;
            return 20 + Math.random() * 30;
        }

        type() {
            if (this.i < this.text.length) {
                const ch = this.text[this.i];
                this.el.textContent += ch;
                this.i++;
                setTimeout(() => this.type(), this.getDelay(ch));
            } else {
                // Pause at the end, then erase once to match the effect, then type and stay
                setTimeout(() => this.erase(), 5000);
            }
        }

        erase() {
            if (this.i > 0) {
                this.i--;
                this.el.textContent = this.text.substring(0, this.i);
                setTimeout(() => this.erase(), 15);
            } else {
                // Final re-type and stay fixed
                setTimeout(() => this.typeFinal(), 500);
            }
        }

        typeFinal() {
            if (this.i < this.text.length) {
                const ch = this.text[this.i];
                this.el.textContent += ch;
                this.i++;
                setTimeout(() => this.typeFinal(), this.getDelay(ch));
            }
            // No loop after this to keep the page stable once revealed
        }
    }

    function initTypewriters() {
        document.querySelectorAll('.typewriter-header').forEach(el => {
            new HeaderTypewriter(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTypewriters);
    } else {
        initTypewriters();
    }
})();

// --- Canvas ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 500;

const DPR = window.devicePixelRatio || 1;
canvas.width = GAME_WIDTH * DPR;
canvas.height = GAME_HEIGHT * DPR;
ctx.scale(DPR, DPR);
ctx.imageSmoothingEnabled = false;


// --- Sprites ---

const sprZombie1 = [
    "  ##### ",
    " #######",
    " #######",
    "  ##### ",
    "   ##   ",
    "  ####  ",
    " ## ## ##",
    " ## ##  ",
    "   #### ",
    "   #  # ",
    "  ##  ##",
    " ##   ##"
];

const sprZombie2 = [
    "  ##### ",
    " #######",
    " #######",
    "  ##### ",
    "   ##   ",
    "  ####  ",
    " ## ## ##",
    " ## ##  ",
    "   #### ",
    "    ##  ",
    "   ###  ",
    "   ## ##"
];

const sprRunner1 = [
    "   ##### ",
    "  #######",
    "  #######",
    "   ##### ",
    "    ## ##",
    "   ####  ",
    "  ## ##  ",
    " ##  ##  ",
    "     # # ",
    "    ## ##",
    "   ##   #"
];

const sprRunner2 = [
    "   ##### ",
    "  #######",
    "  #######",
    "   ##### ",
    "   ### ##",
    "  ####   ",
    " ## ##  #",
    " #  ##   ",
    "         ",
    "   ## ## ",
    "  ##   ##"
];

const animZombie = [sprZombie1, sprZombie2];
const animRunner = [sprRunner1, sprRunner2];

const sprZ = [
    "####",
    "   #",
    "  # ",
    " #  ",
    "####"
];

function drawSprite(ctx, sprite, x, y, color, scale) {
    if (!sprite) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = color;
    for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
            if (sprite[r][c] !== ' ') {
                ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
            }
        }
    }
}

// --- Game state ---

const button = {
    x: GAME_WIDTH / 2 - 64,
    y: GAME_HEIGHT / 2 - 48,
    w: 128,
    h: 96
};

const state = {
    isFNActive: false,
    lastTime: performance.now(),
    timeAcc: 0,
    zombie: { x: 80, y: GAME_HEIGHT / 2 - 96, frame: 0 },
    runner: { x: GAME_WIDTH / 2 + 120, y: GAME_HEIGHT / 2 - 96, frame: 0 },
    particlesZ: [],
    runnerTrail: [],
    waveTimer: 0
};

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        // Делим на DPR, так как внутренние координаты холста отскейлены через ctx.scale(DPR, DPR)
        x: ((e.clientX - rect.left) * scaleX) / DPR,
        y: ((e.clientY - rect.top) * scaleY) / DPR
    };
}

function isOverButton(x, y) {
    return x >= button.x && x <= button.x + button.w &&
        y >= button.y && y <= button.y + button.h;
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getCanvasPos(e);
    if (isOverButton(pos.x, pos.y)) {
        state.isFNActive = true;
        state.waveTimer = 1;
    }
});

// Space bar hold — mirrors the FN button mechanic
document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (e.repeat) return;
    if (!state.isFNActive) {
        state.isFNActive = true;
        state.waveTimer = 1;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    if (state.isFNActive) {
        state.isFNActive = false;
        state.waveTimer = 1;
    }
});

canvas.addEventListener('mouseup', () => {
    if (state.isFNActive) {
        state.isFNActive = false;
        state.waveTimer = 1;
    }
});

canvas.addEventListener('mouseleave', () => {
    if (state.isFNActive) {
        state.isFNActive = false;
        state.waveTimer = 1;
    }
});

// --- Update ---

function update(dt) {
    state.timeAcc += dt;

    if (state.waveTimer > 0) {
        state.waveTimer += dt;
        if (state.waveTimer > 500) state.waveTimer = 0;
    }

    if (!state.isFNActive) {
        // Left world — slow typing
        state.zombie.x += (dt / 1000) * 32;
        state.zombie.frame = Math.floor(state.timeAcc / 400) % 2;

        if (state.zombie.x > button.x - 96) {
            state.zombie.x = 80;
        }

        if (Math.random() < 0.02) {
            state.particlesZ.push({
                x: state.zombie.x - 40,
                y: state.zombie.y - 40,
                life: 2000,
                maxLife: 2000
            });
        }
        state.runner.frame = 0;
    } else {
        // Right world — fast dictation
        state.runner.x += (dt / 1000) * 800;
        state.runner.frame = Math.floor(state.timeAcc / 50) % 2;

        if (state.runner.x > GAME_WIDTH - 80) {
            state.runner.x = button.x + button.w + 40;
        }

        state.runnerTrail.push({
            x: state.runner.x,
            y: state.runner.y,
            frame: state.runner.frame,
            life: 100
        });
        state.zombie.frame = 0;
    }

    // Particles
    for (let i = state.particlesZ.length - 1; i >= 0; i--) {
        const p = state.particlesZ[i];
        p.life -= dt;
        p.y -= (dt / 1000) * 40;
        p.x -= Math.sin(p.life / 200) * 2.0;
        if (p.life <= 0) state.particlesZ.splice(i, 1);
    }

    for (let i = state.runnerTrail.length - 1; i >= 0; i--) {
        const p = state.runnerTrail[i];
        p.life -= dt;
        if (p.life <= 0) state.runnerTrail.splice(i, 1);
    }
}

// --- Draw ---

function drawTextPixels(txt, x, y, color, size = 28) {
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px "JetBrains Mono", monospace`;
    ctx.fillText(txt, x, y);
    ctx.imageSmoothingEnabled = false;
}

function draw() {
    // Background matches page theme
    ctx.fillStyle = '#0d0c0b';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Wave ring on state change
    if (state.waveTimer > 0) {
        const radius = (state.waveTimer / 500) * 600;
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Horizon line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT / 2);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // WPM labels + comparison text below horizon
    const colorTextL = !state.isFNActive ? '#aaa' : '#333';
    const colorTextR = state.isFNActive ? '#aaa' : '#333';
    const colorRowL = !state.isFNActive ? '#555' : '#222';
    const colorRowR = state.isFNActive ? '#555' : '#222';

    const baseY = GAME_HEIGHT / 2;
    const lx = 160;
    const rx = GAME_WIDTH - 440;

    const lang = window.currentLang || 'en';
    const t = translations && translations[lang] ? translations[lang] : translations['en'];

    // WPM numbers
    drawTextPixels('40 wpm', lx, baseY + 70, colorTextL, 28);
    drawTextPixels('150 wpm', rx, baseY + 70, colorTextR, 28);

    // Headers — (bold 28px)
    drawTextPixels(t['game_kb'] || '⌨ keyboard', lx, baseY + 115, colorTextL, 28);
    drawTextPixels(t['game_fn'] || '🎙 fnkey', rx, baseY + 115, colorTextR, 28);

    // Rows — (bold 22px)
    const rows = [t['game_l1'] || '— letter by letter', t['game_l2'] || '— backspace, retype', t['game_l3'] || '— fingers limit you'];
    const rowsR = [t['game_r1'] || '— thought by thought', t['game_r2'] || '— streams as you speak', t['game_r3'] || '— voice sets you free'];
    for (let i = 0; i < 3; i++) {
        const ry = baseY + 155 + i * 35;
        drawTextPixels(rows[i], lx, ry, colorRowL, 22);
        drawTextPixels(rowsR[i], rx, ry, colorRowR, 22);
    }

    const colorL = !state.isFNActive ? '#fff' : '#444';
    const colorR = state.isFNActive ? '#fff' : '#444';

    // Zombie (left world)
    drawSprite(ctx, animZombie[state.zombie.frame], state.zombie.x, state.zombie.y, colorL, 8);

    for (const p of state.particlesZ) {
        drawSprite(ctx, sprZ, p.x, p.y, colorL, 4);
    }

    // Runner (right world)
    if (state.isFNActive) {
        for (const p of state.runnerTrail) {
            const alpha = Math.max(0, p.life / 100);
            ctx.globalAlpha = alpha;
            drawSprite(ctx, animRunner[p.frame], p.x, p.y, '#666', 8);
            ctx.globalAlpha = 1.0;
        }
    }
    drawSprite(ctx, animRunner[state.runner.frame], state.runner.x, state.runner.y, colorR, 8);

    if (state.isFNActive) {
        drawTextPixels(t['game_done'] || 'done', state.runner.x + 100, state.runner.y + 40, '#fff', 22);
    }

    // Hint above button
    ctx.fillStyle = '#777';
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t['game_just_hold'] || 'just hold', GAME_WIDTH / 2, button.y - 64);
    ctx.fillStyle = '#555';
    ctx.fillText(t['game_space'] || '[ space ]', GAME_WIDTH / 2, button.y - 36);
    ctx.fillText(t['game_or_click'] || 'or click \u2193', GAME_WIDTH / 2, button.y - 10);
    ctx.textAlign = 'left';

    // FN button — keycap style (dark base + light inner square)
    const bx = button.x;
    const by = button.y;
    const bw = button.w;
    const bh = button.h;

    // Dark base (shadow/body)
    ctx.fillStyle = '#444';
    ctx.fillRect(bx, by, bw, bh);

    // Light inner square (shifts on press)
    const innerW = bw - 24;
    const innerH = bh - 32;
    const innerX = bx + 12;
    const innerY = state.isFNActive ? by + 16 : by + 4;

    ctx.fillStyle = '#aaa';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // FN label
    ctx.fillStyle = '#111';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('fn', innerX + innerW / 2, innerY + innerH / 2 + 12);
    ctx.textAlign = 'left';
}

// --- Game loop ---

function gameLoop(timestamp) {
    let dt = timestamp - state.lastTime;
    if (dt > 100) dt = 100;
    state.lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
