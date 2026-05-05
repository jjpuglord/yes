// ===== BASKETBALL STARS - GAME ENGINE =====

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit container
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== GAME CONSTANTS =====
const COURT_WIDTH = canvas.width;
const COURT_HEIGHT = canvas.height;
const HOOP_X = COURT_WIDTH / 2;
const HOOP_Y = COURT_HEIGHT * 0.15;
const HOOP_RADIUS = 25;
const BALL_RADIUS = 12;
const PLAYER_RADIUS = 18;
const GRAVITY = 0.5;
const FRICTION = 0.97;
const GAME_TIME = 90;

let gameState = {
    running: false,
    paused: false,
    playerScore: 0,
    opponentScore: 0,
    timeRemaining: GAME_TIME,
    difficulty: 'normal'
};

let player = null;
let opponent = null;
let ball = null;
let mouseX = 0;
let mouseY = 0;
let isAiming = false;
let aimPower = 0;

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

// ===== BALL CLASS =====
class Ball {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.radius = BALL_RADIUS;
    }

    update() {
        // Gravity
        this.velocity.y += GRAVITY;

        // Friction
        this.velocity.x *= FRICTION;
        this.velocity.y *= FRICTION;

        // Position update
        this.position = this.position.add(this.velocity);

        // Boundary collisions
        // Top
        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.velocity.y *= -0.7;
        }
        // Bottom
        if (this.position.y + this.radius > COURT_HEIGHT) {
            this.position.y = COURT_HEIGHT - this.radius;
            this.velocity.y *= -0.7;
        }
        // Left
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x *= -0.7;
        }
        // Right
        if (this.position.x + this.radius > COURT_WIDTH) {
            this.position.x = COURT_WIDTH - this.radius;
            this.velocity.x *= -0.7;
        }
    }

    draw() {
        // Draw ball
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.position.x - 5, this.position.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Ball lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius - 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    shoot(direction, power) {
        this.velocity = direction.multiply(power);
    }
}

// ===== PLAYER CLASS =====
class Player {
    constructor(x, y, isOpponent = false) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.radius = PLAYER_RADIUS;
        this.isOpponent = isOpponent;
        this.hasBall = false;
        this.color = isOpponent ? '#4488FF' : '#FF5722';
    }

    update() {
        // Movement based on mouse (player only)
        if (!this.isOpponent) {
            // Mouse control
            const dx = mouseX - this.position.x;
            const dy = mouseY - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 50) {
                this.velocity.x = (dx / dist) * 6;
                this.velocity.y = (dy / dist) * 6;
            } else {
                this.velocity.x *= 0.9;
                this.velocity.y *= 0.9;
            }
        } else {
            // AI opponent movement
            this.updateAI();
        }

        // Update position
        this.position = this.position.add(this.velocity);

        // Boundary collisions
        if (this.position.x - this.radius < 0) this.position.x = this.radius;
        if (this.position.x + this.radius > COURT_WIDTH) this.position.x = COURT_WIDTH - this.radius;
        if (this.position.y - this.radius < 0) this.position.y = this.radius;
        if (this.position.y + this.radius > COURT_HEIGHT) this.position.y = COURT_HEIGHT - this.radius;

        // Apply friction when idle
        if (!this.hasBall) {
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;
        }
    }

    updateAI() {
        // AI moves toward ball
        const dx = ball.position.x - this.position.x;
        const dy = ball.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            let speed = 4;
            if (gameState.difficulty === 'hard') speed = 5.5;
            if (gameState.difficulty === 'easy') speed = 2.5;

            this.velocity.x = (dx / dist) * speed;
            this.velocity.y = (dy / dist) * speed;
        }
    }

    draw() {
        // Draw player circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw outline
        ctx.strokeStyle = this.hasBall ? '#FFD700' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = this.hasBall ? 3 : 2;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw player number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isOpponent ? '2' : '1', this.position.x, this.position.y);
    }

    distanceTo(other) {
        return this.position.distance(other.position);
    }
}

// ===== GAME FUNCTIONS =====
function initGame() {
    gameState.running = true;
    gameState.paused = false;
    gameState.playerScore = 0;
    gameState.opponentScore = 0;
    gameState.timeRemaining = GAME_TIME;
    gameState.difficulty = document.getElementById('difficultySelect').value;

    player = new Player(COURT_WIDTH * 0.25, COURT_HEIGHT * 0.5, false);
    opponent = new Player(COURT_WIDTH * 0.75, COURT_HEIGHT * 0.5, true);
    ball = new Ball(COURT_WIDTH / 2, COURT_HEIGHT * 0.3);

    isAiming = false;
    aimPower = 0;

    gameLoop();
}

