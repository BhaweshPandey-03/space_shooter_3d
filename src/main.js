import * as THREE from 'three';

// --- Game State ---
let gameState = 'start_screen'; // 'start_screen', 'playing', 'game_over'

// --- Basic Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Match CSS background
// Camera far plane needs to be large enough for background objects
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000); // Keep far plane large
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Enable shadows for more depth (optional, can impact performance)
// renderer.shadowMap.enabled = true;

// --- HUD Elements ---
const scoreElement = document.getElementById('score');
const screenFlashElement = document.getElementById('screen-flash');
const startModalOverlay = document.getElementById('start-modal-overlay');
const startButton = document.getElementById('start-button');
// Updated console element selectors
const consoleKeysDisplay = document.getElementById('console-keys-value');
const consoleBulletCount = document.getElementById('bullet-count');
const consoleEnemyCount = document.getElementById('enemy-count'); // Added enemy count display
let score = 0;

function updateScoreDisplay(change = 0) {
    scoreElement.textContent = score;

    // Add animation class based on score change
    if (change > 0) {
        scoreElement.classList.add('score-increase');
    } else if (change < 0) {
        scoreElement.classList.add('score-decrease');
    }

    // Remove the class after the animation duration
    setTimeout(() => {
        scoreElement.classList.remove('score-increase', 'score-decrease');
    }, 150); // Match CSS transition duration
}

function triggerScreenFlash() {
    screenFlashElement.classList.add('active');
    setTimeout(() => {
        screenFlashElement.classList.remove('active');
    }, 100); // Duration of the flash visibility before fade out starts
}

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x808090); // Slightly brighter ambient
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Slightly less intense directional
directionalLight.position.set(10, 15, 10);
// Enable shadows for the directional light (optional)
// directionalLight.castShadow = true;
scene.add(directionalLight);

// --- Texture Loader ---
const textureLoader = new THREE.TextureLoader();

// --- Celestial Background Objects ---
const backgroundObjects = new THREE.Group(); // Group to hold background elements

// Function to load texture and create plane/sprite
function createBackgroundObject(
    texturePath,
    position,
    scale,
    rotationZ = 0,
    blending = THREE.AdditiveBlending,
    isSprite = false,
    emissiveColor = 0x000000, // Add emissive color parameter
    emissiveIntensity = 0,   // Add emissive intensity parameter
    opacity = 0.8             // Add opacity parameter
) {
    // console.log(`Attempting to load texture: ${texturePath}`); // Debug log
    const texture = textureLoader.load(
        texturePath,
        (loadedTexture) => { // onLoad callback
            //  console.log(`Successfully loaded texture: ${texturePath}`);
             loadedTexture.colorSpace = THREE.SRGBColorSpace; // Ensure correct color space
             loadedTexture.needsUpdate = true;
        },
        undefined, // onProgress callback (optional)
        (error) => { // onError callback
            console.error(`Failed to load texture: ${texturePath}`, error);
            // Optionally create a placeholder if texture fails
        }
    );

    let material, geometry, mesh;

    if (isSprite) {
        material = new THREE.SpriteMaterial({
            map: texture,
            blending: blending,
            depthWrite: false, // Important for layering transparent objects
            transparent: true,
            opacity: opacity, // Use parameter
            color: 0xffffff // Keep base color white for sprites unless texture needs tinting
            // Sprites don't directly support emissive in the same way MeshBasicMaterial does
        });
        mesh = new THREE.Sprite(material);
        mesh.scale.set(scale.x, scale.y, scale.z || 1); // Use provided scale
    } else {
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false, // Important for layering transparent objects
            side: THREE.DoubleSide,
            blending: blending,
            opacity: opacity, // Use parameter
            color: 0xffffff, // Keep base color white to show texture's true colors
            emissive: emissiveColor, // Use parameter
            emissiveMap: texture, // Use texture for emission map too (optional, enhances glow)
            emissiveIntensity: emissiveIntensity // Use parameter
        });
        geometry = new THREE.PlaneGeometry(scale.x, scale.y); // Use scale for geometry size
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = rotationZ;
    }

    mesh.position.copy(position);
    backgroundObjects.add(mesh);
    // console.log(`Created background object: ${texturePath} at Z=${position.z} with opacity ${opacity}`); // Debug log
    return mesh; // Return the mesh if needed later (e.g., for animation reference)
}

