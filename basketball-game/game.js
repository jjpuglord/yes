/* ===== HOOPLAND BASKETBALL GAME ENGINE ===== */
/* Complete Physics Engine, AI System, and Game Logic */

// ===== CONSTANTS =====
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const PLAYER_SPEED = 4;
const PLAYER_SPRINT_SPEED = 6;
const MAX_STAMINA = 100;
const STAMINA_DRAIN_RATE = 0.8;
const STAMINA_REGEN_RATE = 0.4;
const GRAVITY = 0.3;
const FRICTION = 0.98;
const BALL_RADIUS = 12;
const PLAYER_RADIUS = 15;
const HOOP_RADIUS = 30;
const HOOP_X = CANVAS_WIDTH / 2;
const HOOP_Y = CANVAS_HEIGHT - 150;
const GAME_DURATION = 12 * 60; // 12 minutes in seconds
const COURT_PADDING = 50;

// ===== VECTOR CLASS =====
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector(0, 0);
        return new Vector(this.x / mag, this.y / mag);
    }

    copy() {
        return new Vector(this.x, this.y);
    }
}

// ===== PLAYER CLASS =====
class Player {
    constructor(x, y, team) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.team = team; // 1 or 2
        this.stamina = MAX_STAMINA;
        this.hasBall = false;
        this.radius = PLAYER_RADIUS;
        this.isSprinting = false;
        this.direction = new Vector(1, 0);
    }

    update(keys, mousePos, ballPos) {
        // Movement input
        let moveVector = new Vector(0, 0);
        let isSprinting = false;

        if (keys['w'] || keys['W']) moveVector.y -= 1;
        if (keys['s'] || keys['S']) moveVector.y += 1;
        if (keys['a'] || keys['A']) moveVector.x -= 1;
        if (keys['d'] || keys['D']) moveVector.x += 1;
        if (keys['Shift']) isSprinting = true;

        // Normalize movement
        if (moveVector.magnitude() > 0) {
            moveVector = moveVector.normalize();
            this.direction = moveVector.copy();
        }

        // Apply speed
        let currentSpeed = PLAYER_SPEED;
        if (isSprinting && this.stamina > 0 && moveVector.magnitude() > 0) {
            currentSpeed = PLAYER_SPRINT_SPEED;
            this.stamina -= STAMINA_DRAIN_RATE;
            this.isSprinting = true;
        } else {
            this.isSprinting = false;
        }

        // Stamina regeneration
        if (!isSprinting) {
            this.stamina = Math.min(this.stamina + STAMINA_REGEN_RATE, MAX_STAMINA);
        }

        // Apply velocity
        this.velocity = moveVector.multiply(currentSpeed);

        // Update position
        this.position = this.position.add(this.velocity);

        // Boundary collision
        if (this.position.x - this.radius < COURT_PADDING) this.position.x = COURT_PADDING + this.radius;
        if (this.position.x + this.radius > CANVAS_WIDTH - COURT_PADDING) this.position.x = CANVAS_WIDTH - COURT_PADDING - this.radius;
        if (this.position.y - this.radius < COURT_PADDING) this.position.y = COURT_PADDING + this.radius;
        if (this.position.y + this.radius > CANVAS_HEIGHT - COURT_PADDING) this.position.y = CANVAS_HEIGHT - COURT_PADDING - this.radius;

        // Limit stamina
        this.stamina = Math.max(0, Math.min(this.stamina, MAX_STAMINA));
    }

    draw(ctx) {
        // Draw player circle
        ctx.fillStyle = this.team === 1 ? '#FF4444' : '#4444FF';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw team number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', this.position.x, this.position.y);

        // Highlight if has ball
        if (this.hasBall) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// ===== BALL CLASS =====
class Ball {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.radius = BALL_RADIUS;
        this.owner = null;
    }

    update() {
        // Apply gravity
        this.velocity.y += GRAVITY;

        // Apply friction
        this.velocity.x *= FRICTION;
        this.velocity.y *= FRICTION;

        // Update position
        this.position = this.position.add(this.velocity);

        // Boundary collision
        if (this.position.x - this.radius < COURT_PADDING) {
            this.position.x = COURT_PADDING + this.radius;
            this.velocity.x *= -0.7;
        }
        if (this.position.x + this.radius > CANVAS_WIDTH - COURT_PADDING) {
            this.position.x = CANVAS_WIDTH - COURT_PADDING - this.radius;
            this.velocity.x *= -0.7;
        }
        if (this.position.y - this.radius < COURT_PADDING) {
            this.position.y = COURT_PADDING + this.radius;
            this.velocity.y *= -0.7;
        }
        if (this.position.y + this.radius > CANVAS_HEIGHT - COURT_PADDING) {
            this.position.y = CANVAS_HEIGHT - COURT_PADDING - this.radius;
            this.velocity.y *= -0.7;
        }
    }

    draw(ctx) {
        // Draw ball
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw highlights
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x - 5, this.position.y - 5, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    shoot(direction, power) {
        this.velocity = direction.multiply(power);
        this.owner = null;
    }
}

// ===== MAIN GAME ENGINE =====
let gameState = {
    canvas: null,
    ctx: null,
    players: [],
    ball: null,
    score1: 0,
    score2: 0,
    gameTime: GAME_DURATION,
    isActive: false,
    isPaused: false,
    gameOver: false,
    keys: {},
    mousePos: new Vector(0, 0),
    isAiming: false,
    shootPower: 0,
};

// ===== INITIALIZATION =====
function initGame() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    gameState.players = [];
    gameState.ball = new Ball(HOOP_X, HOOP_Y - 200);
    gameState.score1 = 0;
    gameState.score2 = 0;
    gameState.gameTime = GAME_DURATION;
    gameState.isActive = true;
    gameState.isPaused = false;
    gameState.gameOver = false;

    // Create player (Team 1)
    gameState.players.push(new Player(HOOP_X - 200, CANVAS_HEIGHT / 2, 1));

    // Create 4 AI teammates (Team 1)
    for (let i = 0; i < 4; i++) {
        const x = HOOP_X - 200 + (Math.random() - 0.5) * 100;
        const y = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 150;
        gameState.players.push(new Player(x, y, 1));
    }

    // Create 5 AI opponents (Team 2)
    for (let i = 0; i < 5; i++) {
        const x = HOOP_X + 200 + (Math.random() - 0.5) * 100;
        const y = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 150;
        gameState.players.push(new Player(x, y, 2));
    }

    // Give ball to a random player
    const randomPlayer = gameState.players[Math.floor(Math.random() * gameState.players.length)];
    randomPlayer.hasBall = true;
    gameState.ball.owner = randomPlayer;

    // Setup input listeners
    setupInputListeners();
    updateHUD();
}

