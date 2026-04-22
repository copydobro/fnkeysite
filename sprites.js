/**
 * Sprites Engine for Pixel Game Landing
 * Generates sharp, animated SVGs from pixel arrays.
 */

const PIXEL_SPRITES = {
    zombie: [
        [
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
        ],
        [
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
        ]
    ],
    runner: [
        [
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
        ],
        [
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
        ]
    ],
    sentry: [
        [
            "  #####  ",
            " ####### ",
            " ####### ",
            "  #####  ",
            "   ###   ",
            "  #####  ",
            " ####### ",
            " ####### ",
            "  #####  ",
            "  #####  "
        ],
        [
            "  #####  ",
            " ####### ",
            " ####### ",
            "  #####  ",
            "   ###   ",
            "  #####  ",
            " ####### ",
            " ####### ",
            " ####### ",
            "  #####  "
        ]
    ]
};

class PixelSprite {
    constructor(containerId, charType, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.charType = charType;
        this.frames = PIXEL_SPRITES[charType];
        this.currentFrame = 0;
        this.pixelSize = options.pixelSize || 4;
        this.color = options.color || '#f4c842';
        this.interval = options.interval || 400;
        this.moveSpeed = options.moveSpeed || 0;
        this.isManual = options.isManual || false;
        
        // Physics & Behavior
        this.behavior = options.behavior || 'linear';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.angle = 0;
        this.stateTime = 0;
        this.currentMode = 'drift'; 
        
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.mirrored = false;
        this.yInverted = options.yInverted || false;
        this.timer = null;

        this.init();
    }

    init() {
        this.render();
        if (!this.isManual) {
            this.start();
        }
    }

    setX(val) { this.x = val; this.render(); }
    setY(val) { this.y = val; this.render(); }
    setMirror(bool) { this.mirrored = bool; this.render(); }

    tick() {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        this.updatePhysics();
        this.render();
    }

    updatePhysics() {
        if (this.isManual) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const containerRect = this.container.getBoundingClientRect();
        
        if (this.behavior === 'linear') {
            this.x += this.moveSpeed * 10;
            const limit = this.charType === 'runner' && this.moveSpeed > 2 ? viewportWidth : (this.container.offsetWidth || 400);
            if (this.x > limit) this.x = -64;
        } 
        else if (this.behavior === 'chaotic') {
            this.stateTime++;
            
            // Mode switching every ~5 seconds
            if (this.stateTime % 250 === 0) {
                const modes = ['drift', 'sine', 'bounce', 'teleport', 'orbit'];
                this.currentMode = modes[Math.floor(Math.random() * modes.length)];
                
                // Add a controlled initial "kick"
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;

                if (this.currentMode === 'teleport') {
                    // Teleport into visible card area
                    this.x = (Math.random() - 0.5) * 200;
                    this.y = -Math.random() * 100;
                }
            }

            // Global Resistance (Damping) - prevents runaway speed
            this.vx *= 0.97;
            this.vy *= 0.97;

            // Stronger Responsive Leash - pull back if too far from source
            const dist = Math.sqrt(this.x * this.x + this.y * this.y);
            if (dist > 400) {
                const pullStrength = (dist - 400) * 0.01;
                this.vx -= (this.x / dist) * (0.8 + pullStrength);
                this.vy -= (this.y / dist) * (0.8 + pullStrength);
                
                // Extra friction when out of bounds to slow down the "psycho" run
                this.vx *= 0.9;
                this.vy *= 0.9;
            }

            switch(this.currentMode) {
                case 'drift':
                    this.vx += (Math.random() - 0.5) * 1.5;
                    this.vy += (Math.random() - 0.5) * 1.5;
                    break;
                case 'sine':
                    // Keep it moving but bound to center
                    const targetSineX = Math.sin(this.stateTime * 0.02) * 250;
                    const targetSineY = -150 + Math.cos(this.stateTime * 0.04) * 100;
                    this.vx += (targetSineX - this.x) * 0.05;
                    this.vy += (targetSineY - this.y) * 0.05;
                    break;
                case 'bounce':
                    if (Math.abs(this.vx) < 1) { this.vx = 8; this.vy = -6; }
                    if (Math.abs(this.x) > 350) this.vx *= -1.1; // Bounce with energy
                    if (this.y < -300 || this.y > 0) this.vy *= -1.1;
                    break;
                case 'teleport':
                    // Just stay still for a bit after teleport
                    this.vx *= 0.8; this.vy *= 0.8;
                    break;
                case 'orbit':
                    this.angle += 0.08;
                    const targetX = Math.cos(this.angle) * 120;
                    const targetY = -150 + Math.sin(this.angle) * 80;
                    this.vx += (targetX - this.x) * 0.12;
                    this.vy += (targetY - this.y) * 0.12;
                    break;
            }

            // Hard Velocity Cap
            const maxSpeed = 15;
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > maxSpeed) {
                this.vx = (this.vx / currentSpeed) * maxSpeed;
                this.vy = (this.vy / currentSpeed) * maxSpeed;
            }

            this.x += this.vx;
            this.y += this.vy;
            
            // Keep within visible section but wide enough
            if (Math.abs(this.x) > viewportWidth / 2) this.vx *= -1;
            if (this.y < -600) { this.y = -600; this.vy *= -1; }
            if (this.y > 50) { this.y = 50; this.vy *= -1; }
            
            // Mirroring
            if (this.vx > 0.5) this.mirrored = false;
            if (this.vx < -0.5) this.mirrored = true;
        }
    }

    render() {
        const frame = this.frames[this.currentFrame];
        const height = frame.length;
        const width = Math.max(...frame.map(row => row.length));
        
        let transform = `translate(${this.x}px, ${this.y}px)`;
        if (this.mirrored) transform += ' scaleX(-1)';
        if (this.yInverted) transform += ' scaleY(-1)';

        let svgContent = `<svg width="${width * this.pixelSize}" height="${height * this.pixelSize}" 
            viewBox="0 0 ${width * this.pixelSize} ${height * this.pixelSize}" 
            style="transform: ${transform}; transition: transform 0.05s linear; opacity: ${this.opacity}; position: absolute; left: 0; bottom: 0;"
            xmlns="http://www.w3.org/2000/svg">`;
        
        for (let r = 0; r < frame.length; r++) {
            for (let c = 0; c < frame[r].length; c++) {
                if (frame[r][c] !== ' ') {
                    svgContent += `<rect x="${c * this.pixelSize}" y="${r * this.pixelSize}" width="${this.pixelSize}" height="${this.pixelSize}" fill="${this.color}" />`;
                }
            }
        }
        
        svgContent += `</svg>`;
        this.container.innerHTML = svgContent;
    }

    start() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), this.interval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }
}


// Export
window.PixelSprite = PixelSprite;
