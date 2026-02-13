export class InputManager {
    constructor() {
        this.keys = {}
        this.mouse = { x: 0, y: 0 }
        this.isMouseDown = false

        this.actions = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false
        }

        this._initListeners()
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => this._onKeyDown(e))
        window.addEventListener('keyup', (e) => this._onKeyUp(e))
        window.addEventListener('mousemove', (e) => this._onMouseMove(e))
        window.addEventListener('mousedown', (e) => this._onMouseDown(e))
        window.addEventListener('mouseup', (e) => this._onMouseUp(e))
    }

    _onKeyDown(e) {
        this.keys[e.code] = true
        this._updateActions()
    }

    _onKeyUp(e) {
        this.keys[e.code] = false
        this._updateActions()
    }

    _onMouseMove(e) {
        // Normalize mouse coordinates to -1 to 1
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    _onMouseDown(e) {
        this.isMouseDown = true
    }

    _onMouseUp(e) {
        this.isMouseDown = false
    }

    _updateActions() {
        this.actions.forward = this.keys['KeyW'] || this.keys['ArrowUp']
        this.actions.backward = this.keys['KeyS'] || this.keys['ArrowDown']
        this.actions.left = this.keys['KeyA'] || this.keys['ArrowLeft']
        this.actions.right = this.keys['KeyD'] || this.keys['ArrowRight']
        this.actions.jump = this.keys['Space']
        this.actions.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight']
    }

    getMovementVector() {
        const x = Number(this.actions.right) - Number(this.actions.left)
        const z = Number(this.actions.backward) - Number(this.actions.forward)
        return { x, z }
    }
}
