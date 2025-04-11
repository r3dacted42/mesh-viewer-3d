import { ButtonApi, FolderApi, Pane } from "tweakpane";
import WebGLRenderer from "../lib/renderer";
import Scene from "../lib/scene";
import { mat4, vec3, vec4 } from "gl-matrix";
import Mesh from "../lib/mesh";

export default class Animator {
    renderer: WebGLRenderer;
    scene: Scene;
    pane: Pane;
    pointMesh: () => Mesh;
    lastPos: vec3 | null = null;
    points: vec3[];
    pointFolders: FolderApi[];
    selectMode: boolean = false;
    selectPtButton!: ButtonApi;
    animSpeed: number = 1;
    t1: number = 0.5;

    constructor(renderer: WebGLRenderer, scene: Scene, pointMesh: () => Mesh) {
        this.renderer = renderer;
        this.scene = scene;
        this.pane = new Pane({
            title: 'animation',
            expanded: false,
            container: document.getElementById('animation')!,
        });
        this.addControls();
        this.points = [];
        this.pointFolders = [];
        this.pointMesh = pointMesh;
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    }

    addControls() {
        const playButton = this.pane.addButton({ title: 'play anim', disabled: true });
        playButton.on('click', () => this.playAnimation());
        this.pane.addBinding(this, 'animSpeed', { label: "speed", min: 0.1, max: 3, step: 0.1 });
        this.pane.addBinding(this, 't1', { min: 0.1, max: 0.9, step: 0.1 });
        this.pane.addBlade({ view: 'separator' });
        const message = this.pane.addBlade({
            view: 'text',
            label: 'turn 3d off in camera settings and activate a mesh to place points',
            parse: (s: any) => String(s),
            value: '',
        });
        message.element.removeChild(message.element.children[1]);
        this.selectPtButton = this.pane.addButton({ title: 'place point', hidden: true });
        this.selectPtButton.on('click', () => {
            this.selectMode = true;
            this.selectPtButton.disabled = true;
            this.selectPtButton.title = 'place now';
            const mesh = Mesh.clone(this.pointMesh(), `point ${this.points.length + 1}`);
            mesh.selectable = false;
            this.scene.points.push(mesh);
        });
        setInterval(() => {
            playButton.disabled = this.points.length < 2;
            const hideMessage = !(this.renderer.perspectiveMode || this.scene.activeMesh === null);
            message.hidden = hideMessage || this.points.length >= 2;
            this.selectPtButton.hidden = !hideMessage || this.points.length >= 2;
        }, 100);
    }

    onMove(event: MouseEvent) {
        if (!this.selectMode || !this.scene.activeMesh) return;
        const pointMesh = this.scene.points[this.points.length];

        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((rect.bottom - event.clientY) / rect.height) * 2 - 1;

        const ndc = vec4.fromValues(x, y, 0, 1);
        const view = this.renderer.orthocamera.viewMatrix;
        const projection = this.renderer.orthocamera.projectionMatrix;
        const inverseVP = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projection, view));
        if (!inverseVP) return;

        vec4.transformMat4(ndc, ndc, inverseVP);
        const world = vec3.fromValues(ndc[0] / ndc[3], ndc[1] / ndc[3], ndc[2] / ndc[3]);

        const targetY = this.scene.activeMesh.transform.translation[1];
        const point = vec3.fromValues(world[0], targetY, world[2]);
        pointMesh.transform.translation = point;
        this.lastPos = point;
    }

    onClick(_event: MouseEvent) {
        if (this.lastPos === null || !this.selectMode || this.renderer.perspectiveMode || !this.scene.activeMesh) return;
        const pointMesh = this.scene.points[this.points.length];
        this.selectMode = false;
        this.points.push(this.lastPos);
        this.selectPtButton.disabled = false;
        this.selectPtButton.title = 'place point';

        const folder = this.pane.addFolder({ title: `point ${this.points.length}` });
        const meshPos = {
            planar: { x: this.lastPos[0], y: this.lastPos[2] },
            vertical: pointMesh.transform.position[1],
        };
        folder.addBinding(meshPos, 'planar', { label: "XZ" })
            .on('change', (ev) => { pointMesh.transform.translation = vec3.fromValues(ev.value.x, meshPos.vertical, ev.value.y) });
        folder.addBinding(meshPos, 'vertical', { label: "Y" })
            .on('change', (ev) => { pointMesh.transform.translation = vec3.fromValues(meshPos.planar.x, ev.value, meshPos.planar.y) });
        this.pointFolders.push(folder);
        this.lastPos = null;
    }

    solveQuadraticCoefficients(p0: vec3, p1: vec3, p2: vec3, t1: number): { a: vec3, b: vec3, c: vec3 } {
        const c = vec3.clone(p0); // p(0) = c = p0
        const p2_minus_c = vec3.subtract(vec3.create(), p2, c);
        const p1_minus_c = vec3.subtract(vec3.create(), p1, c);
        const left = vec3.scale(vec3.create(), p2_minus_c, t1); // (p2 - c)*t1
        const right = vec3.subtract(vec3.create(), p1_minus_c, left); // (p1 - c) - (p2 - c)*t1
        const denom = t1 * t1 - t1;
        const a = vec3.scale(vec3.create(), right, 1 / denom); // a = right / (t1² - t1)
        const b = vec3.subtract(vec3.create(), p2_minus_c, a); // b = (p2 - c) - a
        return { a, b, c };
    }

    playAnimation() {
        const mesh = this.scene.activeMesh;
        if (!mesh || this.points.length < 2) return;

        let t = 0;
        const { a, b, c } = this.solveQuadraticCoefficients(
            mesh.transform.position, this.points[0], this.points[1], this.t1
        );
        const getCoord = (t: number) => {
            const at2 = vec3.scale(vec3.create(), a, t * t);
            const bt = vec3.scale(vec3.create(), b, t);
            vec3.add(at2, at2, bt);
            return vec3.add(at2, at2, c);
        }

        const animate = () => {
            t += 0.005 * this.animSpeed;
            if (t > 1) {
                for (let i = 0; i < 2; i++) {
                    this.scene.points.pop();
                    this.points.pop();
                    this.pointFolders.pop()?.dispose();
                }
                this.scene.activeMesh = null;
                return;
            }
            mesh.transform.translation = getCoord(t);
            requestAnimationFrame(animate);
        };

        animate();
    }
}