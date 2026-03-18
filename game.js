// --- Typewriter ---

(function() {
    const text = 'Your keyboard is holding you back.';
    const el = document.getElementById('heroTypewriter');
    let i = 0;
    function nextDelay(ch, prevCh) {
        // Pause after punctuation or end of word
        if (ch === '.' || ch === ',' || ch === '!' || ch === '?') return 280 + Math.random() * 120;
        if (ch === ' ') return 100 + Math.random() * 80;
        // Occasional thinking pause (~6% chance)
        if (Math.random() < 0.06) return 320 + Math.random() * 200;
        // Base character delay with some variance
        return 55 + Math.random() * 90;
    }
    function type() {
        if (!el) return;
        if (i < text.length) {
            const ch = text[i];
            const prevCh = i > 0 ? text[i - 1] : '';
            el.textContent += ch;
            i++;
            setTimeout(type, nextDelay(ch, prevCh));
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', type);
    } else {
        type();
    }
})();

// --- Canvas ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;

const DPR = window.devicePixelRatio || 1;
canvas.width  = GAME_WIDTH  * DPR;
canvas.height = GAME_HEIGHT * DPR;
canvas.style.width  = GAME_WIDTH  + 'px';
canvas.style.height = GAME_HEIGHT + 'px';
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
    x: GAME_WIDTH / 2 - 32,
    y: GAME_HEIGHT / 2 - 24,
    w: 64,
    h: 48
};

const state = {
    isFNActive: false,
    lastTime: performance.now(),
    timeAcc: 0,
    zombie: { x: 40, y: GAME_HEIGHT / 2 - 48, frame: 0 },
    runner: { x: GAME_WIDTH / 2 + 60, y: GAME_HEIGHT / 2 - 48, frame: 0 },
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
        state.zombie.x += (dt / 1000) * 16;
        state.zombie.frame = Math.floor(state.timeAcc / 400) % 2;

        if (state.zombie.x > button.x - 48) {
            state.zombie.x = 40;
        }

        if (Math.random() < 0.02) {
            state.particlesZ.push({
                x: state.zombie.x - 20,
                y: state.zombie.y - 20,
                life: 2000,
                maxLife: 2000
            });
        }
        state.runner.frame = 0;
    } else {
        // Right world — fast dictation
        state.runner.x += (dt / 1000) * 400;
        state.runner.frame = Math.floor(state.timeAcc / 50) % 2;

        if (state.runner.x > GAME_WIDTH - 40) {
            state.runner.x = button.x + button.w + 20;
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
        p.y -= (dt / 1000) * 20;
        p.x -= Math.sin(p.life / 200) * 1.0;
        if (p.life <= 0) state.particlesZ.splice(i, 1);
    }

    for (let i = state.runnerTrail.length - 1; i >= 0; i--) {
        const p = state.runnerTrail[i];
        p.life -= dt;
        if (p.life <= 0) state.runnerTrail.splice(i, 1);
    }
}

// --- Draw ---

function drawTextPixels(txt, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText(txt, x, y);
}

function draw() {
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Wave ring on state change
    if (state.waveTimer > 0) {
        const radius = (state.waveTimer / 500) * 300;
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Horizon line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT / 2);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // WPM labels + comparison text below horizon
    const colorTextL = !state.isFNActive ? '#aaa' : '#333';
    const colorTextR =  state.isFNActive ? '#aaa' : '#333';
    const colorRowL  = !state.isFNActive ? '#555' : '#222';
    const colorRowR  =  state.isFNActive ? '#555' : '#222';

    const baseY = GAME_HEIGHT / 2;
    const lx = 80;
    const rx = GAME_WIDTH - 220;

    // WPM numbers
    drawTextPixels('40 WPM',  lx, baseY + 46, colorTextL);
    drawTextPixels('150 WPM', rx, baseY + 46, colorTextR);

    // Headers — same size as WPM (bold 17px)
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillStyle = colorTextL;
    ctx.textAlign = 'left';
    ctx.fillText('⌨ KEYBOARD', lx, baseY + 76);
    ctx.fillStyle = colorTextR;
    ctx.fillText('🎙 FNKEY', rx, baseY + 76);

    // Rows — same size as previous headers (bold 13px)
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    const rows = ['— letter by letter', '— backspace, retype', '— fingers limit you'];
    const rowsR = ['— thought by thought', '— streams as you speak', '— voice sets you free'];
    for (let i = 0; i < 3; i++) {
        const ry = baseY + 100 + i * 22;
        ctx.fillStyle = colorRowL;
        ctx.textAlign = 'left';
        ctx.fillText(rows[i], lx, ry);
        ctx.fillStyle = colorRowR;
        ctx.fillText(rowsR[i], rx, ry);
    }
    ctx.textAlign = 'left';

    const colorL = !state.isFNActive ? '#fff' : '#444';
    const colorR =  state.isFNActive ? '#fff' : '#444';

    // Zombie (left world)
    drawSprite(ctx, animZombie[state.zombie.frame], state.zombie.x, state.zombie.y, colorL, 4);

    for (const p of state.particlesZ) {
        drawSprite(ctx, sprZ, p.x, p.y, colorL, 2);
    }

    // Runner (right world)
    if (state.isFNActive) {
        for (const p of state.runnerTrail) {
            const alpha = Math.max(0, p.life / 100);
            ctx.globalAlpha = alpha;
            drawSprite(ctx, animRunner[p.frame], p.x, p.y, '#666', 4);
            ctx.globalAlpha = 1.0;
        }
    }
    drawSprite(ctx, animRunner[state.runner.frame], state.runner.x, state.runner.y, colorR, 4);

    if (state.isFNActive) {
        drawTextPixels('DONE', state.runner.x + 50, state.runner.y + 20, '#fff');
    }

    // Hint above button
    ctx.fillStyle = '#777';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JUST HOLD', GAME_WIDTH / 2, button.y - 32);
    ctx.fillStyle = '#555';
    ctx.fillText('[ SPACE ]', GAME_WIDTH / 2, button.y - 18);
    ctx.fillText('or click \u2193', GAME_WIDTH / 2, button.y - 5);
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
    const innerW = bw - 12;
    const innerH = bh - 16;
    const innerX = bx + 6;
    const innerY = state.isFNActive ? by + 8 : by + 2;

    ctx.fillStyle = '#aaa';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // FN label
    ctx.fillStyle = '#111';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FN', innerX + innerW / 2, innerY + innerH / 2 + 6);
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
