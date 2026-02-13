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

    update(deltaTime, gravitySystem) {
        // Get local gravity up vector
        const gravity = gravitySystem ? gravitySystem.getGravityAt(this.body.position) : new CANNON.Vec3(0, -9.82, 0)
        const up = new THREE.Vector3(-gravity.x, -gravity.y, -gravity.z).normalize()

        this._updateOrientation(up)
        this._handleMovement(up)
        this._syncCamera(up)
        this._checkBounds()
    }

    _updateOrientation(up) {
        // We need to rotate the player's body so that its "up" matches the gravity "up"
        // But we want to preserve Yaw (rotation around up) based on mouse look

        // This is tricky with Cannon bodies. 
        // For a sphere, rotation doesn't matter for collision, but matters for "forward" movement?
        // Actually, we just need to calculate "forward" and "right" based on "up" and camera yaw.

        this.up = up
    }

    _handleMovement(up) {
        // Get input vector
        const movement = this.input.getMovementVector()
        const isSprinting = this.input.actions.sprint
        const currentSpeed = isSprinting ? this.sprintSpeed : this.speed

        if (movement.x !== 0 || movement.z !== 0) {
            // Calculate forward and right vectors relative to Up
            // We use the camera's yaw to determine "forward" on the plane perpendicular to Up.

            // 1. Get a temporary forward vector based on Yaw in standard space
            const tempForward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize()

            // 2. Project this onto the plane defined by Up? 
            // Better: Construct a basis from Up.

            // Let's assume standard Y-up for Yaw calculation first, then transform?
            // "Yaw" is rotation around local Up.

            // Construct a quaternion that rotates (0,1,0) to Up.
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)

            // Now apply Yaw rotation around Up
            const qYaw = new THREE.Quaternion().setFromAxisAngle(up, this.yaw)

            // Combine? No, Yaw is just an angle.

            // Let's try:
            // Right = Up cross Forward (where Forward is roughly camera direction)
            // But we don't have camera direction yet.

            // Let's stick to: Yaw defines rotation around Up.
            // Basis:
            // Up = local gravity up
            // Right = Up cross (Initial Forward transformed by Yaw?)

            // Simplified:
            // Create a conceptual "Forward" vector (0, 0, -1) and rotate it by Yaw around Y (0,1,0).
            // Then rotate that whole RESULT to align Y with Up.

            const localForward = new THREE.Vector3(0, 0, -1)
            localForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
            localForward.applyQuaternion(q)

            const localRight = new THREE.Vector3(1, 0, 0)
            localRight.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
            localRight.applyQuaternion(q)

            // Calculate final move direction
            const moveDir = new THREE.Vector3()
                .addScaledVector(localRight, movement.x)
                .addScaledVector(localForward, -movement.z) // Input Z is backward/forward
                .normalize()

            // Apply velocity
            // We need to preserve velocity along Up (falling/jumping)
            const velocity = new THREE.Vector3(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z)
            const verticalSpeed = velocity.dot(up)

            const outputVelocity = moveDir.multiplyScalar(currentSpeed)
            outputVelocity.addScaledVector(up, verticalSpeed)

            this.body.velocity.set(outputVelocity.x, outputVelocity.y, outputVelocity.z)
        } else {
            // Stop horizontal movement, preserve vertical
            const velocity = new THREE.Vector3(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z)
            const verticalSpeed = velocity.dot(up)
            const stopVelocity = up.clone().multiplyScalar(verticalSpeed)
            this.body.velocity.set(stopVelocity.x, stopVelocity.y, stopVelocity.z)
        }

        // Jump
        if (this.input.actions.jump && this.canJump) {
            // Ground check: Velocity along Up is near 0?
            const velocity = new THREE.Vector3(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z)
            const verticalSpeed = velocity.dot(up)

            if (Math.abs(verticalSpeed) < 0.1) {
                // Apply impulse along Up
                const jumpImpulse = up.clone().multiplyScalar(this.jumpForce)
                this.body.velocity.x += jumpImpulse.x
                this.body.velocity.y += jumpImpulse.y
                this.body.velocity.z += jumpImpulse.z
            }
        }
    }

    _syncCamera(up) {
        this.camera.position.copy(this.body.position)
        this.camera.position.addScaledVector(up, 0.5)

        // Rotate camera to align with Up and Yaw/Pitch
        // 1. Align Y to Up
        const qGravity = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)

        // 2. Apply Yaw/Pitch (local rotation)
        const qLook = new THREE.Quaternion()
        qLook.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'))

        // Combine: Gravity * Look
        const finalQ = qGravity.multiply(qLook)

        this.camera.quaternion.copy(finalQ)
    }
}
