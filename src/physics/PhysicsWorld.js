import * as CANNON from 'cannon-es'

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World()
        this.world.broadphase = new CANNON.SAPBroadphase(this.world)
        this.world.allowSleep = true

        // Default global gravity - can be overridden by GravitySystem
        // Default global gravity - set to 0 as we apply it manually per body
        this.world.gravity.set(0, 0, 0)

        this.bodies = []
    }

    addBody(body) {
        this.world.addBody(body)
        this.bodies.push(body)
    }

    removeBody(body) {
        this.world.removeBody(body)
        const index = this.bodies.indexOf(body)
        if (index > -1) {
            this.bodies.splice(index, 1)
        }
    }

    update(deltaTime, gravitySystem) {
        if (gravitySystem) {
            // Apply custom gravity to all dynamic bodies
            for (const body of this.bodies) {
                if (body.type === CANNON.Body.DYNAMIC) {
                    // Manual gravity application
                    // We need to disable world gravity or counteract it?
                    // Better: Set world gravity to 0 and apply manually.

                    // Get gravity vector
                    const force = gravitySystem.getGravityAt(body.position)

                    // F = ma
                    const gravityForce = force.scale(body.mass)
                    body.force.vadd(gravityForce, body.force)
                }
            }
        }

        this.world.step(1 / 60, deltaTime, 3)
    }
}
