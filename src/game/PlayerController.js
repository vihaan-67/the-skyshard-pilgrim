import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class PlayerController {
    constructor(camera, physicsWorld, inputManager) {
        this.camera = camera
        this.world = physicsWorld
        this.input = inputManager

        // Settings
        this.speed = 5
        this.sprintSpeed = 10
        this.jumpForce = 7
        this.mouseSensitivity = 0.002

        // State
        this.canJump = true
        this.pitch = 0
        this.yaw = 0

        // Physics Body
        const shape = new CANNON.Sphere(0.5) // Simple sphere collider for now
        this.body = new CANNON.Body({
            mass: 5, // Player mass
            shape: shape,
            position: new CANNON.Vec3(0, 10, 0),
            linearDamping: 0.1, // Reduced from 0.9 to allow movement
            angularDamping: 0.1,
            fixedRotation: true // Prevent rolling
        })
        this.world.addBody(this.body)

        // Visual Mesh (optional for debug, camera usually attached)
        // We'll attach the camera to the physics body position

        this._initCameraControl()
    }

    _initCameraControl() {
        // Lock pointer on click
        document.body.addEventListener('click', () => {
            document.body.requestPointerLock()
        })

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                // Clamp large jumps that can occur on lock/unlock or weak hardware
                const movementX = Math.max(-50, Math.min(50, e.movementX))
                const movementY = Math.max(-50, Math.min(50, e.movementY))

                this.yaw -= movementX * this.mouseSensitivity
                this.pitch -= movementY * this.mouseSensitivity

                // Clamp pitch
                this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch))
            }
        })
    }

    update(deltaTime) {
        this._handleMovement()
        this._syncCamera()
        this._checkBounds()
    }

    _checkBounds() {
        // NaN check
        if (isNaN(this.body.position.x) || isNaN(this.body.position.y) || isNaN(this.body.position.z)) {
            console.error("Player position became NaN! Resetting.")
            this.resetPosition()
            return
        }

        // Void check
        if (this.body.position.y < -50) {
            this.resetPosition()
        }
    }

    resetPosition() {
        this.body.position.set(0, 30, 0)
        this.body.velocity.set(0, 0, 0)
        this.body.angularVelocity.set(0, 0, 0)
    }

    _handleMovement() {
        // ... (existing code, ensure it is robust)
        // Get input vector
        const movement = this.input.getMovementVector()
        const isSprinting = this.input.actions.sprint
        const currentSpeed = isSprinting ? this.sprintSpeed : this.speed

        if (movement.x !== 0 || movement.z !== 0) {
            // Calculate movement direction relative to camera look
            const direction = new THREE.Vector3(movement.x, 0, movement.z)
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
            direction.normalize()

            // Apply velocity (simulating movement)
            this.body.velocity.x = direction.x * currentSpeed
            this.body.velocity.z = direction.z * currentSpeed
        } else {
            // Stop horizontal movement if no input
            this.body.velocity.x = 0
            this.body.velocity.z = 0
        }

        // Jump
        if (this.input.actions.jump && this.canJump) {
            if (Math.abs(this.body.velocity.y) < 0.1) {
                this.body.velocity.y = this.jumpForce
            }
        }
    }

    _syncCamera() {
        this.camera.position.copy(this.body.position)
        this.camera.position.y += 0.5

        this.camera.rotation.order = 'YXZ'
        this.camera.rotation.y = this.yaw
        this.camera.rotation.x = this.pitch
    }
}
