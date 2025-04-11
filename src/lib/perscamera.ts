import { mat4, vec3 } from 'gl-matrix';
import Mesh from './mesh';

export default class PerspectiveCamera {
    private _fovy: number;
    readonly aspect: number;
    private _near: number;
    private _far: number;

    position: vec3;
    target: vec3;
    up: vec3;
    private _distance: number;
    rotation: { x: number, z: number };

    readonly projectionMatrix: mat4;
    readonly viewMatrix: mat4;

    constructor(public width: number, public height: number) {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.aspect = width / height;
        this._fovy = Math.PI / 4;
        this._near = 1;
        this._far = 2000;

        this.position = vec3.fromValues(100, 100, 0);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 0, 1);
        this._distance = 20;
        this.rotation = { x: Math.PI / 6, z: Math.PI / 3 };

        this.updatePosition();
        this.updateProjectionMatrix();
    }

    updatePosition() {
        const sinY = Math.sin(this.rotation.z);
        const cosY = Math.cos(this.rotation.z);
        const sinX = Math.sin(this.rotation.x);
        const cosX = Math.cos(this.rotation.x);

        const x = this._distance * cosX * sinY;
        const y = this._distance * cosX * cosY;
        const z = this._distance * sinX;

        vec3.set(this.position,
            this.target[0] + x,
            this.target[1] + y,
            this.target[2] + z,
        );

        this.updateViewMatrix();
    }

    lookAt(target: Mesh) {
        vec3.copy(this.target, target.transform.position);
        const scale = target.transform.scale;
        this._distance = target.boundingRadius * 3 * Math.min(...scale);
        this.updatePosition();
    }

    setRotation(x: number, z: number) {
        this.rotation.x = x;
        this.rotation.z = z;
        this.updatePosition();
    }

    get distance(): number {
        return this._distance;
    }
    set distance(distance: number) {
        this._distance = distance;
        this.updatePosition();
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.updateProjectionMatrix();
    }

    get fovy(): number { return this._fovy; }
    set fovy(fovy: number) {
        this._fovy = fovy;
        this.updateProjectionMatrix();
    }
    get near(): number { return this._near; }
    set near(near: number) {
        this._near = near;
        this.updateProjectionMatrix();
    }
    get far(): number { return this._far; }
    set far(far: number) {
        this._far = far;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix, this._fovy, this.aspect, this._near, this._far);
    }

    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }

    reset() {
        this._fovy = Math.PI / 4;
        this._near = 1;
        this._far = 2000;
        this.position = vec3.fromValues(0, 100, 100);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 0, 1);
        this._distance = 20;
        this.rotation = { x: Math.PI / 6, z: Math.PI / 3 };
        this.updatePosition();
        this.updateProjectionMatrix();
    }
}