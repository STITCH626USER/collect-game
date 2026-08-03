const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg?v=4', desc: 'Détruit la carte de votre choix chez un adversaire.' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg?v=4', desc: 'Joker. S\'annule et se défausse si vous en posez un 2ème.' },
    { id: 'monkey', name: 'Singe', img: 'assets/card_monkey.jpg?v=4', desc: 'Échange votre Singe avec la carte d\'un adversaire.' },
    { id: 'crab', name: 'Crabe', img: 'assets/card_crab.jpg?v=4', desc: 'Déplace une carte de sa ligne ou d\'un adversaire (gauche/droite).' },
    { id: 'hermit_crab', name: 'Bernard l\'hermite', img: 'assets/card_hermit_crab.jpg?v=6', desc: 'Rejouez un tour si vous avez déjà un Crabe.' },
    { id: 'octopus', name: 'Pieuvre', img: 'assets/card_octopus.jpg?v=4', desc: 'Gagnez si vous avez 2 paires d\'animaux (4 cartes).' },
    { id: 'lion', name: 'Lion', img: 'assets/card_lion.jpg?v=4', desc: 'Gagnez si vous avez 1 exemplaire de chaque autre animal.' },
    { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg?v=4', desc: 'Devinez votre pioche pour la conserver.' }
];

// --- SOUND SYNTHESIZER ENGINE ---
const soundEngine = {
    audioCtx: null,
    isMuted: localStorage.getItem('collect_sound_muted') === 'true',

    toggleMute: () => {
        soundEngine.isMuted = !soundEngine.isMuted;
        localStorage.setItem('collect_sound_muted', soundEngine.isMuted);
        soundEngine.updateSpeakerBtn();
    },

    updateSpeakerBtn: () => {
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) {
            btn.innerText = soundEngine.isMuted ? '🔇' : '🔊';
            btn.title = soundEngine.isMuted ? 'Activer le son' : 'Couper le son';
        }
    },

    getAudioContext: () => {
        if (soundEngine.isMuted) return null;
        if (!soundEngine.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            soundEngine.audioCtx = new AudioContext();
        }
        if (soundEngine.audioCtx.state === 'suspended') {
            soundEngine.audioCtx.resume();
        }
        return soundEngine.audioCtx;
    },

    playIntroSound: () => {
        if (soundEngine.isMuted) return;
        try {
            const ctx = soundEngine.getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // 1. Lush Orchestral Pad Swell (C Major 9 chord)
            const padFrequencies = [130.81, 196.00, 261.63, 329.63, 392.00, 587.33];
            padFrequencies.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 1.6);
            });

            // 2. Crystal Marimba Fanfare Arpeggio (C5 - E5 - G5 - C6)
            const chimeNotes = [523.25, 659.25, 783.99, 1046.50];
            chimeNotes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const delay = idx * 0.14;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + delay);

                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.9);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.9);
            });
        } catch(e){}
    },

    playDiceSound: () => {
        if (soundEngine.isMuted) return;
        try {
            const ctx = soundEngine.getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            [0, 0.05, 0.11, 0.18, 0.26].forEach((delay, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(800 - idx * 80, now + delay);
                osc.frequency.exponentialRampToValueAtTime(150, now + delay + 0.04);

                gain.gain.setValueAtTime(0.3, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.04);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.04);
            });
        } catch(e){}
    },

    playAnimalSound: (animalId) => {
        if (soundEngine.isMuted) return;
        try {
            const ctx = soundEngine.getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (animalId === 'lion') {
                // 🦁 Majestic Lion Roar (Dual detuned predator vocal growl + throat formant filters)
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                const mainGain = ctx.createGain();
                
                const filter1 = ctx.createBiquadFilter();
                const filter2 = ctx.createBiquadFilter();

                osc1.type = 'sawtooth';
                osc2.type = 'triangle';
                osc1.frequency.setValueAtTime(140, now);
                osc2.frequency.setValueAtTime(144, now);

                osc1.frequency.exponentialRampToValueAtTime(80, now + 0.5);
                osc2.frequency.exponentialRampToValueAtTime(82, now + 0.5);
                osc1.frequency.linearRampToValueAtTime(110, now + 1.0);
                osc2.frequency.linearRampToValueAtTime(113, now + 1.0);
                osc1.frequency.exponentialRampToValueAtTime(50, now + 1.8);
                osc2.frequency.exponentialRampToValueAtTime(52, now + 1.8);

                lfo.frequency.setValueAtTime(22, now);
                lfoGain.gain.setValueAtTime(0.35, now);
                lfo.connect(mainGain.gain);

                filter1.type = 'bandpass';
                filter1.frequency.setValueAtTime(320, now);
                filter1.Q.setValueAtTime(3.0, now);
                filter1.frequency.exponentialRampToValueAtTime(650, now + 0.6);
                filter1.frequency.exponentialRampToValueAtTime(250, now + 1.8);

                filter2.type = 'lowpass';
                filter2.frequency.setValueAtTime(800, now);
                filter2.frequency.exponentialRampToValueAtTime(400, now + 1.8);

                mainGain.gain.setValueAtTime(0.01, now);
                mainGain.gain.linearRampToValueAtTime(0.5, now + 0.3);
                mainGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

                osc1.connect(filter1);
                osc2.connect(filter1);
                filter1.connect(filter2);
                filter2.connect(mainGain);
                mainGain.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                lfo.start(now);

                osc1.stop(now + 1.8);
                osc2.stop(now + 1.8);
                lfo.stop(now + 1.8);
            }
            else if (animalId === 'crocodile') {
                // 🐊 Crocodile: Heavy predator jaw crunch with low sub-bass & bone crackle
                [0, 0.11].forEach((delay, idx) => {
                    const subOsc = ctx.createOscillator();
                    const subGain = ctx.createGain();
                    subOsc.type = 'sawtooth';
                    subOsc.frequency.setValueAtTime(280 - idx * 60, now + delay);
                    subOsc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.18);

                    subGain.gain.setValueAtTime(0.7, now + delay);
                    subGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

                    const lowpass = ctx.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.setValueAtTime(500, now + delay);

                    subOsc.connect(lowpass);
                    lowpass.connect(subGain);
                    subGain.connect(ctx.destination);
                    
                    subOsc.start(now + delay);
                    subOsc.stop(now + delay + 0.18);

                    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
                    }

                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;

                    const noiseFilter = ctx.createBiquadFilter();
                    noiseFilter.type = 'bandpass';
                    noiseFilter.frequency.setValueAtTime(800, now + delay);
                    noiseFilter.Q.setValueAtTime(1.5, now + delay);

                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.5, now + delay);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

                    noise.connect(noiseFilter);
                    noiseFilter.connect(noiseGain);
                    noiseGain.connect(ctx.destination);

                    noise.start(now + delay);
                    noise.stop(now + delay + 0.12);
                });
            }
            else if (animalId === 'monkey') {
                // 🐒 Singe: High-pitched double screech chatter
                [0, 0.18, 0.36].forEach((delay, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const baseFreq = 850 + idx * 150;
                    osc.frequency.setValueAtTime(baseFreq, now + delay);
                    osc.frequency.linearRampToValueAtTime(baseFreq + 400, now + delay + 0.08);
                    osc.frequency.linearRampToValueAtTime(baseFreq - 100, now + delay + 0.15);

                    gain.gain.setValueAtTime(0, now + delay);
                    gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.15);
                });
            }
            else if (animalId === 'crab') {
                // 🦀 Crabe: 3 rapid crisp pincer snaps (Cliquetis de pinces aigu & métallique)
                [0, 0.07, 0.14].forEach((delay, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();
                    
                    osc.type = 'triangle';
                    const startFreq = 1800 + i * 200;
                    osc.frequency.setValueAtTime(startFreq, now + delay);
                    osc.frequency.exponentialRampToValueAtTime(400, now + delay + 0.04);

                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(1200, now + delay);

                    gain.gain.setValueAtTime(0.5, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.04);
                });
            }
            else if (animalId === 'hermit_crab') {
                // 🐚 Bernard l'Hermite: Magical sparkling chime & romantic heart sound
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const delay = idx * 0.08;
                    osc.frequency.setValueAtTime(freq, now + delay);

                    gain.gain.setValueAtTime(0, now + delay);
                    gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.6);
                });
            }
            else if (animalId === 'octopus') {
                // 🐙 Pieuvre: Wet suction cup pop / bubble
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            }
            else if (animalId === 'parrot') {
                // 🦜 Perroquet: Chirpy FM bird whistle call
                [0, 0.2].forEach(delay => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1400, now + delay);
                    osc.frequency.linearRampToValueAtTime(2200, now + delay + 0.08);
                    osc.frequency.linearRampToValueAtTime(1600, now + delay + 0.16);

                    gain.gain.setValueAtTime(0.3, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.16);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.16);
                });
            }
            else if (animalId === 'chameleon') {
                // 🦎 Caméléon: Shimmering magic sfx / pitch glide
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.4);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch(e) {
            console.log("Audio play note:", e);
        }
    }
};

