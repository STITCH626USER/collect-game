// Définition des animaux du jeu
const ANIMALS = [
    { id: 'crocodile', name: 'Crocodile', img: 'assets/card_crocodile.jpg' },
    { id: 'chameleon', name: 'Caméléon', img: 'assets/card_chameleon.jpg' }
    // On ajoute seulement 2 types pour ce MVP pour faciliter les alignements rapides
];

class Game {
    constructor() {
        this.playerRow = [];
        this.opponentRow = [];
        this.score = 0;
        
        // État du tour
        this.currentDrawnCard = null;
        this.forcedDeck = null; // Si on a rejeté, on est forcé de prendre l'autre

        // Éléments du DOM
        this.deck1 = document.getElementById('deck-1');
        this.deck2 = document.getElementById('deck-2');
        this.drawnCardArea = document.getElementById('drawn-card-area');
        this.drawnCardImg = document.getElementById('drawn-card-img');
        this.placementActions = document.getElementById('placement-actions');
        this.statusMessage = document.getElementById('status-message');
        this.playerRowEl = document.getElementById('player-row');
        this.decksContainer = document.getElementById('decks-container');
    }

    getRandomAnimal() {
        const randomIndex = Math.floor(Math.random() * ANIMALS.length);
        return ANIMALS[randomIndex];
    }

    drawCard(deckIndex) {
        // Bloquer si une carte est déjà tirée ou si on est forcé sur l'autre paquet
        if (this.currentDrawnCard !== null) return;
        if (this.forcedDeck !== null && this.forcedDeck !== deckIndex) {
            this.statusMessage.innerText = "Vous DEVEZ piocher dans le paquet " + this.forcedDeck;
            this.statusMessage.classList.add('shake');
            setTimeout(() => this.statusMessage.classList.remove('shake'), 400);
            return;
        }

        // Tirage
        this.currentDrawnCard = this.getRandomAnimal();
        this.drawnCardImg.src = this.currentDrawnCard.img;
        
        // UI
        this.deck1.style.display = 'none';
        this.deck2.style.display = 'none';
        this.drawnCardArea.style.display = 'flex';
        
        if (this.forcedDeck !== null) {
            // S'il était forcé, il ne peut pas rejeter
            document.getElementById('btn-reject').style.display = 'none';
            this.statusMessage.innerText = "Vous devez garder cette carte.";
        } else {
            document.getElementById('btn-reject').style.display = 'block';
            this.statusMessage.innerText = "Que voulez-vous faire ?";
        }
    }

    rejectCard() {
        if (this.forcedDeck !== null) return; // Sécurité

        const originalDeck = this.deck1.style.display === 'none' && this.deck2.style.display === 'none' ? 
                             (event.target.closest('#deck-1') ? 1 : 2) : 1; 
                             // C'est un peu un hack car on a masqué les decks, 
                             // on va juste forcer l'opposé aléatoirement ou simplifier :
        // Pour simplifier l'UX dans ce MVP, si on rejette, on réaffiche les paquets et on force.
        this.forcedDeck = Math.random() > 0.5 ? 1 : 2; // Simulation du "l'autre paquet"
        
        this.currentDrawnCard = null;
        this.drawnCardArea.style.display = 'none';
        
        this.deck1.style.display = 'flex';
        this.deck2.style.display = 'flex';
        
        this.statusMessage.innerText = `Carte rejetée. Piochez le paquet ${this.forcedDeck} !`;
        
        // Feedback visuel
        if(this.forcedDeck === 1) this.deck2.style.opacity = '0.3';
        if(this.forcedDeck === 2) this.deck1.style.opacity = '0.3';
    }

    prepareKeep() {
        document.querySelector('.drawn-card-area .actions').style.display = 'none';
        this.placementActions.style.display = 'flex';
        this.statusMessage.innerText = "Où placer cette carte ?";
    }

    placeCard(side) {
        if (side === 'left') {
            this.playerRow.unshift(this.currentDrawnCard);
        } else {
            this.playerRow.push(this.currentDrawnCard);
        }

        this.renderRow();
        this.checkVictory();

        // Réinitialiser pour le prochain tour si pas de victoire
        this.endTurn();
    }

    renderRow() {
        this.playerRowEl.innerHTML = '';
        this.playerRow.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            const imgEl = document.createElement('img');
            imgEl.src = card.img;
            cardEl.appendChild(imgEl);
            this.playerRowEl.appendChild(cardEl);
        });
    }

    checkVictory() {
        if (this.playerRow.length < 4) return;

        // Vérifier s'il y a 4 animaux identiques de suite
        let count = 1;
        let lastId = this.playerRow[0].id;

        for (let i = 1; i < this.playerRow.length; i++) {
            if (this.playerRow[i].id === lastId) {
                count++;
                if (count >= 4) {
                    this.triggerVictory();
                    return;
                }
            } else {
                count = 1;
                lastId = this.playerRow[i].id;
            }
        }
    }

    triggerVictory() {
        this.score++;
        document.getElementById('player-score').innerText = this.score;
        document.getElementById('victory-screen').style.display = 'flex';
        
        if (this.score >= 2) {
            document.getElementById('victory-title').innerText = "👑 ROI DES ANIMAUX !";
            document.getElementById('victory-message').innerText = "Vous avez remporté la couronne finale !";
        }
    }

    endTurn() {
        this.currentDrawnCard = null;
        this.forcedDeck = null;
        
        // Reset UI
        this.drawnCardArea.style.display = 'none';
        this.placementActions.style.display = 'none';
        document.querySelector('.drawn-card-area .actions').style.display = 'flex';
        
        this.deck1.style.display = 'flex';
        this.deck2.style.display = 'flex';
        this.deck1.style.opacity = '1';
        this.deck2.style.opacity = '1';
        
        this.statusMessage.innerText = "Tour suivant. Piochez !";
    }

    reset() {
        document.getElementById('victory-screen').style.display = 'none';
        this.playerRow = [];
        this.renderRow();
        this.endTurn();
        
        if (this.score >= 2) {
            this.score = 0; // Hard reset
            document.getElementById('player-score').innerText = "0";
            document.getElementById('victory-title').innerText = "👑 Victoire !";
            document.getElementById('victory-message').innerText = "Vous avez remporté une couronne !";
        }
    }
}

const game = new Game();
