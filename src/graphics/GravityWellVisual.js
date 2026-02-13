import * as THREE from 'three'

export class GravityWellVisual {
    constructor(scene, position, radius) {
        this.scene = scene
        this.position = position
        this.radius = radius

        // Outer glow sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32)
        const material = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            emissive: 0x4488ff,
            emissiveIntensity: 0.5
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(position)
        this.scene.add(this.mesh)

        // Core wireframe
        const wireGeo = new THREE.SphereGeometry(radius * 1.05, 16, 16)
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        })
        this.wire = new THREE.Mesh(wireGeo, wireMat)
        this.wire.position.copy(position)
        this.scene.add(this.wire)
    }

    update(time) {
        this.wire.rotation.y = time * 0.2
        this.wire.rotation.z = time * 0.1

        // Pulse effect
        const s = 1 + Math.sin(time * 2) * 0.05
        this.mesh.scale.set(s, s, s)
    }
}