// --- ANIMATION ENGINE ---
const vfx = {
    queue: [],
    isAnimating: false,
    
    push: (animFn) => {
        vfx.queue.push(animFn);
        vfx.process();
    },
    
    process: () => {
        if (vfx.isAnimating || vfx.queue.length === 0) return;
        vfx.isAnimating = true;
        const next = vfx.queue.shift();
        next(() => {
            vfx.isAnimating = false;
            vfx.process();
        });
    },

    clearAll: () => {
        vfx.queue = [];
        vfx.isAnimating = false;
        document.querySelectorAll('.flying-card, .vfx-blood-particles').forEach(el => el.remove());
    },

    flyCardToRect: (imgSrc, startId, tRect, onComplete, forceStartRect = null, customClass = 'spin') => {
        let sRect = forceStartRect;
        if (!sRect) {
            const startEl = document.getElementById(startId) || document.body;
            sRect = startEl.getBoundingClientRect();
        }
        
        const flying = document.createElement('img');
        flying.src = imgSrc;
        flying.className = `flying-card ${customClass}`;
        flying.style.left = sRect.left + 'px';
        flying.style.top = sRect.top + 'px';
        flying.style.width = (sRect.width || 80) + 'px';
        flying.style.height = (sRect.height || 120) + 'px';
        
        document.body.appendChild(flying);
        flying.offsetHeight; // force reflow
        
        flying.style.left = tRect.left + 'px';
        flying.style.top = tRect.top + 'px';
        flying.style.width = (tRect.width || 75) + 'px';
        flying.style.height = (tRect.height || 110) + 'px';
        
        if (customClass === 'spin') flying.style.transform = 'rotate(360deg)';
        else if (customClass === 'spin-reverse') flying.style.transform = 'rotate(-360deg)';
        else if (customClass === 'attack') flying.style.transform = 'scale(1.4) rotate(10deg)';
        else if (customClass === 'simple-swap') flying.style.transform = 'scale(1.05)';

        setTimeout(() => {
            flying.remove();
            if(onComplete) onComplete();
        }, 600);
    },

    crocodileBite: (targetElement, onComplete) => {
        targetElement.classList.add('vfx-crocodile-bite');
        
        const rect = targetElement.getBoundingClientRect();
        
        const jaws = document.createElement('div');
        jaws.style.position = 'absolute';
        jaws.style.zIndex = '10000';
        jaws.style.pointerEvents = 'none';
        jaws.style.left = (rect.left + rect.width/2 - 75) + 'px';
        jaws.style.top = (rect.top + rect.height/2 - 75) + 'px';
        jaws.style.width = '150px';
        jaws.style.height = '150px';
        jaws.innerHTML = `
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <g class="jaw-top" fill="#1b5e20">
                    <path d="M 10 50 Q 50 10 90 50 L 75 50 L 65 35 L 50 50 L 35 35 L 25 50 Z" />
                    <path d="M 25 50 L 35 35 L 50 50 L 65 35 L 75 50 Z" fill="#fff"/>
                </g>
                <g class="jaw-bottom" fill="#1b5e20">
                    <path d="M 10 50 Q 50 90 90 50 L 75 50 L 65 65 L 50 50 L 35 65 L 25 50 Z" />
                    <path d="M 25 50 L 35 65 L 50 50 L 65 65 L 75 50 Z" fill="#fff"/>
                </g>
            </svg>
        `;
        document.body.appendChild(jaws);

        for(let i=0; i<15; i++) {
            const p = document.createElement('div');
            p.className = 'vfx-blood-particles';
            p.style.left = (rect.left + rect.width/2) + 'px';
            p.style.top = (rect.top + rect.height/2) + 'px';
            p.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
            p.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');
            p.style.background = Math.random() > 0.5 ? 'var(--primary)' : '#ff4d4d';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
        
        setTimeout(() => {
            jaws.remove();
            if(onComplete) onComplete();
        }, 800);
    }
};

// --- UI CONTROLLER ---
const ui = {
    crabPreview: null,
    getPlayerIconSvg: (p, size = 20) => {
        if (!p) return '';
        const color = p.color || '#00e5ff';
        if (p.isBot) {
            return `<svg class="player-type-icon bot-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M12 2a2 2 0 012 2v1h1a3 3 0 013 3v8a3 3 0 01-3 3H9a3 3 0 01-3-3V8a3 3 0 013-3h1V4a2 2 0 012-2zm-3.5 6a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-5.5 5h4v1.5h-4V15z"/></svg>`;
        }
        return `<svg class="player-type-icon human-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
    },
    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'screen-game') {
            const vic = document.getElementById('victory-modal');
            if(vic) vic.style.display = 'none';
        }
    },
    showOverlay: (title, desc, btnHtml = '') => {
        if (ui.isParrotResultActive) return;
        const titleEl = document.getElementById('overlay-title');
        const descEl = document.getElementById('overlay-desc');
        const overlayEl = document.getElementById('overlay-msg');
        
        // Prevent flickering / animation restarts if overlay content is already identical
        if (overlayEl && overlayEl.style.display === 'block' && titleEl.innerText === title && descEl.innerText === desc && ui._lastOverlayBtnHtml === btnHtml) {
            return;
        }
        ui._lastOverlayBtnHtml = btnHtml;
        titleEl.innerText = title;
        descEl.innerText = desc;
        const btnContainer = document.getElementById('overlay-btn-container');
        if (btnContainer) {
            btnContainer.innerHTML = btnHtml;
            btnContainer.style.display = btnHtml ? 'block' : 'none';
        }
        if (overlayEl) overlayEl.style.display = 'block';
    },
    hideOverlay: (force = false) => {
        if (ui.isParrotResultActive && !force) return;
        ui._lastOverlayBtnHtml = null;
        const overlayEl = document.getElementById('overlay-msg');
        if (overlayEl) overlayEl.style.display = 'none';
    },
    showParrotResultModal: (data) => {
        ui.isParrotResultActive = true;
        const titleEl = document.getElementById('overlay-title');
        const descEl = document.getElementById('overlay-desc');
        const btnContainer = document.getElementById('overlay-btn-container');

        const title = data.success ? "🎉 BONNE PIOCHE !" : "❌ MAUVAISE PIOCHE 😞";
        let text = "";
        if (data.success) {
            text = `${data.playerName} a prédit <b>${data.predictedName}</b> et a pioché <b>${data.cardName}</b> ! Prédiction réussie 🦜 !`;
        } else {
            text = `${data.playerName} a prédit <b>${data.predictedName}</b> mais a pioché <b>${data.cardName}</b> ! Carte remise sous la pioche, le Perroquet reste dans le jeu.`;
        }

        titleEl.innerText = title;
        descEl.innerHTML = `
            <div style="margin-top:12px; margin-bottom:12px; display:flex; flex-direction:column; align-items:center; gap:14px;">
                <img src="${data.cardImg}" style="width:165px; aspect-ratio:2/3; border-radius:18px; border:4px solid white; box-shadow:0 20px 45px rgba(0,0,0,0.6); transform:scale(1.05);" alt="${data.cardName}">
                <p style="font-size:1.2rem; font-weight:700; color:var(--text-main); text-align:center; margin:0; line-height:1.4;">${text}</p>
            </div>
        `;
        if (btnContainer) btnContainer.style.display = 'none';
        document.getElementById('overlay-msg').style.display = 'block';

        setTimeout(() => {
            ui.isParrotResultActive = false;
            ui.hideOverlay(true);
            if (game.state) ui.renderGameState(game.state);
        }, 2000);
    },
    showHermitLoveModal: (actingPlayerId, actingPlayerName) => {
        soundEngine.playAnimalSound('hermit_crab');
        const modal = document.getElementById('hermit-love-modal');
        if (!modal) return;
        
        const isMe = (game.myId === actingPlayerId);
        const titleEl = document.getElementById('hermit-love-title');
        const descEl = document.getElementById('hermit-love-desc');

        if (titleEl) {
            titleEl.innerText = isMe ? "VOUS REPIOCHEZ ! 💕" : `${actingPlayerName.toUpperCase()} REPIOCHE ! 💕`;
        }
        if (descEl) {
            descEl.innerText = isMe 
                ? "Le Bernard l'hermite et le Crabe ont trouvé l'amour parfait ! Vous rejouez un tour !"
                : `${actingPlayerName} réunit le Bernard l'hermite et le Crabe et rejoue un tour !`;
        }

        modal.style.display = 'flex';

        if (ui.hermitLoveTimer) clearTimeout(ui.hermitLoveTimer);
        ui.hermitLoveTimer = setTimeout(() => {
            ui.hideHermitLoveModal();
        }, 2000);
    },
    hideHermitLoveModal: () => {
        if (ui.hermitLoveTimer) clearTimeout(ui.hermitLoveTimer);
        const modal = document.getElementById('hermit-love-modal');
        if (modal) modal.style.display = 'none';
    },
    showDiceModal: (players, diceRolls = {}) => {
        game.myDiceRoll = null;
        const modal = document.getElementById('dice-modal');
        if (modal) modal.style.display = 'flex';
        const box = document.getElementById('dice-visual-box');
        if (box) { box.innerText = '🎲'; box.classList.remove('dice-spinning'); }
        const btn = document.getElementById('btn-roll-dice');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerText = '🎲 LANCER MON DÉ !';
        }
        ui.updateDiceScores(players, diceRolls);
    },
    updateDiceScores: (players, diceRolls = {}, winnerId = null) => {
        if (players && players.length) ui.dicePlayersCache = players;
        const validPlayers = (players && players.length) ? players : (ui.dicePlayersCache || []);
        const list = document.getElementById('dice-scores-list');
        if (!list) return;
        list.innerHTML = '';
        validPlayers.forEach(p => {
            const rollVal = diceRolls[p.id];
            const isWinner = (winnerId && winnerId === p.id);
            const div = document.createElement('div');
            div.className = `dice-score-item ${rollVal !== undefined ? 'rolled' : ''} ${isWinner ? 'winner' : ''}`;
            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    ${ui.getPlayerIconSvg(p, 18)}
                    <span style="font-weight:900; color:${p.color || '#fff'};">${p.name}</span>
                </div>
                <span style="font-weight:900; font-size:1.1rem; color:${isWinner ? '#2ed573' : (rollVal !== undefined ? 'var(--secondary)' : 'rgba(255,255,255,0.4)')};">
                    ${isWinner ? '🏆 1er (Dé : ' + rollVal + ')' : (rollVal !== undefined ? '🎲 Dé : ' + rollVal : 'En attente...')}
                </span>
            `;
            list.appendChild(div);
        });
    },
    hideDiceModal: () => {
        const modal = document.getElementById('dice-modal');
        if (modal) modal.style.display = 'none';
    },
    installPWA: () => {
        if (game.deferredPrompt) {
            game.deferredPrompt.prompt();
            game.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    const btn = document.getElementById('btn-install-app');
                    if (btn) btn.style.display = 'none';
                }
                game.deferredPrompt = null;
            });
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (isIOS) {
                ui.showOverlay(
                    "📲 Installer sur iPhone / iPad",
                    "Pour ajouter le jeu sur votre écran d'accueil :\n\n1️⃣ Appuyez sur le bouton Partager ⎋ (en bas de Safari)\n2️⃣ Choisissez 'Sur l'écran d'accueil ➕'\n3️⃣ Validez 'Ajouter' en haut à droite !",
                    '<button class="btn btn-main" style="margin-top:10px; width:100%;" onclick="ui.hideOverlay()">✖ Fermer</button>'
                );
            } else {
                ui.showOverlay(
                    "📲 Installer l'application",
                    "Ouvrez le menu de votre navigateur (⠇) et choisissez 'Ajouter à l'écran d'accueil' ou 'Installer l'application'.",
                    '<button class="btn btn-main" style="margin-top:10px; width:100%;" onclick="ui.hideOverlay()">✖ Fermer</button>'
                );
            }
        }
    },
    updateWaitingPlayers: (players) => {
        const ul = document.getElementById('waiting-players-list');
        if (!ul) return;
        ul.innerHTML = '';
        const hostId = (players && players.length > 0) ? players[0].id : null;

        players.forEach(p => {
            const li = document.createElement('li');
            const iconSvg = ui.getPlayerIconSvg(p, 22);
            let roleTag = '';

            if (p.isBot) {
                roleTag = '<span style="opacity:0.6; font-size:0.9rem; margin-left:6px; font-weight:700;">(Bot)</span>';
            } else if (p.id === hostId) {
                roleTag = p.id === game.myId ? '<span style="opacity:0.65; font-size:0.9rem; margin-left:6px; font-weight:700;">(Hôte - Vous)</span>' : '<span style="opacity:0.65; font-size:0.9rem; margin-left:6px; font-weight:700;">(Hôte)</span>';
            } else {
                roleTag = p.id === game.myId ? '<span style="opacity:0.65; font-size:0.9rem; margin-left:6px; font-weight:700;">(Vous)</span>' : '';
            }

            let kickBtnHtml = '';
            if (game.isHost && p.id !== game.myId) {
                kickBtnHtml = `<button class="btn-kick" title="Retirer" onclick="game.removePlayer('${p.id}')">❌</button>`;
            }

            const color = p.color || '#fff';
            li.innerHTML = `
                <div style="display:flex; align-items:center;">
                    ${iconSvg}
                    <span style="font-weight:900; color:${color}; text-shadow:0 0 10px ${color}40;">${p.name}</span>
                    ${roleTag}
                </div>
                ${kickBtnHtml}
            `;
            ul.appendChild(li);
        });
        const pc = document.getElementById('player-count');
        if (pc) { pc.innerText = players.length; pc.textContent = players.length; }
    },
    
    showPlacement: (skipPower = false) => {
        const myPlayer = game.state.players.find(p => p.id === game.myId);
        document.getElementById('card-actions').style.display = 'none';

        if (myPlayer && myPlayer.row.length === 0) {
            game.placeCard('right', skipPower); 
        } else {
            const pa = document.getElementById('placement-actions');
            pa.innerHTML = `
                <button class="btn-action btn-place" onclick="game.placeCard('left', ${skipPower})">⬅ Gauche</button>
                <button class="btn-action btn-place" onclick="game.placeCard('right', ${skipPower})">Droite ➡</button>
            `;
            pa.style.display = 'flex';
        }
    },
    
    showPlacementForParrot: () => {
        const myPlayer = game.state.players.find(p => p.id === game.myId);
        document.getElementById('card-actions').style.display = 'none';

        if (myPlayer && myPlayer.row.length === 0) {
            game.sendAction('PARROT_INIT', { side: 'right' });
        } else {
            const pa = document.getElementById('placement-actions');
            pa.innerHTML = `
                <button class="btn-action btn-place" onclick="game.sendAction('PARROT_INIT', { side: 'left' })">⬅ Gauche</button>
                <button class="btn-action btn-place" onclick="game.sendAction('PARROT_INIT', { side: 'right' })">Droite ➡</button>
            `;
            pa.style.display = 'flex';
        }
    },
    
    showParrotModal: () => {
        const grid = document.getElementById('parrot-animal-grid');
        grid.innerHTML = '';
        ANIMALS.forEach(animal => {
            const img = document.createElement('img');
            img.src = animal.img;
            img.onclick = () => {
                document.getElementById('parrot-modal').style.display = 'none';
                game.sendAction('PARROT_PREDICT', { animalId: animal.id });
            };
            grid.appendChild(img);
        });
        document.getElementById('parrot-modal').style.display = 'flex';
    },

    showVictoryModal: (winner, reason, row, winningCardIndices = []) => {
        const isMe = (winner.id === game.myId);
        const titleEl = document.getElementById('victory-title');
        const subtitleEl = document.getElementById('victory-subtitle');

        if (isMe) {
            titleEl.innerText = "VOUS AVEZ GAGNÉ ! 🎉";
            titleEl.style.color = "var(--secondary)";
            subtitleEl.innerText = `Vous avez remporté la manche ${reason}`;
        } else {
            titleEl.innerText = "PERDU ! 💔";
            titleEl.style.color = "#ff4757";
            const winnerColor = winner.color || '#00d2ff';
            subtitleEl.innerHTML = `<span style="color: ${winnerColor}; font-weight: 900; text-shadow: 0 0 12px ${winnerColor}80;">${winner.name}</span> a remporté la manche ${reason}`;
        }
        
        const cardsDiv = document.getElementById('victory-cards');
        cardsDiv.innerHTML = '';
        if (row && row.length) {
            const hasSpecificIndices = (winningCardIndices && winningCardIndices.length > 0);
            row.forEach((c, idx) => {
                const img = document.createElement('img');
                img.src = c.img;
                const isWinningCard = hasSpecificIndices ? winningCardIndices.includes(idx) : true;
                img.className = `victory-card-tile ${isWinningCard ? 'winning-card' : 'non-winning-card'}`;
                cardsDiv.appendChild(img);
            });
        }
        document.getElementById('victory-modal').style.display = 'flex';
        
        const rematchBtn = document.getElementById('btn-rematch');
        rematchBtn.style.display = 'inline-block';
        if (game.state && game.state.rematchVotes) {
            if (game.state.rematchVotes.includes(game.myId)) {
                rematchBtn.innerText = `En attente... (${game.state.rematchVotes.length}/${game.state.players.length})`;
                rematchBtn.disabled = true;
                rematchBtn.style.opacity = '0.7';
            } else {
                rematchBtn.innerText = `Rejouer une manche (${game.state.rematchVotes.length}/${game.state.players.length} prêts)`;
                rematchBtn.disabled = false;
                rematchBtn.style.opacity = '1';
            }
        } else {
            rematchBtn.innerText = "Rejouer une manche";
            rematchBtn.disabled = false;
            rematchBtn.style.opacity = '1';
        }
    },

    openOpponentZoom: (playerId) => {
        if (!game.state) return;
        ui.zoomedOpponentId = playerId;
        ui.renderZoomModal(playerId);
        document.getElementById('opponent-zoom-modal').style.display = 'flex';
    },

    renderZoomModal: (playerId) => {
        if (!game.state) return;
        const state = game.state;
        const myId = game.myId;
        const p = state.players.find(p => p.id === playerId);
        if (!p) {
            document.getElementById('opponent-zoom-modal').style.display = 'none';
            return;
        }

        const pColor = p.color || '#fff';
        document.getElementById('zoom-opp-name').innerHTML = `Jeu de <span style="color: ${pColor}; font-weight: 900; text-shadow: 0 0 10px ${pColor}40;">${p.name}</span> (${p.score} 👑)`;
        
        const zoomCardsContainer = document.getElementById('zoom-opp-cards');
        zoomCardsContainer.innerHTML = '';
        
        let rowToRender = [...p.row];
        if (state.crabTargeting === myId && ui.crabPreview && ui.crabPreview.playerId === p.id) {
            const card = rowToRender.splice(ui.crabPreview.originalIndex, 1)[0];
            rowToRender.splice(ui.crabPreview.currentIndex, 0, card);
        }

        rowToRender.forEach((c, index) => {
            const img = document.createElement('img');
            img.src = c.img;
            img.className = 'card';
            
            const cardWrapper = document.createElement('div');
            cardWrapper.style.position = 'relative';
            cardWrapper.style.display = 'inline-flex';
            cardWrapper.appendChild(img);
            
            if (state.crabTargeting === myId) {
                if (!ui.crabPreview && rowToRender.length > 1) {
                    img.classList.add('clickable-target');
                    img.onclick = () => { ui.crabPreview = { playerId: p.id, originalIndex: index, currentIndex: index }; ui.renderZoomModal(p.id); ui.renderGameState(state, myId); };
                } else if (ui.crabPreview && ui.crabPreview.playerId === p.id && index === ui.crabPreview.currentIndex) {
                    img.style.borderColor = 'var(--primary)';
                    img.classList.add('clickable-target');
                    
                    if (index > 0) {
                        const leftArrow = document.createElement('div');
                        leftArrow.className = 'crab-ghost bounce-in';
                        leftArrow.innerHTML = '⬅️';
                        leftArrow.style.left = '-35px';
                        leftArrow.onclick = () => { ui.crabPreview.currentIndex--; ui.renderZoomModal(p.id); ui.renderGameState(state, myId); };
                        cardWrapper.appendChild(leftArrow);
                    }
                    if (index < rowToRender.length - 1) {
                        const rightArrow = document.createElement('div');
                        rightArrow.className = 'crab-ghost bounce-in';
                        rightArrow.innerHTML = '➡️';
                        rightArrow.style.right = '-35px';
                        rightArrow.style.left = 'auto';
                        rightArrow.onclick = () => { ui.crabPreview.currentIndex++; ui.renderZoomModal(p.id); ui.renderGameState(state, myId); };
                        cardWrapper.appendChild(rightArrow);
                    }
                }
            } else if (state.crocodileTargeting === myId) {
                img.classList.add('clickable-target');
                img.onclick = () => { document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('CROCODILE_SELECT', { targetPlayerId: p.id, cardIndex: index }); };
            } else if (state.monkeyTargeting === myId) {
                img.classList.add('clickable-target');
                img.onclick = () => { document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('MONKEY_SELECT', { targetPlayerId: p.id, cardIndex: index }); };
            }
            
            zoomCardsContainer.appendChild(cardWrapper);
        });
    },

    showHelpModal: () => {
        const grid = document.getElementById('help-grid');
        grid.innerHTML = `
            <div class="rules-victory-banner" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(255, 234, 0, 0.1)); border: 1.5px solid rgba(0, 229, 255, 0.4); border-radius: 20px; padding: 16px; margin-bottom: 15px; text-align: left; box-shadow: 0 8px 25px rgba(0,0,0,0.3);">
                <h3 style="color: var(--secondary); margin-top: 0; margin-bottom: 10px; font-size: 1.2rem; font-weight: 900; display: flex; align-items: center; gap: 8px;">
                    <span>🏆</span> Comment Gagner la Partie ?
                </h3>
                <div style="font-size: 0.95rem; line-height: 1.5; color: var(--text-main); font-weight: 700;">
                    <p style="margin: 0 0 8px 0;">
                        🥇 <strong style="color: #2ed573;">Règle de Base :</strong> Alignez <strong>4 animaux identiques d'affilée</strong> (ex: 4 Lions 🦁🦁🦁🦁 côte à côte) dans votre jeu pour l'emporter instantanément !
                    </p>
                    <p style="margin: 0;">
                        🌟 <strong style="color: var(--secondary);">Règle des 7 Espèces :</strong> Réunissez <strong>7 espèces différentes</strong> dans votre jeu !
                    </p>
                </div>
            </div>
        `;
        ANIMALS.forEach(animal => {
            grid.innerHTML += `
                <div class="help-row">
                    <img src="${animal.img}">
                    <div>
                        <h4>${animal.name}</h4>
                        <p>${animal.desc}</p>
                    </div>
                </div>
            `;
        });
        document.getElementById('help-modal').style.display = 'flex';
    },

    showSoundTesterModal: () => {
        const grid = document.getElementById('sound-tester-grid');
        if (!grid) return;
        grid.innerHTML = '';
        ANIMALS.forEach(animal => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;';
            card.innerHTML = `
                <img src="${animal.img}" style="width: 75px; aspect-ratio: 2/3; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.4);" alt="${animal.name}">
                <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">${animal.name}</div>
                <button class="btn btn-main" style="padding: 6px 12px; font-size: 0.85rem; width: 100%; border-radius: 12px;" onclick="soundEngine.playAnimalSound('${animal.id}')">▶️ Écouter</button>
            `;
            grid.appendChild(card);
        });
        document.getElementById('sound-tester-modal').style.display = 'flex';
    },
    
    renderHistory: (history) => {
        const list = document.getElementById('history-list');
        if (!list) return;
        list.innerHTML = '';
        if (!history || history.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5); margin:auto;">Aucune action pour le moment.</p>';
            return;
        }

        const animalImgMap = [
            { key: 'lion', name: 'Lion 🦁', img: 'assets/card_lion.jpg?v=2' },
            { key: 'caméléon', name: 'Caméléon 🦎', img: 'assets/card_chameleon.jpg' },
            { key: 'chameleon', name: 'Caméléon 🦎', img: 'assets/card_chameleon.jpg' },
            { key: 'singe', name: 'Singe 🐒', img: 'assets/card_monkey.jpg?v=2' },
            { key: 'crabe', name: 'Crabe 🦀', img: 'assets/card_crab.jpg?v=4' },
            { key: 'pieuvre', name: 'Pieuvre 🐙', img: 'assets/card_octopus.jpg?v=2' },
            { key: 'crocodile', name: 'Crocodile 🐊', img: 'assets/card_crocodile.jpg?v=2' },
            { key: 'perroquet', name: 'Perroquet 🦜', img: 'assets/card_parrot.jpg?v=2' },
            { key: "bernard l'hermite", name: "Bernard l'hermite 🐚", img: 'assets/card_hermit_crab.jpg?v=7' },
            { key: "bernard-l'ermite", name: "Bernard l'hermite 🐚", img: 'assets/card_hermit_crab.jpg?v=7' }
        ];

        history.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            let formattedMsg = msg;

            animalImgMap.forEach(info => {
                const regex = new RegExp(`\\b${info.key}(s|es)?\\b`, 'gi');
                formattedMsg = formattedMsg.replace(regex, (match) => {
                    return `<span class="history-badge"><img src="${info.img}" class="history-mini-img" alt="${match}"> ${match}</span>`;
                });
            });

            if (game.state && game.state.players) {
                game.state.players.forEach(p => {
                    if (p.name) {
                        const color = p.color || '#ff4757';
                        const escapedName = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const nameRegex = new RegExp(`\\b${escapedName}\\b`, 'g');
                        formattedMsg = formattedMsg.replace(nameRegex, `<span class="history-player-name" style="color: ${color}; font-weight: 900; text-shadow: 0 0 10px ${color}40;">${p.name}</span>`);
                    }
                });
            }

            if (msg.includes('GAGNE') || msg.includes('VICTOIRE')) {
                div.style.borderLeftColor = '#2ed573';
                div.style.background = 'linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.05))';
            }

            div.innerHTML = formattedMsg;
            list.appendChild(div);
        });
        list.scrollTop = 0;
    },

    renderGameState: (state, myId) => {
        if (state && state.players) {
            state.players.forEach((p, idx) => {
                if (!p.color) p.color = game.getPlayerColor(idx);
            });
        }
        if (!state.started) {
            if (document.getElementById('victory-modal').style.display === 'flex' && state.rematchVotes) {
                 const rematchBtn = document.getElementById('btn-rematch');
                 if (state.rematchVotes.includes(myId)) {
                     rematchBtn.innerText = `En attente... (${state.rematchVotes.length}/${state.players.length})`;
                     rematchBtn.disabled = true;
                     rematchBtn.style.opacity = '0.7';
                 } else {
                     rematchBtn.innerText = `Rejouer une manche (${state.rematchVotes.length}/${state.players.length} prêts)`;
                     rematchBtn.disabled = false;
                     rematchBtn.style.opacity = '1';
                 }
            }
            return;
        }

        const updateDOM = () => {
        const effectiveMyId = game.myId || myId || (state.players.length > 0 ? state.players[0].id : null);
        const myPlayer = state.players.find(p => p.id === effectiveMyId) || state.players[0];
        
        const leftCount = document.getElementById('deck-left-count');
        if (leftCount && leftCount.innerText !== String(state.deck1Count)) leftCount.innerText = state.deck1Count;

        const rightCount = document.getElementById('deck-right-count');
        if (rightCount && rightCount.innerText !== String(state.deck2Count)) rightCount.innerText = state.deck2Count;
        
        const thumbLeft = document.getElementById('deck-left-thumbnail');
        if (state.deck1Thumbnail) {
            if (thumbLeft.src !== state.deck1Thumbnail) thumbLeft.src = state.deck1Thumbnail;
            thumbLeft.style.display = 'block';
        } else {
            thumbLeft.style.display = 'none';
        }
        
        const thumbRight = document.getElementById('deck-right-thumbnail');
        if (state.deck2Thumbnail) {
            if (thumbRight.src !== state.deck2Thumbnail) thumbRight.src = state.deck2Thumbnail;
            thumbRight.style.display = 'block';
        } else {
            thumbRight.style.display = 'none';
        }
        
        const turnPlayer = state.players.find(p => p.id === state.turn);
        const isMyTurn = (state.turn === effectiveMyId);
        const turnIndicator = document.getElementById('turn-indicator');
        const targetTurnText = isMyTurn ? "C'est votre tour !" : `Tour de ${turnPlayer ? turnPlayer.name : '...'}`;
        if (turnIndicator && turnIndicator.innerText !== targetTurnText) {
            turnIndicator.innerText = targetTurnText;
        }
        if (isMyTurn) turnIndicator.classList.remove('opp-turn');
        else turnIndicator.classList.add('opp-turn');

        const localArea = document.querySelector('.local-player-area');
        if (localArea) {
            if (isMyTurn) localArea.classList.add('active-turn');
            else localArea.classList.remove('active-turn');
        }
        
        const canDraw = isMyTurn && (!state.currentDrawnCard || state.parrotPredictedAnimal);
        document.getElementById('deck-left').classList.toggle('disabled', !canDraw);
        document.getElementById('deck-right').classList.toggle('disabled', !canDraw);
        document.getElementById('deck-left').style.opacity = (canDraw && state.forcedDeck === 2) ? '0.3' : '1';
        document.getElementById('deck-right').style.opacity = (canDraw && state.forcedDeck === 1) ? '0.3' : '1';

        if (!state.currentDrawnCard || ui.isParrotResultActive) {
            document.getElementById('action-modal').style.display = 'none';
            if (state.parrotPredictedAnimal && isMyTurn && !ui.isParrotResultActive) {
                const animalObj = ANIMALS.find(a => a.id === state.parrotPredictedAnimal);
                ui.showOverlay("Prédiction Perroquet 🦜", `Vous avez prédit : ${animalObj ? animalObj.name : ''} !\nCliquez sur la pioche de votre choix (Pioche Gauche ⬅️ ou Pioche Droite ➡️).`);
            }
        } else {
            document.getElementById('action-modal').style.display = 'flex';
            const drawnCardImg = document.getElementById('drawn-card-img');
            drawnCardImg.src = state.currentDrawnCard.img;
            drawnCardImg.style.opacity = '1';

            if(isMyTurn) {
                const activePowers = ['crocodile', 'monkey', 'crab', 'parrot'];
                const cardActions = document.getElementById('card-actions');
                
                if (state.parrotPredictedAnimal) {
                    cardActions.style.display = 'none';
                } else {
                    cardActions.style.display = 'flex';
                    if (activePowers.includes(state.currentDrawnCard.id) && !state.disablePower) {
                        if (state.currentDrawnCard.id === 'monkey') {
                            cardActions.innerHTML = `
                                ${!state.mustPlaceDrawnCard ? '<button class="btn-action btn-reject" onclick="game.rejectCard()">❌ Jeter</button>' : ''}
                                <button class="btn-action btn-neutral" onclick="ui.showPlacement(true)">✅ SANS pouvoir</button>
                                <button class="btn-action btn-keep" onclick="game.sendAction('MONKEY_INIT', {})">✨ AVEC pouvoir</button>
                            `;
                        } else if (state.currentDrawnCard.id === 'parrot') {
                            cardActions.innerHTML = `
                                ${!state.mustPlaceDrawnCard ? '<button class="btn-action btn-reject" onclick="game.rejectCard()">❌ Jeter</button>' : ''}
                                <button class="btn-action btn-neutral" onclick="ui.showPlacement(true)">✅ SANS pouvoir</button>
                                <button class="btn-action btn-keep" onclick="ui.showPlacementForParrot()">✨ AVEC pouvoir</button>
                            `;
                        } else {
                            cardActions.innerHTML = `
                                ${!state.mustPlaceDrawnCard ? '<button class="btn-action btn-reject" onclick="game.rejectCard()">❌ Jeter</button>' : ''}
                                <button class="btn-action btn-neutral" onclick="ui.showPlacement(true)">✅ SANS pouvoir</button>
                                <button class="btn-action btn-keep" onclick="ui.showPlacement(false)">✨ AVEC pouvoir</button>
                            `;
                        }
                    } else {
                        cardActions.innerHTML = `
                            ${!state.mustPlaceDrawnCard ? '<button class="btn-action btn-reject" onclick="game.rejectCard()">❌ Jeter</button>' : ''}
                            <button class="btn-action btn-keep" onclick="ui.showPlacement(false)">✅ Garder</button>
                        `;
                    }
                }
                document.getElementById('placement-actions').style.display = 'none';
                if (state.forcedDeck === 1) document.getElementById('deck-right').style.opacity = '0.3';
                if (state.forcedDeck === 2) document.getElementById('deck-left').style.opacity = '0.3';

                if (state.mustPlaceDrawnCard && (state.disablePower || !activePowers.includes(state.currentDrawnCard.id))) {
                    ui.showPlacement(false);
                }
                
                if (state.mustPlaceDrawnCard && (state.disablePower || !activePowers.includes(state.currentDrawnCard.id))) {
                    ui.showPlacement(false);
                }
                
                if (state.monkeyTargeting === effectiveMyId || state.parrotPredicting === effectiveMyId) {
                    document.getElementById('drawn-card').style.transform = 'scale(0.5) translateY(30px)';
                    cardActions.style.display = 'none';
                } else if (state.parrotPredictedAnimal) {
                    cardActions.style.display = 'none';
                    document.getElementById('drawn-card').style.transform = '';
                } else {
                    document.getElementById('drawn-card').style.transform = '';
                }
            } else {
                document.getElementById('card-actions').style.display = 'none';
                document.getElementById('placement-actions').style.display = 'none';
            }
        }
        
        if (state.crocodileTargeting === effectiveMyId) {
            ui.showOverlay("Attaque Crocodile 🐊", "Cliquez sur une carte à dévorer, ou passez si vous ne voulez pas utiliser le pouvoir.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('CROCODILE_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
        } else if (state.monkeyTargeting === effectiveMyId) {
            ui.showOverlay("Pouvoir du Singe 🐒", "Cliquez sur la carte avec laquelle échanger, ou passez.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('MONKEY_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
        } else if (state.crabTargeting === effectiveMyId) {
            if (ui.crabPreview) {
                ui.showOverlay("Pouvoir du Crabe 🦀", "Déplacez la carte, puis validez.", `
                    <button class="btn-action btn-keep" style="width: 100%; margin-bottom: 10px;" onclick="game.sendAction('CRAB_SELECT', { targetPlayerId: ui.crabPreview.playerId, originalIndex: ui.crabPreview.originalIndex, currentIndex: ui.crabPreview.currentIndex }); ui.crabPreview = null;">✅ Valider le déplacement</button>
                    <button class="btn-action btn-reject" style="width: 100%;" onclick="ui.crabPreview = null; ui.renderGameState(game.state, game.myId);">Annuler la sélection</button>
                `);
            } else {
                ui.showOverlay("Pouvoir du Crabe 🦀", "Cliquez sur une carte à déplacer, ou passez.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('CRAB_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
            }
        } else if (state.crocodileTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crocodileTargeting);
            ui.showOverlay("Attaque Crocodile...", `${targetingPlayer ? targetingPlayer.name : 'Adversaire'} choisit sa cible...`);
        } else if (state.monkeyTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.monkeyTargeting);
            ui.showOverlay("Pouvoir du Singe...", `${targetingPlayer ? targetingPlayer.name : 'Adversaire'} choisit avec qui échanger...`);
        } else if (state.crabTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crabTargeting);
            ui.showOverlay("Pouvoir du Crabe...", `${targetingPlayer ? targetingPlayer.name : 'Adversaire'} hésite à déplacer une carte...`);
        } else if (state.parrotPredictedAnimal && state.turn !== effectiveMyId) {
            const targetingPlayer = state.players.find(p => p.id === state.turn);
            const animalNameMap = {
                lion: 'le Lion 🦁', chameleon: 'le Caméléon 🦎', monkey: 'le Singe 🐒',
                crab: 'le Crabe 🦀', octopus: 'la Pieuvre 🐙', crocodile: 'le Crocodile 🐊', parrot: 'le Perroquet 🦜', 'hermit_crab': 'le Bernard-l\'ermite 🐚'
            };
            ui.showOverlay("Prédiction en cours 🦜", `${targetingPlayer ? targetingPlayer.name : 'Adversaire'} a prédit ${animalNameMap[state.parrotPredictedAnimal]} ! Il s'apprête à piocher...`);
        } else {
            ui.crabPreview = null;
            ui.hideOverlay();
        }

        const myRowEl = document.getElementById('my-row');
        if (myPlayer) {
            const myNameEl = document.getElementById('my-name-display');
            if (myNameEl) {
                myNameEl.innerHTML = `${ui.getPlayerIconSvg(myPlayer, 20)} ${myPlayer.name} (Vous)`;
                myNameEl.style.color = myPlayer.color || '#00d2ff';
                myNameEl.style.fontWeight = '900';
                myNameEl.style.textShadow = `0 0 10px ${myPlayer.color || '#00d2ff'}40`;
                myNameEl.style.display = 'inline-flex';
                myNameEl.style.alignItems = 'center';
            }
            document.getElementById('my-score').innerText = myPlayer.score;
            myRowEl.innerHTML = '';
            
            let myRowToRender = [...myPlayer.row];
            if (state.crabTargeting === effectiveMyId && ui.crabPreview && ui.crabPreview.playerId === effectiveMyId) {
                const card = myRowToRender.splice(ui.crabPreview.originalIndex, 1)[0];
                myRowToRender.splice(ui.crabPreview.currentIndex, 0, card);
            }

            myRowToRender.forEach((c, index) => {
                const img = document.createElement('img');
                img.src = c.img;
                img.className = 'card';
                img.id = `card-target-${effectiveMyId}-${index}`;
                
                if (state.crabTargeting === effectiveMyId) {
                    if (myPlayer.row.length > 1) {
                        img.classList.add('clickable-target');
                        const origIdx = myPlayer.row.indexOf(c);
                        img.onclick = () => {
                            ui.crabPreview = { playerId: effectiveMyId, originalIndex: origIdx, currentIndex: index };
                            ui.renderGameState(state, effectiveMyId);
                        };
                    }
                    if (ui.crabPreview && ui.crabPreview.playerId === effectiveMyId && index === ui.crabPreview.currentIndex) {
                        img.style.borderColor = 'var(--secondary)';
                        img.style.boxShadow = '0 0 20px var(--secondary)';
                        img.style.transform = 'scale(1.15)';
                    }
                } else if (state.crocodileTargeting === effectiveMyId) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('CROCODILE_SELECT', { targetPlayerId: effectiveMyId, cardIndex: index });
                } else if (state.monkeyTargeting === effectiveMyId) {
                    img.style.opacity = '0.5';
                }
                
                myRowEl.appendChild(img);
            });

            if (state.crabTargeting === effectiveMyId && ui.crabPreview && ui.crabPreview.playerId === effectiveMyId) {
                if (ui.crabPreview.currentIndex > 0) {
                    const leftArrow = document.createElement('div');
                    leftArrow.className = 'crab-ghost bounce-in';
                    leftArrow.innerHTML = '⬅️';
                    leftArrow.onclick = () => { ui.crabPreview.currentIndex--; ui.renderGameState(state, effectiveMyId); };
                    myRowEl.prepend(leftArrow);
                }
                if (ui.crabPreview.currentIndex < myRowToRender.length - 1) {
                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'crab-ghost bounce-in';
                    rightArrow.innerHTML = '➡️';
                    rightArrow.onclick = () => { ui.crabPreview.currentIndex++; ui.renderGameState(state, effectiveMyId); };
                    myRowEl.appendChild(rightArrow);
                }
            }
        }

        const opponentsListEl = document.getElementById('opponents-vertical-list');
        if (opponentsListEl) {
            opponentsListEl.innerHTML = '';
            const opponents = state.players.filter(p => p.id !== effectiveMyId);

            opponents.forEach(oppPlayer => {
                const oppBlock = document.createElement('div');
                oppBlock.className = `opponent-card-block ${state.turn === oppPlayer.id ? 'active-turn' : ''}`;

                const isTargeting = (state.crocodileTargeting === effectiveMyId || state.monkeyTargeting === effectiveMyId || (state.crabTargeting === effectiveMyId && oppPlayer.row.length > 1));
                if (isTargeting) oppBlock.classList.add('targeting-mode');

                const header = document.createElement('div');
                header.className = 'opponent-header-pill';
                const oppColor = oppPlayer.color || '#fff';
                header.innerHTML = `
                    <span style="color: ${oppColor}; font-weight: 900; text-shadow: 0 0 10px ${oppColor}40; display:inline-flex; align-items:center;">${ui.getPlayerIconSvg(oppPlayer, 18)} ${oppPlayer.name} ${state.parrotPredicting === oppPlayer.id ? '🦜' : ''}</span>
                    <span><strong style="color:var(--secondary);">${oppPlayer.score}</strong></span>
                `;
                oppBlock.appendChild(header);

                const oppRowEl = document.createElement('div');
                oppRowEl.className = 'opp-row-cards';
                oppRowEl.id = `opp-cards-${oppPlayer.id}`;

                let rowToRender = [...oppPlayer.row];
                if (state.crabTargeting === effectiveMyId && ui.crabPreview && ui.crabPreview.playerId === oppPlayer.id) {
                    const card = rowToRender.splice(ui.crabPreview.originalIndex, 1)[0];
                    rowToRender.splice(ui.crabPreview.currentIndex, 0, card);
                }

                rowToRender.forEach((c, index) => {
                    const img = document.createElement('img');
                    img.src = c.img;
                    img.className = 'card';
                    img.id = `card-target-${oppPlayer.id}-${index}`;

                    if (state.crabTargeting === effectiveMyId) {
                        if (oppPlayer.row.length > 1) {
                            img.classList.add('clickable-target');
                            const origIdx = oppPlayer.row.indexOf(c);
                            img.onclick = () => {
                                ui.crabPreview = { playerId: oppPlayer.id, originalIndex: origIdx, currentIndex: index };
                                ui.renderGameState(state, effectiveMyId);
                            };
                        }
                        if (ui.crabPreview && ui.crabPreview.playerId === oppPlayer.id && index === ui.crabPreview.currentIndex) {
                            img.style.borderColor = 'var(--secondary)';
                            img.style.boxShadow = '0 0 20px var(--secondary)';
                            img.style.transform = 'scale(1.15)';
                        }
                    } else if (state.crocodileTargeting === effectiveMyId) {
                        img.classList.add('clickable-target');
                        img.onclick = () => game.sendAction('CROCODILE_SELECT', { targetPlayerId: oppPlayer.id, cardIndex: index });
                    } else if (state.monkeyTargeting === effectiveMyId) {
                        img.classList.add('clickable-target');
                        img.onclick = () => game.sendAction('MONKEY_SELECT', { targetPlayerId: oppPlayer.id, cardIndex: index });
                    }

                    oppRowEl.appendChild(img);
                });

                if (state.crabTargeting === effectiveMyId && ui.crabPreview && ui.crabPreview.playerId === oppPlayer.id) {
                    if (ui.crabPreview.currentIndex > 0) {
                        const leftArrow = document.createElement('div');
                        leftArrow.className = 'crab-ghost bounce-in';
                        leftArrow.innerHTML = '⬅️';
                        leftArrow.onclick = () => { ui.crabPreview.currentIndex--; ui.renderGameState(state, effectiveMyId); };
                        oppRowEl.prepend(leftArrow);
                    }
                    if (ui.crabPreview.currentIndex < rowToRender.length - 1) {
                        const rightArrow = document.createElement('div');
                        rightArrow.className = 'crab-ghost bounce-in';
                        rightArrow.innerHTML = '➡️';
                        rightArrow.onclick = () => { ui.crabPreview.currentIndex++; ui.renderGameState(state, effectiveMyId); };
                        oppRowEl.appendChild(rightArrow);
                    }
                }

                oppBlock.appendChild(oppRowEl);
                opponentsListEl.appendChild(oppBlock);
            });
        }
        
        if (state.parrotPredicting === effectiveMyId) ui.showParrotModal();
        else document.getElementById('parrot-modal').style.display = 'none';
        };

        if (document.startViewTransition && !ui.isAnimating) {
            ui.isAnimating = true;
            document.startViewTransition(updateDOM).finished.finally(() => {
                ui.isAnimating = false;
            });
        } else {
            updateDOM();
        }
    }
};

