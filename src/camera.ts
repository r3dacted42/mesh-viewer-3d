import { mat4 } from 'gl-matrix';

export default class PerspectiveCamera {
    private _fovy: number;
    readonly aspect: number;
    private _near: number;
    private _far: number;
    readonly projectionMatrix: mat4;
    readonly viewMatrix: mat4;

    constructor(public width: number, public height: number) {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.identity(mat4.create());
        this._fovy = Math.PI / 2;
        this.aspect = width / height;
        this._near = 1;
        this._far = 2000;
        this.updateProjectionMatrix();
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
    get far():number { return this._far; }
    set far(far: number) {
        this._far = far;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix, this._fovy, this.aspect, this._near, this._far);
    }
}