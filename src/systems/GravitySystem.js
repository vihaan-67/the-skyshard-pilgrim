import * as CANNON from 'cannon-es'

export class GravitySystem {
    constructor(fieldCenter = new CANNON.Vec3(0, 0, 0), strength = 9.82) {
        this.center = fieldCenter
        this.strength = strength
        this.mode = 'global' // 'global', 'point', 'zero'
        this.globalVector = new CANNON.Vec3(0, -9.82, 0)
    }

    setMode(mode) {
        this.mode = mode
    }

    applyGravity(body) {
        if (this.mode === 'zero') {
            body.force.set(0, 0, 0)
            return
        }

        if (this.mode === 'global') {
            // Cannon handles global gravity automatically via world.gravity, 
            // but for custom per-object gravity we might need to apply it manually if we disable world gravity.
            // For now, let's assume world gravity handles global mode.
            return
        }

        if (this.mode === 'point') {
            const direction = new CANNON.Vec3()
            this.center.vsub(body.position, direction)
            direction.normalize()
            const force = direction.scale(this.strength * body.mass)
            body.force.vadd(force, body.force)
        }
    }
}
