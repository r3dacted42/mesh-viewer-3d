import { vec3, vec4, mat4 } from 'gl-matrix';
import Mesh from './mesh';
import Scene from './scene';
import WebGLRenderer from './renderer';

export default class MeshPicker {
    private canvas: HTMLCanvasElement;
    private scene: Scene;
    private renderer: WebGLRenderer;

    constructor(
        renderer: WebGLRenderer,
        scene: Scene
    ) {
        this.canvas = renderer.domElement;
        this.scene = scene;
        this.renderer = renderer;
        this.canvas.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(event: MouseEvent) {
        if (this.renderer.perspectiveMode) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((rect.bottom - event.clientY) / rect.height) * 2 - 1;

        const view = this.renderer.orthocamera.viewMatrix;
        const projection = this.renderer.orthocamera.projectionMatrix;
        const inverseVP = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projection, view));
        if (!inverseVP) return;

        const ndcNear = vec4.fromValues(x, y, -1, 1);
        const ndcFar = vec4.fromValues(x, y, 1, 1);

        vec4.transformMat4(ndcNear, ndcNear, inverseVP);
        vec4.transformMat4(ndcFar, ndcFar, inverseVP);

        const worldNear = vec3.fromValues(ndcNear[0] / ndcNear[3], ndcNear[1] / ndcNear[3], ndcNear[2] / ndcNear[3]);
        const worldFar = vec3.fromValues(ndcFar[0] / ndcFar[3], ndcFar[1] / ndcFar[3], ndcFar[2] / ndcFar[3]);

        const rayDir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), worldFar, worldNear));

        let closestMesh: Mesh | null = null;
        let closestDistance = Infinity;

        for (const mesh of this.scene.meshes) {
            const toCenter = vec3.sub(vec3.create(), mesh.transform.position, worldNear);
            const t = vec3.dot(toCenter, rayDir);
            if (t < 0) continue; // behind the ray

            const closestPoint = vec3.scaleAndAdd(vec3.create(), worldNear, rayDir, t);
            const distanceToCenter = vec3.distance(closestPoint, mesh.transform.position);

            if (mesh.selectable && distanceToCenter < mesh.boundingRadius && t < closestDistance) {
                closestDistance = t;
                closestMesh = mesh;
            }
        }

        if (closestMesh) {
            this.scene.activeMesh = closestMesh;
        }
    }
}