// Create background objects using the function
// Adjusted positions (closer Z), scales, opacity, and added emissive properties
const galaxyPlane = createBackgroundObject(
    '/textures/galaxy.png',
    new THREE.Vector3(200, 120, -700),   // Closer Z
    new THREE.Vector3(1400, 1400), // Larger size
    Math.PI / 10,
    THREE.AdditiveBlending,          // Good for bright nebulas/galaxies
    false,                           // Not a sprite
    0x5555aa,                        // Bluish emissive glow
    0.3,                             // Moderate intensity
    0.7                              // Slightly less opaque for layering
);

const nebulaPlane = createBackgroundObject(
    '/textures/nebula.png',
    new THREE.Vector3(-250, -100, -550), // Even closer Z
    new THREE.Vector3(1000, 800),  // Larger size
    -Math.PI / 12,
    THREE.AdditiveBlending,          // Good for bright nebulas
    false,                           // Not a sprite
    0xaa5555,                        // Reddish emissive glow
    0.4,                             // Slightly higher intensity
    0.8                              // More opaque
);

const blackHoleSprite = createBackgroundObject(
    '/textures/black_hole.png',
    new THREE.Vector3(100, -200, -900),  // Mid-deep Z
    new THREE.Vector3(300, 300),   // Larger sprite scale
    0,
    THREE.NormalBlending,            // Normal blending for dark object
    true,                            // Is a sprite
    0x000000,                        // No emissive color for black hole core
    0,                               // No intensity
    0.95                             // Almost fully opaque
);

scene.add(backgroundObjects); // Add the group containing all background objects to the scene


// --- Player Ship ---
const playerShip = new THREE.Group();
// Body
const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x4499ff, metalness: 0.3, roughness: 0.6
});
const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 1.5);
const shipBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
playerShip.add(shipBody);
// Cockpit
const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff, transparent: true, opacity: 0.7, emissive: 0x00ffff, emissiveIntensity: 0.3
});
const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 8);
const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
cockpit.position.set(0, 0.2, -0.4);
playerShip.add(cockpit);
// Wings
const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd, metalness: 0.5, roughness: 0.5
});
const wingGeometry = new THREE.BoxGeometry(2.5, 0.15, 0.7);
const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
leftWing.position.set(-1.2, 0, 0.1);
playerShip.add(leftWing);
const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
rightWing.position.set(1.2, 0, 0.1);
playerShip.add(rightWing);
// Engine
const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.6
});
const engineGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.6, 16);
const engine = new THREE.Mesh(engineGeometry, engineMaterial);
engine.position.set(0, 0, 0.9);
engine.rotation.x = Math.PI / 2;
playerShip.add(engine);
// Player Bounding Box & State
playerShip.userData.boundingBox = new THREE.Box3();
playerShip.userData.originalMaterial = bodyMaterial.clone();
playerShip.userData.isHit = false;
playerShip.userData.hitTimer = 0;
scene.add(playerShip);

// --- Player Input Handling ---
const playerMoveSpeed = 8.0; // Units per second
const keysPressed = {};

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = true;
    updateConsoleKeys(); // Update console when key is pressed
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = false;
    updateConsoleKeys(); // Update console when key is released
});

// --- Player Movement & Hit Effect Logic ---
const playerHitDuration = 150; // ms for the hit color flash

