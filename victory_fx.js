/**
 * Boss Victory Animation Engine
 * Triggers a classic NES-style celebratory sequence.
 */

class VictoryFX {
    constructor() {
        this.button = document.querySelector('.cta-button');
        this.container = document.getElementById('victory-overlay');
        this.flashOverlay = document.createElement('div');
        this.flashOverlay.className = 'screen-flash';
        document.body.appendChild(this.flashOverlay);
        
        this.particles = [];
        this.isAnimating = false;

        if (this.button) {
            this.init();
        }
    }

    init() {
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isAnimating) return;
            this.startSequence();
        });
    }

    startSequence() {
        this.isAnimating = true;

        // 1. Shake Phase - longer more noticeable shake
        this.button.classList.add('victory-shaking');

        setTimeout(() => {
            // 2. Explosion Phase
            this.button.classList.remove('victory-shaking');
            this.button.style.opacity = '0';
            this.button.style.pointerEvents = 'none';

            this.triggerFlash();
            this.spawnParticles();
            this.showBanner();
            
            // Add blur to backdrop
            this.container.classList.add('banner-active');
            
            this.animateParticles();

            // 3. Reset Phase
            setTimeout(() => {
                this.reset();
            }, 5000);
        }, 1200); // 1.2s shake
    }

    triggerFlash() {
        this.flashOverlay.classList.add('flash-active');
        setTimeout(() => {
            this.flashOverlay.classList.remove('flash-active');
        }, 400);
    }

    spawnParticles() {
        const rect = this.button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Spawn shard particles
        for (let i = 0; i < 40; i++) {
            this.createParticle(centerX, centerY, 'pixel-particle');
        }

        // Spawn star particles
        for (let i = 0; i < 15; i++) {
            this.createParticle(centerX, centerY, 'pixel-star');
        }
    }

    createParticle(x, y, className) {
        const el = document.createElement('div');
        el.className = className;
        
        // Random colors for shards (yellow variants)
        if (className === 'pixel-particle') {
            const colors = ['#f4c842', '#fff', '#c4a434'];
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }

        this.container.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 15;

        this.particles.push({
            el: el,
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 5, // Upward bias
            gravity: 0.5,
            rotation: 0,
            vr: (Math.random() - 0.5) * 20,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02
        });
    }

    animateParticles() {
        if (!this.isAnimating) return;

        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.vr;
            p.life -= p.decay;

            p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.life})`;
            p.el.style.opacity = p.life;

            if (p.life <= 0) {
                p.el.remove();
                this.particles.splice(index, 1);
            }
        });

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animateParticles());
        }
    }

    showBanner() {
        if (this.victoryBanner) this.victoryBanner.remove();

        const banner = document.createElement('div');
        banner.className = 'victory-banner banner-appear banner-glitch';
        banner.innerHTML = `
            <div style="margin-bottom: 10px;">BOSS DEFEATED</div>
            <div style="font-size: 14px; color: #fff;">CEILING BROKEN!</div>
        `;
        
        // Append to overlay instead of body to ensure it's in the fixed layer
        this.container.appendChild(banner);
        this.victoryBanner = banner;
    }

    reset() {
        this.isAnimating = false;
        this.button.style.opacity = '1';
        this.button.style.pointerEvents = 'auto';
        this.container.classList.remove('banner-active');
        
        if (this.victoryBanner) {
            this.victoryBanner.remove();
        }
        
        // Clear remaining particles
        this.particles.forEach(p => p.el.remove());
        this.particles = [];
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VictoryFX());
} else {
    new VictoryFX();
}
