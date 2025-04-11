import { mat4, vec3 } from 'gl-matrix';
import Mesh from './mesh';

export default class OrthographicCamera {
    left: number = 0;
    right: number = 0;
    top: number = 0;
    bottom: number = 0;
    near: number;
    far: number;

    position: vec3;
    target: vec3;
    up: vec3;

    zoom: number;

    readonly projectionMatrix: mat4;
    readonly viewMatrix: mat4;

    constructor(public width: number, public height: number) {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.zoom = 3;
        this.near = -1000;
        this.far = 1000;

        this.position = vec3.fromValues(0, 0, 100);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);

        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }

    updateProjectionMatrix() {
        const aspect = this.width / this.height;
        const scale = 50 / this.zoom;

        this.left = -scale * aspect;
        this.right = scale * aspect;
        this.bottom = -scale;
        this.top = scale;

        mat4.ortho(this.projectionMatrix, this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.updateProjectionMatrix();
    }

    setZoom(zoom: number) {
        this.zoom = Math.max(0.1, zoom);
        this.updateProjectionMatrix();
    }

    pan(dx: number, dy: number) {
        this.position[0] += dx;
        this.target[0] += dx;
        this.position[1] += dy;
        this.target[1] += dy;
        this.updateViewMatrix();
    }

    lookAt(target: Mesh) {
        vec3.copy(this.target, target.transform.position);
        this.position[0] = this.target[0];
        this.position[2] = this.target[2];
        this.updateViewMatrix();
    }

    reset() {
        this.zoom = 3;
        this.position = vec3.fromValues(0, 0, 100);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);
        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }
}