function updatePlayer(deltaTime) {
    const moveDistance = playerMoveSpeed * deltaTime;

    // Movement
    if (keysPressed['w'] || keysPressed['arrowup']) {
        playerShip.position.y += moveDistance;
    }
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        playerShip.position.y -= moveDistance;
    }
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        playerShip.position.x -= moveDistance;
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        playerShip.position.x += moveDistance;
    }

    // Bounds Checking
    const aspect = window.innerWidth / window.innerHeight;
    const worldHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * 2;
    const worldWidth = worldHeight * aspect;
    playerShip.userData.boundingBox.setFromObject(playerShip, true);
    const shipSize = new THREE.Vector3();
    playerShip.userData.boundingBox.getSize(shipSize);
    const bounds = {
        x: worldWidth / 2 - shipSize.x / 2,
        y: worldHeight / 2 - shipSize.y / 2,
    };
    playerShip.position.x = Math.max(-bounds.x, Math.min(bounds.x, playerShip.position.x));
    playerShip.position.y = Math.max(-bounds.y, Math.min(bounds.y, playerShip.position.y));
    playerShip.userData.boundingBox.setFromObject(playerShip, true); // Update BB after clamping

    // Hit Effect Timer
    if (playerShip.userData.isHit) {
        playerShip.userData.hitTimer -= deltaTime * 1000; // Decrement using deltaTime in ms
        if (playerShip.userData.hitTimer <= 0) {
            playerShip.userData.isHit = false;
            // Restore original material color
            shipBody.material.color.copy(playerShip.userData.originalMaterial.color);
            shipBody.material.emissive.setHex(0x000000); // Turn off emissive flash
        }
    }
}

function playerGotHit() {
    if (!playerShip.userData.isHit) { // Prevent re-triggering while already hit
        playerShip.userData.isHit = true;
        playerShip.userData.hitTimer = playerHitDuration;
        // Flash the ship body red/white
        shipBody.material.color.set(0xffffff); // Flash white
        shipBody.material.emissive.setHex(0xff0000); // Emit red
        triggerScreenFlash(); // Also trigger screen flash
    }
}


// --- Bullets ---
const bulletMoveSpeed = 25.0; // Units per second
const fireRate = 180; // Milliseconds between shots
let lastFireTime = 0;

// Shared resources for bullets
const bulletGeometry = new THREE.SphereGeometry(0.12, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 }); // Red-Orange

// Bullet Pool
const bulletPool = [];
const activeBullets = []; // Bullets currently moving/visible
// REMOVED: const maxBullets = 100; // No longer limiting bullets

// Pre-populate the pool (optional, but can prevent initial stutter)
function initializeBulletPool() {
    // Clear existing pool if any (e.g., on restart)
    bulletPool.forEach(bullet => scene.remove(bullet));
    bulletPool.length = 0;

    // Pre-populate with a reasonable number for performance, even though it's infinite
    const initialPoolSize = 50;
    for (let i = 0; i < initialPoolSize; i++) {
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.visible = false; // Start invisible
        bullet.userData.isActive = false;
        bullet.userData.boundingBox = new THREE.Box3();
        scene.add(bullet); // Add to scene once, just toggle visibility
        bulletPool.push(bullet);
    }
}

function getBulletFromPool() {
    let bullet = null;
    if (bulletPool.length > 0) {
        bullet = bulletPool.pop(); // Get from the end of the pool
    } else {
        // If pool is empty, create a new bullet (infinite bullets)
        bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.userData.boundingBox = new THREE.Box3();
        scene.add(bullet); // Add new bullet to the scene
        // console.log("Created new bullet, pool empty.");
    }

    // This part remains the same, activating the obtained bullet
    if (bullet) {
        bullet.visible = true;
        bullet.userData.isActive = true;
        activeBullets.push(bullet);
        updateConsoleStats(); // Update bullet count when one becomes active
    }
    return bullet;
}

function returnBulletToPool(bullet) {
    const index = activeBullets.indexOf(bullet);
    if (index > -1) {
        activeBullets.splice(index, 1); // Remove from active list
    }

    bullet.visible = false;
    bullet.userData.isActive = false;
    bullet.position.set(0, 0, -camera.far * 2); // Move far away

    // Add back to pool (no max limit check needed)
    bulletPool.push(bullet);

    updateConsoleStats(); // Update bullet count when one is returned
}


function fireBullet() {
    const now = Date.now();
    if (now - lastFireTime < fireRate) {
        return;
    }

    const bullet = getBulletFromPool(); // Get a bullet from the pool

    if (bullet) { // Only proceed if we got a bullet
        lastFireTime = now;
        // Set bullet's initial X and Y to match the player ship's current X and Y
        bullet.position.x = playerShip.position.x;
        bullet.position.y = playerShip.position.y;
        // Set initial Z slightly in front of the ship
        bullet.position.z = playerShip.position.z - 0.8;
        // Bounding box is already part of the pooled object's userData
    }
}