// --- PEER NETWORK & GAME LOGIC ---
const game = {
    peer: null,
    connections: [],
    isHost: false,
    myId: null,
    myName: "Joueur",
    roomCode: null,
    botTimer: null,
    
    PLAYER_COLORS: [
        '#00d2ff', // Electric Cyan
        '#ff4757', // Neon Coral Red
        '#ff9f43', // Vibrant Gold Orange
        '#10ac84', // Deep Vivid Emerald Green
        '#e056fd', // Bright Electric Violet
        '#70a1ff', // Soft Sky Blue
        '#ff6b6b'  // Bright Coral
    ],
    getPlayerColor: (index) => {
        return game.PLAYER_COLORS[index % game.PLAYER_COLORS.length];
    },
    
    state: {
        started: false,
        players: [],
        deck1: [], deck2: [],
        deck1Count: 0, deck2Count: 0,
        turnIndex: 0, turn: null,
        currentDrawnCard: null,
        originalDeckIndex: null,
        forcedDeck: null,
        mustPlaceDrawnCard: false,
        parrotPredicting: null,
        parrotPredictedAnimal: null,
        crocodileTargeting: null,
        monkeyTargeting: null,
        crabTargeting: null,
        history: []
    },

    addHistory: (msg) => {
        if (!game.state.history) game.state.history = [];
        game.state.history.unshift(msg);
        game.broadcast({ type: 'HISTORY_UPDATE', history: game.state.history });
        ui.renderHistory(game.state.history);
    },

    deferredPrompt: null,

    init: () => { 
        ui.showScreen('screen-home'); 
        soundEngine.updateSpeakerBtn(); 
        game.startInactivityTracker();

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const installBtn = document.getElementById('btn-install-app');
        if (isStandalone && installBtn) {
            installBtn.style.display = 'none';
        } else if (installBtn) {
            installBtn.style.display = 'block';
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            game.deferredPrompt = e;
            if (installBtn && !isStandalone) installBtn.style.display = 'block';
        });

        // Reconnect listener on tab refocus / browser online
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                game.checkAndReconnect();
            }
        });
        window.addEventListener('online', () => {
            game.checkAndReconnect();
        });

        // Keep-alive PING interval
        setInterval(() => {
            if (game.isHost) {
                game.connections.forEach(conn => {
                    try { conn.send({ type: 'PING' }); } catch(e){}
                });
            } else if (game.clientConn && game.clientConn.open) {
                try { game.clientConn.send({ type: 'PING' }); } catch(e){}
            }
        }, 4000);
    },

    turnTimeLeft: 30,
    shotClockTimer: null,

    resetTurnTimer: (seconds = 30) => {
        game.turnTimeLeft = seconds;
        game.updateInactivityUI();
    },

    startInactivityTracker: () => {
        const timerBadge = document.getElementById('inactivity-timer-badge');
        if (timerBadge) {
            timerBadge.onclick = () => {
                game.updateInactivityUI();
            };
        }

        if (game.shotClockTimer) clearInterval(game.shotClockTimer);
        game.shotClockTimer = setInterval(() => {
            if (game.state && game.state.started) {
                if (game.turnTimeLeft > 0) {
                    game.turnTimeLeft--;
                } else if (game.isHost) {
                    game.handleShotClockTimeout();
                }
            } else {
                game.turnTimeLeft = 30;
            }
            game.updateInactivityUI();
        }, 1000);
    },

    handleShotClockTimeout: () => {
        if (!game.state || !game.state.started) return;
        const activePlayerId = game.state.turn;
        if (!activePlayerId) return;

        const activePlayer = game.state.players.find(p => p.id === activePlayerId);
        if (!activePlayer) return;

        game.resetTurnTimer(30);

        // If it's a Bot turn, execute standard bot logic
        if (activePlayer.isBot) {
            game.playBotTurn();
            return;
        }

        // --- DISADVANTAGEOUS AFK PENALTY FOR HUMAN PLAYER ---
        game.broadcast({ type: 'ALERT', msg: `⏳ Temps écoulé pour ${activePlayer.name} ! Pénalité AFK appliquée.` });
        game.addHistory(`⏱️ Temps écoulé (30s) pour ${activePlayer.name} : choix défavorable appliqué !`);

        // 1. Crocodile targeting penalty: Crocodile bites one of the AFK player's OWN cards if possible!
        if (game.state.crocodileTargeting === activePlayerId) {
            if (activePlayer.row && activePlayer.row.length > 0) {
                game.handlePlayerAction(activePlayerId, 'CROCODILE_SELECT', { targetPlayerId: activePlayerId, cardIndex: 0 });
            } else {
                game.handlePlayerAction(activePlayerId, 'CROCODILE_SELECT', { skip: true });
            }
            return;
        }

        // 2. Crab targeting penalty: Skip crab power
        if (game.state.crabTargeting === activePlayerId) {
            game.handlePlayerAction(activePlayerId, 'CRAB_SELECT', { skip: true });
            return;
        }

        // 3. Monkey targeting penalty: Skip monkey power
        if (game.state.monkeyTargeting === activePlayerId) {
            game.handlePlayerAction(activePlayerId, 'MONKEY_SELECT', { skip: true });
            return;
        }

        // 4. Parrot predicting penalty: Intentionally predict wrong animal to discard card
        if (game.state.parrotPredicting === activePlayerId) {
            game.handlePlayerAction(activePlayerId, 'PARROT_PREDICT', { animalId: 'lion' });
            return;
        }

        // 5. Drawn card placement penalty:
        if (game.state.currentDrawnCard) {
            const card = game.state.currentDrawnCard;

            // If card can be REJECTED (not mustPlaceDrawnCard): ALWAYS REJECT IT!
            if (!game.state.mustPlaceDrawnCard) {
                game.handlePlayerAction(activePlayerId, 'REJECT', { endTurn: true });
                return;
            }

            // If forced to place (e.g. 2nd card drawn or parrot success):
            // Choose the side that DOES NOT create a pair for the AFK player
            let worstSide = 'left';
            if (activePlayer.row && activePlayer.row.length > 0) {
                const leftEndCard = activePlayer.row[0];
                const rightEndCard = activePlayer.row[activePlayer.row.length - 1];

                const leftCreatesPair = (leftEndCard.id === card.id || card.id === 'chameleon' || leftEndCard.id === 'chameleon');
                const rightCreatesPair = (rightEndCard.id === card.id || card.id === 'chameleon' || rightEndCard.id === 'chameleon');

                if (leftCreatesPair && !rightCreatesPair) {
                    worstSide = 'right';
                } else if (!leftCreatesPair && rightCreatesPair) {
                    worstSide = 'left';
                } else if (card.id === 'chameleon') {
                    const chamIdx = activePlayer.row.findIndex(c => c.id === 'chameleon');
                    if (chamIdx === 0) worstSide = 'left';
                    else if (chamIdx === activePlayer.row.length - 1) worstSide = 'right';
                }
            }

            game.handlePlayerAction(activePlayerId, 'PLACE', { side: worstSide, skipPower: true });
            return;
        }

        // 6. Drawing card penalty: Draw from deck 1 or forced deck
        const deckToDraw = game.state.forcedDeck || 1;
        game.handlePlayerAction(activePlayerId, 'DRAW', { deckIndex: deckToDraw });
    },

    updateInactivityUI: () => {
        const badge = document.getElementById('inactivity-timer-badge');
        const countEl = document.getElementById('inactivity-countdown');
        if (!badge || !countEl) return;

        if (!game.state || !game.state.started) {
            badge.style.display = 'none';
            return;
        }
        badge.style.display = 'flex';

        const effectiveMyId = game.myId || (game.state.players.length > 0 ? game.state.players[0].id : null);
        const isMyTurn = (game.state.turn === effectiveMyId);
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        const activeName = activePlayer ? (isMyTurn ? "Votre tour" : activePlayer.name) : "...";

        countEl.innerText = `${activeName} : ${game.turnTimeLeft}s`;

        if (game.turnTimeLeft <= 8) {
            badge.className = 'inactivity-timer-badge warning';
        } else if (isMyTurn) {
            badge.className = 'inactivity-timer-badge my-turn';
        } else {
            badge.className = 'inactivity-timer-badge opp-turn';
        }
    },

    checkAndReconnect: () => {
        const savedCode = sessionStorage.getItem('collect_room_code');
        const savedName = sessionStorage.getItem('collect_player_name');
        const savedId = sessionStorage.getItem('collect_player_id');

        if (savedCode && !game.isHost) {
            if (!game.clientConn || !game.clientConn.open) {
                console.log("Auto-reconnecting to room:", savedCode);
                game.reconnectClient(savedCode, savedName, savedId);
            } else {
                try { game.clientConn.send({ type: 'PING' }); } catch(e){}
            }
        }
    },

    generateRoomCode: () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    hostRoom: () => {
        game.isHost = true;
        game.roomCode = game.generateRoomCode();
        const nameInput = document.getElementById('input-host-name');
        game.myName = (nameInput && nameInput.value && nameInput.value.trim() !== '') ? nameInput.value.trim() : "Hôte";
        const codeEl = document.getElementById('room-code-display');
        if (codeEl) { codeEl.innerText = game.roomCode; codeEl.textContent = game.roomCode; }
        
        game.myId = 'host_' + Math.floor(Math.random() * 10000);
        game.state.players = [{ id: game.myId, name: game.myName, isBot: false, row: [], score: 0, disconnected: false, color: game.getPlayerColor(0) }];
        
        sessionStorage.setItem('collect_room_code', game.roomCode);
        sessionStorage.setItem('collect_player_name', game.myName);
        sessionStorage.setItem('collect_player_id', game.myId);

        ui.updateWaitingPlayers(game.state.players);
        ui.showScreen('screen-host');
        
        try {
            game.peer = new Peer(`collect-${game.roomCode}`, {
                config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
            });
            
            game.peer.on('open', (id) => {
                const hostP = game.state.players.find(p => p.id === game.myId);
                if (hostP) hostP.id = id;
                game.myId = id;
                sessionStorage.setItem('collect_player_id', id);
                ui.updateWaitingPlayers(game.state.players);
            });
            game.peer.on('connection', (conn) => {
                conn.on('data', (data) => {
                    if (data.type === 'JOIN') {
                        let existingPlayer = game.state.players.find(p => 
                            (data.reconnectId && p.id === data.reconnectId) || 
                            (p.name && data.name && p.name.trim().toLowerCase() === data.name.trim().toLowerCase() && !p.isBot)
                        );
                        
                        if (existingPlayer) {
                            existingPlayer.id = conn.peer;
                            existingPlayer.disconnected = false;
                            
                            game.connections = game.connections.filter(c => c.peer !== conn.peer && c.peer !== existingPlayer.id);
                            game.connections.push(conn);
                            
                            conn.send({ type: 'RECONNECT_SUCCESS', state: game.state });
                            conn.send({ type: 'HISTORY_UPDATE', history: game.state.history });
                            
                            if (game.state.started) {
                                game.broadcastState();
                            } else {
                                ui.updateWaitingPlayers(game.state.players);
                                game.broadcast({ type: 'PLAYERS_UPDATE', players: game.state.players });
                            }
                            return;
                        }

                        if (game.state.players.length >= 5) { conn.send({type: 'ERROR', msg: "Salon complet (5 joueurs max)."}); return; }
                        game.connections.push(conn);
                        const playerColor = game.getPlayerColor(game.state.players.length);
                        game.state.players.push({ id: conn.peer, name: data.name, isBot: false, row: [], score: 0, disconnected: false, color: playerColor });
                        ui.updateWaitingPlayers(game.state.players);
                        game.broadcast({ type: 'PLAYERS_UPDATE', players: game.state.players });
                        conn.send({ type: 'HISTORY_UPDATE', history: game.state.history });
                    }
                    else if (data.type === 'ACTION') {
                        game.handlePlayerAction(conn.peer, data.action, data.payload);
                    }
                });
                conn.on('close', () => {
                    const p = game.state.players.find(item => item.id === conn.peer);
                    if (p) {
                        p.disconnected = true;
                        const pName = p.name;
                        game.addHistory(`⚠️ ${pName} s'est déconnecté. Suppression dans 90s.`);
                        game.broadcast({ type: 'ALERT', msg: `⚠️ ${pName} s'est déconnecté. Si pas de reconnexion sous 90s, son jeu sera supprimé et la partie reprendra avec les joueurs restants !` });
                    }
                    
                    // 90-second grace period before removing disconnected player & their content
                    setTimeout(() => {
                        const targetP = game.state.players.find(item => item.id === conn.peer);
                        if (targetP && targetP.disconnected) {
                            const targetName = targetP.name;
                            // Remove disconnected player entry and cards
                            game.state.players = game.state.players.filter(item => item.id !== conn.peer);
                            ui.updateWaitingPlayers(game.state.players);
                            
                            game.broadcast({ 
                                type: 'ALERT', 
                                msg: `Fin du délai (90s) : ${targetName} a été retiré de la partie et son jeu a été supprimé. La partie reprend !` 
                            });
                            game.addHistory(`🗑️ ${targetName} a été retiré pour déconnexion (90s).`);

                            if (game.state.started) {
                                // If it was disconnected player's turn, advance turn immediately
                                if (game.state.turn === conn.peer) {
                                    game.state.turnIndex = (game.state.turnIndex) % game.state.players.length;
                                    game.state.turn = game.state.players[game.state.turnIndex] ? game.state.players[game.state.turnIndex].id : null;
                                }
                                // Clear pending power targetings
                                game.state.crocodileTargeting = null;
                                game.state.crabTargeting = null;
                                game.state.monkeyTargeting = null;
                                game.state.parrotPredicting = null;

                                // If only 1 player remains, declare victory by forfeit
                                if (game.state.players.length < 2) {
                                    game.state.started = false;
                                    const remainingWinner = game.state.players[0];
                                    if (remainingWinner) {
                                        game.triggerVictory(remainingWinner, "par forfait (les autres joueurs se sont déconnectés)", remainingWinner.row.map((_, i) => i));
                                    }
                                } else {
                                    game.broadcastState();
                                }
                            }
                        }
                    }, 90000);

                    ui.updateWaitingPlayers(game.state.players);
                    if (game.state.started) game.broadcastState();
                });
            });
        } catch(e) {
            console.log("PeerJS init note:", e);
        }
    },

    addBot: () => {
        if (game.state.players.length >= 5) {
            ui.showOverlay("Limite atteinte", "Maximum 5 joueurs par partie !");
            setTimeout(ui.hideOverlay, 2000);
            return;
        }
        const botId = 'bot_' + Math.floor(Math.random()*10000);
        const botColor = game.getPlayerColor(game.state.players.length);
        game.state.players.push({ id: botId, name: "Bot " + (game.state.players.length), isBot: true, row: [], score: 0, color: botColor });
        ui.updateWaitingPlayers(game.state.players);
    },

    removePlayer: (targetId) => {
        if (!game.isHost) return;
        const pIndex = game.state.players.findIndex(p => p.id === targetId);
        if (pIndex !== -1) {
            const targetP = game.state.players[pIndex];
            if (!targetP.isBot) {
                const conn = game.connections.find(c => c.peer === targetId);
                if (conn) {
                    try {
                        conn.send({ type: 'KICK', msg: "Vous avez été retiré du salon par l'hôte." });
                        setTimeout(() => conn.close(), 300);
                    } catch(e){}
                }
                game.connections = game.connections.filter(c => c.peer !== targetId);
            }
            game.state.players.splice(pIndex, 1);
            ui.updateWaitingPlayers(game.state.players);
            game.broadcast({ type: 'PLAYERS_UPDATE', players: game.state.players });
        }
    },

    rollDice: () => {
        if (game.myDiceRoll) return;
        soundEngine.playDiceSound();
        const box = document.getElementById('dice-visual-box');
        if (box) box.classList.add('dice-spinning');
        const roll = Math.floor(1 + Math.random() * 6);
        game.myDiceRoll = roll;
        
        setTimeout(() => {
            if (box) {
                box.classList.remove('dice-spinning');
                box.innerText = roll;
            }
            game.sendAction('ROLL_DICE', { roll: roll });
            const btn = document.getElementById('btn-roll-dice');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.innerText = `🎲 Votre Dé : ${roll}`;
            }
        }, 700);
    },

    broadcast: (data) => {
        game.connections.forEach(conn => conn.send(data));
        if (data.type === 'ALERT') {
            ui.showOverlay("Info", data.msg);
        } else if (data.type === 'PARROT_RESULT') {
            ui.showParrotResultModal(data);
        }
    },

    broadcastState: () => {
        const state = game.state;
        
        const safeState = {
            started: game.state.started,
            deck1Count: game.state.deck1.length, deck2Count: game.state.deck2.length,
            deck1Thumbnail: game.state.deck1Thumbnail, deck2Thumbnail: game.state.deck2Thumbnail,
            turn: game.state.turn,
            currentDrawnCard: game.state.currentDrawnCard, forcedDeck: game.state.forcedDeck, mustPlaceDrawnCard: game.state.mustPlaceDrawnCard, disablePower: game.state.disablePower,
            parrotPredicting: game.state.parrotPredicting,
            parrotPredictedAnimal: game.state.parrotPredictedAnimal,
            crocodileTargeting: game.state.crocodileTargeting,
            monkeyTargeting: game.state.monkeyTargeting,
            crabTargeting: game.state.crabTargeting,
            players: game.state.players.map((p, idx) => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, row: p.row, color: p.color || game.getPlayerColor(idx) }))
        };
        game.broadcast({ type: 'STATE_UPDATE', state: safeState });
        ui.renderGameState(safeState, game.myId);
        
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        if(activePlayer && activePlayer.isBot) {
            const isFirstTurnOfGame = (!game.state.currentDrawnCard && game.state.players.every(p => !p.row || p.row.length === 0));
            const botDelay = isFirstTurnOfGame ? 2000 : 800;
            game.scheduleBotTurn(botDelay);
        }
    },

    scheduleBotTurn: (delay = 800) => {
        game.isBotTurnRunning = false;
        if (game.botTimer) clearTimeout(game.botTimer);
        game.botTimer = setTimeout(() => {
            game.playBotTurn();
        }, delay);
    },

    startGame: () => {
        game.isBotTurnRunning = false;
        vfx.clearAll();
        soundEngine.playIntroSound();
        if (game.state.players.length < 2) {
            ui.showOverlay("Action impossible", "Il faut au moins 2 joueurs pour démarrer la partie !");
            setTimeout(ui.hideOverlay, 3000);
            return;
        }
        let fullDeck = [];
        for(let i=0; i<8; i++) ANIMALS.forEach(animal => fullDeck.push({...animal}));
        
        // Anti-clumping Fisher-Yates shuffle
        for (let round = 0; round < 5; round++) {
            for (let i = fullDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
            }
        }

        // Anti-clumping pass: ensure no two adjacent cards share the same animal ID
        for (let i = 1; i < fullDeck.length; i++) {
            if (fullDeck[i].id === fullDeck[i - 1].id) {
                for (let j = i + 1; j < fullDeck.length; j++) {
                    if (fullDeck[j].id !== fullDeck[i - 1].id) {
                        [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
                        break;
                    }
                }
            }
        }
        
        game.state.deck1 = fullDeck.slice(0, 32);
        game.state.deck2 = fullDeck.slice(32);
        game.state.deck1Thumbnail = null;
        game.state.deck2Thumbnail = null;
        game.state.started = true;
        game.state.diceRolls = {};
        game.state.diceResolved = false;
        game.myDiceRoll = null;

        game.state.currentDrawnCard = null;
        game.state.mustPlaceDrawnCard = false;
        game.state.crabTargeting = null;
        game.state.monkeyTargeting = null;
        game.state.crocTargeting = null;

        // Initialiser une main vide pour tout le monde
        game.state.players.forEach((p, idx) => {
            p.row = [];
            if (p.score === undefined) p.score = 0;
            if (!p.color) p.color = game.getPlayerColor(idx);
        });
        
        game.broadcast({ type: 'DICE_ROLL_START', players: game.state.players });
        ui.showDiceModal(game.state.players, game.state.diceRolls);

        // Host automatically rolls for bots with staggered delays
        game.state.players.forEach((p, idx) => {
            if (p.isBot) {
                setTimeout(() => {
                    const botRoll = Math.floor(1 + Math.random() * 6);
                    game.handlePlayerAction(p.id, 'ROLL_DICE', { roll: botRoll });
                }, 700 + (idx * 400));
            }
        });

        // Safety fallback: auto-roll for any player/bot stuck after 5 seconds
        if (game.diceSafetyTimer) clearTimeout(game.diceSafetyTimer);
        game.diceSafetyTimer = setTimeout(() => {
            if (game.isHost && game.state.started && !game.state.diceResolved) {
                game.state.players.forEach(p => {
                    if (game.state.diceRolls[p.id] === undefined) {
                        const autoRoll = Math.floor(1 + Math.random() * 6);
                        game.handlePlayerAction(p.id, 'ROLL_DICE', { roll: autoRoll });
                    }
                });
            }
        }, 5000);
    },

    joinRoom: () => {
        const codeInput = document.getElementById('input-room-code');
        const nameInput = document.getElementById('input-player-name');
        const code = codeInput ? codeInput.value.trim() : '';
        const name = (nameInput && nameInput.value && nameInput.value.trim() !== '') ? nameInput.value.trim() : "Joueur";
        if (code.length !== 4) return;
        
        document.getElementById('join-msg').innerText = "Connexion...";
        
        sessionStorage.setItem('collect_room_code', code);
        sessionStorage.setItem('collect_player_name', name);

        game.peer = new Peer({ config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] } });
        
        game.peer.on('error', (err) => { document.getElementById('join-msg').innerText = "Erreur (" + err.type + ")"; });
        game.peer.on('open', (id) => {
            game.myId = id;
            game.myName = name;
            sessionStorage.setItem('collect_player_id', id);

            const conn = game.peer.connect(`collect-${code}`);
            game.clientConn = conn;
            game.connections = [conn];

            conn.on('open', () => { 
                conn.send({ type: 'JOIN', name: name, reconnectId: id }); 
            });
            conn.on('data', (data) => {
                game.handleClientData(data, code);
            });
            conn.on('close', () => {
                game.clientConn = null;
            });
        });
    },

    reconnectClient: (code, name, reconnectId) => {
        if (game.isReconnecting) return;
        game.isReconnecting = true;
        console.log("reconnectClient triggered for room:", code);

        if (game.peer) {
            try { game.peer.destroy(); } catch(e){}
        }

        game.peer = new Peer({ config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] } });
        
        game.peer.on('open', (id) => {
            game.myId = id;
            game.myName = name;
            const conn = game.peer.connect(`collect-${code}`);
            game.clientConn = conn;
            game.connections = [conn];

            conn.on('open', () => {
                game.isReconnecting = false;
                conn.send({ type: 'JOIN', name: name, reconnectId: reconnectId || id });
            });

            conn.on('data', (data) => {
                game.handleClientData(data, code);
            });

            conn.on('close', () => {
                game.clientConn = null;
            });
        });

        game.peer.on('error', () => {
            game.isReconnecting = false;
        });
    },

    handleClientData: (data, code) => {
        if(data.type === 'ERROR') document.getElementById('join-msg').innerText = data.msg;
        else if(data.type === 'PLAYERS_UPDATE') {
            ui.showScreen('screen-host');
            const codeEl = document.getElementById('room-code-display');
            if (codeEl) { codeEl.innerText = code; codeEl.textContent = code; }
            const hostAct = document.querySelector('.host-actions');
            if (hostAct) hostAct.style.display = 'none';
            ui.updateWaitingPlayers(data.players);
        } 
        else if(data.type === 'STATE_UPDATE' || data.type === 'RECONNECT_SUCCESS') {
            if (data.state) {
                game.state = data.state;
                if (game.state.started) {
                    ui.showScreen('screen-game');
                } else {
                    ui.showScreen('screen-host');
                    const codeEl = document.getElementById('room-code-display');
                    if (codeEl) { codeEl.innerText = code; codeEl.textContent = code; }
                    const hostAct = document.querySelector('.host-actions');
                    if (hostAct) hostAct.style.display = 'none';
                    ui.updateWaitingPlayers(game.state.players);
                }
                ui.renderGameState(game.state);
            }
        }
        else if(data.type === 'DICE_ROLL_START') {
            game.myDiceRoll = null;
            if (!game.state) game.state = {};
            game.state.players = data.players;
            ui.dicePlayersCache = data.players;
            ui.showDiceModal(data.players, {});
        }
        else if(data.type === 'DICE_ROLL_UPDATE') {
            if (data.players) ui.dicePlayersCache = data.players;
            const players = (data.players && data.players.length) ? data.players : (ui.dicePlayersCache || (game.state ? game.state.players : []));
            ui.updateDiceScores(players, data.diceRolls);
        }
        else if(data.type === 'DICE_ROLL_WINNER') {
            if (data.players) ui.dicePlayersCache = data.players;
            const players = (data.players && data.players.length) ? data.players : (ui.dicePlayersCache || (game.state ? game.state.players : []));
            ui.updateDiceScores(players, data.diceRolls || {}, data.winnerId);
            setTimeout(() => {
                ui.hideDiceModal();
                ui.showScreen('screen-game');
                if (game.state) ui.renderGameState(game.state, game.myId);
            }, 2200);
        }
        else if(data.type === 'START_GAME') { 
            ui.showScreen('screen-game'); 
            document.getElementById('victory-modal').style.display = 'none';
        }
        else if(data.type === 'KICK') {
            ui.showOverlay("Salon", data.msg || "Vous avez été retiré du salon par l'hôte.");
            sessionStorage.removeItem('collect_room_code');
            if (game.peer) { try { game.peer.destroy(); } catch(e){} }
            setTimeout(() => { ui.hideOverlay(); ui.showScreen('screen-home'); }, 2200);
        }
        else if(data.type === 'ALERT') ui.showOverlay("Info", data.msg);
        else if(data.type === 'PARROT_RESULT') {
            ui.showParrotResultModal(data);
        }
        else if(data.type === 'HERMIT_EXTRA_TURN') {
            ui.showHermitLoveModal(data.playerId, data.playerName);
        }
        else if(data.type === 'VFX') game.handleVFX(data);
        else if(data.type === 'VICTORY') ui.showVictoryModal(data.winner, data.reason, data.row);
        else if(data.type === 'HISTORY_UPDATE') ui.renderHistory(data.history);
    },

    sendAction: (action, payload) => {
        if(game.isHost) game.handlePlayerAction(game.myId, action, payload);
        else if (game.connections && game.connections[0]) game.connections[0].send({ type: 'ACTION', action, payload });
    },

    drawCard: (deckIndex) => { game.sendAction('DRAW', { deckIndex }); },
    rejectCard: () => { game.sendAction('REJECT', {}); },
    placeCard: (side, skipPower = false) => {
        game.sendAction('PLACE', { side: side, skipPower: skipPower });
    },
    // --- HOST LOGIC ---
    handlePlayerAction: (playerId, action, payload) => {
        if(!game.isHost) return;
        
        if (action === 'REMATCH') {
            if (!game.state.rematchVotes.includes(playerId)) {
                game.state.rematchVotes.push(playerId);
                game.broadcastState();
            }
            if (game.state.rematchVotes.length === game.state.players.length) {
                game.state.players.forEach(p => p.row = []);
                game.state.rematchVotes = [];
                ui.hideOverlay();
                document.getElementById('victory-modal').style.display = 'none';
                game.startGame();
            }
            return;
        }

        if (action === 'ROLL_DICE') {
            if (!game.state.diceRolls) game.state.diceRolls = {};
            game.state.diceRolls[playerId] = payload.roll;
            
            game.broadcast({ type: 'DICE_ROLL_UPDATE', diceRolls: game.state.diceRolls, players: game.state.players });
            ui.updateDiceScores(game.state.players, game.state.diceRolls);

            const allRolled = game.state.players.every(p => game.state.diceRolls[p.id] !== undefined);
            if (allRolled && !game.state.diceResolved) {
                game.state.diceResolved = true;
                
                let maxRoll = -1;
                let winner = game.state.players[0];
                game.state.players.forEach(p => {
                    const r = game.state.diceRolls[p.id] || 0;
                    if (r > maxRoll) {
                        maxRoll = r;
                        winner = p;
                    }
                });

                const winnerIndex = game.state.players.findIndex(p => p.id === winner.id);
                game.state.turnIndex = (winnerIndex !== -1) ? winnerIndex : 0;
                game.state.turn = winner.id;
                game.state.currentDrawnCard = null;
                game.state.mustPlaceDrawnCard = false;
                game.resetTurnTimer(30);

                game.broadcast({ type: 'DICE_ROLL_WINNER', winnerId: winner.id, winnerName: winner.name, winnerScore: maxRoll });
                ui.updateDiceScores(game.state.players, game.state.diceRolls, winner.id);

                setTimeout(() => {
                    ui.hideDiceModal();
                    ui.showScreen('screen-game');
                    document.getElementById('victory-modal').style.display = 'none';
                    game.broadcastState();
                }, 2200);
            }
            return;
        }

        if (action === 'MONKEY_INIT') {
            game.state.monkeyTargeting = playerId;
            game.broadcastState();
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            if (sourcePlayer && sourcePlayer.isBot) setTimeout(game.playBotTurn, 800);
            return;
        }

        if (action === 'PARROT_INIT') {
            game.state.parrotPredicting = playerId;
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            const side = payload.side || 'right';
            const parrotCardObj = ANIMALS.find(a => a.id === 'parrot') || { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg?v=4' };
            
            if (side === 'left') sourcePlayer.row.unshift(parrotCardObj);
            else sourcePlayer.row.push(parrotCardObj);

            game.triggerVFX({ action: 'PLACE', player: playerId, card: parrotCardObj, side: side });
            game.state.currentDrawnCard = null;
            game.addHistory(`${sourcePlayer.name} pose son Perroquet 🦜 et s'apprête à prédire...`);
            game.broadcastState();
            if (sourcePlayer && sourcePlayer.isBot) setTimeout(game.playBotTurn, 800);
            return;
        }

        if (action === 'PARROT_PREDICT') {
            game.state.parrotPredicting = null;
            game.state.parrotPredictedAnimal = payload.animalId;
            game.state.currentDrawnCard = null;
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            const animalObj = ANIMALS.find(a => a.id === payload.animalId);
            game.addHistory(`${sourcePlayer.name} prédit : ${animalObj.name}.`);
            game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a prédit : ${animalObj ? animalObj.name : ''} ! Choisissez une pioche (Gauche ou Droite).` });
            game.broadcastState();

            if (sourcePlayer && sourcePlayer.isBot) {
                setTimeout(game.playBotTurn, 800);
            }
            return;
        }
        else if (action === 'CROCODILE_SELECT') {
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            if (payload.skip) {
                game.state.crocodileTargeting = null;
                game.addHistory(`${sourcePlayer.name} passe le pouvoir du Crocodile.`);
                game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a épargné ses adversaires !` });
                game.broadcastState();
                setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                return;
            }
            const targetPlayer = game.state.players.find(p => p.id === payload.targetPlayerId);
            if (targetPlayer && targetPlayer.row.length > payload.cardIndex) {
                game.state.crocodileTargeting = null;
                const targetCardName = targetPlayer.row[payload.cardIndex].name || "une carte";
                game.addHistory(`${sourcePlayer.name} 🐊 dévore la carte ${targetCardName} de ${targetPlayer.name}.`);
                
                let crocIndex = -1;
                for (let i = sourcePlayer.row.length - 1; i >= 0; i--) {
                    if (sourcePlayer.row[i].id === 'crocodile') { crocIndex = i; break; }
                }
                
                game.triggerVFX({ 
                    action: 'CROCODILE_ATTACK', 
                    attackerId: sourcePlayer.id, 
                    attackerIndex: crocIndex, 
                    crocImg: sourcePlayer.row[crocIndex]?.img,
                    targetId: targetPlayer.id, 
                    targetIndex: payload.cardIndex 
                });

                setTimeout(() => {
                    game.broadcast({ type: 'ALERT', msg: `Le Crocodile de ${sourcePlayer.name} a dévoré une carte de ${targetPlayer.name} !` });
                    targetPlayer.row.splice(payload.cardIndex, 1);
                    game.broadcastState();
                    setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                }, 1400);
                return;
            }
        }
        else if (action === 'MONKEY_SELECT') {
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            if (payload.skip) {
                game.state.monkeyTargeting = null;
                game.state.disablePower = true;
                game.addHistory(`${sourcePlayer.name} passe le pouvoir du Singe.`);
                game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a gardé son Singe sans cibler d'adversaire !` });
                game.broadcastState();
                if (sourcePlayer.isBot) setTimeout(game.playBotTurn, 800);
                return;
            }
            const targetPlayer = game.state.players.find(p => p.id === payload.targetPlayerId);
            if (targetPlayer && targetPlayer.row.length > payload.cardIndex) {
                game.state.monkeyTargeting = null;
                const targetCardName = targetPlayer.row[payload.cardIndex].name || "une carte";
                game.addHistory(`${sourcePlayer.name} 🐒 vole la carte ${targetCardName} de ${targetPlayer.name} avec son Singe.`);
                
                const oppCard = targetPlayer.row[payload.cardIndex];
                const monkeyCard = game.state.currentDrawnCard;
                
                game.triggerVFX({
                    action: 'MONKEY_STEAL',
                    playerA: sourcePlayer.id,
                    playerB: targetPlayer.id, 
                    indexB: payload.cardIndex, 
                    cardImgB: oppCard.img,
                    monkeyImg: monkeyCard ? monkeyCard.img : 'assets/card_monkey.jpg?v=4'
                });

                setTimeout(() => {
                    targetPlayer.row[payload.cardIndex] = monkeyCard;
                    game.state.currentDrawnCard = oppCard;
                    game.state.mustPlaceDrawnCard = true;
                    game.state.disablePower = true;
                    game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a volé une carte à ${targetPlayer.name} avec son Singe !` });
                    game.broadcastState();
                    if (sourcePlayer.isBot) setTimeout(game.playBotTurn, 800);
                }, 600);
                return;
            }
        }
        else if (action === 'CRAB_SELECT') {
            const player = game.state.players.find(p => p.id === playerId);
            if (player && game.state.crabTargeting === playerId) {
                game.state.crabTargeting = null;
                if (!payload.skip && payload.targetPlayerId !== undefined) {
                    const targetPlayer = game.state.players.find(p => p.id === payload.targetPlayerId);
                    if (targetPlayer && targetPlayer.row.length > payload.originalIndex && targetPlayer.row.length > 1) {
                        const targetCard = targetPlayer.row[payload.originalIndex];
                        game.triggerVFX({ action: 'CRAB_MOVE', player: targetPlayer.id, cardImg: targetCard.img, originalIndex: payload.originalIndex, currentIndex: payload.currentIndex });
                        setTimeout(() => {
                            const cardToMove = targetPlayer.row.splice(payload.originalIndex, 1)[0];
                            targetPlayer.row.splice(payload.currentIndex, 0, cardToMove);
                            
                            const targetCardName = targetCard.name || "une carte";
                            game.addHistory(`${player.name} 🦀 déplace la carte ${targetCardName} de ${targetPlayer.name}.`);
                            game.broadcast({ type: 'ALERT', msg: `Le Crabe de ${player.name} a déplacé la carte ${targetCardName} de ${targetPlayer.name} !` });
                            game.broadcastState();
                            setTimeout(() => { game.finalizeTurn(player); }, 800);
                        }, 600);
                        return;
                    }
                }
                game.addHistory(`${player.name} passe le pouvoir du Crabe.`);
                game.broadcast({ type: 'ALERT', msg: `${player.name} passe le pouvoir de son Crabe.` });
                game.broadcastState();
                setTimeout(() => { game.finalizeTurn(player); }, 800);
                return;
            }
        }

        const activeTurnPlayer = game.state.players.find(p => p.id === game.state.turn);
        const actionSenderPlayer = game.state.players.find(p => p.id === playerId) || (playerId === game.myId ? game.state.players.find(p => !p.isBot) : null);

        if (!activeTurnPlayer || !actionSenderPlayer || activeTurnPlayer.id !== actionSenderPlayer.id) {
            return;
        }

        if (action === 'DRAW') {
            if(game.state.currentDrawnCard && !game.state.parrotPredictedAnimal) return;
            if(game.state.parrotPredicting) return;
            if(game.state.forcedDeck && payload.deckIndex !== game.state.forcedDeck) return;

            let card = null;
            if (payload.deckIndex === 1 && game.state.deck1.length > 0) {
                card = game.state.deck1.pop();
                game.state.deck1Thumbnail = null;
            }
            else if (payload.deckIndex === 2 && game.state.deck2.length > 0) {
                card = game.state.deck2.pop();
                game.state.deck2Thumbnail = null;
            }

            if (card) {
                const sourcePlayer = actionSenderPlayer;
                game.addHistory(`${sourcePlayer.name} pioche ${card.name}.`);

                if (game.state.parrotPredictedAnimal) {
                    const predictedAnimalObj = ANIMALS.find(a => a.id === game.state.parrotPredictedAnimal);
                    const predictedName = predictedAnimalObj ? predictedAnimalObj.name : "un animal";
                    const parrotCardObj = ANIMALS.find(a => a.id === 'parrot') || { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg?v=4' };

                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.state.mustPlaceDrawnCard = true;
                    
                    if (card.id === game.state.parrotPredictedAnimal) {
                        game.broadcast({ 
                            type: 'PARROT_RESULT', 
                            success: true, 
                            playerName: sourcePlayer.name,
                            cardImg: card.img,
                            cardName: card.name,
                            predictedName: predictedName
                        });
                        game.broadcastState();

                        setTimeout(() => {
                            game.state.parrotPredictedAnimal = null;
                            game.state.currentDrawnCard = card;
                            game.state.mustPlaceDrawnCard = true;
                            game.state.disablePower = true;
                            game.broadcastState();
                            if (sourcePlayer.isBot) setTimeout(game.playBotTurn, 600);
                        }, 2000);
                    } else {
                        game.broadcast({ 
                            type: 'PARROT_RESULT', 
                            success: false, 
                            playerName: sourcePlayer.name,
                            cardImg: card.img,
                            cardName: card.name,
                            predictedName: predictedName
                        });
                        game.broadcastState();

                        setTimeout(() => {
                            if (payload.deckIndex === 1) {
                                game.state.deck1.push(card);
                                game.state.deck1Thumbnail = card.img;
                            } else {
                                game.state.deck2.push(card);
                                game.state.deck2Thumbnail = card.img;
                            }
                            
                            game.state.parrotPredictedAnimal = null;
                            game.state.currentDrawnCard = null;
                            game.state.mustPlaceDrawnCard = false;
                            game.state.disablePower = false;
                            game.broadcastState();
                            game.finalizeTurn(sourcePlayer);
                        }, 2000);
                    }
                } else {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.broadcastState();
                    if (sourcePlayer.isBot) setTimeout(game.playBotTurn, 800);
                }
            }
        }
        else if (action === 'REJECT') {
            if(!game.state.currentDrawnCard) return;
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            game.addHistory(`${sourcePlayer.name} défausse la carte.`);

            if(game.state.originalDeckIndex === 1) {
                game.state.deck1.push(game.state.currentDrawnCard);
                game.state.deck1Thumbnail = game.state.currentDrawnCard.img;
            }
            else {
                game.state.deck2.push(game.state.currentDrawnCard);
                game.state.deck2Thumbnail = game.state.currentDrawnCard.img;
            }
            
            game.state.currentDrawnCard = null;
            game.triggerVFX({ action: 'REJECT', player: playerId });

            if (payload && payload.endTurn) {
                game.state.forcedDeck = null;
                game.state.mustPlaceDrawnCard = false;
                setTimeout(() => {
                    const p = game.state.players.find(x => x.id === playerId);
                    if (p) game.finalizeTurn(p);
                }, 500);
            } else {
                game.state.forcedDeck = game.state.originalDeckIndex === 1 ? 2 : 1;
                game.state.mustPlaceDrawnCard = true;
                setTimeout(() => {
                    game.broadcastState();
                    const p = game.state.players.find(x => x.id === playerId);
                    if (p && p.isBot) setTimeout(game.playBotTurn, 800);
                }, 500);
            }
        }
        else if (action === 'PLACE') {
            if(!game.state.currentDrawnCard) return;
            if (game.state.parrotPredictedAnimal) return; // Block cheating
            const player = game.state.players.find(p => p.id === playerId);
            const card = game.state.currentDrawnCard;
            
            game.addHistory(`${player.name} pose ${card.name} dans son jeu.`);

            if(payload.side === 'left') player.row.unshift(card);
            else player.row.push(card);
            
            game.state.currentDrawnCard = null;
            game.state.forcedDeck = null;
            game.state.mustPlaceDrawnCard = false;
            
            const wasDisablePower = game.state.disablePower;
            game.state.disablePower = false;

            game.triggerVFX({ action: 'PLACE', player: playerId, card: card, side: payload.side });

            // Check victory IMMEDIATELY upon placing the card into the row!
            const winCheck = game.checkVictoryCondition(player);
            if (winCheck.won) {
                setTimeout(() => {
                    game.triggerVictory(player, winCheck.reason, winCheck.winningCardIndices);
                }, 600);
                return;
            }

            setTimeout(() => {
                game.applyAnimalEffects(player, card, payload.side, payload.skipPower || wasDisablePower);
            }, 600);
            return;
        }
    },

    checkVictoryCondition: (player) => {
        if (!player || !player.row || player.row.length === 0) {
            return { won: false, reason: '', winningCardIndices: [] };
        }

        // 1. Lion + 7 unique species
        const nonLions = player.row.filter(c => c.id !== 'lion');
        const hasChameleon = nonLions.some(c => c.id === 'chameleon');
        const uniqueSpecies = new Set(nonLions.filter(c => c.id !== 'chameleon').map(c => c.id));
        const effectiveUniqueCount = uniqueSpecies.size + (hasChameleon ? 1 : 0);
        if (player.row.find(c => c.id === 'lion') && effectiveUniqueCount >= 7) {
            const allIndices = player.row.map((_, i) => i);
            return { won: true, reason: "grâce au Lion (7 espèces différentes) !", winningCardIndices: allIndices };
        }

        // 2. 4 Contiguous matching species (sliding window of 4)
        if (player.row.length >= 4) {
            for (let i = 0; i <= player.row.length - 4; i++) {
                const slice = player.row.slice(i, i + 4);
                const nonChameleons = slice.filter(c => c.id !== 'chameleon').map(c => c.id);
                const uniqueSet = new Set(nonChameleons);
                if (uniqueSet.size <= 1) {
                    return { won: true, reason: "en alignant 4 animaux identiques !", winningCardIndices: [i, i + 1, i + 2, i + 3] };
                }
            }
        }

        // 3. Octopus (3 pairs)
        if (player.row.find(c => c.id === 'octopus')) {
            let frequencies = {};
            let chameleonIndices = [];
            player.row.forEach((c, idx) => {
                if (c.id === 'chameleon') chameleonIndices.push(idx);
                else {
                    if (!frequencies[c.id]) frequencies[c.id] = [];
                    frequencies[c.id].push(idx);
                }
            });

            let pairsIndices = [];
            let unusedChameleons = [...chameleonIndices];

            for (let id in frequencies) {
                const idxs = frequencies[id];
                while (idxs.length >= 2) {
                    pairsIndices.push(idxs.pop(), idxs.pop());
                }
            }
            for (let id in frequencies) {
                const idxs = frequencies[id];
                if (idxs.length === 1 && unusedChameleons.length > 0) {
                    pairsIndices.push(idxs.pop());
                    pairsIndices.push(unusedChameleons.pop());
                }
            }

            if (pairsIndices.length >= 6) {
                const octopusIdx = player.row.findIndex(c => c.id === 'octopus');
                if (octopusIdx !== -1 && !pairsIndices.includes(octopusIdx)) pairsIndices.push(octopusIdx);
                return { won: true, reason: "grâce à la Pieuvre (3 paires) !", winningCardIndices: pairsIndices };
            }
        }

        // 4. 4 Hermit Crabs anywhere
        const hermitIndices = player.row.map((c, idx) => c.id === 'hermit_crab' ? idx : -1).filter(idx => idx !== -1);
        if (hermitIndices.length >= 4) {
            return { won: true, reason: "en réunissant 4 Bernard l'hermite !", winningCardIndices: hermitIndices };
        }

        return { won: false, reason: '', winningCardIndices: [] };
    },

    triggerVictory: (winner, reason, winningCardIndices = []) => {
        game.addHistory(`🏆 ${winner.name} GAGNE !`);
        winner.score += 0.5;
        game.state.started = false;
        game.state.rematchVotes = game.state.players.filter(p => p.isBot).map(p => p.id);
        game.broadcast({ type: 'VICTORY', winner: winner, reason: reason, row: winner.row, winningCardIndices: winningCardIndices });
        ui.showVictoryModal(winner, reason, winner.row, winningCardIndices);
        game.broadcastState();
    },

    applyAnimalEffects: (player, card, side, skipPower = false) => {
        if (skipPower) {
            game.finalizeTurn(player, false);
            return;
        }

        if (card.id === 'crocodile') {
            game.state.crocodileTargeting = player.id;
            game.broadcastState();
            return; 
        }

        if (card.id === 'crab') {
            game.state.crabTargeting = player.id;
            game.broadcastState();
            return;
        }

        if (card.id === 'parrot') {
            game.state.parrotPredicting = player.id;
            game.broadcastState();
            return;
        }
        
        let getsExtraTurn = false;
        if (card.id === 'hermit_crab' && player.row.find(c => c.id === 'crab' || c.id === 'chameleon')) {
            getsExtraTurn = true;
        }
        
        game.finalizeTurn(player, getsExtraTurn);
    },

    finalizeTurn: (player, getsExtraTurn = false) => {
        game.isBotTurnRunning = false;
        game.resetTurnTimer(30);
        // Règle passive : 2 Caméléons s'annulent toujours
        const chameleons = player.row.filter(c => c.id === 'chameleon');
        if (chameleons.length >= 2) {
            game.broadcast({ type: 'ALERT', msg: `Les Caméléons de ${player.name} s'annulent !` });
            player.row = player.row.filter(c => c.id !== 'chameleon');
            game.triggerVFX({ action: 'REJECT', player: player.id });
        }

        const winCheck = game.checkVictoryCondition(player);
        if (winCheck.won) {
            game.triggerVictory(player, winCheck.reason, winCheck.winningCardIndices);
            return;
        }

        if (getsExtraTurn) {
            game.addHistory(`${player.name} 💕 rejoue grâce à l'amour du Bernard l'hermite et du Crabe !`);
            game.broadcast({ type: 'HERMIT_EXTRA_TURN', playerId: player.id, playerName: player.name });
            ui.showHermitLoveModal(player.id, player.name);
        } else {
            game.state.turnIndex = (game.state.turnIndex + 1) % game.state.players.length;
            game.state.turn = game.state.players[game.state.turnIndex].id;
        }
        game.state.mustPlaceDrawnCard = false;
        game.broadcastState();
    },

    triggerVFX: (vfxData) => {
        game.broadcast({ type: 'VFX', data: vfxData });
        game.handleVFX({ data: vfxData });
    },
    
    handleVFX: (event) => {
        const data = event.data || event; 
        if(data.action === 'PLACE') {
            vfx.push((done) => {
                const is1v1 = game.state.players.length === 2;
                const containerId = data.player === game.myId ? 'my-row' : (is1v1 ? 'opp-1v1-row' : `opp-cards-${data.player}`);
                const container = document.getElementById(containerId);
                
                const origCard = document.getElementById('drawn-card-img');
                if (origCard && data.player === game.myId) origCard.style.opacity = '0';
                
                let tRect = { left: window.innerWidth/2, top: data.player === game.myId ? window.innerHeight - 50 : 50, width: 75, height: 110 };
                if (container) {
                    const placeholder = document.createElement('div');
                    placeholder.style.width = (data.player === game.myId ? 75 : 40) + 'px';
                    placeholder.style.height = (data.player === game.myId ? 110 : 60) + 'px';
                    placeholder.style.flexShrink = '0';
                    if (data.side === 'left') container.prepend(placeholder);
                    else container.appendChild(placeholder);
                    
                    tRect = placeholder.getBoundingClientRect();
                    // Fallback to top if container returned 0/0 because it is hidden
                    if (tRect.top === 0 && tRect.left === 0 && data.player !== game.myId) {
                        tRect = { left: window.innerWidth/2, top: 50, width: 40, height: 60 };
                    }
                    placeholder.remove();
                }

                vfx.flyCardToRect(data.card.img, 'drawn-card-img', tRect, () => {
                    done();
                });
            });
        }
        else if (data.action === 'CROCODILE_BITE') {
            soundEngine.playAnimalSound('crocodile');
            vfx.push((done) => {
                const targetElement = document.getElementById(`card-target-${data.player}-${data.cardIndex}`);
                if (targetElement) vfx.crocodileBite(targetElement, done);
                else done(); 
            });
        }
        else if (data.action === 'CROCODILE_ATTACK') {
            soundEngine.playAnimalSound('crocodile');
            vfx.push((done) => {
                const crocCard = document.getElementById(`card-target-${data.attackerId}-${data.attackerIndex}`);
                const targetCard = document.getElementById(`card-target-${data.targetId}-${data.targetIndex}`);
                if (targetCard && data.crocImg) {
                    const sRect = crocCard ? crocCard.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 80, height: 120 };
                    const tRect = targetCard.getBoundingClientRect();
                    vfx.flyCardToRect(data.crocImg, null, tRect, () => {
                        vfx.crocodileBite(targetCard, () => { done(); });
                    }, sRect, 'attack');
                } else done();
            });
        }
        else if (data.action === 'PARROT_FLY') {
            soundEngine.playAnimalSound('parrot');
            vfx.push((done) => {
                const drawnEl = document.getElementById('drawn-card') || document.body;
                const rect = drawnEl.getBoundingClientRect();
                
                const parrotImg = document.createElement('img');
                parrotImg.src = 'assets/card_parrot.jpg?v=4';
                parrotImg.className = 'flying-card';
                parrotImg.style.position = 'fixed';
                parrotImg.style.zIndex = '10002';
                parrotImg.style.left = rect.left + 'px';
                parrotImg.style.top = rect.top + 'px';
                parrotImg.style.width = (rect.width || 120) + 'px';
                parrotImg.style.height = (rect.height || 180) + 'px';
                parrotImg.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
                parrotImg.style.borderRadius = '20px';
                document.body.appendChild(parrotImg);
                
                parrotImg.offsetHeight; // reflow
                
                parrotImg.style.transform = 'translateY(-400px) scale(0.2) rotate(35deg)';
                parrotImg.style.opacity = '0';
                
                setTimeout(() => {
                    parrotImg.remove();
                    done();
                }, 1000);
            });
        }
        else if (data.action === 'REJECT') {
             vfx.push((done) => {
                const c = document.getElementById('drawn-card');
                if(c) {
                    c.style.transform = 'scale(0)';
                    c.style.transition = 'transform 0.3s';
                }
                setTimeout(() => { if(c) c.style.transform = ''; done(); }, 300);
             });
        }
        else if (data.action === 'MONKEY_STEAL') {
            soundEngine.playAnimalSound('monkey');
            vfx.push((done) => {
                const targetCard = document.getElementById(`card-target-${data.playerB}-${data.indexB}`);
                const drawnCardArea = document.getElementById('drawn-card-img') || document.getElementById('drawn-card');
                
                const sRectB = targetCard 
                    ? targetCard.getBoundingClientRect() 
                    : { left: window.innerWidth/2, top: 80, width: 60, height: 90 };

                const sRectA = drawnCardArea 
                    ? drawnCardArea.getBoundingClientRect() 
                    : { left: window.innerWidth/2, top: window.innerHeight - 150, width: 90, height: 135 };

                if (targetCard) targetCard.style.opacity = '0';
                if (drawnCardArea && data.playerA === game.myId) drawnCardArea.style.opacity = '0';

                // 1. Fly Stolen Card (Card B) -> to Player A's drawn area
                vfx.flyCardToRect(data.cardImgB, null, sRectA, null, sRectB, 'simple-swap');

                // 2. Fly Monkey Card (Card A) -> to Player B's target card slot
                const monkeyImg = data.monkeyImg || 'assets/card_monkey.jpg?v=4';
                vfx.flyCardToRect(monkeyImg, null, sRectB, () => {
                    if (targetCard) targetCard.style.opacity = '1';
                    if (drawnCardArea && data.playerA === game.myId) drawnCardArea.style.opacity = '1';
                    done();
                }, sRectA, 'simple-swap');
            });
        }
        else if (data.action === 'CRAB_MOVE') {
            soundEngine.playAnimalSound('crab');
            vfx.push((done) => {
                const cardEl = document.getElementById(`card-target-${data.player}-${data.originalIndex}`);
                const is1v1 = game.state.players.length === 2;
                const containerId = data.player === game.myId ? 'my-row' : (is1v1 ? 'opp-1v1-row' : `opp-cards-${data.player}`);
                const container = document.getElementById(containerId);
                if (cardEl && container) {
                    const sRect = cardEl.getBoundingClientRect();
                    const placeholder = document.createElement('div');
                    placeholder.style.width = (data.player === game.myId ? 75 : 40) + 'px';
                    placeholder.style.height = (data.player === game.myId ? 110 : 60) + 'px';
                    placeholder.style.flexShrink = '0';
                    
                    if (data.currentIndex < container.children.length) {
                        container.insertBefore(placeholder, container.children[data.currentIndex]);
                    } else {
                        container.appendChild(placeholder);
                    }
                    
                    let tRect = placeholder.getBoundingClientRect();
                    if (tRect.top === 0 && tRect.left === 0 && data.player !== game.myId) {
                        tRect = { left: window.innerWidth/2, top: 50, width: 40, height: 60 };
                    }
                    placeholder.remove();
                    cardEl.style.opacity = '0';
                    vfx.flyCardToRect(data.cardImg, null, tRect, () => { done(); }, sRect, 'crab-walk');
                } else done();
            });
        }
    },

    // --- BOTS ---
    playBotTurn: () => {
        if (!game.state.started) return;
        if (game.isBotTurnRunning) return;
        game.isBotTurnRunning = true;

        const resetGuard = () => { game.isBotTurnRunning = false; };

        const botId = game.state.turn;
        const bot = game.state.players.find(p => p.id === botId);
        if(!bot || !bot.isBot) {
            resetGuard();
            return;
        }
        
        if (game.state.crocodileTargeting === botId) {
            setTimeout(() => {
                resetGuard();
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 0);
                if (opponents.length > 0) {
                    let bestTarget = null;
                    let bestCardIndex = 0;
                    let maxScore = -999;

                    opponents.forEach(opp => {
                        const len = opp.row.length;
                        opp.row.forEach((card, idx) => {
                            let score = 0;

                            // 1. Is this card part of an adjacent pair in opp's row? (Break pairs!)
                            const isPairedWithLeft = (idx > 0 && opp.row[idx - 1].id === card.id);
                            const isPairedWithRight = (idx < len - 1 && opp.row[idx + 1].id === card.id);
                            const isChameleonLeft = (idx > 0 && opp.row[idx - 1].id === 'chameleon');
                            const isChameleonRight = (idx < len - 1 && opp.row[idx + 1].id === 'chameleon');

                            if (isPairedWithLeft || isPairedWithRight) {
                                score += 80; // High priority to break adjacent pairs!
                            }
                            if (isChameleonLeft || isChameleonRight) {
                                score += 60; // Break chameleon pairs
                            }

                            // 2. Is this card at the edge of opp's row? (Edge cards are active pair builders)
                            const isEdge = (idx === 0 || idx === len - 1);
                            if (isEdge) {
                                score += 30;
                                if (isPairedWithLeft || isPairedWithRight) score += 50; // Edge pair combo bonus!
                            }

                            // 3. Opponent Threat Level (Close to winning?)
                            const uniqueAnimals = new Set(opp.row.filter(c => c.id !== 'lion').map(c => c.id));
                            const hasLion = opp.row.some(c => c.id === 'lion');
                            if (hasLion && uniqueAnimals.size >= 5) {
                                score += 120; // Critical threat! Destroy their cards!
                            }

                            let pairCount = 0;
                            const freqs = {};
                            opp.row.forEach(c => freqs[c.id] = (freqs[c.id] || 0) + 1);
                            Object.values(freqs).forEach(count => { if (count >= 2) pairCount++; });
                            if (pairCount >= 2 && (isPairedWithLeft || isPairedWithRight)) {
                                score += 100; // Critical threat to break octopus 3-pair win!
                            }

                            // 4. Animal Type Importance
                            if (card.id === 'crocodile') score += 45; // Destroy opponent crocodiles!
                            else if (card.id === 'lion') score += 50; // Destroy opponent lions!
                            else if (card.id === 'octopus') score += 35;
                            else if (card.id === 'hermit_crab') score += 30;
                            else if (card.id === 'chameleon') score += 25;
                            else if (card.id === 'monkey') score += 15;

                            score += Math.random() * 5; // Natural tie-breaking noise

                            if (score > maxScore) {
                                maxScore = score;
                                bestTarget = opp;
                                bestCardIndex = idx;
                            }
                        });
                    });

                    if (bestTarget) {
                        game.handlePlayerAction(botId, 'CROCODILE_SELECT', { targetPlayerId: bestTarget.id, cardIndex: bestCardIndex });
                    } else {
                        game.handlePlayerAction(botId, 'CROCODILE_SELECT', { skip: true });
                    }
                } else {
                    game.handlePlayerAction(botId, 'CROCODILE_SELECT', { skip: true });
                }
            }, 600);
            return;
        }
        
        if (game.state.monkeyTargeting === botId) {
            setTimeout(() => {
                resetGuard();
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 0);
                if (opponents.length > 0) {
                    let chosenTarget = null;
                    let chosenCardIndex = -1;

                    const botLeft = bot.row.length > 0 ? bot.row[0].id : null;
                    const botRight = bot.row.length > 0 ? bot.row[bot.row.length - 1].id : null;

                    for (let opp of opponents) {
                        for (let i = 0; i < opp.row.length; i++) {
                            const cId = opp.row[i].id;
                            if ((botLeft && cId === botLeft) || (botRight && cId === botRight) || cId === 'lion' || cId === 'chameleon') {
                                chosenTarget = opp;
                                chosenCardIndex = i;
                                break;
                            }
                        }
                        if (chosenTarget) break;
                    }

                    if (!chosenTarget) {
                        chosenTarget = opponents[Math.floor(Math.random() * opponents.length)];
                        chosenCardIndex = Math.floor(Math.random() * chosenTarget.row.length);
                    }

                    game.handlePlayerAction(botId, 'MONKEY_SELECT', { targetPlayerId: chosenTarget.id, cardIndex: chosenCardIndex });
                } else {
                    game.handlePlayerAction(botId, 'MONKEY_SELECT', { skip: true });
                }
            }, 600);
            return;
        }
        
        if (game.state.crabTargeting === botId) {
            setTimeout(() => {
                resetGuard();
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 1);
                let target = null;
                let cIndex = -1;
                let index = -1;
                for (let opp of opponents) {
                    for (let i = 0; i < opp.row.length - 1; i++) {
                        if (opp.row[i].id === opp.row[i+1].id) {
                            target = opp;
                            index = i;
                            break;
                        }
                    }
                    if (target) break;
                }
                
                if (target) {
                    let newIndex = index;
                    if (index === 0) newIndex = 1;
                    else if (index === target.row.length - 1) newIndex = index - 1;
                    else newIndex = Math.random() > 0.5 ? index - 1 : index + 1;
                    game.handlePlayerAction(botId, 'CRAB_SELECT', { targetPlayerId: target.id, originalIndex: index, currentIndex: newIndex });
                } else {
                    game.handlePlayerAction(botId, 'CRAB_SELECT', { skip: true });
                }
            }, 600);
            return;
        }

        if (game.state.parrotPredicting === botId) {
            setTimeout(() => {
                resetGuard();
                let animalIdToPredict = 'lion';
                if (bot.row.length > 0) {
                    animalIdToPredict = bot.row[Math.random() > 0.5 ? 0 : bot.row.length - 1].id;
                } else {
                    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
                    animalIdToPredict = randomAnimal.id;
                }
                game.handlePlayerAction(botId, 'PARROT_PREDICT', { animalId: animalIdToPredict });
            }, 600);
            return;
        }

        if (game.state.parrotPredictedAnimal && !game.state.currentDrawnCard) {
            setTimeout(() => {
                resetGuard();
                if (game.state.turn !== botId) return;
                const deckToDraw = game.state.forcedDeck || (Math.random() > 0.5 ? 1 : 2);
                game.handlePlayerAction(botId, 'DRAW', { deckIndex: deckToDraw });
            }, 600);
            return;
        }

        if(!game.state.currentDrawnCard) {
            setTimeout(() => {
                resetGuard();
                if(game.state.turn !== botId) return;
                if(game.state.currentDrawnCard) return;
                const deckToDraw = game.state.forcedDeck || (Math.random() > 0.5 ? 1 : 2);
                game.handlePlayerAction(botId, 'DRAW', { deckIndex: deckToDraw });
            }, 400);
            return;
        }

        setTimeout(() => {
            resetGuard();
            const card = game.state.currentDrawnCard;
            let wantsToKeep = true;
            let skipPower = false;
            
            const leftCard = bot.row.length > 0 ? bot.row[0] : null;
            const rightCard = bot.row.length > 0 ? bot.row[bot.row.length - 1] : null;
            let bestSide = Math.random() > 0.5 ? 'left' : 'right';
            let formsPair = false;
            
            if (leftCard && card.id === leftCard.id) { bestSide = 'left'; formsPair = true; }
            else if (rightCard && card.id === rightCard.id) { bestSide = 'right'; formsPair = true; }
            
            if(card.id === 'chameleon' && bot.row.find(c => c.id === 'chameleon')) wantsToKeep = false;
            
            const powerCards = ['crocodile', 'monkey', 'crab', 'parrot'];
            if (!powerCards.includes(card.id) && !formsPair && bot.row.length >= 3) {
                wantsToKeep = false;
            }

            if(card.id === 'crocodile') {
                const hasOpponents = game.state.players.some(p => p.id !== bot.id && p.row.length > 0);
                if(!hasOpponents) skipPower = true;
            }
            if(card.id === 'crab') {
                let hasPairToBreak = false;
                game.state.players.forEach(p => {
                    if (p.id !== bot.id && p.row.length > 1) {
                        for (let i = 0; i < p.row.length - 1; i++) {
                            if (p.row[i].id === p.row[i+1].id) hasPairToBreak = true;
                        }
                    }
                });
                if (!hasPairToBreak) skipPower = true;
            }
            if(card.id === 'monkey') {
                const hasOpponents = game.state.players.some(p => p.id !== bot.id && p.row.length > 0);
                if(!hasOpponents) skipPower = true;
            }
                
            if (game.state.mustPlaceDrawnCard) {
                wantsToKeep = true;
            }

            if(!wantsToKeep && !game.state.forcedDeck && !game.state.mustPlaceDrawnCard) {
                game.handlePlayerAction(botId, 'REJECT', {});
            } else {
                if (card.id === 'monkey' && !skipPower && !game.state.disablePower && !game.state.mustPlaceDrawnCard) {
                    game.handlePlayerAction(botId, 'MONKEY_INIT', {});
                } else if (card.id === 'parrot' && !skipPower && !game.state.disablePower && !game.state.mustPlaceDrawnCard) {
                    game.handlePlayerAction(botId, 'PARROT_INIT', { side: bestSide });
                } else {
                    game.handlePlayerAction(botId, 'PLACE', { side: bestSide, skipPower: skipPower });
                }
            }
        }, 600);
    }
};

document.addEventListener("DOMContentLoaded", game.init);
