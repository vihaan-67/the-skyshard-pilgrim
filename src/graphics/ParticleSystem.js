import * as THREE from 'three'

export class ParticleSystem {
    constructor(scene, count = 1000) {
        this.scene = scene
        this.count = count

        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        const speeds = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50 + 10
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100

            speeds[i] = Math.random() * 0.05 + 0.01
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))

        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        })

        this.particles = new THREE.Points(geometry, material)
        this.scene.add(this.particles)
    }

    update(time) {
        const positions = this.particles.geometry.attributes.position.array
        const speeds = this.particles.geometry.attributes.speed.array

        for (let i = 0; i < this.count; i++) {
            // Move particles up slowly
            positions[i * 3 + 1] += speeds[i]

            // Reset if too high
            if (positions[i * 3 + 1] > 30) {
                positions[i * 3 + 1] = -10
            }

            // Wobble
            positions[i * 3] += Math.sin(time + i) * 0.01
        }

        this.particles.geometry.attributes.position.needsUpdate = true
    }
}
