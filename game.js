const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg' },
    { id: 'monkey', name: 'Singe', img: 'assets/card_monkey.jpg' },
    { id: 'crab', name: 'Crabe', img: 'assets/card_crab.jpg' },
    { id: 'hermit_crab', name: 'Bernard l\'hermite', img: 'assets/card_hermit_crab.jpg' },
    { id: 'octopus', name: 'Pieuvre', img: 'assets/card_octopus.jpg' },
    { id: 'lion', name: 'Lion', img: 'assets/card_lion.jpg' },
    { id: 'parrot', name: 'Perroquet', img: 'assets/card_parrot.jpg' }
];

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
        document.getElementById('card-actions').style.display = 'none';
        document.getElementById('placement-actions').style.display = 'flex';
    },
    renderGameState: (state, myId) => {
        // Update decks
        document.getElementById('deck-left-count').innerText = state.deck1Count;
        document.getElementById('deck-right-count').innerText = state.deck2Count;
        
        // Update turn indicator
        const turnPlayer = state.players.find(p => p.id === state.turn);
        const isMyTurn = (state.turn === myId);
        document.getElementById('turn-indicator').innerText = isMyTurn ? "C'est votre tour !" : `Tour de ${turnPlayer.name}`;
        
        // Hide drawn card if not actively drawing
        if (!state.currentDrawnCard) {
            document.getElementById('drawn-card-zone').style.display = 'none';
            document.getElementById('decks-area').style.pointerEvents = isMyTurn ? 'auto' : 'none';
            // Reset opacity
            document.getElementById('deck-left').style.opacity = '1';
            document.getElementById('deck-right').style.opacity = '1';
        } else {
            document.getElementById('drawn-card-zone').style.display = 'flex';
            document.getElementById('drawn-card-img').src = state.currentDrawnCard.img;
            document.getElementById('decks-area').style.pointerEvents = 'none';
            if(isMyTurn) {
                document.getElementById('card-actions').style.display = 'flex';
                document.getElementById('placement-actions').style.display = 'none';
                // Handle forced draw visually
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
            if (myRowEl.children.length !== myPlayer.row.length) {
                myRowEl.innerHTML = '';
                myPlayer.row.forEach(c => {
                    const img = document.createElement('img');
                    img.src = c.img;
                    img.className = 'card shadow-pop';
                    myRowEl.appendChild(img);
                });
            } else if (myPlayer.row.length === 0) {
                myRowEl.innerHTML = '';
            } else {
                // Same length, just update sources without re-animating
                myPlayer.row.forEach((c, i) => {
                    if(myRowEl.children[i]) myRowEl.children[i].src = c.img;
                });
            }
        }

        // Render Opponents
        const oppCarousel = document.getElementById('opponents-carousel');
        if (state.players.length === 2) {
            oppCarousel.classList.add('two-players-mode');
        } else {
            oppCarousel.classList.remove('two-players-mode');
        }
        oppCarousel.innerHTML = '';
        state.players.forEach(p => {
            if (p.id === myId) return;
            const div = document.createElement('div');
            div.className = `opponent-slot ${state.turn === p.id ? 'active-turn' : ''}`;
            div.innerHTML = `
                <div class="opp-name">${p.name} ${p.isBot?'🤖':''}</div>
                <div class="opp-score">${p.score} 👑</div>
                <div class="opp-cards-mini">
                    ${p.row.map(c => `<img src="${c.img}" class="shadow-pop">`).join('')}
                </div>
            `;
            oppCarousel.appendChild(div);
        });
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
    
    // Game State (Host only)
    state: {
        started: false,
        players: [], // { id, name, isBot, connection, row, score }
        deck1: [],
        deck2: [],
        deck1Count: 0,
        deck2Count: 0,
        turnIndex: 0,
        turn: null, // id of active player
        currentDrawnCard: null,
        originalDeckIndex: null,
        forcedDeck: null // If a player rejected, they are forced to draw from the other
    },

    init: () => {
        // Preload generic logic
        ui.showScreen('screen-home');
    },

    generateRoomCode: () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    // ================= HOST =================
    hostRoom: () => {
        game.isHost = true;
        game.roomCode = game.generateRoomCode();
        game.myName = "Hôte";
        document.getElementById('room-code-display').innerText = game.roomCode;
        
        game.peer = new Peer(`collect-${game.roomCode}`, {
            config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
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
                    if(game.state.players.length >= 8) {
                        conn.send({type: 'ERROR', msg: "Salon complet (8 max)."});
                        return;
                    }
                    game.connections.push(conn);
                    game.state.players.push({ id: conn.peer, name: data.name || "Joueur", isBot: false, row: [], score: 0 });
                    ui.updateWaitingPlayers(game.state.players);
                    game.broadcast({ type: 'PLAYERS_UPDATE', players: game.state.players.map(p => ({id:p.id, name:p.name, isBot:p.isBot})) });
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
        // Send a sanitized state to all clients
        const safeState = {
            started: game.state.started,
            deck1Count: game.state.deck1.length,
            deck2Count: game.state.deck2.length,
            turn: game.state.turn,
            currentDrawnCard: game.state.currentDrawnCard,
            forcedDeck: game.state.forcedDeck,
            players: game.state.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, row: p.row }))
        };
        game.broadcast({ type: 'STATE_UPDATE', state: safeState });
        ui.renderGameState(safeState, game.myId); // Update self
        
        // Check if it's a bot's turn
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        if(activePlayer && activePlayer.isBot) {
            setTimeout(game.playBotTurn, 1500);
        }
    },

    startGame: () => {
        // Generate Deck (64 cards)
        let fullDeck = [];
        for(let i=0; i<8; i++) {
            ANIMALS.forEach(animal => fullDeck.push({...animal}));
        }
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

    // ================= CLIENT =================
    joinRoom: () => {
        const code = document.getElementById('input-room-code').value.toUpperCase();
        const name = document.getElementById('input-player-name').value || "Joueur";
        if(code.length !== 4) return;
        
        document.getElementById('join-msg').innerText = "Connexion...";
        game.peer = new Peer({
            config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
        });
        game.peer.on('error', (err) => {
            document.getElementById('join-msg').innerText = "Erreur (" + err.type + "). Réessayez.";
        });
        game.peer.on('open', (id) => {
            game.myId = id;
            game.myName = name;
            const conn = game.peer.connect(`collect-${code}`);
            conn.on('open', () => {
                conn.send({ type: 'JOIN', name: name });
            });
            conn.on('data', (data) => {
                if(data.type === 'ERROR') {
                    document.getElementById('join-msg').innerText = data.msg;
                } else if(data.type === 'PLAYERS_UPDATE') {
                    ui.showScreen('screen-host');
                    document.getElementById('room-code-display').innerText = code;
                    document.querySelector('.host-actions').style.display = 'none'; // Clients can't start
                    ui.updateWaitingPlayers(data.players);
                } else if(data.type === 'START_GAME') {
                    ui.showScreen('screen-game');
                } else if(data.type === 'STATE_UPDATE') {
                    ui.renderGameState(data.state, game.myId);
                } else if(data.type === 'ALERT') {
                    ui.showOverlay("Info", data.msg);
                }
            });
            game.connections = [conn]; // Client has only 1 connection to host
        });
    },

    sendAction: (action, payload) => {
        if(game.isHost) {
            game.handlePlayerAction(game.myId, action, payload);
        } else {
            game.connections[0].send({ type: 'ACTION', action, payload });
        }
    },

    // ================= GAME ACTIONS =================
    drawCard: (deckIndex) => {
        game.sendAction('DRAW', { deckIndex });
    },
    rejectCard: () => {
        game.sendAction('REJECT', {});
    },
    placeCard: (side) => {
        game.sendAction('PLACE', { side });
    },

    // ================= HOST GAME LOGIC =================
    handlePlayerAction: (playerId, action, payload) => {
        if(!game.isHost) return;
        if(game.state.turn !== playerId) return;

        if (action === 'DRAW') {
            if(game.state.currentDrawnCard) return; // Already drew
            if(game.state.forcedDeck && payload.deckIndex !== game.state.forcedDeck) return;

            let card = null;
            if (payload.deckIndex === 1 && game.state.deck1.length > 0) card = game.state.deck1.pop();
            else if (payload.deckIndex === 2 && game.state.deck2.length > 0) card = game.state.deck2.pop();

            if (card) {
                game.state.currentDrawnCard = card;
                game.state.originalDeckIndex = payload.deckIndex;
                game.state.forcedDeck = null;
                game.broadcastState();
            }
        }
        else if (action === 'REJECT') {
            if(!game.state.currentDrawnCard) return;
            // Put card back
            if(game.state.originalDeckIndex === 1) game.state.deck1.push(game.state.currentDrawnCard);
            else game.state.deck2.push(game.state.currentDrawnCard);
            
            // Force draw from other deck
            game.state.forcedDeck = game.state.originalDeckIndex === 1 ? 2 : 1;
            game.state.currentDrawnCard = null;
            game.broadcastState();
        }
        else if (action === 'PLACE') {
            if(!game.state.currentDrawnCard) return;
            
            const player = game.state.players.find(p => p.id === playerId);
            if(payload.side === 'left') player.row.unshift(game.state.currentDrawnCard);
            else player.row.push(game.state.currentDrawnCard);

            game.state.currentDrawnCard = null;
            
            // Check win condition
            if(game.checkWinCondition(player)) {
                player.score++;
                game.broadcast({ type: 'ALERT', msg: `${player.name} remporte la couronne !` });
                if(player.id === game.myId) ui.showOverlay("👑 Victoire", "Vous remportez la couronne !");
                // Reset rows
                game.state.players.forEach(p => p.row = []);
                // Ensure enough cards, simplified shuffle
                if(game.state.deck1.length + game.state.deck2.length < 10) {
                     game.broadcast({ type: 'ALERT', msg: `Les pioches sont vides.` });
                }
            } else {
                // Next turn
                game.state.turnIndex = (game.state.turnIndex + 1) % game.state.players.length;
                game.state.turn = game.state.players[game.state.turnIndex].id;
            }
            game.broadcastState();
        }
    },

    checkWinCondition: (player) => {
        // Logique de victoire : 4 identiques ou caméléon
        let count = 1;
        let lastId = null;
        for(let c of player.row) {
            let id = c.id;
            if(lastId === null && id !== 'chameleon') lastId = id;
            if(id === lastId || id === 'chameleon') {
                if(lastId !== null) count++;
                if(count >= 4) return true;
            } else {
                lastId = id;
                count = 1;
            }
        }
        return false;
    },

    // ================= BOT LOGIC =================
    playBotTurn: () => {
        const botId = game.state.turn;
        const bot = game.state.players.find(p => p.id === botId);
        if(!bot || !bot.isBot) return;

        // Etape 1: Piocher
        if(!game.state.currentDrawnCard) {
            const deckToDraw = game.state.forcedDeck || (Math.random() > 0.5 ? 1 : 2);
            game.handlePlayerAction(botId, 'DRAW', { deckIndex: deckToDraw });
            return;
        }

        // Etape 2: Garder ou Rejeter (Petit délai pour l'animation)
        setTimeout(() => {
            const card = game.state.currentDrawnCard;
            let wantsToKeep = Math.random() > 0.3; // 70% de chance de garder
            
            // Intelligence basique: si c'est un caméléon, on garde.
            if(card.id === 'chameleon') wantsToKeep = true;

            if(!wantsToKeep && !game.state.forcedDeck) {
                game.handlePlayerAction(botId, 'REJECT', {});
            } else {
                // Poser à gauche ou droite
                const side = Math.random() > 0.5 ? 'left' : 'right';
                game.handlePlayerAction(botId, 'PLACE', { side: side });
            }
        }, 1500);
    }
};

// Start
document.addEventListener("DOMContentLoaded", game.init);
// Overrides host creation to trigger directly from UI
const originalHost = game.hostRoom;
ui.showScreen = (id) => {
    if(id === 'screen-host' && !game.isHost && game.connections.length === 0) game.hostRoom();
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