function updateGame() {
    if (!gameState.running || gameState.paused) return;

    // Update players
    player.update();
    opponent.update();

    // Update ball
    if (!player.hasBall && !opponent.hasBall) {
        ball.update();
    }

    // Check ball possession
    if (player.distanceTo(ball) < player.radius + ball.radius && !opponent.hasBall) {
        player.hasBall = true;
        opponent.hasBall = false;
        ball.velocity = new Vector(0, 0);
    }

    if (opponent.distanceTo(ball) < opponent.radius + ball.radius && !player.hasBall) {
        opponent.hasBall = true;
        player.hasBall = false;
        ball.velocity = new Vector(0, 0);
    }

    // Ball follows player
    if (player.hasBall) {
        ball.position = new Vector(player.position.x, player.position.y - 25);
    } else if (opponent.hasBall) {
        ball.position = new Vector(opponent.position.x, opponent.position.y - 25);
        // AI shoots occasionally
        if (Math.random() < 0.02) {
            shootOpponent();
        }
    }

    // Check scoring
    const distToHoop = ball.position.distance(new Vector(HOOP_X, HOOP_Y));
    if (distToHoop < HOOP_RADIUS && ball.position.y < HOOP_Y + 40) {
        if (player.hasBall) {
            gameState.playerScore += 2;
        } else if (opponent.hasBall) {
            gameState.opponentScore += 2;
        }
        resetBall();
    }

    // Update timer
    gameState.timeRemaining -= 1 / 60;
    if (gameState.timeRemaining <= 0) {
        endGame();
    }

    // Update HUD
    updateHUD();
}

function shootOpponent() {
    const direction = new Vector(HOOP_X - opponent.position.x, HOOP_Y - opponent.position.y).normalize();
    const power = 8 + Math.random() * 4;
    ball.shoot(direction, power);
    opponent.hasBall = false;
}

function resetBall() {
    ball.position = new Vector(COURT_WIDTH / 2, COURT_HEIGHT * 0.3);
    ball.velocity = new Vector(0, 0);
    player.hasBall = false;
    opponent.hasBall = false;
}

function drawGame() {
    // Clear court
    ctx.fillStyle = '#1a5c1a';
    ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

    // Draw court lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(COURT_WIDTH / 2, 0);
    ctx.lineTo(COURT_WIDTH / 2, COURT_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw hoop
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(HOOP_X, HOOP_Y, HOOP_RADIUS * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(HOOP_X, HOOP_Y, HOOP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Draw backboard
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(HOOP_X - 40, HOOP_Y - 30, 80, 20);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(HOOP_X - 40, HOOP_Y - 30, 80, 20);

    // Draw players and ball
    player.draw();
    opponent.draw();
    ball.draw();

    // Draw aiming line
    if (isAiming && player.hasBall) {
        const direction = new Vector(mouseX - player.position.x, mouseY - player.position.y).normalize();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.position.x, player.position.y);
        ctx.lineTo(player.position.x + direction.x * 300, player.position.y + direction.y * 300);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw power indicator
        const barWidth = 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(player.position.x - barWidth / 2, player.position.y - 60, barWidth, 15);
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(player.position.x - barWidth / 2, player.position.y - 60, (aimPower / 100) * barWidth, 15);
    }
}

function updateHUD() {
    document.getElementById('playerScore').textContent = gameState.playerScore;
    document.getElementById('opponentScore').textContent = gameState.opponentScore;

    const time = Math.ceil(gameState.timeRemaining);
    document.getElementById('timer').textContent = time;

    if (time <= 10) {
        document.getElementById('timer').classList.add('warning');
    }

    const powerPercent = Math.min(aimPower, 100);
    document.getElementById('powerMeterFill').style.width = powerPercent + '%';
}

function gameLoop() {
    updateGame();
    drawGame();

    if (gameState.running) {
        requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    gameState.running = false;

    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.add('active');

    document.getElementById('finalPlayerScore').textContent = gameState.playerScore;
    document.getElementById('finalOpponentScore').textContent = gameState.opponentScore;

    let message = '';
    let title = '';
    let resultClass = '';

    if (gameState.playerScore > gameState.opponentScore) {
        message = '🎉 YOU WIN! 🎉';
        title = 'VICTORY';
        resultClass = 'win';
    } else if (gameState.playerScore < gameState.opponentScore) {
        message = 'OPPONENT WINS!';
        title = 'DEFEAT';
        resultClass = 'lose';
    } else {
        message = 'ITS A TIE!';
        title = 'TIED GAME';
    }

    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultMessage').textContent = message;
    document.getElementById('resultMessage').className = 'result-message ' + resultClass;
}

function pauseGame() {
    if (gameState.running) {
        gameState.paused = true;
        document.getElementById('pauseOverlay').classList.remove('hidden');
    }
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById('pauseOverlay').classList.add('hidden');
}

function showInstructions() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('instructionsScreen').classList.add('active');
}

function showSettings() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('settingsScreen').classList.add('active');
}

function startGame() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('instructionsScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('timer').classList.remove('warning');

    initGame();
}

function backToMenu() {
    gameState.running = false;
    document.getElementById('mainMenu').classList.add('active');
    document.getElementById('instructionsScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('pauseOverlay').classList.add('hidden');
}

// ===== EVENT LISTENERS =====
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

document.addEventListener('mousedown', (e) => {
    if (gameState.running && !gameState.paused && player.hasBall && !isAiming) {
        isAiming = true;
        aimPower = 0;
    }
});

document.addEventListener('mousemove', () => {
    if (isAiming && gameState.running && !gameState.paused) {
        aimPower = Math.min(aimPower + 2, 100);
    }
});

document.addEventListener('mouseup', (e) => {
    if (isAiming && player.hasBall && gameState.running && !gameState.paused) {
        const direction = new Vector(mouseX - player.position.x, mouseY - player.position.y).normalize();
        const power = 5 + (aimPower / 100) * 15;
        ball.shoot(direction, power);
        player.hasBall = false;
        isAiming = false;
        aimPower = 0;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.running && !gameState.paused) {
        e.preventDefault();
    }
});