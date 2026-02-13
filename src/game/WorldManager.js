import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { Skyshard } from './Skyshard.js'
import { Tree } from './Tree.js'
import { JumpPad } from './JumpPad.js'
import { MovingPlatform } from './MovingPlatform.js'

export class WorldManager {
    constructor(scene, physicsWorld) {
        this.scene = scene
        this.physicsWorld = physicsWorld
        this.islands = []
        this.skyshards = []
        this.trees = []
        this.jumpPads = []
        this.movingPlatforms = []

        // Materials
        this.islandMaterial = new THREE.MeshStandardMaterial({
            color: 0x88CC88,
            flatShading: true
        })
    }

    generateIslands(count = 50, spread = 200) {
        // Start Platform
        this.createIsland(0, 0, 0, 20) // Bigger start platform

        let lastPos = new THREE.Vector3(0, 0, 0)

        for (let i = 0; i < count; i++) {
            const size = Math.random() * 10 + 5 // 5 to 15 radius (Bigger islands)
            const x = (Math.random() - 0.5) * spread
            const y = (Math.random()) * 40 - 10 // -10 to 30 height
            const z = (Math.random() - 0.5) * spread
            const position = new THREE.Vector3(x, y, z)

            // Avoid center
            if (position.length() < 30) continue

            this.createIsland(x, y, z, size)

            // 20% Chance to connect nearest islands with a moving platform
            if (Math.random() < 0.2) {
                // Simple random end point near the island
                const endX = x + (Math.random() - 0.5) * 40
                const endY = y + (Math.random() - 0.5) * 10
                const endZ = z + (Math.random() - 0.5) * 40

                this.createMovingPlatform(
                    new CANNON.Vec3(x + 15, y, z), // Start near island
                    new CANNON.Vec3(endX, endY, endZ)
                )
            }

            // 30% chance to spawn a Skyshard on this island
            if (Math.random() < 0.3) {
                this.createSkyshard(new THREE.Vector3(x, y + size / 2 + 2, z))
            } else if (Math.random() < 0.2) {
                // 20% chance for Jump Pad if no shard
                this.createJumpPad(new THREE.Vector3(x, y + size / 2 + 0.2, z))
            }

            // Spawn Trees (1 to 3 per island)
            const treeCount = Math.floor(Math.random() * 3) + 1
            for (let t = 0; t < treeCount; t++) {
                const angle = Math.random() * Math.PI * 2
                const dist = Math.random() * (size * 0.6) // Keep within radius
                const tx = x + Math.cos(angle) * dist
                const tz = z + Math.sin(angle) * dist
                const ty = y + size / 2 // On top surface

                this.createTree(new THREE.Vector3(tx, ty, tz))
            }
        }
    }

    createIsland(x, y, z, radius) {
        // Visuals
        const geometry = new THREE.CylinderGeometry(radius, radius * 0.5, radius, 8)
        const mesh = new THREE.Mesh(geometry, this.islandMaterial)
        mesh.position.set(x, y, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)

        // Physics
        // Using Box for stability as Cylinder can be finicky with orientation/player smooth edges
        const shape = new CANNON.Box(new CANNON.Vec3(radius, radius * 0.5, radius))
        const body = new CANNON.Body({
            mass: 0, // Static
            position: new CANNON.Vec3(x, y, z),
            shape: shape
        })

        // Cylinder collider was:
        /*
        const shape = new CANNON.Cylinder(radius, radius * 0.5, radius, 8)
        const q = new CANNON.Quaternion()
        q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2)
        body.addShape(shape, new CANNON.Vec3(0,0,0), q)
        */

        this.physicsWorld.addBody(body)

        this.islands.push({ mesh, body })
    }

    createSkyshard(position) {
        const shard = new Skyshard(this.scene, this.physicsWorld, position)
        this.skyshards.push(shard)
    }

    createTree(position) {
        const tree = new Tree(this.scene, this.physicsWorld, position)
        this.trees.push(tree)
    }

    createJumpPad(position) {
        const pad = new JumpPad(this.scene, this.physicsWorld, position)
        this.jumpPads.push(pad)
    }

    createMovingPlatform(start, end) {
        const platform = new MovingPlatform(this.scene, this.physicsWorld, start, end)
        this.movingPlatforms.push(platform)
    }

    update(time, playerBody) {
        // Moving Platforms
        this.movingPlatforms.forEach(p => p.update(time))

        // Jump Pads
        this.jumpPads.forEach(pad => pad.update(time, playerBody))

        // Skyshards
        for (let i = this.skyshards.length - 1; i >= 0; i--) {
            const shard = this.skyshards[i]
            shard.update(time)

            // Simple distance check for collection
            if (playerBody && shard.position.distanceTo(playerBody.position) < 1.5) {
                shard.collect()
                this.skyshards.splice(i, 1)

                // Visual feedback?
                // Sound?
                console.log('Shard collected!')
            }
        }
    }
}
