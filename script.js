const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas to full screen
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

// Game configuration
const GAME_DURATION = 60; // seconds
const GROUND_HEIGHT = 50;
const CAT_SIZE = 100;
const CAT_SPEED = 180; // Pixels per second (increased from 120)
const CAT_FALL_SPEED = 300; // Pixels per second for falling
const CAMERA_FOLLOW_SPEED = 0.05; // How quickly camera follows the stack (0-1)
const TARGET_STACK_HEIGHT = height / 2; // Keep stack top at middle of screen

// Time tracking for deltaTime
let lastTime = 0;

// Camera offset (for scrolling up as cats stack)
let cameraOffsetY = 0;

// Load cat images
const catImages = [];
const catCount = 3;
for (let i = 1; i <= catCount; i++) {
    const img = new Image();
    img.src = `./assets/cat${i}.png`;
    catImages.push(img);
}

// Game state
let gameActive = false;
let timeRemaining = GAME_DURATION;
let score = 0;
let stackedCats = [];
let currentCat = {
    x: 0,
    y: 50, // Initial height from top
    img: getRandomCat(),
    falling: false
};

// DOM elements
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');

// Get random cat image
function getRandomCat() {
    return catImages[Math.floor(Math.random() * catImages.length)];
}

// Start game
function startGame() {
    gameActive = true;
    timeRemaining = GAME_DURATION;
    score = 0;
    stackedCats = [];
    cameraOffsetY = 0;
    lastTime = performance.now();
    currentCat = {
        x: 0,
        y: 50,
        img: getRandomCat(),
        falling: false
    };
    
    // Start game timer
    const gameTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(gameTimer);
            gameActive = false;
            alert(`Game Over! Final Score: ${score}`);
        }
    }, 1000);
    
    // Start animation loop
    requestAnimationFrame(gameLoop);
}

// Update timer display
function updateTimerDisplay() {
    timerElement.textContent = `Time: ${timeRemaining}s`;
}

// Update score display
function updateScoreDisplay() {
    scoreElement.textContent = `Score: ${score}`;
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameActive && !currentCat.falling) {
        currentCat.falling = true;
    }
    
    // Start the game on spacebar if not already started
    if (e.code === 'Space' && !gameActive) {
        startGame();
    }
});

// Check if two cats are colliding
function checkCollision(cat1, cat2) {
    return (
        cat1.x < cat2.x + CAT_SIZE &&
        cat1.x + CAT_SIZE > cat2.x &&
        cat1.y < cat2.y + CAT_SIZE &&
        cat1.y + CAT_SIZE > cat2.y
    );
}

// Get the Y position of the highest stacked cat
function getStackTop() {
    if (stackedCats.length === 0) {
        return height - GROUND_HEIGHT;
    }
    
    let minY = height;
    for (const cat of stackedCats) {
        minY = Math.min(minY, cat.y);
    }
    return minY;
}

// Main game loop
function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate target camera position based on stack height
    let stackTop = getStackTop();
    let targetCameraY = 0;
    
    // Only start scrolling if stack is high enough
    if (stackTop < height - TARGET_STACK_HEIGHT) {
        targetCameraY = (height - TARGET_STACK_HEIGHT) - stackTop;
    }
    
    // Smoothly move camera toward target position
    cameraOffsetY += (targetCameraY - cameraOffsetY) * CAMERA_FOLLOW_SPEED;
    
    // Save current transformation matrix
    ctx.save();
    
    // Apply camera transformation
    ctx.translate(0, cameraOffsetY);
    
    // Draw background (fixed to viewport)
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, -cameraOffsetY, width, height);
    
    // Draw ground
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Update current cat position
    if (gameActive) {
        if (!currentCat.falling) {
            // Move horizontally based on deltaTime
            currentCat.x += CAT_SPEED * deltaTime;
            
            // Loop back to left side when reaching right edge
            if (currentCat.x > width) {
                currentCat.x = -CAT_SIZE;
            }
            
            // Make current cat follow the camera when not falling
            currentCat.y = 50 - cameraOffsetY;
        } else {
            // Move vertically when falling, based on deltaTime
            currentCat.y += CAT_FALL_SPEED * deltaTime;
            
            // Check collision with ground or stacked cats
            let collision = false;
            
            // Check collision with ground
            if (currentCat.y + CAT_SIZE >= height - GROUND_HEIGHT) {
                currentCat.y = height - GROUND_HEIGHT - CAT_SIZE;
                collision = true;
            }
            
            // Check collision with stacked cats
            for (const stackedCat of stackedCats) {
                if (checkCollision(currentCat, stackedCat)) {
                    currentCat.y = stackedCat.y - CAT_SIZE;
                    collision = true;
                    break;
                }
            }
            
            // If collision detected, add cat to stack and create a new cat
            if (collision) {
                stackedCats.push({...currentCat});
                
                // Calculate score based on stack height
                const stackHeight = height - (currentCat.y + CAT_SIZE);
                score = Math.max(score, Math.floor(stackHeight / CAT_SIZE));
                updateScoreDisplay();
                
                // Reset current cat
                currentCat = {
                    x: 0,
                    y: 50 - cameraOffsetY, // Adjust for camera position
                    img: getRandomCat(),
                    falling: false
                };
            }
        }
    }
    
    // Draw stacked cats
    for (const cat of stackedCats) {
        ctx.drawImage(cat.img, cat.x, cat.y, CAT_SIZE, CAT_SIZE);
    }
    
    // Draw current cat
    ctx.drawImage(currentCat.img, currentCat.x, currentCat.y, CAT_SIZE, CAT_SIZE);
    
    // Restore transformation matrix
    ctx.restore();
    
    // Draw the UI elements - these should be drawn after restoring the transformation
    // to keep them fixed on screen
    if (!gameActive) {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to start the game!', width / 2, height / 2);
        ctx.textAlign = 'start';
    }
    
    // Continue animation
    requestAnimationFrame(gameLoop);
}

// Initialize the game
lastTime = performance.now();
updateTimerDisplay();
updateScoreDisplay();
ctx.font = '30px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.fillText('Press SPACE to start the game!', width / 2, height / 2);
ctx.textAlign = 'start';