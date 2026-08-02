const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg?v=3', desc: 'Détruit la dernière carte d\'un adversaire aléatoire.' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg?v=3', desc: 'Joker. S\'annule et se défausse si vous en posez un 2ème.' },
    { id: 'monkey', name: 'Singe', img: 'assets/card_monkey.jpg?v=3', desc: 'Échange votre carte avec celle d\'un adversaire.' },
    { id: 'crab', name: 'Crabe', img: 'assets/card_crab.jpg?v=3', desc: 'Déplace votre première carte à la fin de votre rangée.' },
    { id: 'hermit_crab', name: 'Bernard l\'hermite', img: 'assets/card_hermit_crab.jpg?v=3', desc: 'Rejouez un tour si vous avez déjà un Crabe.' },
    { id: 'octopus', name: 'Pieuvre', img: 'assets/card_octopus.jpg?v=3', desc: 'Gagnez si vous avez 2 paires d\'animaux (4 cartes).' },
    { id: 'lion', name: 'Lion', img: 'assets/card_lion.jpg?v=3', desc: 'Gagnez si vous avez 1 exemplaire de chaque autre animal.' },
    { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg?v=3', desc: 'Devinez votre pioche pour la conserver.' }
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

    flyCardToRect: (imgSrc, startId, tRect, onComplete) => {
        const startEl = document.getElementById(startId) || document.body;
        const sRect = startEl.getBoundingClientRect();
        
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
        
        // Particules de sang/poussière
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
        if (myPlayer && myPlayer.row.length === 0) {
            game.placeCard('right'); // Pas de choix nécessaire si la main est vide
        } else {
            document.getElementById('card-actions').style.display = 'none';
            document.getElementById('placement-actions').style.display = 'flex';
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
    
    // Le rendu "silencieux" qui met à jour le DOM sans animer (car l'animation a déjà eu lieu)
    renderGameState: (state, myId) => {
        document.getElementById('deck-left-count').innerText = state.deck1Count;
        document.getElementById('deck-right-count').innerText = state.deck2Count;
        
        const turnPlayer = state.players.find(p => p.id === state.turn);
        const isMyTurn = (state.turn === myId);
        document.getElementById('turn-indicator').innerText = isMyTurn ? "C'est votre tour !" : `Tour de ${turnPlayer ? turnPlayer.name : '...'}`;
        
        if (!state.currentDrawnCard) {
            document.getElementById('drawn-card-zone').style.display = 'none';
            // Enable/disable individual decks, NOT the parent container
            document.getElementById('deck-left').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-right').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-left').style.opacity = '1';
            document.getElementById('deck-right').style.opacity = '1';
        } else {
            document.getElementById('drawn-card-zone').style.display = 'flex';
            document.getElementById('drawn-card-img').src = state.currentDrawnCard.img;
            
            // Disable both decks while deciding
            document.getElementById('deck-left').classList.add('disabled');
            document.getElementById('deck-right').classList.add('disabled');

            if(isMyTurn) {
                document.getElementById('card-actions').style.display = 'flex';
                document.getElementById('placement-actions').style.display = 'none';
                if (state.forcedDeck === 1) document.getElementById('deck-right').style.opacity = '0.3';
                if (state.forcedDeck === 2) document.getElementById('deck-left').style.opacity = '0.3';
            } else {
                document.getElementById('card-actions').style.display = 'none';
                document.getElementById('placement-actions').style.display = 'none';
            }
        }

        // Render My Row
        const myRowEl = document.getElementById('my-row');
        const myPlayer = state.players.find(p => p.id === myId);
        if(myPlayer) {
            document.getElementById('my-score').innerText = myPlayer.score;
            myRowEl.innerHTML = '';
            myPlayer.row.forEach((c, index) => {
                const img = document.createElement('img');
                img.src = c.img;
                img.className = 'card';
                // Si c'est la dernière carte ajoutée, on lui met l'id pour le ciblage des VFX
                if(index === myPlayer.row.length - 1) img.id = `card-target-${myId}`;
                myRowEl.appendChild(img);
            });
        }

        // Render Opponents
        const oppCarousel = document.getElementById('opponents-carousel');
        if (state.players.length === 2) oppCarousel.classList.add('two-players-mode');
        else oppCarousel.classList.remove('two-players-mode');
        
        oppCarousel.innerHTML = '';
        state.players.forEach(p => {
            if (p.id === myId) return;
            const div = document.createElement('div');
            div.className = `opponent-slot ${state.turn === p.id ? 'active-turn' : ''}`;
            div.id = `opp-slot-${p.id}`;
            div.innerHTML = `
                <div class="opp-name">${p.name} ${p.isBot?'🤖':''} ${state.parrotPredicting === p.id ? '🦜' : ''}</div>
                <div class="opp-score">${p.score} 👑</div>
                <div class="opp-cards-mini" id="opp-cards-${p.id}">
                    ${p.row.map((c, i) => `<img src="${c.img}" id="${i === p.row.length-1 ? 'card-target-'+p.id : ''}">`).join('')}
                </div>
            `;
            oppCarousel.appendChild(div);
        });
        
        // Show Parrot Modal if predicting
        if (state.parrotPredicting === myId) {
            ui.showParrotModal();
        } else {
            document.getElementById('parrot-modal').style.display = 'none';
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
    
    state: {
        started: false,
        players: [],
        deck1: [], deck2: [],
        deck1Count: 0, deck2Count: 0,
        turnIndex: 0, turn: null,
        currentDrawnCard: null,
        originalDeckIndex: null,
        forcedDeck: null,
        parrotPredicting: null, // id du joueur en train de prédire
        parrotPredictedAnimal: null // l'animal prédit
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
            players: game.state.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, row: p.row }))
        };
        game.broadcast({ type: 'STATE_UPDATE', state: safeState });
        ui.renderGameState(safeState, game.myId);
        
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        if(activePlayer && activePlayer.isBot) {
            setTimeout(game.playBotTurn, 2000); // 2 sec de réflexion pour le bot
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
                else if(data.type === 'VFX') game.handleVFX(data); // Reçoit les events d'animation !
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
        if(!game.isHost || game.state.turn !== playerId) return;
        
        if (action === 'PARROT_PREDICT') {
            game.state.parrotPredicting = null;
            game.state.parrotPredictedAnimal = payload.animalId;
            game.broadcast({ type: 'ALERT', msg: `${game.state.players.find(p=>p.id===playerId).name} prédit un(e) ${ANIMALS.find(a=>a.id===payload.animalId).name} !` });
            game.broadcastState();
            return;
        }

        if (action === 'DRAW') {
            if(game.state.currentDrawnCard) return;
            if(game.state.parrotPredicting) return; // Must finish prediction first
            if(game.state.forcedDeck && payload.deckIndex !== game.state.forcedDeck) return;

            let card = null;
            if (payload.deckIndex === 1 && game.state.deck1.length > 0) card = game.state.deck1.pop();
            else if (payload.deckIndex === 2 && game.state.deck2.length > 0) card = game.state.deck2.pop();

            if (card) {
                // If this is a parrot prediction draw
                if (game.state.parrotPredictedAnimal) {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.broadcastState(); // Show the drawn card
                    
                    if (card.id === game.state.parrotPredictedAnimal) {
                        // Success! They can keep it.
                        game.broadcast({ type: 'ALERT', msg: "Prédiction réussie !" });
                        game.state.parrotPredictedAnimal = null;
                    } else {
                        // Fail! Forced reject.
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
            
            // Animation Rejet
            game.triggerVFX({ action: 'REJECT', player: playerId });
            setTimeout(() => game.broadcastState(), 500); // sync après anim
        }
        else if (action === 'PLACE') {
            if(!game.state.currentDrawnCard) return;
            const player = game.state.players.find(p => p.id === playerId);
            const card = game.state.currentDrawnCard;
            
            if(payload.side === 'left') player.row.unshift(card);
            else player.row.push(card);
            
            game.state.currentDrawnCard = null;

            // Envoi de l'événement d'animation de la carte volante vers le joueur
            game.triggerVFX({ action: 'PLACE', player: playerId, card: card, side: payload.side });

            // On attend la fin du vol de la carte pour faire les effets des animaux
            setTimeout(() => {
                game.applyAnimalEffects(player, card, payload.side);
            }, 600);
        }
    },

    applyAnimalEffects: (player, card, side) => {
        // Applique l'effet Crocodile (Détruit la dernière carte d'un adversaire aléatoire)
        if (card.id === 'crocodile') {
            const opponents = game.state.players.filter(p => p.id !== player.id && p.row.length > 0);
            if (opponents.length > 0) {
                const targetOpp = opponents[Math.floor(Math.random() * opponents.length)];
                game.broadcast({ type: 'ALERT', msg: `Le Crocodile de ${player.name} attaque ${targetOpp.name} !` });
                game.triggerVFX({ action: 'CROCODILE_BITE', player: targetOpp.id });
                setTimeout(() => {
                    targetOpp.row.pop(); // Détruit la dernière carte
                    game.finalizeTurn(player);
                }, 800);
                return;
            }
        }
        
        // Singe : Échange la dernière carte avec un adversaire aléatoire
        if (card.id === 'monkey' && player.row.length > 1) {
            const opponents = game.state.players.filter(p => p.id !== player.id && p.row.length > 0);
            if (opponents.length > 0) {
                const targetOpp = opponents[Math.floor(Math.random() * opponents.length)];
                game.broadcast({ type: 'ALERT', msg: `${player.name} utilise son Singe pour échanger avec ${targetOpp.name} !` });
                const myLast = player.row.pop();
                const oppLast = targetOpp.row.pop();
                player.row.push(oppLast);
                targetOpp.row.push(myLast);
                // On finalise le tour directement (les cartes sont échangées)
            }
        }

        // Crabe : Déplace la première carte (la plus ancienne) à la fin
        if (card.id === 'crab' && player.row.length > 2) {
            game.broadcast({ type: 'ALERT', msg: `Le Crabe de ${player.name} déplace une carte !` });
            const first = player.row.shift();
            player.row.push(first);
        }

        // Caméléon : Si 2 caméléons, ils s'autodétruisent
        if (card.id === 'chameleon') {
            const chameleons = player.row.filter(c => c.id === 'chameleon');
            if (chameleons.length >= 2) {
                game.broadcast({ type: 'ALERT', msg: `Les deux Caméléons de ${player.name} disparaissent !` });
                // Enlève tous les caméléons de la main
                player.row = player.row.filter(c => c.id !== 'chameleon');
            }
        }
        
        // Effet Perroquet (Prédiction)
        if (card.id === 'parrot') {
            game.state.parrotPredicting = player.id;
            game.broadcastState();
            return; // On ne finalise pas le tour !
        }
        
        // Par défaut, pas d'effet complexe qui coupe le flux
        game.finalizeTurn(player);
    },

    finalizeTurn: (player) => {
        // Condition de Victoire : Lion (1 de chaque animal sauf Lion)
        const uniqueAnimals = new Set(player.row.filter(c => c.id !== 'lion').map(c => c.id));
        if (player.row.find(c => c.id === 'lion') && uniqueAnimals.size >= 7) {
            game.broadcast({ type: 'ALERT', msg: `${player.name} a réuni tous les animaux avec son Lion ! VICTOIRE !` });
            player.score += 1;
        }

        // Condition de Victoire : 4 identiques
        let lastId = null; let count = 0;
        for (let c of player.row) {
            if (c.id === lastId || c.id === 'chameleon' || lastId === 'chameleon') {
                count++;
                if(c.id !== 'chameleon') lastId = c.id; 
            } else { count = 1; lastId = c.id; }
            
            if (count >= 4) {
                game.broadcast({ type: 'ALERT', msg: `${player.name} a aligné 4 animaux ! VICTOIRE !` });
                player.score += 1;
                break;
            }
        }

        // Condition de Victoire : Pieuvre (2 paires)
        if (player.row.find(c => c.id === 'octopus') && player.row.length >= 5) {
            // Logique simplifiée : a gagné
            game.broadcast({ type: 'ALERT', msg: `${player.name} gagne grâce à la Pieuvre !` });
            player.score += 1;
        }

        // Effet Bernard l'Hermite : Rejoue si un crabe est présent
        if (player.row.length > 0 && player.row[player.row.length - 1].id === 'hermit_crab' && player.row.find(c => c.id === 'crab')) {
            game.broadcast({ type: 'ALERT', msg: `Le Bernard l'hermite offre un tour supplémentaire à ${player.name} !` });
            // Ne pas avancer le turnIndex
        } else {
            game.state.turnIndex = (game.state.turnIndex + 1) % game.state.players.length;
            game.state.turn = game.state.players[game.state.turnIndex].id;
        }
        game.broadcastState();
    },

    checkWinCondition: (player) => {
        let count = 1, lastId = null;
        for(let c of player.row) {
            let id = c.id;
            if(lastId === null && id !== 'chameleon') lastId = id;
            if(id === lastId || id === 'chameleon') {
                if(lastId !== null) count++;
                if(count >= 4) return true;
            } else { lastId = id; count = 1; }
        }
        return false;
    },

    // --- CLIENT VFX DISPATCHER ---
    triggerVFX: (vfxData) => {
        game.broadcast({ type: 'VFX', data: vfxData });
        game.handleVFX({ data: vfxData }); // Le Host le joue aussi
    },
    
    handleVFX: (event) => {
        const data = event.data;
        if(data.action === 'PLACE') {
            vfx.push((done) => {
                const targetId = data.player === game.myId ? 'my-row' : `opp-cards-${data.player}`;
                vfx.flyCard(data.card.img, 'drawn-card-img', targetId, done);
            });
        }
        else if (data.action === 'CROCODILE_BITE') {
            vfx.push((done) => {
                // Trouver la carte à croquer visuellement (la cible)
                const targetElement = document.getElementById(`card-target-${data.player}`);
                if (targetElement) {
                    vfx.crocodileBite(targetElement, done);
                } else {
                    done(); // Fallback si non trouvé
                }
            });
        }
        else if (data.action === 'REJECT') {
             vfx.push((done) => {
                // Petite animation de shake ou retour dans la pioche
                const c = document.getElementById('drawn-card-zone');
                if(c) {
                    c.style.transform = 'scale(0)';
                    c.style.transition = 'transform 0.3s';
                }
                setTimeout(() => { if(c) c.style.transform = ''; done(); }, 300);
             });
        }
    },

    // --- BOTS ---
    playBotTurn: () => {
        const botId = game.state.turn;
        const bot = game.state.players.find(p => p.id === botId);
        if(!bot || !bot.isBot) return;

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

        // Si le bot a raté sa prédiction perroquet, il n'a rien à faire (ça rejette auto)
        if(game.state.parrotPredictedAnimal && game.state.currentDrawnCard.id !== game.state.parrotPredictedAnimal) return;

        setTimeout(() => {
            const card = game.state.currentDrawnCard;
            let wantsToKeep = Math.random() > 0.2; // Bots gardent presque tout
            if(card.id === 'chameleon' || card.id === 'parrot') wantsToKeep = true;

            if(!wantsToKeep && !game.state.forcedDeck) {
                game.handlePlayerAction(botId, 'REJECT', {});
            } else {
                game.handlePlayerAction(botId, 'PLACE', { side: Math.random() > 0.5 ? 'left' : 'right' });
            }
        }, 1500); // Simule le temps de réflexion du bot
    }
};

document.addEventListener("DOMContentLoaded", game.init);
const originalHost = game.hostRoom;
ui.showScreen = (id) => {
    if(id === 'screen-host' && !game.isHost && game.connections.length === 0) game.hostRoom();
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
