import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Skyshard {
    constructor(scene, physicsWorld, position) {
        this.scene = scene
        this.world = physicsWorld
        this.position = position

        // Visuals
        const geometry = new THREE.OctahedronGeometry(0.5)
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x0088aa,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(position)
        this.mesh.castShadow = true

        // Point light for glow
        this.light = new THREE.PointLight(0x00ffff, 1, 5)
        this.light.position.copy(position)
        this.scene.add(this.light)
        this.scene.add(this.mesh)

        // Physics (Trigger)
        const shape = new CANNON.Sphere(0.5)
        this.body = new CANNON.Body({
            mass: 0, // Static
            isTrigger: true, // Sensor
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape
        })
        this.world.addBody(this.body)

        // Animation
        this.timeOffset = Math.random() * 100
    }

    update(time) {
        // Floating animation
        this.mesh.position.y = this.position.y + Math.sin(time * 2 + this.timeOffset) * 0.2
        this.mesh.rotation.y += 0.02
        this.mesh.rotation.z += 0.01

        // Sync trigger body? Not strictly necessary if it's static, but if we want the trigger to move...
        // For now, let's keep the trigger static at the center of the float range
    }

    collect() {
        this.scene.remove(this.mesh)
        this.scene.remove(this.light)
        this.world.removeBody(this.body)
    }
}
