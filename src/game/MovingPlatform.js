import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class MovingPlatform {
    constructor(scene, physicsWorld, startPos, endPos, duration = 5) {
        this.scene = scene
        this.world = physicsWorld
        this.startPos = startPos
        this.endPos = endPos
        this.duration = duration

        // Visuals
        const geometry = new THREE.BoxGeometry(4, 0.5, 4)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.5,
            metalness: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(startPos)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)

        // Physics (Kinematic)
        const shape = new CANNON.Box(new CANNON.Vec3(2, 0.25, 2))
        this.body = new CANNON.Body({
            mass: 0, // Kinematic bodies are treated as static/infinite mass but movable
            type: CANNON.Body.KINEMATIC,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
            shape: shape
        })
        this.world.addBody(this.body)
    }

    update(time) {
        // Calculate factor 0 to 1 based on time
        // Use sine wave for smooth back and forth
        const t = (Math.sin(time / this.duration * Math.PI * 2) + 1) / 2

        // Lerp position
        const currentPos = new CANNON.Vec3()
        this.startPos.lerp(this.endPos, t, currentPos)

        // Update Physics Body
        this.body.position.copy(currentPos)

        // Update Visuals
        this.mesh.position.copy(currentPos)
    }
}
