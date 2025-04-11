import { mat4, quat, vec3, vec4 } from "gl-matrix";

interface AxisAngle {
    axis: vec3;
    angle: number;
}

export default class Transform {
    private _translate: vec3;
    private _scale: vec3;
    private _rotate: quat;
    private _transformationMatrix: mat4;
    private _modified: boolean;
    private _centroid: vec3;

    constructor(centroid = vec3.create()) {
        this._translate = vec3.fromValues(0, 0, 0);
        this._scale = vec3.fromValues(1, 1, 1);
        this._rotate = quat.create(); // identity
        this._transformationMatrix = mat4.create();
        this._modified = false;
        this._centroid = centroid;
    }

    get centroid(): vec3 {
        return this._centroid;
    }
    set centroid(newCentroid: vec3) {
        vec3.copy(this._centroid, newCentroid);
        this._modified = true;
    }
    get position(): vec3 {
        const pos = vec4.fromValues(
            this._centroid[0],
            this._centroid[1],
            this._centroid[2],
            1,
        );
        vec4.transformMat4(pos, pos, this.transformMatrix);
        return vec3.fromValues(pos[0], pos[1], pos[2]);
    }

    get translation(): Readonly<vec3> {
        return this._translate;
    }
    set translation(newTranslation: vec3) {
        vec3.copy(this._translate, newTranslation);
        this._modified = true;
    }
    addTranslation(x: number, y: number, z: number): this {
        vec3.add(this._translate, this._translate, vec3.fromValues(x, y, z));
        this._modified = true;
        return this;
    }

    get scale(): Readonly<vec3> {
        return this._scale;
    }
    set scale(newScale: vec3) {
        vec3.copy(this._scale, newScale);
        this._modified = true;
    }
    setScale(x: number, y: number, z: number): this {
        vec3.copy(this._scale, vec3.fromValues(x, y, z));
        this._modified = true;
        return this;
    }

    get rotation(): Readonly<AxisAngle> {
        const axis = vec3.create();
        const angle = quat.getAxisAngle(axis, this._rotate);
        return { axis, angle };
    }
    set rotation(axisAngle: AxisAngle) {
        quat.setAxisAngle(this._rotate, vec3.normalize(axisAngle.axis, axisAngle.axis), axisAngle.angle);
        this._modified = true;
    }
    applyRotation(axisAngle: AxisAngle) {
        const deltaQuat = quat.create();
        quat.setAxisAngle(deltaQuat, axisAngle.axis, axisAngle.angle);
        quat.multiply(this._rotate, deltaQuat, this._rotate);
        quat.normalize(this._rotate, this._rotate);
    }
    rotateAboutAxis(axis: 'x' | 'y' | 'z', angle: number): this {
        switch (axis) {
            case 'x': quat.rotateX(this._rotate, this._rotate, angle); break;
            case 'y': quat.rotateY(this._rotate, this._rotate, angle); break;
            case 'z': quat.rotateZ(this._rotate, this._rotate, angle); break;
            default: throw new Error(`invalid rotation axis: ${axis}`);
        }
        this._modified = true;
        return this;
    }

    get transformMatrix(): mat4 {
        if (this._modified) {
            mat4.fromRotationTranslationScaleOrigin(
                this._transformationMatrix,
                this._rotate,
                this._translate,
                this._scale,
                this._centroid,
            );
        }
        return this._transformationMatrix;
    }
}