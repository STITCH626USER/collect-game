const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg?v=4', desc: 'Détruit la carte de votre choix chez un adversaire.' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg?v=4', desc: 'Joker. S\'annule et se défausse si vous en posez un 2ème.' },
    { id: 'monkey', name: 'Singe', img: 'assets/card_monkey.jpg?v=4', desc: 'Échange votre Singe avec la carte d\'un adversaire.' },
    { id: 'crab', name: 'Crabe', img: 'assets/card_crab.jpg?v=4', desc: 'Déplace votre première carte à la fin de votre rangée.' },
    { id: 'hermit_crab', name: 'Bernard l\'hermite', img: 'assets/card_hermit_crab.jpg?v=6', desc: 'Rejouez un tour si vous avez déjà un Crabe.' },
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
    selectedCrabCard: null,
    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'screen-game') {
            const vic = document.getElementById('victory-modal');
            if(vic) vic.style.display = 'none';
        }
    },
    showOverlay: (title, desc, btnHtml = '') => {
        document.getElementById('overlay-title').innerText = title;
        document.getElementById('overlay-desc').innerText = desc;
        const btnContainer = document.getElementById('overlay-btn-container');
        if (btnContainer) {
            btnContainer.innerHTML = btnHtml;
            btnContainer.style.display = btnHtml ? 'block' : 'none';
        }
        document.getElementById('overlay-msg').style.display = 'block';
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

    showVictoryModal: (winner, reason, row) => {
        document.getElementById('victory-title').innerText = winner.id === game.myId ? "VOUS AVEZ GAGNÉ ! 🎉" : "VICTOIRE ! 🎉";
        document.getElementById('victory-subtitle').innerText = `${winner.name} a gagné ${reason}`;
        
        const cardsDiv = document.getElementById('victory-cards');
        cardsDiv.innerHTML = '';
        row.forEach(c => {
            const img = document.createElement('img');
            img.src = c.img;
            
            if (reason.includes('Lion')) {
                img.classList.add('highlight-win');
            } else if (reason.includes('Pieuvre')) {
                img.classList.add('highlight-win');
            }
            
            cardsDiv.appendChild(img);
        });
        
        const rematchBtn = document.getElementById('btn-rematch');
        rematchBtn.style.display = 'inline-block';
        if (game.state.rematchVotes) {
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
        
        document.getElementById('victory-modal').style.display = 'flex';
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

        document.getElementById('zoom-opp-name').innerText = `Jeu de ${p.name} (${p.score} 👑)`;
        
        const zoomCardsContainer = document.getElementById('zoom-opp-cards');
        zoomCardsContainer.innerHTML = '';
        
        if (state.crabTargeting === myId && ui.selectedCrabCard && ui.selectedCrabCard.playerId === p.id) {
            const leftGhost = document.createElement('div');
            leftGhost.className = 'crab-ghost bounce-in';
            leftGhost.innerHTML = '⬅️';
            leftGhost.onclick = () => { const payload = { targetPlayerId: p.id, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'left' }; ui.selectedCrabCard = null; document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('CRAB_SELECT', payload); };
            zoomCardsContainer.appendChild(leftGhost);
        }

        p.row.forEach((c, index) => {
            const img = document.createElement('img');
            img.src = c.img;
            img.className = 'card';
            
            if (state.crabTargeting === myId && p.row.length > 1) {
                img.classList.add('clickable-target');
                if (ui.selectedCrabCard && ui.selectedCrabCard.playerId === p.id && ui.selectedCrabCard.cardIndex === index) {
                    img.style.borderColor = 'var(--primary)';
                }
                img.onclick = () => { ui.selectedCrabCard = { playerId: p.id, cardIndex: index }; ui.renderZoomModal(p.id); };
            } else if (state.crocodileTargeting === myId) {
                img.classList.add('clickable-target');
                img.onclick = () => { document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('CROCODILE_SELECT', { targetPlayerId: p.id, cardIndex: index }); };
            } else if (state.monkeyTargeting === myId) {
                img.classList.add('clickable-target');
                img.onclick = () => { document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('MONKEY_SELECT', { targetPlayerId: p.id, cardIndex: index }); };
            }
            
            zoomCardsContainer.appendChild(img);
        });
        
        if (state.crabTargeting === myId && ui.selectedCrabCard && ui.selectedCrabCard.playerId === p.id) {
            const rightGhost = document.createElement('div');
            rightGhost.className = 'crab-ghost opp-ghost bounce-in';
            rightGhost.innerHTML = '➡️';
            rightGhost.onclick = () => { const payload = { targetPlayerId: p.id, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'right' }; ui.selectedCrabCard = null; document.getElementById('opponent-zoom-modal').style.display = 'none'; game.sendAction('CRAB_SELECT', payload); };
            zoomCardsContainer.appendChild(rightGhost);
        }
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
    
    renderHistory: (history) => {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        if (!history || history.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#999;">Aucune action pour le moment.</p>';
            return;
        }
        history.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerText = msg;
            list.appendChild(div);
        });
        list.scrollTop = list.scrollHeight;
    },

    renderGameState: (state, myId) => {
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
        document.getElementById('deck-left-count').innerText = state.deck1Count;
        document.getElementById('deck-right-count').innerText = state.deck2Count;
        
        const thumbLeft = document.getElementById('deck-left-thumbnail');
        if (state.deck1Thumbnail) { thumbLeft.src = state.deck1Thumbnail; thumbLeft.style.display = 'block'; }
        else { thumbLeft.style.display = 'none'; }
        
        const thumbRight = document.getElementById('deck-right-thumbnail');
        if (state.deck2Thumbnail) { thumbRight.src = state.deck2Thumbnail; thumbRight.style.display = 'block'; }
        else { thumbRight.style.display = 'none'; }
        
        const turnPlayer = state.players.find(p => p.id === state.turn);
        const isMyTurn = (state.turn === myId);
        const turnIndicator = document.getElementById('turn-indicator');
        turnIndicator.innerText = isMyTurn ? "C'est votre tour !" : `Tour de ${turnPlayer ? turnPlayer.name : '...'}`;
        if (isMyTurn) turnIndicator.classList.remove('opp-turn');
        else turnIndicator.classList.add('opp-turn');
        
        if (!state.currentDrawnCard) {
            document.getElementById('action-modal').style.display = 'none';
            document.getElementById('deck-left').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-right').classList.toggle('disabled', !isMyTurn);
            document.getElementById('deck-left').style.opacity = '1';
            document.getElementById('deck-right').style.opacity = '1';
        } else {
            document.getElementById('action-modal').style.display = 'flex';
            const drawnCardImg = document.getElementById('drawn-card-img');
            drawnCardImg.src = state.currentDrawnCard.img;
            drawnCardImg.style.opacity = '1'; 
            
            document.getElementById('deck-left').classList.add('disabled');
            document.getElementById('deck-right').classList.add('disabled');

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
                                <button class="btn-action btn-keep" onclick="game.sendAction('PARROT_INIT', {})">✨ AVEC pouvoir</button>
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
                
                if (state.monkeyTargeting === myId || state.parrotPredicting === myId) {
                    document.getElementById('drawn-card').style.transform = 'scale(0.5) translateY(30px)';
                    cardActions.style.display = 'none';
                } else {
                    document.getElementById('drawn-card').style.transform = '';
                }
            } else {
                document.getElementById('card-actions').style.display = 'none';
                document.getElementById('placement-actions').style.display = 'none';
            }
        }
        
        if (state.crocodileTargeting === myId) {
            ui.showOverlay("Attaque Crocodile 🐊", "Cliquez sur une carte à dévorer, ou passez si vous ne voulez pas utiliser le pouvoir.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('CROCODILE_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
        } else if (state.monkeyTargeting === myId) {
            ui.showOverlay("Pouvoir du Singe 🐒", "Cliquez sur la carte avec laquelle échanger, ou passez.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('MONKEY_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
        } else if (state.crabTargeting === myId) {
            if (ui.selectedCrabCard) {
                ui.showOverlay("Pouvoir du Crabe 🦀", "Cliquez sur ⬅️ ou ➡️ de chaque côté de sa ligne, ou annulez.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="ui.selectedCrabCard = null; ui.renderGameState(game.state, game.myId);">Annuler la sélection</button>`);
            } else {
                ui.showOverlay("Pouvoir du Crabe 🦀", "Cliquez sur une carte à déplacer, ou passez.", `<button class="btn-action btn-reject" style="width: 100%;" onclick="game.sendAction('CRAB_SELECT', {skip: true})">Ne pas utiliser le pouvoir</button>`);
            }

        } else if (state.crocodileTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crocodileTargeting);
            ui.showOverlay("Attaque Crocodile...", `${targetingPlayer.name} choisit sa cible...`);
        } else if (state.monkeyTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.monkeyTargeting);
            ui.showOverlay("Pouvoir du Singe...", `${targetingPlayer.name} choisit avec qui échanger...`);
        } else if (state.crabTargeting) {
            const targetingPlayer = state.players.find(p => p.id === state.crabTargeting);
            ui.showOverlay("Pouvoir du Crabe...", `${targetingPlayer.name} hésite à déplacer une carte...`);
        } else if (state.parrotPredictedAnimal && state.turn !== myId) {
            const targetingPlayer = state.players.find(p => p.id === state.turn);
            const animalNameMap = {
                lion: 'le Lion 🦁', chameleon: 'le Caméléon 🦎', monkey: 'le Singe 🐒',
                crab: 'le Crabe 🦀', octopus: 'la Pieuvre 🐙', crocodile: 'le Crocodile 🐊', parrot: 'le Perroquet 🦜', 'hermit_crab': 'le Bernard-l\'ermite 🐚'
            };
            ui.showOverlay("Prédiction en cours 🦜", `${targetingPlayer.name} a prédit ${animalNameMap[state.parrotPredictedAnimal]} ! Il s'apprête à piocher...`);
        } else {
            ui.selectedCrabCard = null;
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
                img.id = `card-target-${myId}-${index}`;
                
                if (state.crabTargeting === myId && myPlayer.row.length > 1) {
                    img.classList.add('clickable-target');
                    if (ui.selectedCrabCard && ui.selectedCrabCard.playerId === myId && ui.selectedCrabCard.cardIndex === index) {
                        img.style.borderColor = 'var(--primary)';
                    }
                    img.onclick = () => { ui.selectedCrabCard = { playerId: myId, cardIndex: index }; ui.renderGameState(state, myId); };
                } else if (state.crocodileTargeting === myId) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('CROCODILE_SELECT', { targetPlayerId: myId, cardIndex: index });
                } else if (state.monkeyTargeting === myId) {
                    img.classList.add('clickable-target');
                    img.onclick = () => game.sendAction('MONKEY_SELECT', { targetPlayerId: myId, cardIndex: index });
                }
                
                myRowEl.appendChild(img);
            });
            
            if (state.crabTargeting === myId && ui.selectedCrabCard && ui.selectedCrabCard.playerId === myId) {
                const leftGhost = document.createElement('div');
                leftGhost.className = 'crab-ghost bounce-in';
                leftGhost.innerHTML = '⬅️';
                leftGhost.onclick = () => { const p = { targetPlayerId: myId, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'left' }; ui.selectedCrabCard = null; game.sendAction('CRAB_SELECT', p); };
                myRowEl.prepend(leftGhost);

                const rightGhost = document.createElement('div');
                rightGhost.className = 'crab-ghost bounce-in';
                rightGhost.innerHTML = '➡️';
                rightGhost.onclick = () => { const p = { targetPlayerId: myId, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'right' }; ui.selectedCrabCard = null; game.sendAction('CRAB_SELECT', p); };
                myRowEl.appendChild(rightGhost);
            }
        }

        const oppCarousel = document.getElementById('opponents-carousel');
        const oppArea1v1 = document.getElementById('opponent-area-1v1');
        const is1v1 = (state.players.length === 2);
        
        if (is1v1) {
            oppCarousel.style.display = 'none';
            oppArea1v1.style.display = 'block';
            
            const oppPlayer = state.players.find(p => p.id !== myId);
            if (oppPlayer) {
                const isTargeting = (state.crocodileTargeting === myId || state.monkeyTargeting === myId || (state.crabTargeting === myId && oppPlayer.row.length > 1));
                
                document.getElementById('opp-1v1-name').innerText = `${oppPlayer.name} ${oppPlayer.isBot ? '🤖' : ''} ${state.parrotPredicting === oppPlayer.id ? '🦜' : ''}`;
                document.getElementById('opp-1v1-score').innerText = oppPlayer.score;
                document.getElementById('opp-1v1-name').parentElement.style.border = (state.turn === oppPlayer.id) ? '2px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)';
                if (isTargeting) document.getElementById('opp-1v1-name').parentElement.classList.add('targeting-mode');
                else document.getElementById('opp-1v1-name').parentElement.classList.remove('targeting-mode');
                
                const oppRowEl = document.getElementById('opp-1v1-row');
                oppRowEl.innerHTML = '';
                
                if (state.crabTargeting === myId && ui.selectedCrabCard && ui.selectedCrabCard.playerId === oppPlayer.id) {
                    const leftGhost = document.createElement('div');
                    leftGhost.className = 'crab-ghost bounce-in';
                    leftGhost.innerHTML = '⬅️';
                    leftGhost.onclick = () => { const payload = { targetPlayerId: oppPlayer.id, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'left' }; ui.selectedCrabCard = null; game.sendAction('CRAB_SELECT', payload); };
                    oppRowEl.appendChild(leftGhost);
                }

                oppPlayer.row.forEach((c, index) => {
                    const img = document.createElement('img');
                    img.src = c.img;
                    img.className = 'card';
                    img.id = `card-target-${oppPlayer.id}-${index}`;
                    
                    if (state.crabTargeting === myId && oppPlayer.row.length > 1) {
                        img.classList.add('clickable-target');
                        if (ui.selectedCrabCard && ui.selectedCrabCard.playerId === oppPlayer.id && ui.selectedCrabCard.cardIndex === index) {
                            img.style.borderColor = 'var(--primary)';
                        }
                        img.onclick = () => { ui.selectedCrabCard = { playerId: oppPlayer.id, cardIndex: index }; ui.renderGameState(state, myId); };
                    } else if (state.crocodileTargeting === myId) {
                        img.classList.add('clickable-target');
                        img.onclick = () => game.sendAction('CROCODILE_SELECT', { targetPlayerId: oppPlayer.id, cardIndex: index });
                    } else if (state.monkeyTargeting === myId) {
                        img.classList.add('clickable-target');
                        img.onclick = () => game.sendAction('MONKEY_SELECT', { targetPlayerId: oppPlayer.id, cardIndex: index });
                    }
                    
                    oppRowEl.appendChild(img);
                });
                
                if (state.crabTargeting === myId && ui.selectedCrabCard && ui.selectedCrabCard.playerId === oppPlayer.id) {
                    const rightGhost = document.createElement('div');
                    rightGhost.className = 'crab-ghost opp-ghost bounce-in';
                    rightGhost.innerHTML = '➡️';
                    rightGhost.onclick = () => { const payload = { targetPlayerId: oppPlayer.id, cardIndex: ui.selectedCrabCard.cardIndex, direction: 'right' }; ui.selectedCrabCard = null; game.sendAction('CRAB_SELECT', payload); };
                    oppRowEl.appendChild(rightGhost);
                }
            }
        } else {
            oppCarousel.style.display = 'flex';
            oppArea1v1.style.display = 'none';
            oppCarousel.innerHTML = '';
            
            state.players.forEach(p => {
                if (p.id === myId) return;
                const div = document.createElement('div');
                div.className = `opponent-slot ${state.turn === p.id ? 'active-turn' : ''}`;
                
                if (state.crocodileTargeting === myId || state.monkeyTargeting === myId || (state.crabTargeting === myId && p.row.length > 1)) {
                    div.classList.add('targeting-mode');
                }

                div.id = `opp-slot-${p.id}`;
                div.onclick = () => ui.openOpponentZoom(p.id);
                div.style.cursor = 'pointer';
                
                const oppCardsMini = document.createElement('div');
                oppCardsMini.className = 'opp-cards-mini';
                oppCardsMini.id = `opp-cards-${p.id}`;
                
                p.row.forEach((c, index) => {
                    const img = document.createElement('img');
                    img.src = c.img;
                    oppCardsMini.appendChild(img);
                });

                div.innerHTML = `
                    <div class="opp-name">${p.name} ${p.isBot?'🤖':''} ${state.parrotPredicting === p.id ? '🦜' : ''}</div>
                    <div class="opp-score">${p.score} 👑</div>
                `;
                div.appendChild(oppCardsMini);
                oppCarousel.appendChild(div);
            });
        }
        
        if (!is1v1 && ui.zoomedOpponentId) {
            ui.renderZoomModal(ui.zoomedOpponentId);
        } else {
            ui.zoomedOpponentId = null;
            document.getElementById('opponent-zoom-modal').style.display = 'none';
        }
        
        if (state.parrotPredicting === myId) ui.showParrotModal();
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
        game.state.history.push(msg);
        game.broadcast({ type: 'HISTORY_UPDATE', history: game.state.history });
        ui.renderHistory(game.state.history);
    },

    init: () => { ui.showScreen('screen-home'); },

    generateRoomCode: () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    hostRoom: () => {
        game.isHost = true;
        game.roomCode = game.generateRoomCode();
        const nameInput = document.getElementById('input-host-name');
        game.myName = (nameInput && nameInput.value.trim() !== '') ? nameInput.value.trim() : "Hôte";
        document.getElementById('room-code-display').innerText = game.roomCode;
        
        game.peer = new Peer(`collect-${game.roomCode}`, {
            config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        
        game.peer.on('open', (id) => {
            game.myId = id;
            game.state.players.push({ id: id, name: game.myName, isBot: false, row: [], score: 0 });
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
                    conn.send({ type: 'HISTORY_UPDATE', history: game.state.history });
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
        if (data.type === 'ALERT') {
            ui.showOverlay("Info", data.msg);
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
            players: game.state.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, row: p.row }))
        };
        game.broadcast({ type: 'STATE_UPDATE', state: safeState });
        ui.renderGameState(safeState, game.myId);
        
        const activePlayer = game.state.players.find(p => p.id === game.state.turn);
        if(activePlayer && activePlayer.isBot) {
            if (game.botTimer) clearTimeout(game.botTimer);
            game.botTimer = setTimeout(game.playBotTurn, 600);
        }
    },

    startGame: () => {
        let fullDeck = [];
        for(let i=0; i<8; i++) ANIMALS.forEach(animal => fullDeck.push({...animal}));
        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }
        
        game.state.deck1 = fullDeck.slice(0, 32);
        game.state.deck2 = fullDeck.slice(32);
        game.state.deck1Thumbnail = null;
        game.state.deck2Thumbnail = null;
        game.state.started = true;
        game.state.turnIndex = 0;
        game.state.turn = game.state.players[0].id;
        game.state.currentDrawnCard = null;
        game.state.mustPlaceDrawnCard = false;
        game.state.crabTargeting = null;
        game.state.monkeyTargeting = null;
        game.state.crocTargeting = null;

        // Initialiser 3 cartes pour tout le monde
        game.state.players.forEach(p => {
            p.row = [];
            if (p.score === undefined) p.score = 0;
            p.row.push(game.state.deck1.pop());
            p.row.push(game.state.deck2.pop());
            p.row.push(game.state.deck1.pop());
        });ui.hideOverlay();
        document.getElementById('victory-modal').style.display = 'none';
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
                else if(data.type === 'START_GAME') { 
                    ui.showScreen('screen-game'); 
                    ui.hideOverlay();
                    document.getElementById('victory-modal').style.display = 'none'; 
                }
                else if(data.type === 'STATE_UPDATE') ui.renderGameState(data.state, game.myId);
                else if(data.type === 'ALERT') ui.showOverlay("Info", data.msg);
                else if(data.type === 'VFX') game.handleVFX(data);
                else if(data.type === 'VICTORY') ui.showVictoryModal(data.winner, data.reason, data.row);
                else if(data.type === 'HISTORY_UPDATE') ui.renderHistory(data.history);
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

        if (action === 'MONKEY_INIT') {
            game.state.monkeyTargeting = playerId;
            game.broadcastState();
            return;
        }

        if (action === 'PARROT_INIT') {
            game.state.parrotPredicting = playerId;
            const sourcePlayer = game.state.players.find(p => p.id === playerId);
            game.addHistory(`${sourcePlayer.name} utilise son Perroquet et va faire une prédiction...`);
            game.broadcastState();
            return;
        }

        if (action === 'PARROT_PREDICT') {
            game.state.parrotPredicting = null;
            game.state.parrotPredictedAnimal = payload.animalId;
            const sourcePlayer = game.state.players.find(p=>p.id===playerId);
            const animalObj = ANIMALS.find(a=>a.id===payload.animalId);
            game.addHistory(`${sourcePlayer.name} prédit : ${animalObj.name}.`);
            game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} prédit un(e) ${animalObj.name} !` });
            game.broadcastState();
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
                    playerB: targetPlayer.id, indexB: payload.cardIndex, cardImgB: oppCard.img,
                    monkeyImg: monkeyCard.img
                });

                setTimeout(() => {
                    targetPlayer.row[payload.cardIndex] = monkeyCard;
                    game.state.currentDrawnCard = oppCard;
                    game.state.mustPlaceDrawnCard = true;
                    game.state.disablePower = true;
                    game.broadcast({ type: 'ALERT', msg: `${sourcePlayer.name} a volé une carte à ${targetPlayer.name} avec son Singe !` });
                    game.broadcastState();
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
                    if (targetPlayer && targetPlayer.row.length > payload.cardIndex && targetPlayer.row.length > 1) {
                        const targetCard = targetPlayer.row[payload.cardIndex];
                        game.triggerVFX({ action: 'CRAB_MOVE', player: targetPlayer.id, cardImg: targetCard.img, cardIndex: payload.cardIndex, direction: payload.direction });
                        setTimeout(() => {
                            const cardToMove = targetPlayer.row.splice(payload.cardIndex, 1)[0];
                            if (payload.direction === 'left') targetPlayer.row.unshift(cardToMove);
                            else targetPlayer.row.push(cardToMove);
                            
                            const targetCardName = targetCard.name || "une carte";
                            game.addHistory(`${player.name} 🦀 déplace la carte ${targetCardName} de ${targetPlayer.name}.`);
                            game.broadcast({ type: 'ALERT', msg: `Le Crabe de ${player.name} a déplacé la carte ${targetCardName} de ${targetPlayer.name} vers la ${payload.direction === 'left' ? 'gauche' : 'droite'} !` });
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

        if(game.state.turn !== playerId) return;

        if (action === 'DRAW') {
            if(game.state.currentDrawnCard) return;
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
                const sourcePlayer = game.state.players.find(p => p.id === playerId);
                game.addHistory(`${sourcePlayer.name} pioche ${card.name}.`);

                if (game.state.parrotPredictedAnimal) {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    game.state.mustPlaceDrawnCard = false;
                    
                    if (card.id === game.state.parrotPredictedAnimal) {
                        game.broadcast({ type: 'ALERT', msg: "Prédiction réussie ! Le Perroquet est défaussé." });
                        game.state.parrotPredictedAnimal = null;
                        game.broadcastState();
                    } else {
                        game.broadcastState(); // Broadcast to show the wrong card
                        game.broadcast({ type: 'ALERT', msg: "Prédiction ratée ! Les deux cartes sont défaussées." });
                        setTimeout(() => {
                            game.state.parrotPredictedAnimal = null;
                            game.handlePlayerAction(playerId, 'REJECT', { endTurn: true });
                        }, 1500);
                    }
                } else {
                    game.state.currentDrawnCard = card;
                    game.state.originalDeckIndex = payload.deckIndex;
                    game.state.forcedDeck = null;
                    // Note: We DO NOT clear mustPlaceDrawnCard here, because this is where the player DRAWS the forced card. 
                    // If they drew the forced card, mustPlaceDrawnCard remains true until their turn ends!
                    // Wait, if mustPlaceDrawnCard is true, it remains true for this card. If it's false, it remains false.
                    game.broadcastState();
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
                setTimeout(() => game.broadcastState(), 500);
            }
        }
        else if (action === 'PLACE') {
            if(!game.state.currentDrawnCard) return;
            if (game.state.parrotPredictedAnimal) return; // Block cheating
            const player = game.state.players.find(p => p.id === playerId);
            const card = game.state.currentDrawnCard;
            
            game.addHistory(`${player.name} joue ${card.name}.`);

            if(payload.side === 'left') player.row.unshift(card);
            else player.row.push(card);
            
            game.state.currentDrawnCard = null;
            game.state.forcedDeck = null;
            game.state.mustPlaceDrawnCard = false;
            
            const wasDisablePower = game.state.disablePower;
            game.state.disablePower = false;

            game.triggerVFX({ action: 'PLACE', player: playerId, card: card, side: payload.side });

            setTimeout(() => {
                game.applyAnimalEffects(player, card, payload.side, payload.skipPower || wasDisablePower);
            }, 600);
            return;
        }
    },

    applyAnimalEffects: (player, card, side, skipPower = false) => {
        if (skipPower) {
            let getsExtraTurn = false;
            if (card.id === 'hermit_crab' && player.row.find(c => c.id === 'crab' || c.id === 'chameleon')) getsExtraTurn = true;
            game.finalizeTurn(player, getsExtraTurn);
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

        // Chameleon cancellation moved to finalizeTurn
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
        // Règle passive : 2 Caméléons s'annulent toujours
        const chameleons = player.row.filter(c => c.id === 'chameleon');
        if (chameleons.length >= 2) {
            game.broadcast({ type: 'ALERT', msg: `Les Caméléons de ${player.name} s'annulent !` });
            player.row = player.row.filter(c => c.id !== 'chameleon');
            game.triggerVFX({ action: 'REJECT', player: player.id }); // Trigger a visual discard
        }

        let won = false;
        let winReason = '';
        
        const uniqueAnimals = new Set(player.row.filter(c => c.id !== 'lion').map(c => c.id));
        if (player.row.find(c => c.id === 'lion') && uniqueAnimals.size >= 7) {
            game.broadcast({ type: 'ALERT', msg: `${player.name} a réuni tous les animaux avec son Lion ! VICTOIRE !` });
            player.score += 0.5;
            won = true; winReason = "grâce au Lion (7 espèces différentes) !";
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
                    player.score += 0.5;
                    won = true; winReason = "en alignant 4 animaux identiques !";
                    break;
                }
            }
        }

        if (!won && player.row.find(c => c.id === 'octopus')) {
            let frequencies = {};
            let chameleonCount = 0;
            for(let c of player.row) {
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
            if (pairs >= 3) {
                game.broadcast({ type: 'ALERT', msg: `${player.name} a formé 3 paires grâce à la Pieuvre ! VICTOIRE !` });
                player.score += 0.5;
                won = true; winReason = "grâce à la Pieuvre (3 paires) !";
            }
        }

        if (won) {
            game.addHistory(`🏆 ${player.name} GAGNE !`);
            game.state.started = false;
            game.state.rematchVotes = game.state.players.filter(p => p.isBot).map(p => p.id);
            game.broadcast({ type: 'VICTORY', winner: player, reason: winReason, row: player.row });
            ui.showVictoryModal(player, winReason, player.row);
            game.broadcastState();
            return;
        }


        if (getsExtraTurn) {
            game.addHistory(`${player.name} rejoue grâce au Bernard l'hermite !`);
            game.broadcast({ type: 'ALERT', msg: `Le Bernard l'hermite offre un tour supplémentaire à ${player.name} !` });
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
                    }, sRect, 'attack');
                } else done();
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
            vfx.push((done) => {
                const targetCard = document.getElementById(`card-target-${data.playerB}-${data.indexB}`);
                const centerDrawnCard = document.getElementById('drawn-card-img');
                
                if (targetCard && centerDrawnCard) {
                    const rectB = targetCard.getBoundingClientRect(); // Opponent card
                    const rectA = centerDrawnCard.getBoundingClientRect(); // Monkey
                    
                    targetCard.style.opacity = '0';
                    centerDrawnCard.style.opacity = '0';
                    
                    vfx.flyCardToRect(data.monkeyImg, null, rectB, null, rectA, 'spin');
                    vfx.flyCardToRect(data.cardImgB, null, rectA, () => { done(); }, rectB, 'spin-reverse');
                } else {
                    done(); // Prevent blocking
                }
            });
        }
        else if (data.action === 'CRAB_MOVE') {
            vfx.push((done) => {
                const cardEl = document.getElementById(`card-target-${data.player}-${data.cardIndex}`);
                const is1v1 = game.state.players.length === 2;
                const containerId = data.player === game.myId ? 'my-row' : (is1v1 ? 'opp-1v1-row' : `opp-cards-${data.player}`);
                const container = document.getElementById(containerId);
                if (cardEl && container) {
                    const sRect = cardEl.getBoundingClientRect();
                    const placeholder = document.createElement('div');
                    placeholder.style.width = (data.player === game.myId ? 75 : 40) + 'px';
                    placeholder.style.height = (data.player === game.myId ? 110 : 60) + 'px';
                    placeholder.style.flexShrink = '0';
                    
                    if (data.direction === 'left') container.prepend(placeholder);
                    else container.appendChild(placeholder);
                    
                    const tRect = placeholder.getBoundingClientRect();
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
        const botId = game.state.turn;
        const bot = game.state.players.find(p => p.id === botId);
        if(!bot || !bot.isBot) return;
        
        if (game.state.crocodileTargeting === botId) {
            setTimeout(() => {
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 0);
                if (opponents.length > 0) {
                    opponents.sort((a, b) => b.row.length - a.row.length);
                    const target = opponents[0];
                    const cardIndex = Math.floor(Math.random() * target.row.length);
                    game.handlePlayerAction(botId, 'CROCODILE_SELECT', { targetPlayerId: target.id, cardIndex });
                } else {
                    game.handlePlayerAction(botId, 'CROCODILE_SELECT', { skip: true });
                }
            }, 800);
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
                } else {
                    game.handlePlayerAction(botId, 'MONKEY_SELECT', { skip: true });
                }
            }, 800);
            return;
        }
        
        if (game.state.crabTargeting === botId) {
            setTimeout(() => {
                const opponents = game.state.players.filter(p => p.id !== bot.id && p.row.length > 1);
                let target = null;
                let cIndex = -1;
                // Le bot cherche à séparer une paire existante chez l'adversaire
                for (let opp of opponents) {
                    for (let i = 0; i < opp.row.length - 1; i++) {
                        if (opp.row[i].id === opp.row[i+1].id) {
                            target = opp;
                            cIndex = i;
                            break;
                        }
                    }
                    if (target) break;
                }
                
                if (target) {
                    game.handlePlayerAction(botId, 'CRAB_SELECT', { targetPlayerId: target.id, cardIndex: cIndex, direction: 'right' });
                } else {
                    game.handlePlayerAction(botId, 'CRAB_SELECT', { skip: true });
                }
            }, 800);
            return;
        }

        if (game.state.parrotPredicting === botId) {
            setTimeout(() => {
                // Le bot prédit une carte qu'il possède aux extrémités pour faire une paire
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

        if(!game.state.currentDrawnCard) {
            let delay = 500;
            if (game.state.parrotPredictedAnimal) delay = 2000;

            setTimeout(() => {
                if(game.state.turn !== botId || game.state.currentDrawnCard) return;
                const deckToDraw = game.state.forcedDeck || (Math.random() > 0.5 ? 1 : 2);
                game.handlePlayerAction(botId, 'DRAW', { deckIndex: deckToDraw });
            }, delay);
            return;
        }

        if(game.state.parrotPredictedAnimal && game.state.currentDrawnCard.id !== game.state.parrotPredictedAnimal) return;

        setTimeout(() => {
            const card = game.state.currentDrawnCard;
            let wantsToKeep = true;
            let skipPower = false;
            
            const leftCard = bot.row.length > 0 ? bot.row[0] : null;
            const rightCard = bot.row.length > 0 ? bot.row[bot.row.length - 1] : null;
            let bestSide = Math.random() > 0.5 ? 'left' : 'right';
            let formsPair = false;
            
            if (leftCard && card.id === leftCard.id) { bestSide = 'left'; formsPair = true; }
            else if (rightCard && card.id === rightCard.id) { bestSide = 'right'; formsPair = true; }
            
            // Rejeter si c'est un caméléon en double
            if(card.id === 'chameleon' && bot.row.find(c => c.id === 'chameleon')) wantsToKeep = false;
            
            // Si c'est une carte sans pouvoir qui ne forme pas de paire, on pourrait la jeter (sauf si on a peu de cartes)
            const powerCards = ['crocodile', 'monkey', 'crab', 'parrot'];
            if (!powerCards.includes(card.id) && !formsPair && bot.row.length >= 3) {
                wantsToKeep = false;
            }

            // Gestion intelligente des pouvoirs
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
                } else {
                    game.handlePlayerAction(botId, 'PLACE', { side: bestSide, skipPower: skipPower });
                }
            }
        }, 800);
    }
};

document.addEventListener("DOMContentLoaded", game.init);
const originalHost = game.hostRoom;
ui.showScreen = (id) => {
    if(id === 'screen-host' && !game.isHost && game.connections.length === 0) game.hostRoom();
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
