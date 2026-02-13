import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class GravitySystem {
    constructor(physicsWorld) {
        this.physicsWorld = physicsWorld
        this.gravityWells = []
        this.globalGravity = new CANNON.Vec3(0, -9.82, 0)
    }

    addGravityWell(position, force, radius) {
        this.gravityWells.push({ position, force, radius })
    }

    getGravityAt(position) {
        // Start with global gravity if no wells are near? 
        // Or should wells override global gravity? 
        // Let's say wells override if inside radius.

        // Check for nearest well
        let netGravity = this.globalGravity.clone()
        let maxInfluence = 0

        for (const well of this.gravityWells) {
            const dist = position.distanceTo(well.position)

            if (dist < well.radius) {
                // Inside a well!
                // Calculate direction towards center
                const direction = new CANNON.Vec3()
                well.position.vsub(position, direction)
                direction.normalize()

                // Linear falloff or constant? Let's go constant for consistent "planet" feel
                // Or maybe smooth blend?

                // Let's simply replace global gravity with local gravity for now for stability
                // "Point Attractor"
                const localGravity = direction.scale(well.force)

                // Blend based on distance to edge?
                // For this prototype, if you are in a well, that is your gravity.
                return localGravity
            }
        }

        return netGravity
    }

    // Apply gravity to all registered bodies?
    // Cannon applies global gravity automatically. We need to disable that for per-body gravity.
    applyGravity(body) {
        const gravity = this.getGravityAt(body.position)
        body.force.vadd(gravity.scale(body.mass), body.force)
    }
}