function updateBullets(deltaTime) {
    const moveDistance = bulletMoveSpeed * deltaTime;
    // Iterate backwards over ACTIVE bullets only
    for (let i = activeBullets.length - 1; i >= 0; i--) {
        const bullet = activeBullets[i];

        // Bullets might be marked inactive by collision check before this loop runs
        if (!bullet.userData.isActive) {
            returnBulletToPool(bullet);
            continue;
        }

        // Move bullet straight along the Z-axis ONLY
        bullet.position.z -= moveDistance; // Move using deltaTime
        // X and Y positions remain constant after firing

        // Update bounding box based on the new position
        bullet.userData.boundingBox.setFromObject(bullet);

        // Check if bullet is off-screen
        if (bullet.position.z < -camera.far * 0.8) {
            bullet.userData.isActive = false; // Mark inactive first
            // returnBulletToPool(bullet); // Will be handled in the next frame or collision check
        }
    }
}

// --- Enemies ---
const enemies = [];

// Enemy Type Definitions
const ENEMY_TYPES = {
    GRUNT: {
        name: 'GRUNT',
        // INCREASED SIZE: 1.2 -> 1.6
        geometry: new THREE.IcosahedronGeometry(1.6, 0),
        material: new THREE.MeshStandardMaterial({
            color: 0xcc00ff, metalness: 0.2, roughness: 0.4, emissive: 0x550077, emissiveIntensity: 0.4
        }),
        speed: 4.0,
        score: 10,
        movementPattern: 'straight'
    },
    DODGER: {
        name: 'DODGER',
        // INCREASED SIZE: 1.0 -> 1.4
        geometry: new THREE.OctahedronGeometry(1.4, 0),
        material: new THREE.MeshStandardMaterial({
            color: 0x00ff88, metalness: 0.3, roughness: 0.5, emissive: 0x005533, emissiveIntensity: 0.3
        }),
        speed: 5.0, // Slightly faster
        score: 15,
        movementPattern: 'sine',
        sineFrequency: 0.5, // How fast it weaves
        sineAmplitude: 5.0   // How wide it weaves
    },
    // Add more types later (e.g., SHOOTER, TANK)
};

const enemySpawnMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }); // White flash material
const enemySpawnRate = 1100; // Spawn a bit faster overall
let lastEnemySpawnTime = 0;
const enemyHitDuration = 100; // ms for enemy hit flash
const enemySpawnFlashDuration = 200; // ms for spawn flash
const maxEnemies = 25; // Allow slightly more enemies

