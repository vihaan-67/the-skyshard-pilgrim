import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class JumpPad {
    constructor(scene, physicsWorld, position) {
        this.scene = scene
        this.world = physicsWorld
        this.position = position
        this.force = 20

        // Visuals
        const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16)
        const material = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(position)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)

        // Physics (Sensor)
        const shape = new CANNON.Cylinder(1.5, 1.5, 0.2, 16)
        this.body = new CANNON.Body({
            mass: 0, // Static
            isTrigger: true,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape
        })

        // Cannon Cylinder orientation fix
        const q = new CANNON.Quaternion()
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        this.body.addShape(shape, new CANNON.Vec3(0, 0, 0), q)

        this.world.addBody(this.body)

        // Cooldown
        this.lastTriggered = 0
    }

    update(time, playerBody) {
        // Simple distance check since it's a sensor
        // Or we could use collision events, but this is easy for a prototype
        if (this.position.distanceTo(playerBody.position) < 2) {
            // Check cooldown
            if (time - this.lastTriggered > 1.0) {
                // Apply impulse
                playerBody.velocity.y = this.force
                playerBody.velocity.x *= 1.5 // Speed boost too
                playerBody.velocity.z *= 1.5

                this.lastTriggered = time

                // Visual feedback (Flash)
                this.mesh.material.emissiveIntensity = 2.0
                console.log('JUMP PAD!')
            }
        }

        // Reset emissive
        if (this.mesh.material.emissiveIntensity > 0.8) {
            this.mesh.material.emissiveIntensity -= 0.1
        }
    }
}
