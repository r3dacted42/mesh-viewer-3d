import { mat4, vec3 } from "gl-matrix";

export default class Camera {
    private _position: vec3;
    private _target: vec3;
    private _up: vec3;
    private _viewMatrix: mat4;
    private _projectionMatrix: mat4;
    private _modified: boolean;

    constructor() {
        this._position = vec3.fromValues(0, 0, 5);
        this._target = vec3.fromValues(0, 0, 0);
        this._up = vec3.fromValues(0, 1, 0);
        this._viewMatrix = mat4.create();
        this._projectionMatrix = mat4.create();
        this._modified = true;

        mat4.perspective(this._projectionMatrix, Math.PI / 4, 1, 0.1, 100);
    }

    get position(): vec3 {
        return this._position;
    }

    set position(value: vec3) {
        vec3.copy(this._position, value);
        this._modified = true;
    }

    get target(): vec3 {
        return this._target;
    }

    set target(value: vec3) {
        vec3.copy(this._target, value);
        this._modified = true;
    }

    get up(): vec3 {
        return this._up;
    }

    set up(value: vec3) {
        vec3.copy(this._up, value);
        this._modified = true;
    }

    get viewMatrix(): mat4 {
        if (this._modified) {
            mat4.lookAt(this._viewMatrix, this._position, this._target, this._up);
            this._modified = false;
        }
        return this._viewMatrix;
    }

    get projectionMatrix(): mat4 {
        return this._projectionMatrix;
    }
} 