function spawnEnemy() {
    const now = Date.now();
    // Check spawn rate and also limit total number of enemies on screen
    if (now - lastEnemySpawnTime < enemySpawnRate || enemies.length >= maxEnemies) {
        return;
    }
    lastEnemySpawnTime = now;

    // --- Select Enemy Type ---
    const enemyTypeKeys = Object.keys(ENEMY_TYPES);
    const randomTypeKey = enemyTypeKeys[Math.floor(Math.random() * enemyTypeKeys.length)];
    const typeDefinition = ENEMY_TYPES[randomTypeKey];

    // --- Create Enemy based on Type ---
    const enemyMaterial = enemySpawnMaterial.clone(); // Start with spawn flash
    const enemy = new THREE.Mesh(typeDefinition.geometry, enemyMaterial); // Use type's geometry

    enemy.userData.type = typeDefinition.name; // Store type name
    enemy.userData.definition = typeDefinition; // Store full definition
    enemy.userData.originalMaterial = typeDefinition.material.clone(); // Store the *target* material
    enemy.userData.speed = typeDefinition.speed;
    enemy.userData.scoreValue = typeDefinition.score;
    enemy.userData.movementPattern = typeDefinition.movementPattern;

    // Specific data for movement patterns
    if (typeDefinition.movementPattern === 'sine') {
        enemy.userData.sineWaveTime = Math.random() * Math.PI * 2; // Random start phase
        enemy.userData.sineFrequency = typeDefinition.sineFrequency;
        enemy.userData.sineAmplitude = typeDefinition.sineAmplitude;
        enemy.userData.baseX = 0; // Will be set on spawn position
    }

    enemy.userData.isSpawning = true;
    enemy.userData.spawnTimer = enemySpawnFlashDuration;

    // Calculate spawn position - FOCUS ON CENTER
  const aspect = window.innerWidth / window.innerHeight;
    const spawnCheckDistance = 50;
    const worldHeightSpawn = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * spawnCheckDistance * 2;
    const worldWidthSpawn = worldHeightSpawn * aspect;

    // Reduce spawn area to 40% of screen width/height for more central focus
    const spawnAreaFactor = 0.4;
    const spawnX = (Math.random() - 0.5) * (worldWidthSpawn * spawnAreaFactor);
    const spawnY = (Math.random() - 0.5) * (worldHeightSpawn * spawnAreaFactor);
    const spawnZ = -100;

    enemy.position.set(spawnX, spawnY, spawnZ);
    if (enemy.userData.movementPattern === 'sine') {
        enemy.userData.baseX = spawnX; // Store initial X for sine wave calculation
    }

    enemy.userData.boundingBox = new THREE.Box3();
    enemy.userData.isHit = false;
    enemy.userData.hitByPlayer = false;
    enemy.userData.hitTimer = 0; // Timer for hit effect duration

    scene.add(enemy);
    enemies.push(enemy);
    updateConsoleStats(); // Update enemy count when one spawns
}


function updateEnemies(deltaTime) {
    const indicesToRemove = []; // Store indices of enemies to remove this frame

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue;

        // Handle Spawn Flash
        if (enemy.userData.isSpawning) {
            enemy.userData.spawnTimer -= deltaTime * 1000;
            // Fade out the flash effect
            enemy.material.opacity = Math.max(0, enemy.userData.spawnTimer / enemySpawnFlashDuration);
            if (enemy.userData.spawnTimer <= 0) {
                enemy.userData.isSpawning = false;
                enemy.material = enemy.userData.originalMaterial; // Switch to normal material
            }
        }

        // --- Movement Logic based on Type ---
        const moveDistanceZ = enemy.userData.speed * deltaTime;
        enemy.position.z += moveDistanceZ; // Base forward movement

        if (enemy.userData.movementPattern === 'sine' && !enemy.userData.isSpawning) {
            enemy.userData.sineWaveTime += enemy.userData.sineFrequency * deltaTime;
            const offsetX = Math.sin(enemy.userData.sineWaveTime) * enemy.userData.sineAmplitude;
            enemy.position.x = enemy.userData.baseX + offsetX;
        }
        // Add other movement patterns here (e.g., 'homing', 'zigzag')

        // Update bounding box after movement
        enemy.userData.boundingBox.setFromObject(enemy);

        // Rotation (can be type-specific too if needed)
        enemy.rotation.x += 1.0 * deltaTime;
        enemy.rotation.y += 1.0 * deltaTime;

        // Hit Effect Timer & Removal Logic
        if (enemy.userData.isHit) {
             enemy.userData.hitTimer -= deltaTime * 1000; // Decrement timer in milliseconds

             if (enemy.userData.hitTimer <= 0) {
                 // Mark for removal if hit timer expired
                 indicesToRemove.push(i);
                 triggerExplosion(enemy.position); // Trigger explosion before removing
                 continue; // Skip rest of logic for this enemy
             }
        }

        // Remove enemy if it goes past the camera (and wasn't hit and marked for removal)
        if (enemy.position.z > camera.position.z + 10) {
            indicesToRemove.push(i);
        }
    }

    // Remove enemies marked for removal (iterate backwards for safe splicing)
    let enemiesRemoved = false;
    indicesToRemove.sort((a, b) => b - a); // Sort descending
    for (const index of indicesToRemove) {
        if (enemies[index]) { // Check if it still exists
            scene.remove(enemies[index]);
            // Dispose geometry/material if not shared/pooled - here they are cloned, so okay
            enemies.splice(index, 1);
            enemiesRemoved = true;
        }
    }
    // Update console only if enemies were actually removed
    if (enemiesRemoved) {
        updateConsoleStats();
    }
}

