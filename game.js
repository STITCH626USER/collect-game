const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg?v=4', desc: 'Détruit la carte de votre choix chez un adversaire.' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg?v=4', desc: 'Joker. S\'annule et se défausse si vous en posez un 2ème.' },
    { id: 'monkey', name: 'Singe', img: 'assets/card_monkey.jpg?v=4', desc: 'Échange votre Singe avec la carte d\'un adversaire.' },
    { id: 'crab', name: 'Crabe', img: 'assets/card_crab.jpg?v=4', desc: 'Déplace votre première carte à la fin de votre rangée.' },
    { id: 'hermit_crab', name: 'Bernard l\'hermite', img: 'assets/card_hermit_crab.jpg?v=4', desc: 'Rejouez un tour si vous avez déjà un Crabe.' },
    { id: 'octopus', name: 'Pieuvre', img: 'assets/card_octopus.jpg?v=4', desc: 'Gagnez si vous avez 2 paires d\'animaux (4 cartes).' },
    { id: 'lion', name: 'Lion', img: 'assets/card_lion.jpg?v=4', desc: 'Gagnez si vous avez 1 exemplaire de chaque autre animal.' },
    { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg?v=4', desc: 'Devinez votre pioche pour la conserver.' }
];

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

    flyCardToRect: (imgSrc, startId, tRect, onComplete, forceStartRect = null) => {
        let sRect = forceStartRect;
        if (!sRect) {
            const startEl = document.getElementById(startId) || document.body;
            sRect = startEl.getBoundingClientRect();
        }
        
        const flying = document.createElement('img');
        flying.src = imgSrc;
        flying.className = 'flying-card';
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
        flying.style.transform = 'rotate(360deg)';

        setTimeout(() => {
            flying.remove();
            if(onComplete) onComplete();
        }, 600);
    },

    crocodileBite: (targetElement, onComplete) => {
        targetElement.classList.add('vfx-crocodile-bite');
        
        const rect = targetElement.getBoundingClientRect();
        for(let i=0; i<10; i++) {
            const p = document.createElement('div');
            p.className = 'vfx-blood-particles';
            p.style.left = (rect.left + rect.width/2) + 'px';
            p.style.top = (rect.top + rect.height/2) + 'px';
            p.style.setProperty('--tx', (Math.random() * 100 - 50) + 'px');
            p.style.setProperty('--ty', (Math.random() * 100 - 50) + 'px');
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 500);
        }
        
        setTimeout(() => {
            if(onComplete) onComplete();
        }, 800);
    }
};

