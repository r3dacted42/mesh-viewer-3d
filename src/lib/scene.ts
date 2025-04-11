import Mesh from "./mesh";

export default class Scene {
    meshes: Mesh[] = [];
    axes: Mesh[] = [];
    points: Mesh[] = [];
    activeMesh: Mesh | null = null;

    constructor() {
    }

    add(mesh: Mesh) {
        if (mesh) {
            this.meshes.push(mesh);
        }
    }

    remove(mesh: Mesh) {
        if (mesh) {
            const index = this.meshes.indexOf(mesh);
            if (index > -1) {
                this.meshes.splice(index, 1);
            }
        }
    }

    get drawables(): Mesh[] {
        return [...this.axes, ...this.points, ...this.meshes];
    }
}