function enemyGotHit(enemy, byPlayer = false) {
     // Trigger visual and timer only if not already in hit state
     if (!enemy.userData.isHit && !enemy.userData.isSpawning) { // Don't hit during spawn flash
        enemy.userData.isHit = true;
        enemy.userData.hitByPlayer = byPlayer;
        enemy.userData.hitTimer = enemyHitDuration;
        // Flash enemy white/bright - ensure we are using the correct material instance
        if (enemy.material !== enemySpawnMaterial) {
            enemy.material.color.set(0xffffff);
            enemy.material.emissive.setHex(0xffffff);
        }
     }
}

// --- Explosions ---
const explosionPool = [];
const activeExplosions = [];
const maxExplosions = 20;
const explosionParticleCount = 50;
const explosionDuration = 500; // ms

// Shared resources for explosion particles
const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4); // Small, simple geometry
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // Orange/Yellow

function initializeExplosionPool() {
    // Clear existing pool if any
    explosionPool.forEach(exp => scene.remove(exp));
    explosionPool.length = 0;

    for (let i = 0; i < maxExplosions / 2; i++) {
        const explosion = new THREE.Group(); // Group to hold particles
        explosion.userData.particles = [];
        explosion.userData.isActive = false;
        explosion.userData.timer = 0;

        for (let j = 0; j < explosionParticleCount; j++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            // Store initial velocity direction (random)
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(Math.random() * 0.1 + 0.05); // Random speed
            explosion.add(particle);
            explosion.userData.particles.push(particle);
        }
        explosion.visible = false;
        scene.add(explosion);
        explosionPool.push(explosion);
    }
}

function getExplosionFromPool() {
    let explosion = null;
    if (explosionPool.length > 0) {
        explosion = explosionPool.pop();
    } else if (activeExplosions.length < maxExplosions) {
        // Create new if pool empty and under limit
        explosion = new THREE.Group();
        explosion.userData.particles = [];
        explosion.userData.isActive = false;
        explosion.userData.timer = 0;
        for (let j = 0; j < explosionParticleCount; j++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(Math.random() * 0.1 + 0.05);
            explosion.add(particle);
            explosion.userData.particles.push(particle);
        }
        scene.add(explosion);
        // console.log("Created new explosion, pool empty. Active:", activeExplosions.length + 1);
    }

    if (explosion) {
        explosion.visible = true;
        explosion.userData.isActive = true;
        explosion.userData.timer = explosionDuration;
        // Reset particle positions within the group
        explosion.userData.particles.forEach(p => {
            p.position.set(0, 0, 0);
            p.scale.set(1, 1, 1); // Reset scale
        });
        activeExplosions.push(explosion);
    }
    return explosion;
}

function returnExplosionToPool(explosion) {
    const index = activeExplosions.indexOf(explosion);
    if (index > -1) {
        activeExplosions.splice(index, 1);
    }
    explosion.visible = false;
    explosion.userData.isActive = false;
    explosion.position.set(0, 0, -camera.far * 2); // Move away

    if (explosionPool.length < maxExplosions) {
        explosionPool.push(explosion);
    } else {
        // scene.remove(explosion); // Or let GC handle
        // console.warn("Explosion pool full.");
    }
}

function triggerExplosion(position) {
    const explosion = getExplosionFromPool();
    if (explosion) {
        explosion.position.copy(position);
    }
}

function updateExplosions(deltaTime) {
    const timeFactor = deltaTime * 1000; // Convert delta to ms for timer

    for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const explosion = activeExplosions[i];
        if (!explosion.userData.isActive) {
             returnExplosionToPool(explosion);
             continue;
        }

        explosion.userData.timer -= timeFactor;

        if (explosion.userData.timer <= 0) {
            explosion.userData.isActive = false; // Mark for pooling
            continue;
        }

        // Animate particles
        const progress = 1.0 - (explosion.userData.timer / explosionDuration); // 0 to 1
        explosion.userData.particles.forEach(particle => {
            // Move particle based on its velocity
            particle.position.addScaledVector(particle.userData.velocity, deltaTime * 15); // Adjust speed multiplier

            // Fade out particles (optional)
            // particle.material.opacity = 1.0 - progress;

            // Shrink particles (optional)
            const scale = Math.max(0, 1.0 - progress); // Ensure scale doesn't go negative
            particle.scale.set(scale, scale, scale);
        });
    }
}