// --- UI CONTROLLER ---
const ui = {
    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },
    showOverlay: (title, desc) => {
        document.getElementById('overlay-title').innerText = title;
        document.getElementById('overlay-desc').innerText = desc;
        document.getElementById('overlay-msg').style.display = 'flex';
    },
    hideOverlay: () => {
        document.getElementById('overlay-msg').style.display = 'none';
    },
    updateWaitingPlayers: (players) => {
        const ul = document.getElementById('waiting-players-list');
        ul.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${p.name} ${p.isBot ? '🤖' : '👤'}</span> <span>${p.id === game.myId ? '(Vous)' : ''}</span>`;
            ul.appendChild(li);
        });
        document.getElementById('player-count').innerText = players.length;
    },
    showPlacement: () => {
        const myPlayer = game.state.players.find(p => p.id === game.myId);
        document.getElementById('card-actions').style.display = 'none';

        if (myPlayer && myPlayer.row.length === 0) {
            game.placeCard('right'); 
        } else {
            const pa = document.getElementById('placement-actions');
            pa.innerHTML = `
                <button class="btn-action btn-place" onclick="game.placeCard('left')">⬅ Gauche</button>
                <button class="btn-action btn-place" onclick="game.placeCard('right')">Droite ➡</button>
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

    showHelpModal: () => {
        const grid = document.getElementById('help-grid');
        grid.innerHTML = '';
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
    
    renderGameState: (state, myId) => {
        document.getElementById('deck-left-count').innerText = state.deck1Count;
        document.getElementById('deck-right-count').innerText = state.deck2Count;
        
        const turnPlayer = state.players.find(p => p.id === state.turn);
        const isMyTurn = (state.turn === myId);
        document.getElementById('turn-indicator').innerText = isMyTurn ? "C'est votre tour !" : `Tour de ${turnPlayer ? turnPlayer.name : '...'}`;
        
        if (!state.currentDrawnCard) {
            document.getElementById('drawn-card-zone').style.display = 'none';
            document.getElementById('deck-left').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-right').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-left').style.opacity = '1';
            document.getElementById('deck-right').style.opacity = '1';
        } else {
            document.getElementById('drawn-card-zone').style.display = 'flex';
            const drawnCardImg = document.getElementById('drawn-card-img');
            drawnCardImg.src = state.currentDrawnCard.img;
            drawnCardImg.style.opacity = '1'; 
            
            document.getElementById('deck-left').classList.add('disabled');
            document.getElementById('deck-right').classList.add('disabled');

            if(isMyTurn) {
                if (state.parrotPredictedAnimal) {
                    document.getElementById('card-actions').style.display = 'none';
                } else {
                    document.getElementById('card-actions').style.display = 'flex';
                }
                document.getElementById('placement-actions').style.display = 'none';
                if (state.forcedDeck === 1) document.getElementById('deck-right').style.opacity = '0.3';
                if (state.forcedDeck === 2) document.getElementById('deck-left').style.opacity = '0.3';
            } else {
                document.getElementById('card-actions').style.display = 'none';
                document.getElementById('placement-actions').style.display = 'none';
            }
        }
        
        if (state.crocodileTargeting === myId) {
            ui.showOverlay("Attaque Crocodile !", "Cliquez sur la carte d'un adversaire à dévorer.");
            document.getElementById('card-actions').style.display = 'none';
            document.getElementById('placement-actions').innerHTML = `<button class="btn-action btn-reject" onclick="game.sendAction('CROCODILE_SELECT', {skip: true})">Passer</button>`;
            document.getElementById('placement-actions').style.display = 'flex';
        } else if (state.monkeyTargeting === myId) {
            ui.showOverlay("Pouvoir du Singe !", "Cliquez sur une carte adverse pour l'échanger avec votre Singe.");
            document.getElementById('card-actions').style.display = 'none';
            document.getElementById('placement-actions').innerHTML = `<button class="btn-action btn-reject" onclick="game.sendAction('MONKEY_SELECT', {skip: true})">Passer</button>`;
            document.getElementById('placement-actions').style.display = 'flex';
        } else if (state.crabTargeting === myId) {
            ui.showOverlay("Pouvoir du Crabe !", "Cliquez sur votre 1ère carte pour la déplacer à la fin.");
            document.getElementById('card-actions').style.display = 'none';
            document.getElementById('placement-actions').innerHTML = `<button class="btn-action btn-reject" onclick="game.sendAction('CRAB_SELECT', {skip: true})">Passer</button>`;
            document.getElementById('placement-actions').style.display = 'flex';
        } else if (state.crocodileTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crocodileTargeting);
            ui.showOverlay("Attaque Crocodile...", `${targetingPlayer.name} choisit sa cible...`);
        } else if (state.monkeyTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.monkeyTargeting);
            ui.showOverlay("Pouvoir du Singe...", `${targetingPlayer.name} choisit avec qui échanger...`);
        } else if (state.crabTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crabTargeting);
            ui.showOverlay("Pouvoir du Crabe...", `${targetingPlayer.name} hésite à déplacer sa carte...`);
        } else {
            ui.hideOverlay();
        }

        const myRowEl = document.getElementById('my-row');
        const myPlayer = state.players.find(p => p.id === myId);
        if(myPlayer) {
            document.getElementById('my-score').innerText = myPlayer.score;
            myRowEl.innerHTML = '';
            myPlayer.row.forEach((c, index) => {
                const img = document.createElement('img');
                img.src = c.img;
                img.className = 'card';
                if(index === myPlayer.row.length - 1) img.id = `card-target-${myId}`;
                
                if (state.crabTargeting === myId && index === 0) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('CRAB_SELECT', { skip: false });
                }
                
                myRowEl.appendChild(img);
            });
        }

        const oppCarousel = document.getElementById('opponents-carousel');
        if (state.players.length === 2) oppCarousel.classList.add('two-players-mode');
        else oppCarousel.classList.remove('two-players-mode');
        
        oppCarousel.innerHTML = '';
        state.players.forEach(p => {
            if (p.id === myId) return;
            const div = document.createElement('div');
            div.className = `opponent-slot ${state.turn === p.id ? 'active-turn' : ''}`;
            div.id = `opp-slot-${p.id}`;
            
            const oppCardsMini = document.createElement('div');
            oppCardsMini.className = 'opp-cards-mini';
            oppCardsMini.id = `opp-cards-${p.id}`;
            
            p.row.forEach((c, index) => {
                const img = document.createElement('img');
                img.src = c.img;
                img.id = `card-target-${p.id}-${index}`;
                
                if (state.crocodileTargeting === myId) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('CROCODILE_SELECT', { targetPlayerId: p.id, cardIndex: index });
                } else if (state.monkeyTargeting === myId) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('MONKEY_SELECT', { targetPlayerId: p.id, cardIndex: index });
                }
                
                oppCardsMini.appendChild(img);
            });

            div.innerHTML = `
                <div class="opp-name">${p.name} ${p.isBot?'🤖':''} ${state.parrotPredicting === p.id ? '🦜' : ''}</div>
                <div class="opp-score">${p.score} 👑</div>
            `;
            div.appendChild(oppCardsMini);
            oppCarousel.appendChild(div);
        });
        
        if (state.parrotPredicting === myId) ui.showParrotModal();
        else document.getElementById('parrot-modal').style.display = 'none';
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
    
    state: {
        started: false,
        players: [],
        deck1: [], deck2: [],
        deck1Count: 0, deck2Count: 0,
        turnIndex: 0, turn: null,
        currentDrawnCard: null,
        originalDeckIndex: null,
        forcedDeck: null,
        parrotPredicting: null,
        parrotPredictedAnimal: null,
        crocodileTargeting: null,
        monkeyTargeting: null,
        crabTargeting: null
    },

    init: () => { ui.showScreen('screen-home'); },

    generateRoomCode: () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    hostRoom: () => {
        game.isHost = true;
        game.roomCode = game.generateRoomCode();
        game.myName = "Hôte";
        document.getElementById('room-code-display').innerText = game.roomCode;
        
        game.peer = new Peer(`collect-${game.roomCode}`, {
            config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        
        game.peer.on('open', (id) => {
            game.myId = id;
            game.state.players.push({ id: id, name: "Hôte", isBot: false, row: [], score: 0 });
            ui.updateWaitingPlayers(game.state.players);
            ui.showScreen('screen-host');
        });

        game.peer.on('connection', (conn) => {
            conn.on('data', (data) => {
                if(data.type === 'JOIN') {
                    if(game.state.players.length >= 8) { conn.send({type: 'ERROR', msg: "Salon complet."}); return; }
                    game.connections.push(conn);
                    game.state.players.push({ id: conn.peer, name: data.name, isBot: false, row: [], score: 0 });
                    ui.updateWaitingPlayers(game.state.players);
                    game.broadcast({ type: 'PLAYERS_UPDATE', players: game.state.players });
                }
                else if (data.type === 'ACTION') {
                    game.handlePlayerAction(conn.peer, data.action, data.payload);
                }
            });
            conn.on('close', () => {
                game.state.players = game.state.players.filter(p => p.id !== conn.peer);
                ui.updateWaitingPlayers(game.state.players);
                if(game.state.started) game.broadcastState();
            });
        });
    },

    addBot: () => {
        if(game.state.players.length >= 8) return;
        const botId = 'bot_' + Math.floor(Math.random()*10000);
        game.state.players.push({ id: botId, name: "Bot " + (game.state.players.length), isBot: true, row: [], score: 0 });
        ui.updateWaitingPlayers(game.state.players);
    },

    broadcast: (data) => {
        game.connections.forEach(conn => conn.send(data));
    },

    broadcastState: () => {
        const safeState = {
            started: game.state.started,
            deck1Count: game.state.deck1.length, deck2Count: game.state.deck2.length,
            turn: game.state.turn,
            currentDrawnCard: game.state.currentDrawnCard, forcedDeck: game.state.forcedDeck,
            parrotPredicting: game.state.parrotPredicting,
            parrotPredictedAnimal: game.state.parrotPredictedAnimal,
            crocodileTargeting: game.state.crocodileTargeting,
            monkeyTargeting: game.state.monkeyTargeting,
            crabTargeting: game.state.crabTargeting,
            players: game.state.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, row: p.row }))
        };
        game.broadcast({ type: 'STATE_UPDATE', state: safeState });
        ui.renderGameState(safeState, game.myId);
        
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        if(activePlayer && activePlayer.isBot) {
            if (game.botTimer) clearTimeout(game.botTimer);
            game.botTimer = setTimeout(game.playBotTurn, 2000);
        }
    },

    startGame: () => {
        let fullDeck = [];
        for(let i=0; i<8; i++) ANIMALS.forEach(animal => fullDeck.push({...animal}));
        fullDeck.sort(() => Math.random() - 0.5);
        
        game.state.deck1 = fullDeck.slice(0, 32);
        game.state.deck2 = fullDeck.slice(32);
        game.state.started = true;
        game.state.turnIndex = 0;
        game.state.turn = game.state.players[0].id;
        
        game.broadcast({ type: 'START_GAME' });
        ui.showScreen('screen-game');
        game.broadcastState();
    },

    joinRoom: () => {
        const code = document.getElementById('input-room-code').value;
        const name = document.getElementById('input-player-name').value || "Joueur";
        if(code.length !== 4) return;
        
        document.getElementById('join-msg').innerText = "Connexion...";
        game.peer = new Peer({ config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] } });
        
        game.peer.on('error', (err) => { document.getElementById('join-msg').innerText = "Erreur (" + err.type + ")"; });
        game.peer.on('open', (id) => {
            game.myId = id;
            game.myName = name;
            const conn = game.peer.connect(`collect-${code}`);
            conn.on('open', () => { conn.send({ type: 'JOIN', name: name }); });
            conn.on('data', (data) => {
                if(data.type === 'ERROR') document.getElementById('join-msg').innerText = data.msg;
                else if(data.type === 'PLAYERS_UPDATE') {
                    ui.showScreen('screen-host');
                    document.getElementById('room-code-display').innerText = code;
                    document.querySelector('.host-actions').style.display = 'none';
                    ui.updateWaitingPlayers(data.players);
                } 
                else if(data.type === 'START_GAME') ui.showScreen('screen-game');
                else if(data.type === 'STATE_UPDATE') ui.renderGameState(data.state, game.myId);
                else if(data.type === 'ALERT') ui.showOverlay("Info", data.msg);
                else if(data.type === 'VFX') game.handleVFX(data);
            });
            game.connections = [conn];
        });
    },

    sendAction: (action, payload) => {
        if(game.isHost) game.handlePlayerAction(game.myId, action, payload);
        else game.connections[0].send({ type: 'ACTION', action, payload });
    },

    drawCard: (deckIndex) => { game.sendAction('DRAW', { deckIndex }); },
    rejectCard: () => { game.sendAction('REJECT', {}); },
    placeCard: (side) => { game.sendAction('PLACE', { side }); },

    // --- HOST LOGIC ---
    handlePlayerAction: (playerId, action, payload) => {
        if(!game.isHost) return;
        
        if (action === 'PARROT_PREDICT') {
            game.state.parrotPredicting = null;
            game.state.parrotPredictedAnimal = payload.animalId;
            game.broadcast({ type: 'ALERT', msg: `${game.state.players.find(p=>p.id===playerId).name} prédit un(e) ${ANIMALS.find(a=>a.id===payload.animalId).name} !` });
            game.broadcastState();
            return;
        }
        else if (action === 'CROCODILE_SELECT') {
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            if (payload.skip) {
                game.state.crocodileTargeting = null;
                game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a épargné ses adversaires !` });
                game.broadcastState();
                setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                return;
            }
            const targetPlayer = game.state.players.find(p => p.id === payload.targetPlayerId);
            if (targetPlayer && targetPlayer.row.length > payload.cardIndex) {
                game.state.crocodileTargeting = null;
                
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
                game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a gardé son Singe.` });
                game.broadcastState();
                setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                return;
            }
            const targetPlayer = game.state.players.find(p => p.id === payload.targetPlayerId);
            if (targetPlayer && targetPlayer.row.length > payload.cardIndex) {
                game.state.monkeyTargeting = null;
                
                let monkeyIndex = -1;
                for (let i = sourcePlayer.row.length - 1; i >= 0; i--) {
                    if (sourcePlayer.row[i].id === 'monkey') { monkeyIndex = i; break; }
                }
                
                if (monkeyIndex !== -1) {
                    game.triggerVFX({
                        action: 'MONKEY_SWAP',
                        playerA: sourcePlayer.id, indexA: monkeyIndex, cardImgA: sourcePlayer.row[monkeyIndex].img,
                        playerB: targetPlayer.id, indexB: payload.cardIndex, cardImgB: targetPlayer.row[payload.cardIndex].img
                    });

                    setTimeout(() => {
                        const myMonkey = sourcePlayer.row.splice(monkeyIndex, 1)[0];
                        const oppCard = targetPlayer.row.splice(payload.cardIndex, 1)[0];
                        sourcePlayer.row.push(oppCard);
                        targetPlayer.row.push(myMonkey);
                        game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a échangé son Singe avec ${targetPlayer.name} !` });
                        game.broadcastState();
                        setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                    }, 600);
                } else {
                    game.broadcastState();
                    setTimeout(() => { game.finalizeTurn(sourcePlayer); }, 800);
                }
                return;
            }
        }
        else if (action === 'CRAB_SELECT') {
            const player = game.state.players.find(p => p.id === playerId);
            if (player && game.state.crabTargeting === playerId) {
                game.state.crabTargeting = null;
                if (!payload.skip && player.row.length >= 2) {
                    game.triggerVFX({ action: 'CRAB_MOVE', player: player.id, cardImg: player.row[0].img });
                    setTimeout(() => {
                        const first = player.row.shift();
                        player.row.push(first);
                        game.broadcast({ type: 'ALERT', msg: `Le Crabe de ${player.name} déplace sa première carte !` });
                        game.broadcastState();
                        setTimeout(() => { game.finalizeTurn(player); }, 800);
                    }, 600);
                } else {
                    game.broadcast({ type: 'ALERT', msg: `${player.name} passe le pouvoir de son Crabe.` });
                    game.broadcastState();
                    setTimeout(() => { game.finalizeTurn(player); }, 800);
                }
                return;
            }
        }

        if(game.state.turn !== playerId) return;

        if (action === 'DRAW') {
            if(game.state.currentDrawnCard) return;
            if(game.state.parrotPredicting) return;
            if(game.state.forcedDeck && payload.deckIndex !== game.state.forcedDeck) return;

            let card = null;
            if (payload.deckIndex === 1 && game.state.deck1.length > 0) card = game.state.deck1.pop();
            else if (payload.deckIndex === 2 && game.state.deck2.length > 0) card = game.state.deck2.pop();

            if (card) {
                if (game.state.parrotPredictedAnimal) {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.broadcastState(); 
                    
                    if (card.id === game.state.parrotPredictedAnimal) {
                        game.broadcast({ type: 'ALERT', msg: "Prédiction réussie !" });
                        game.state.parrotPredictedAnimal = null;
                    } else {
                        game.broadcast({ type: 'ALERT', msg: "Prédiction ratée !" });
                        setTimeout(() => {
                            game.state.parrotPredictedAnimal = null;
                            game.handlePlayerAction(playerId, 'REJECT', {});
                        }, 1500);
                    }
                } else {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.broadcastState();
                }
            }
        }
        else if (action === 'REJECT') {
            if(!game.state.currentDrawnCard) return;
            if(game.state.originalDeckIndex === 1) game.state.deck1.push(game.state.currentDrawnCard);
            else game.state.deck2.push(game.state.currentDrawnCard);
            
            game.state.forcedDeck = game.state.originalDeckIndex === 1 ? 2 : 1;
            game.state.currentDrawnCard = null;
            
            game.triggerVFX({ action: 'REJECT', player: playerId });
            setTimeout(() => game.broadcastState(), 500);
        }
        else if (action === 'PLACE') {
            if (game.state.parrotPredictedAnimal) return; // Block cheating
            const player = game.state.players.find(p => p.id === playerId);
            const card = game.state.currentDrawnCard;
            
            if(payload.side === 'left') player.row.unshift(card);
            else player.row.push(card);
            
            game.state.currentDrawnCard = null;
            game.state.forcedDeck = null;

            game.triggerVFX({ action: 'PLACE', player: playerId, card: card, side: payload.side });

            setTimeout(() => {
                game.applyAnimalEffects(player, card, payload.side);
            }, 600);
            return;
        }
    },

    applyAnimalEffects: (player, card, side) => {
        if (card.id === 'crocodile') {
            const opponents = game.state.players.filter(p => p.id !== player.id && p.row.length > 0);
            if (opponents.length > 0) {
                game.state.crocodileTargeting = player.id;
                game.broadcastState();
                return; 
            }
        }
        
        if (card.id === 'monkey' && player.row.length > 1) {
            const opponents = game.state.players.filter(p => p.id !== player.id && p.row.length > 0);
            if (opponents.length > 0) {
                game.state.monkeyTargeting = player.id;
                game.broadcastState();
                return;
            }
        }

        if (card.id === 'crab' && player.row.length >= 2) {
            game.state.crabTargeting = player.id;
            game.broadcastState();
            return;
        }

        if (card.id === 'chameleon') {
            const chameleons = player.row.filter(c => c.id === 'chameleon');
            if (chameleons.length >= 2) {
                game.broadcast({ type: 'ALERT', msg: `Les deux Caméléons de ${player.name} s'annulent !` });
                player.row = player.row.filter(c => c.id !== 'chameleon');
            }
        }
        
        if (card.id === 'parrot') {
            game.state.parrotPredicting = player.id;
            game.broadcastState();
            return;
        }
        
        game.finalizeTurn(player);
    },

    finalizeTurn: (player) => {
        let won = false;
        
        const uniqueAnimals = new Set(player.row.filter(c => c.id !== 'lion').map(c => c.id));
        if (player.row.find(c => c.id === 'lion') && uniqueAnimals.size >= 7) {
            game.broadcast({ type: 'ALERT', msg: `${player.name} a réuni tous les animaux avec son Lion ! VICTOIRE !` });
            player.score += 1;
            won = true;
        }

        if (!won) {
            let lastId = null; let count = 0;
            for (let c of player.row) {
                if (c.id === lastId || c.id === 'chameleon' || lastId === 'chameleon') {
                    count++;
                    if(c.id !== 'chameleon') lastId = c.id; 
                } else { count = 1; lastId = c.id; }
                
                if (count >= 4) {
                    game.broadcast({ type: 'ALERT', msg: `${player.name} a aligné 4 animaux ! VICTOIRE !` });
                    player.score += 1;
                    won = true;
                    break;
                }
            }
        }

        if (!won && player.row.find(c => c.id === 'octopus')) {
            let frequencies = {};
            let chameleonCount = 0;
            for(let c of player.row) {
                if(c.id === 'octopus') continue;
                if(c.id === 'chameleon') chameleonCount++;
                else frequencies[c.id] = (frequencies[c.id] || 0) + 1;
            }
            let pairs = 0;
            for(let id in frequencies) {
                pairs += Math.floor(frequencies[id] / 2);
                frequencies[id] = frequencies[id] % 2;
            }
            for(let id in frequencies) {
                if(frequencies[id] === 1 && chameleonCount > 0) {
                    pairs++;
                    chameleonCount--;
                    frequencies[id] = 0;
                }
            }
            if (pairs >= 2) {
                game.broadcast({ type: 'ALERT', msg: `${player.name} a formé 2 paires grâce à la Pieuvre ! VICTOIRE !` });
                player.score += 1;
                won = true;
            }
        }
        
        if (won) {
            setTimeout(() => {
                game.broadcast({ type: 'ALERT', msg: 'Nouvelle manche !' });
                game.state.players.forEach(p => p.row = []);
                game.startGame();
            }, 3000);
            return;
        }

        if (player.row.length > 0 && player.row[player.row.length - 1].id === 'hermit_crab' && player.row.find(c => c.id === 'crab')) {
            game.broadcast({ type: 'ALERT', msg: `Le Bernard l'hermite offre un tour supplémentaire à ${player.name} !` });
        } else {
            game.state.turnIndex = (game.state.turnIndex + 1) % game.state.players.length;
            game.state.turn = game.state.players[game.state.turnIndex].id;
        }
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
                const containerId = data.player === game.myId ? 'my-row' : `opp-cards-${data.player}`;
                const container = document.getElementById(containerId);
                
                const origCard = document.getElementById('drawn-card-img');
                if (origCard && data.player === game.myId) origCard.style.opacity = '0';
                
                let tRect = { left: window.innerWidth/2, top: window.innerHeight - 50, width: 75, height: 110 };
                if (container) {
                    const placeholder = document.createElement('div');
                    placeholder.style.width = (data.player === game.myId ? 75 : 40) + 'px';
                    placeholder.style.height = (data.player === game.myId ? 110 : 60) + 'px';
                    placeholder.style.flexShrink = '0';
                    if (data.side === 'left') container.prepend(placeholder);
                    else container.appendChild(placeholder);
                    
                    tRect = placeholder.getBoundingClientRect();
                    placeholder.remove();
                }

                vfx.flyCardToRect(data.card.img, 'drawn-card-img', tRect, () => {
                    done();
                });
            });
        }
        else if (data.action === 'CROCODILE_BITE') {
            vfx.push((done) => {
                const targetElement = document.getElementById(`card-target-${data.player}-${data.cardIndex}`);
                if (targetElement) vfx.crocodileBite(targetElement, done);
                else done(); 
            });
        }
        else if (data.action === 'CROCODILE_ATTACK') {
            vfx.push((done) => {
                const crocCard = document.getElementById(`card-target-${data.attackerId}-${data.attackerIndex}`);
                const targetCard = document.getElementById(`card-target-${data.targetId}-${data.targetIndex}`);
                if (targetCard && data.crocImg) {
                    const sRect = crocCard ? crocCard.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width: 80, height: 120 };
                    const tRect = targetCard.getBoundingClientRect();
                    vfx.flyCardToRect(data.crocImg, null, tRect, () => {
                        vfx.crocodileBite(targetCard, () => { done(); });
                    }, sRect);
                } else done();
            });
        }
        else if (data.action === 'REJECT') {
             vfx.push((done) => {
                const c = document.getElementById('drawn-card-zone');
                if(c) {
                    c.style.transform = 'scale(0)';
                    c.style.transition = 'transform 0.3s';
                }
                setTimeout(() => { if(c) c.style.transform = ''; done(); }, 300);
             });
        }
        else if (data.action === 'MONKEY_SWAP') {
            vfx.push((done) => {
                const cardA = document.getElementById(`card-target-${data.playerA}-${data.indexA}`);
                const cardB = document.getElementById(`card-target-${data.playerB}-${data.indexB}`);
                if (cardA && cardB) {
                    const rectA = cardA.getBoundingClientRect();
                    const rectB = cardB.getBoundingClientRect();
                    cardA.style.opacity = '0';
                    cardB.style.opacity = '0';
                    vfx.flyCardToRect(data.cardImgA, null, rectB, null, rectA);
                    vfx.flyCardToRect(data.cardImgB, null, rectA, () => { done(); }, rectB);
                } else done();
            });
        }
        else if (data.action === 'CRAB_MOVE') {
            vfx.push((done) => {
                const cardEl = document.getElementById(`card-target-${data.player}-0`);
                const containerId = data.player === game.myId ? 'my-row' : `opp-cards-${data.player}`;
                const container = document.getElementById(containerId);
                if (cardEl && container) {
                    const sRect = cardEl.getBoundingClientRect();
                    const placeholder = document.createElement('div');
                    placeholder.style.width = (data.player === game.myId ? 75 : 40) + 'px';
                    placeholder.style.height = (data.player === game.myId ? 110 : 60) + 'px';
                    placeholder.style.flexShrink = '0';
                    container.appendChild(placeholder);
                    const tRect = placeholder.getBoundingClientRect();
                    placeholder.remove();
                    cardEl.style.opacity = '0';
                    vfx.flyCardToRect(data.cardImg, null, tRect, () => { done(); }, sRect);
                } else done();
            });
        }
    },

    // --- BOTS ---
    playBotTurn: () => {
        const botId = game.state.turn;
        const bot = game.state.players.find(p => p.id === botId);
        if(!bot || !bot.isBot) return;
        
        if (game.state.crocodileTargeting === botId) {
            setTimeout(() => {
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 0);
                if (opponents.length > 0) {
                    opponents.sort((a, b) => b.row.length - a.row.length);
                    const target = opponents[0];
                    const cardIndex = target.row.length - 1;
                    game.handlePlayerAction(botId, 'CROCODILE_SELECT', { targetPlayerId: target.id, cardIndex });
                }
            }, 1500);
            return;
        }
        
        if (game.state.monkeyTargeting === botId) {
            setTimeout(() => {
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 0);
                if (opponents.length > 0) {
                    opponents.sort((a, b) => b.row.length - a.row.length);
                    const target = opponents[0];
                    const cardIndex = Math.floor(Math.random() * target.row.length);
                    game.handlePlayerAction(botId, 'MONKEY_SELECT', { targetPlayerId: target.id, cardIndex });
                }
            }, 1500);
            return;
        }
        
        if (game.state.crabTargeting === botId) {
            setTimeout(() => {
                game.handlePlayerAction(botId, 'CRAB_SELECT', { skip: false });
            }, 1500);
            return;
        }

        if (game.state.parrotPredicting === botId) {
            setTimeout(() => {
                const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
                game.handlePlayerAction(botId, 'PARROT_PREDICT', { animalId: randomAnimal.id });
            }, 1000);
            return;
        }

        if(!game.state.currentDrawnCard) {
            const deckToDraw = game.state.forcedDeck || (Math.random() > 0.5 ? 1 : 2);
            game.handlePlayerAction(botId, 'DRAW', { deckIndex: deckToDraw });
            return;
        }

        if(game.state.parrotPredictedAnimal && game.state.currentDrawnCard.id !== game.state.parrotPredictedAnimal) return;

        setTimeout(() => {
            const card = game.state.currentDrawnCard;
            let wantsToKeep = true;
            
            if(card.id === 'chameleon' && bot.row.find(c => c.id === 'chameleon')) wantsToKeep = false;
            if(card.id === 'crocodile') {
                const hasOpponents = game.state.players.some(p => p.id !== bot.id && p.row.length > 0);
                if(!hasOpponents) wantsToKeep = false;
            }

            if(!wantsToKeep && !game.state.forcedDeck) {
                game.handlePlayerAction(botId, 'REJECT', {});
            } else {
                game.handlePlayerAction(botId, 'PLACE', { side: Math.random() > 0.5 ? 'left' : 'right' });
            }
        }, 1500);
    }
};

document.addEventListener("DOMContentLoaded", game.init);
const originalHost = game.hostRoom;
ui.showScreen = (id) => {
    if(id === 'screen-host' && !game.isHost && game.connections.length === 0) game.hostRoom();
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
