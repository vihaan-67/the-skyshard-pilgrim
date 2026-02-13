import * as THREE from 'three'

export class Atmosphere {
    constructor(scene) {
        this.scene = scene

        // Skybox with Gradient Shader
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize( vWorldPosition + offset ).y;
                gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
            }
        `
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        }

        // Tuning colors for "Ethereal" look
        uniforms.topColor.value.setHex(0x001133) // Deep cosmic blue
        uniforms.bottomColor.value.setHex(0xcc99ff) // Soft purple haze

        const skyGeo = new THREE.SphereGeometry(400, 32, 15)
        const skyMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.BackSide })
        this.sky = new THREE.Mesh(skyGeo, skyMat)
        this.scene.add(this.sky)

        // Fog to match
        this.scene.fog = new THREE.FogExp2(0xcc99ff, 0.005)
    }

    update(time, cameraPosition) {
        if (cameraPosition) {
            this.sky.position.copy(cameraPosition)
        }
        // Slowly rotate sky or pulsing colors? 
        // For now static is fine.
    }
}