// --- Collision Detection ---
function checkCollisions() {
    // No need for bulletsToRemove set, we just mark them inactive
    const enemiesHitThisFrame = new Set(); // Track enemies hit to avoid double-counting score/effects

    // 1. Bullet-Enemy Collisions
    // Iterate over ACTIVE bullets only
    for (let i = activeBullets.length - 1; i >= 0; i--) {
        const bullet = activeBullets[i];
        if (!bullet || !bullet.userData.isActive) continue; // Skip inactive bullets

        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            // Skip if enemy is already hit (visual effect active), spawning, or already processed this frame
            if (!enemy || enemy.userData.isHit || enemy.userData.isSpawning || enemiesHitThisFrame.has(j)) continue;

            // Update enemy bounding box just before checking (most up-to-date position)
            // enemy.userData.boundingBox.setFromObject(enemy); // Already done in updateEnemies

            if (bullet.userData.boundingBox.intersectsBox(enemy.userData.boundingBox)) {
                if (!enemiesHitThisFrame.has(j)) { // Check again to prevent double score
                    // Use score value from enemy type definition
                    score += enemy.userData.scoreValue || 10; // Default to 10 if undefined
                    updateScoreDisplay(enemy.userData.scoreValue || 10);
                    enemyGotHit(enemy, false); // Trigger visual hit effect
                    enemiesHitThisFrame.add(j); // Mark as processed this frame
                }
                bullet.userData.isActive = false; // Mark bullet for removal/pooling

                // Explosion is triggered in updateEnemies when hitTimer runs out

                break; // Bullet hits one enemy, move to next bullet
            }
        }
    }

    // 2. Player-Enemy Collisions
    if (!playerShip.userData.isHit) { // Only check if player isn't already in hit recovery state
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            // Skip if enemy is already hit, spawning, or processed this frame
            if (!enemy || enemy.userData.isHit || enemy.userData.isSpawning || enemiesHitThisFrame.has(j)) continue;

            // Update player bounding box just before checking
            // playerShip.userData.boundingBox.setFromObject(playerShip, true); // Already done in updatePlayer

            if (playerShip.userData.boundingBox.intersectsBox(enemy.userData.boundingBox)) {
                // Use a fixed score penalty for player collision, or could be type-specific
                const penalty = 25;
                score -= penalty;
                if (score < 0) score = 0;
                updateScoreDisplay(-penalty);

                playerGotHit(); // Trigger player hit effects
                enemyGotHit(enemy, true); // Trigger enemy hit effect
                enemiesHitThisFrame.add(j); // Mark as processed

                // TODO: Deduct lives, check game over
                // Enemy removal and explosion are handled by its own hit timer in updateEnemies
            }
        }
    }

    // Bullet removal/pooling is handled in updateBullets based on isActive flag
}


// --- Starfield ---
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
    color: 0xaaaaff, size: 0.08, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const starVertices = [];