// ===== INPUT HANDLING =====
function setupInputListeners() {
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;
        if (e.key === 'p' || e.key === 'P') togglePause();
    });

    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });

    document.addEventListener('mousemove', (e) => {
        const rect = gameState.canvas.getBoundingClientRect();
        gameState.mousePos.x = e.clientX - rect.left;
        gameState.mousePos.y = e.clientY - rect.top;
    });

    document.addEventListener('mousedown', (e) => {
        if (gameState.isActive && !gameState.isPaused) {
            const player = gameState.players[0];
            if (player.hasBall) {
                gameState.isAiming = true;
                gameState.shootPower = 0;
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (gameState.isAiming) {
            shootBall();
            gameState.isAiming = false;
            gameState.shootPower = 0;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.isActive && !gameState.isPaused) {
            passBall();
        }
    });
}

// ===== GAME LOGIC =====
function shootBall() {
    const player = gameState.players[0];
    if (!player.hasBall) return;

    const direction = gameState.mousePos.subtract(player.position).normalize();
    const power = 3 + gameState.shootPower * 0.1;

    gameState.ball.shoot(direction, power);
    player.hasBall = false;
    gameState.ball.owner = null;
}

function passBall() {
    const player = gameState.players[0];
    if (!player.hasBall) return;

    // Find nearest teammate
    let nearest = null;
    let minDist = Infinity;

    for (let p of gameState.players) {
        if (p.team === player.team && p !== player) {
            const dist = player.position.distance(p.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        }
    }

    if (nearest) {
        const direction = nearest.position.subtract(player.position).normalize();
        gameState.ball.shoot(direction, 5);
        player.hasBall = false;
    }
}

function updateAI() {
    for (let i = 1; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const dist = player.position.distance(gameState.ball.position);

        // Move toward ball
        const direction = gameState.ball.position.subtract(player.position).normalize();
        player.velocity = direction.multiply(dist > 200 ? PLAYER_SPRINT_SPEED : PLAYER_SPEED);

        // Sprint logic
        if (dist > 200 && player.stamina > 20) {
            player.isSprinting = true;
            player.stamina -= STAMINA_DRAIN_RATE;
        } else {
            player.isSprinting = false;
            player.stamina = Math.min(player.stamina + STAMINA_REGEN_RATE, MAX_STAMINA);
        }

        // Update position with boundary checking
        player.position = player.position.add(player.velocity);
        if (player.position.x - player.radius < COURT_PADDING) player.position.x = COURT_PADDING + player.radius;
        if (player.position.x + player.radius > CANVAS_WIDTH - COURT_PADDING) player.position.x = CANVAS_WIDTH - COURT_PADDING - player.radius;
        if (player.position.y - player.radius < COURT_PADDING) player.position.y = COURT_PADDING + player.radius;
        if (player.position.y + player.radius > CANVAS_HEIGHT - COURT_PADDING) player.position.y = CANVAS_HEIGHT - COURT_PADDING - player.radius;

        // Check ball possession
        if (dist < player.radius + gameState.ball.radius && !gameState.ball.owner) {
            gameState.ball.owner = player;
            player.hasBall = true;
        }
    }
}

function checkPlayerCollisions() {
    for (let i = 0; i < gameState.players.length; i++) {
        for (let j = i + 1; j < gameState.players.length; j++) {
            const p1 = gameState.players[i];
            const p2 = gameState.players[j];
            const dist = p1.position.distance(p2.position);
            const minDist = p1.radius + p2.radius;

            if (dist < minDist) {
                // Collision! Push players apart
                const overlap = minDist - dist;
                const direction = p2.position.subtract(p1.position).normalize();
                const push = direction.multiply(overlap / 2);
                p1.position = p1.position.subtract(push);
                p2.position = p2.position.add(push);
            }
        }
    }
}

function checkBallCollisions() {
    // Ball with players
    for (let player of gameState.players) {
        const dist = player.position.distance(gameState.ball.position);
        if (dist < player.radius + gameState.ball.radius && !player.hasBall) {
            player.hasBall = true;
            gameState.ball.owner = player;
            gameState.ball.velocity = new Vector(0, 0);
        }
    }

    // Ball with hoop (scoring)
    const distToHoop = gameState.ball.position.distance(new Vector(HOOP_X, HOOP_Y));
    if (distToHoop < HOOP_RADIUS && gameState.ball.position.y > HOOP_Y - 50) {
        // Score!
        if (gameState.ball.owner && gameState.ball.owner.team === 1) {
            gameState.score1 += 2;
        } else if (gameState.ball.owner && gameState.ball.owner.team === 2) {
            gameState.score2 += 2;
        }

        // Reset ball
        gameState.ball.position = new Vector(HOOP_X, HOOP_Y - 200);
        gameState.ball.velocity = new Vector(0, 0);
        if (gameState.ball.owner) {
            gameState.ball.owner.hasBall = false;
        }
        gameState.ball.owner = null;

        // Give ball to random player
        const randomPlayer = gameState.players[Math.floor(Math.random() * gameState.players.length)];
        randomPlayer.hasBall = true;
        gameState.ball.owner = randomPlayer;
    }
}

function update() {
    if (!gameState.isActive || gameState.isPaused) return;

    // Update game time
    gameState.gameTime -= 1 / 60;
    if (gameState.gameTime <= 0) {
        endGame();
        return;
    }

    // Update all players
    gameState.players[0].update(gameState.keys, gameState.mousePos, gameState.ball.position);

    // Update ball
    if (gameState.ball.owner) {
        gameState.ball.position = gameState.ball.owner.position.add(new Vector(0, -25));
    } else {
        gameState.ball.update();
    }

    // Update AI
    updateAI();

    // Check collisions
    checkPlayerCollisions();
    checkBallCollisions();

    // Update shooting power
    if (gameState.isAiming) {
        gameState.shootPower = Math.min(gameState.shootPower + 1, 100);
    }

    updateHUD();
}

function draw() {
    const ctx = gameState.ctx;

    // Clear court
    ctx.fillStyle = '#1a5c1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw court border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(COURT_PADDING, COURT_PADDING, CANVAS_WIDTH - COURT_PADDING * 2, CANVAS_HEIGHT - COURT_PADDING * 2);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, COURT_PADDING);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - COURT_PADDING);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw hoop
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(HOOP_X, HOOP_Y, HOOP_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(HOOP_X, HOOP_Y, HOOP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Draw players
    for (let player of gameState.players) {
        player.draw(ctx);
    }

    // Draw ball
    gameState.ball.draw(ctx);

    // Draw aiming crosshair
    if (gameState.isAiming) {
        const player = gameState.players[0];
        const direction = gameState.mousePos.subtract(player.position).normalize();
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.position.x, player.position.y);
        ctx.lineTo(
            player.position.x + direction.x * 300,
            player.position.y + direction.y * 300
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw power meter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(player.position.x - 50, player.position.y - 80, 100, 20);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(player.position.x - 50, player.position.y - 80, gameState.shootPower, 20);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.position.x - 50, player.position.y - 80, 100, 20);
    }
}

function updateHUD() {
    const minutes = Math.floor(gameState.gameTime / 60);
    const seconds = Math.floor(gameState.gameTime % 60);
    const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    document.getElementById('score1').textContent = gameState.score1;
    document.getElementById('score2').textContent = gameState.score2;
    document.getElementById('timer').textContent = timeStr;
    
    const player = gameState.players[0];
    const staminaPercent = (player.stamina / MAX_STAMINA) * 100;
    document.getElementById('staminaBar').style.width = staminaPercent + '%';

    const ballOwner = gameState.ball.owner;
    if (ballOwner) {
        document.getElementById('ballStatus').textContent = `Ball: ${ballOwner.team === 1 ? 'YOUR TEAM' : 'OPPONENT'}`;
    } else {
        document.getElementById('ballStatus').textContent = 'Ball: LOOSE';
    }
}

function togglePause() {
    if (!gameState.gameOver) {
        gameState.isPaused = !gameState.isPaused;
        document.getElementById('pauseMenu').classList.toggle('active');
    }
}

function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pauseMenu').classList.remove('active');
}

function endGame() {
    gameState.isActive = false;
    gameState.gameOver = true;

    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('active');

    document.getElementById('finalScore1').textContent = gameState.score1;
    document.getElementById('finalScore2').textContent = gameState.score2;

    if (gameState.score1 > gameState.score2) {
        document.getElementById('gameOverTitle').textContent = '🏆 YOU WIN! 🏆';
        document.getElementById('gameOverMessage').textContent = 'Congratulations! You\'ve won the match!';
        document.getElementById('gameOverTitle').style.color = '#FFD700';
    } else if (gameState.score2 > gameState.score1) {
        document.getElementById('gameOverTitle').textContent = 'GAME OVER';
        document.getElementById('gameOverMessage').textContent = 'The opposing team won this match.';
        document.getElementById('gameOverTitle').style.color = '#FF6B6B';
    } else {
        document.getElementById('gameOverTitle').textContent = 'TIE GAME';
        document.getElementById('gameOverMessage').textContent = 'Both teams are evenly matched!';
        document.getElementById('gameOverTitle').style.color = '#4488FF';
    }
}

function startGame() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('instructions').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameHUD').classList.remove('hidden');
    
    initGame();
    gameLoop();
}

function returnToMenu() {
    gameState.isActive = false;
    document.getElementById('pauseMenu').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('mainMenu').classList.add('active');
}

function toggleInstructions() {
    document.getElementById('instructions').classList.toggle('active');
}

function gameLoop() {
    update();
    draw();
    
    if (gameState.isActive) {
        requestAnimationFrame(gameLoop);
    }
}

// ===== START GAME ON LOAD =====
window.addEventListener('load', () => {
    document.getElementById('mainMenu').classList.add('active');
});