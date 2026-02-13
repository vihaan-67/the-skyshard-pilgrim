// --- Global Error Handler ---
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerText = `ERROR: ${message}\nSource: ${source}:${lineno}`;
    document.body.appendChild(errorDiv);
};

import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { PhysicsWorld } from './physics/PhysicsWorld.js'
import { GravitySystem } from './systems/GravitySystem.js'
import { InputManager } from './systems/InputManager.js'
import { PlayerController } from './game/PlayerController.js'
import { WorldManager } from './game/WorldManager.js'
import { Atmosphere } from './graphics/Atmosphere.js'
import { ParticleSystem } from './graphics/ParticleSystem.js'
import { GravityWellVisual } from './graphics/GravityWellVisual.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// --- Physics Setup ---
const physicsWorld = new PhysicsWorld()
const gravitySystem = new GravitySystem(physicsWorld)

// --- Input Setup ---
const inputManager = new InputManager()

// --- Scene Setup ---
const scene = new THREE.Scene()

// --- Atmosphere ---
const atmosphere = new Atmosphere(scene)
const particleSystem = new ParticleSystem(scene)

// --- Gravity Wells ---
const gravityWells = []
function addWell(pos, force, radius) {
    gravitySystem.addGravityWell(pos, force, radius)
    const visual = new GravityWellVisual(scene, pos, radius)
    gravityWells.push(visual)
}

// Add multiple gravity wells across the world
// Start platform (standard gravity)
// Central hub area doesn't have a well, uses global gravity (0, -9.82, 0)

// 1. "The Blue Spire" - Strong vertical sink
addWell(new THREE.Vector3(100, 20, 100), 20, 50)

// 2. "Inversion Sky" - Pulls UP
addWell(new THREE.Vector3(-100, 80, -100), -15, 60)

// 3. "The Sideways Temple" - Pulls +X
addWell(new THREE.Vector3(150, 40, 0), 25, 45)

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// --- Post-Processing ---
const renderScene = new RenderPass(scene, camera)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
bloomPass.threshold = 0.2
bloomPass.strength = 1.0
bloomPass.radius = 0.5

const composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(bloomPass)

// --- Player Setup ---
const playerController = new PlayerController(camera, physicsWorld, inputManager)
playerController.body.position.set(0, 30, 0)

// --- World Generation ---
const worldManager = new WorldManager(scene, physicsWorld)
worldManager.generateIslands(50, 400) // Much bigger spread for the new wells

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xffffff, 1)
sunLight.position.set(10, 50, 10)
sunLight.castShadow = true
scene.add(sunLight)

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
})

// --- Animation Loop ---
const clock = new THREE.Clock()
let oldElapsedTime = 0

// --- Debug UI ---
const debugDiv = document.createElement('div')
debugDiv.style.position = 'absolute'
debugDiv.style.top = '50px'
debugDiv.style.left = '10px'
debugDiv.style.color = '#0f0'
debugDiv.style.fontFamily = 'monospace'
debugDiv.style.pointerEvents = 'none'
debugDiv.style.whiteSpace = 'pre'
document.body.appendChild(debugDiv)

function updateDebug() {
    const pos = playerController.body.position
    const vel = playerController.body.velocity
    const grav = gravitySystem.getGravityAt(pos)

    debugDiv.textContent = `
POS: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}
VEL: ${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)}
GRAV: ${grav.x.toFixed(2)}, ${grav.y.toFixed(2)}, ${grav.z.toFixed(2)}
    `
}

function animate() {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    physicsWorld.update(deltaTime, gravitySystem)
    playerController.update(deltaTime, gravitySystem)
    worldManager.update(elapsedTime, playerController.body)
    atmosphere.update(elapsedTime, camera.position)
    particleSystem.update(elapsedTime)

    // Update Gravity Well Visuals
    gravityWells.forEach(well => well.update(elapsedTime))

    composer.render()
    updateDebug()
    requestAnimationFrame(animate)
}

animate()

// Add simple UI instruction
const info = document.createElement('div')
info.style.position = 'absolute'
info.style.top = '10px'
info.style.width = '100%'
info.style.textAlign = 'center'
info.style.color = '#fff'
info.style.pointerEvents = 'none'
info.innerHTML = 'Click to capture mouse<br>WASD to move, SPACE to jump, SHIFT to sprint'
document.body.appendChild(info)