for (let i = 0; i < 20000; i++) {
    const x = (Math.random() - 0.5) * 3000;
    const y = (Math.random() - 0.5) * 3000;
    const z = (Math.random() - 0.5) * 3000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- Camera Position ---
camera.position.z = 15;

// --- Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// --- Console Update ---
function updateConsoleKeys() {
    if (!consoleKeysDisplay) return;
    const pressed = Object.entries(keysPressed)
        .filter(([key, isPressed]) => isPressed)
        .map(([key]) => key.toUpperCase()) // Convert to uppercase for display
        .join(' ');
        console.log(`keysPressed keys: ${keysPressed}`); // Debug log
        
        console.log(`Pressed keys: ${pressed}, length: ${pressed.length}`); // Debug log
       
        
    consoleKeysDisplay.textContent = pressed == " " ? 'Space' : pressed || 'None'; // Display 'None' if no keys are pressed
}

function updateConsoleStats() {
    if (consoleBulletCount) {
        // Display infinity symbol or just active count for "infinite" ammo
        consoleBulletCount.textContent = '∞'; // Or activeBullets.length if you prefer showing active count
    }
    if (consoleEnemyCount) {
        consoleEnemyCount.textContent = enemies.length; // Update enemy count
    }
    // Add more stats here later (e.g., lives)
}

// --- Animation Loop ---
const clock = new THREE.Clock();
let animationFrameId = null; // To potentially stop the loop

function animate() {
    animationFrameId = requestAnimationFrame(animate); // Store the frame ID

    // Only run game logic if playing
    if (gameState !== 'playing') {
        // Still render the scene even if paused or on start screen
        renderer.render(scene, camera);
        return;
    }

    const deltaTime = clock.getDelta(); // Get time since last frame (in seconds)

    // --- Background Animation ---
    // Add slow rotation to the background objects using deltaTime
    if (galaxyPlane) galaxyPlane.rotation.z += 0.005 * deltaTime; // Adjust rotation speed as needed
    if (nebulaPlane) nebulaPlane.rotation.z -= 0.003 * deltaTime;
    // Black hole sprite doesn't need rotation as it always faces camera

    stars.position.z += deltaTime * 2.0; // Star drift speed
    if (stars.position.z > 1000) stars.position.z -= 2000; // Reset star position for looping effect


    // --- Game Logic ---
    // Handle Firing Input
    if (keysPressed[' ']) {
        fireBullet();
    }

    // Update Game Objects
    updatePlayer(deltaTime);
    updateBullets(deltaTime); // Handles pooling and straight movement
    spawnEnemy(); // Spawning logic now includes types
    updateEnemies(deltaTime); // Handles movement (type-specific), hit timer, spawn flash, removal, triggers explosions
    updateExplosions(deltaTime); // Handles explosion animation and pooling

    // Check for Collisions
    checkCollisions(); // Marks bullets/enemies, uses type-specific score

    // Update Console Stats (can be done less frequently if needed)
    // updateConsoleStats(); // Already updated when bullets/enemies are added/removed

    // Render Scene
    renderer.render(scene, camera);
}

// --- Game Initialization and State Change ---
function initializeGame() {
    // Reset game state variables
    score = 0;
    updateScoreDisplay();
    lastEnemySpawnTime = 0;
    lastFireTime = 0;
    Object.keys(keysPressed).forEach(key => keysPressed[key] = false); // Reset keys pressed

    // Clear existing game objects
    activeBullets.forEach(b => returnBulletToPool(b));
    activeExplosions.forEach(e => returnExplosionToPool(e));
    enemies.forEach(e => scene.remove(e));
    enemies.length = 0;
    activeBullets.length = 0; // Ensure active array is empty
    activeExplosions.length = 0; // Ensure active array is empty


    // Reset player state
    playerShip.position.set(0, 0, 0);
    playerShip.userData.isHit = false;
    playerShip.userData.hitTimer = 0;
    if (shipBody && playerShip.userData.originalMaterial) {
         shipBody.material.color.copy(playerShip.userData.originalMaterial.color);
         shipBody.material.emissive.setHex(0x000000);
    }

    // Initialize pools
    initializeBulletPool();
    initializeExplosionPool();

    // Update console display
    updateConsoleKeys();
    updateConsoleStats();

    // Show start modal
    startModalOverlay.classList.remove('hidden');
    gameState = 'start_screen';

    // Start the animation loop (it will check gameState)
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animate(); // Start rendering loop, even for start screen
}

// Event listener for the start button
startButton.addEventListener('click', () => {
    if (gameState === 'start_screen') {
        startModalOverlay.classList.add('hidden'); // Hide modal
        gameState = 'playing'; // Change state
        clock.start(); // Start the clock for deltaTime calculations
        // The animate loop will now execute game logic
        console.log("Game starting!");
    }
});

// Initial call to set up the game and show the modal
initializeGame();
