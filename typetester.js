// --- Split-Screen TypeTester Logic ---

(function() {
    const kbTextEl = document.getElementById('tt-keyboard-text');
    const fnTextEl = document.getElementById('tt-fnkey-text');
    const fnBtn = document.getElementById('tt-virtual-btn');
    const statusEl = document.getElementById('tt-status');
    
    // Safety check
    if (!kbTextEl || !fnTextEl || !fnBtn || !statusEl) return;

    // A more natural, conversational text (better for voice dictation showcase)
    const finalSnippet = `This is a regular text paragraph to demonstrate how much faster it is to speak your thoughts instead of typing them out letter by letter.

You don't have to worry about typos, backspaces, or formatting issues. It just works exactly the way you expect it to. 

So next time you have a complex idea to share, just hold the fn key and dictate it.`;

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
        { w: 2000 } // long wait before reset to show the struggle
    ];

    let kbChars = [];

    function renderKb() {
        let html = '';
        for (let i = 0; i < kbChars.length; i++) {
            const c = kbChars[i];
            const safeChar = c.char.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            if (c.isErr) {
                html += `<span class="tt-error">${safeChar}</span>`;
            } else {
                html += safeChar;
            }
        }
        kbTextEl.innerHTML = html + '<span class="tt-cursor">_</span>';
    }

    function renderFn(str) {
        fnTextEl.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '<span class="tt-cursor" id="tt-fnkey-cursor">_</span>';
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runKeyboardSequence() {
        kbChars = [];
        renderKb();
        await sleep(1000); // initial delay
        
        for (const action of kbSequence) {
            if (action.w) {
                await sleep(action.w);
            }
            if (action.t) {
                for (let i = 0; i < action.t.length; i++) {
                    kbChars.push({ char: action.t[i], isErr: false });
                    renderKb();
                    // Slow, struggling typing
                    await sleep(60 + Math.random() * 150);
                }
            }
            if (action.b) {
                // Highlight chars as errors before deleting
                for (let i = 0; i < action.b; i++) {
                    const idx = kbChars.length - 1 - i;
                    if (idx >= 0) kbChars[idx].isErr = true;
                }
                renderKb();
                await sleep(250); 
                
                // Backspace them
                for (let i = 0; i < action.b; i++) {
                    kbChars.pop();
                    renderKb();
                    await sleep(120 + Math.random() * 80);
                }
            }
        }
    }

    async function runFnKeySequence() {
        renderFn('');
        statusEl.textContent = 'waiting...';
        statusEl.className = 'tt-status';
        fnBtn.classList.remove('pressed');
        
        await sleep(3000); // Wait while the left side struggles
        
        // Hold FN
        fnBtn.classList.add('pressed');
        statusEl.textContent = 'listening (hold)...';
        statusEl.className = 'tt-status listening';
        
        // Speak the natural snippet (approx 5-6 seconds of talking)
        await sleep(5500); 
        
        // Release FN and inject
        fnBtn.classList.remove('pressed');
        statusEl.textContent = 'done (150 wpm)';
        statusEl.className = 'tt-status';
        renderFn(finalSnippet);
        
        // Wait before next loop matches left panel
        await sleep(7000); 
    }

    async function loopLeft() {
        while (true) {
            await runKeyboardSequence();
        }
    }
    
    async function loopRight() {
        while (true) {
            await runFnKeySequence();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('tt-keyboard-text')) {
                loopLeft();
                loopRight();
            }
        });
    } else {
        if (document.getElementById('tt-keyboard-text')) {
            loopLeft();
            loopRight();
        }
    }
})();
