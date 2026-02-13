import * as CANNON from 'cannon-es'

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World()
        this.world.broadphase = new CANNON.SAPBroadphase(this.world)
        this.world.allowSleep = true

        // Default global gravity - can be overridden by GravitySystem
        this.world.gravity.set(0, -9.82, 0)

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

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 3)
    }
}
