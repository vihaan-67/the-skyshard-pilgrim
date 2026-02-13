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

// --- Physics Setup ---
const physicsWorld = new PhysicsWorld()
const gravitySystem = new GravitySystem()

// --- Input Setup ---
const inputManager = new InputManager()

// --- Scene Setup ---
const scene = new THREE.Scene()
// Fog logic moved to Atmosphere class
// scene.background = new THREE.Color(0x1a1a2e) 
// scene.fog = new THREE.FogExp2(0x1a1a2e, 0.002)

// --- Atmosphere ---
const atmosphere = new Atmosphere(scene)
const particleSystem = new ParticleSystem(scene)

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// --- Player Setup ---
const playerController = new PlayerController(camera, physicsWorld, inputManager)
// Position player on start platform
playerController.body.position.set(0, 30, 0)

// --- World Generation ---
const worldManager = new WorldManager(scene, physicsWorld)
worldManager.generateIslands(20, 100)

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight(0xffffff, 1)
sunLight.position.set(10, 50, 10)
sunLight.castShadow = true
sunLight.shadow.mapSize.width = 4096
sunLight.shadow.mapSize.height = 4096
sunLight.shadow.camera.near = 0.5
sunLight.shadow.camera.far = 100
sunLight.shadow.camera.left = -50
sunLight.shadow.camera.right = 50
sunLight.shadow.camera.top = 50
sunLight.shadow.camera.bottom = -50
scene.add(sunLight)

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
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
    const input = inputManager.actions

    debugDiv.textContent = `
POS: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}
VEL: ${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)}
INPUT: ${JSON.stringify(input)}
    `
}

function animate() {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Update Physics
    physicsWorld.update(deltaTime)

    // Update Player
    playerController.update(deltaTime)

    // Update World (Skyshards animation & interaction)
    worldManager.update(elapsedTime, playerController.body)

    // Update Atmosphere (Follow camera)
    atmosphere.update(elapsedTime, camera.position)

    // Update Particles
    particleSystem.update(elapsedTime)

    renderer.render(scene, camera)

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
