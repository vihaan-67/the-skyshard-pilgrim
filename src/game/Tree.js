import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Tree {
    constructor(scene, physicsWorld, position) {
        this.scene = scene
        this.world = physicsWorld
        this.position = position

        // Randomize size
        const scale = Math.random() * 0.5 + 0.8

        // Visuals Group
        this.mesh = new THREE.Group()
        this.mesh.position.copy(position)

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.5 * scale, 6)
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31, roughness: 1.0 })
        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.position.y = 0.75 * scale
        trunk.castShadow = true
        trunk.receiveShadow = true
        this.mesh.add(trunk)

        // Foliage (Low Poly Cones)
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 })

        const layer1 = new THREE.Mesh(new THREE.ConeGeometry(1.2 * scale, 1.5 * scale, 6), foliageMat)
        layer1.position.y = 1.8 * scale
        layer1.castShadow = true
        this.mesh.add(layer1)

        const layer2 = new THREE.Mesh(new THREE.ConeGeometry(0.9 * scale, 1.2 * scale, 6), foliageMat)
        layer2.position.y = 2.5 * scale
        layer2.castShadow = true
        this.mesh.add(layer2)

        this.scene.add(this.mesh)

        // Physics (Trunk only)
        const shape = new CANNON.Cylinder(0.3 * scale, 0.3 * scale, 1.5 * scale, 6)
        this.body = new CANNON.Body({
            mass: 0, // Static
            position: new CANNON.Vec3(position.x, position.y + 0.75 * scale, position.z),
            shape: shape
        })

        const q = new CANNON.Quaternion()
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        this.body.quaternion.copy(q)

        this.world.addBody(this.body)
    }
}
