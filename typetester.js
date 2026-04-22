// --- Split-Screen TypeTester Logic ---

(function() {
    const kbTextEl = document.getElementById('tt-keyboard-text');
    const fnTextEl = document.getElementById('tt-fnkey-text');
    const fnBtn = document.getElementById('tt-virtual-btn');
    const statusEl = document.getElementById('tt-status');
    
    // Safety check
    if (!kbTextEl || !fnTextEl || !fnBtn || !statusEl) return;

    // A more natural, conversational text (better for voice dictation showcase)
    const finalSnippet = `This is a regular text paragraph to demonstrate how much faster it is to speak your thoughts instead of typing them out letter by letter. \n\nYou don't have to worry about typos, backspaces, or formatting issues. It just works exactly the way you expect it to. \n\nSo next time you have a complex idea to share, just hold the fn key and dictate it.`;

    // Keyboard sequence simulating struggle with English text
    const kbSequence = [
        { t: 'This is a redul', err: true },
        { w: 300 },
        { b: 4 }, // backspace "edul"
        { t: 'gular text para', err: true },
        { w: 400 },
        { b: 3 }, // backspace "ara"
        { t: 'agraph to demoo', err: true },
        { w: 200 },
        { b: 1 }, // backspace "o"
        { t: 'nstrat how much fasted r', err: true },
        { w: 500 },
        { b: 4 }, // "ed r" -> "er "
        { t: 'r it is to spek', err: true },
        { w: 300 },
        { b: 2 }, // "ek" -> "ea"
        { t: 'eak your thoughts instead of typign it t', err: true },
        { w: 400 },
        { b: 6 }, // "ign it t" -> "ing them "
        { t: 'ing them out leter', err: true },
        { w: 300 },
        { b: 3 }, // "ter" -> "tter"
        { t: 'tter by letter.\n\nYou odnt', err: true },
        { w: 400 },
        { b: 4 }, // "odnt"
        { t: 'don\'t have to worry abaout', err: true },
        { w: 300 },
        { b: 4 }, // "aout" -> "out"
        { t: 'out typs', err: true },
        { w: 400 },
        { b: 1 }, // "s"
        { t: 'os, bacsl', err: true },
        { w: 300 },
        { b: 2 }, // "sl"
        { t: 'kspaces, or fofm', err: true },
        { w: 400 },
        { b: 2 }, // "fm"
        { t: 'rmattin', err: true },
        { w: 2000 } // long wait before reset
    ];

    let kbChars = [];
    let kbSprite = null;
    let fnSprite = null;

    function renderKb() {
        let html = '';
        for (let i = 0; i < kbChars.length; i++) {
            const c = kbChars[i];
            const safeChar = c.char.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');
            if (c.isErr) {
                html += `<span class="tt-error">${safeChar}</span>`;
            } else {
                html += safeChar;
            }
        }
        kbTextEl.innerHTML = html + '<span class="tt-cursor">_</span>';
        
        // SYNC: Update zombie position
        if (kbSprite) {
            const containerWidth = kbSprite.container.offsetWidth || 400;
            const maxChars = 200;
            const progress = Math.min(kbChars.length / maxChars, 1);
            kbSprite.setX(progress * (containerWidth - 40));
            kbSprite.tick();
        }
    }

    function renderFn(str) {
        fnTextEl.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>') + '<span class="tt-cursor" id="tt-fnkey-cursor">_</span>';
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runKeyboardSequence() {
        kbChars = [];
        if (kbSprite) {
            kbSprite.setX(0);
            kbSprite.setMirror(false);
        }
        renderKb();
        await sleep(1000);
        
        for (const action of kbSequence) {
            if (action.w) await sleep(action.w);
            if (action.t) {
                if (kbSprite) kbSprite.setMirror(false);
                for (let i = 0; i < action.t.length; i++) {
                    kbChars.push({ char: action.t[i], isErr: false });
                    renderKb();
                    await sleep(60 + Math.random() * 150);
                }
            }
            if (action.b) {
                if (kbSprite) kbSprite.setMirror(true);
                for (let i = 0; i < action.b; i++) {
                    const idx = kbChars.length - 1 - i;
                    if (idx >= 0) kbChars[idx].isErr = true;
                }
                renderKb();
                await sleep(250); 
                for (let i = 0; i < action.b; i++) {
                    kbChars.pop();
                    renderKb();
                    await sleep(120 + Math.random() * 80);
                }
            }
        }
    }

    async function runFnKeySequence() {
        const lang = window.currentLang || 'en';
        const t = translations && translations[lang] ? translations[lang] : translations['en'];

        renderFn('');
        if (fnSprite) fnSprite.setX(0);
        statusEl.textContent = t['tt-status'] || 'waiting...';
        statusEl.className = 'tt-status';
        fnBtn.classList.remove('pressed');
        
        await sleep(3000);
        
        fnBtn.classList.add('pressed');
        statusEl.textContent = t['tt-listening'] || 'listening (hold)...';
        statusEl.className = 'tt-status listening';
        
        if (fnSprite) {
            const start = Date.now();
            const duration = 5500;
            const containerWidth = fnSprite.container.offsetWidth || 400;
            const sprintInterval = setInterval(() => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                fnSprite.setX(progress * (containerWidth - 40));
                fnSprite.tick();
                if (progress >= 1) clearInterval(sprintInterval);
            }, 100);
        }

        await sleep(5500); 
        
        fnBtn.classList.remove('pressed');
        statusEl.textContent = t['tt-done'] || 'done (150 wpm)';
        statusEl.className = 'tt-status';
        
        renderFn(finalSnippet);
        await sleep(7000); 
    }

    function initAll() {
        if (!document.getElementById('tt-keyboard-text')) return;

        // Initialize How-it-works Sprites
        kbSprite = new PixelSprite('sprite-keyboard-container', 'zombie', { 
            pixelSize: 4, 
            color: '#444', 
            isManual: true
        });
        fnSprite = new PixelSprite('sprite-fnkey-container', 'runner', { 
            pixelSize: 4, 
            color: '#f4c842', 
            isManual: true
        });

        // --- The Boundary Breakers Narrative ---

        // 1. TRUST: The Shadow Guard (Visible only under spotlight)
        const trustSprite = new PixelSprite('sprite-pillar-trust', 'sentry', {
            pixelSize: 3, color: '#888', isManual: true, opacity: 0
        });
        
        // Spotlight tracking for Trust
        document.addEventListener('mousemove', (e) => {
            const rect = document.getElementById('sprite-pillar-trust').getBoundingClientRect();
            const spriteX = rect.left + rect.width / 2;
            const spriteY = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - spriteX, e.clientY - spriteY);
            
            // Becomes visible when spotlight (approx 150px radius) is near
            let opacity = 0;
            if (dist < 180) opacity = Math.max(0, 1 - (dist / 180));
            trustSprite.opacity = opacity;
            trustSprite.tick(); // Force re-render with new opacity
        });

        // 2. SPEED: The Warp Runner (Exceeds boundaries)
        const speedSprite = new PixelSprite('sprite-pillar-speed', 'runner', {
            pixelSize: 4, color: '#444', interval: 25, moveSpeed: 2
        });

        // 3. FREEDOM: The Gravity Rebel (Chaos Engine)
        const freedomSprite = new PixelSprite('sprite-pillar-freedom', 'runner', {
            pixelSize: 3, color: '#444', interval: 50, behavior: 'chaotic'
        });

        // Dynamic Color Switching for Speed and Freedom
        const pillarCards = document.querySelectorAll('.pillar-card');
        if (pillarCards.length >= 3) {
            // Speed Hover
            pillarCards[0].addEventListener('mouseenter', () => { speedSprite.color = '#f4c842'; });
            pillarCards[0].addEventListener('mouseleave', () => { speedSprite.color = '#444'; });
            
            // Freedom Hover
            pillarCards[2].addEventListener('mouseenter', () => { freedomSprite.color = '#fff'; });
            pillarCards[2].addEventListener('mouseleave', () => { freedomSprite.color = '#444'; });
        }

        const loopLeft = async () => { while(true) await runKeyboardSequence(); };
        const loopRight = async () => { while(true) await runFnKeySequence(); };
        
        loopLeft();
        loopRight();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
