import Mesh from "./mesh";
import Transform from "./transform";

export default class Scene {
    meshes: Array<Mesh>;
    // axes: { x: Mesh, y: Mesh, z: Mesh };
    transform: Transform;

    constructor() {
        this.meshes = [];
        this.transform = new Transform();
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

    get drawables() {
        return this.meshes;
    }
}