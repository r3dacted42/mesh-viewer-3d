import { Pane } from "tweakpane";
import Scene from "../lib/scene";
import { vec3 } from "gl-matrix";
import Mesh from "../lib/mesh";
import parsePLY from "../lib/parsePLY";
import WebGLRenderer from "../lib/renderer";

interface iCtl {
    idx: number;
    color: string,
    updateColor: CallableFunction,
    scale: { x: number, y: number, z: number };
    updateScale: CallableFunction;
    xyz: { x: number, y: number, z: number };
    updateXYZ: CallableFunction;
    raxis: { x: number, y: number, z: number };
    rangle: number;
    updateRot: CallableFunction;
}

export default class Controls {
    cameraPane: Pane;
    scene: Scene;
    renderer: WebGLRenderer;
    scenePane: Pane;
    ctl: iCtl = {
        idx: -1,
        color: "#000",
        updateColor: (idx: number, color: string) => {
            this.scene.meshes[idx].color = color;
        },
        scale: { x: 1, y: 1, z: 1 },
        updateScale: (idx: number, x: number, y: number, z: number) => {
            this.scene.meshes[idx].transform.setScale(x, y, z);
        },
        xyz: { x: 0, y: 0, z: 0 },
        updateXYZ: (idx: number, x: number, y: number, z: number) => {
            this.scene.meshes[idx].transform.translation = vec3.fromValues(x, y, z);
        },
        raxis: { x: 0, y: 1, z: 0 },
        rangle: 0,
        updateRot: (idx: number, axis: vec3, angle: number) => {
            this.scene.meshes[idx].transform.applyRotation({ axis: axis, angle: angle });
        },
    };
    meshInput: HTMLInputElement;

    constructor(renderer: WebGLRenderer, scene: Scene) {
        this.renderer = renderer;
        this.scene = scene;
        this.cameraPane = new Pane({
            title: 'camera',
            expanded: false,
            container: document.getElementById('camera')!,
        });
        this.addCameraControls();
        this.scenePane = new Pane({
            title: 'scene',
            expanded: false,
            container: document.getElementById('scene')!,
        });
        this.addSceneControls();
        this.meshInput = document.getElementById('mesh-input')! as HTMLInputElement;
        this.meshInput.addEventListener('change', (_ev) => {
            this.uploadMesh();
        });
    }

    private addCameraControls() {
        const cameraBinding = this.cameraPane.addBinding(this.renderer, 'perspectiveMode', { label: '3d' });
        const fovyBinding = this.cameraPane.addBinding(this.renderer.perscamera, 'fovy', {
            min: Math.PI / 12,
            max: Math.PI - 0.01,
        });
        const nearBinding = this.cameraPane.addBinding(this.renderer.perscamera, 'near');
        const farBinding = this.cameraPane.addBinding(this.renderer.perscamera, 'far');
        const distanceBinding = this.cameraPane.addBinding(this.renderer.perscamera, 'distance');
        cameraBinding.on('change', (ev) => {
            const isPerspective = ev.value;
            [fovyBinding, nearBinding, farBinding, distanceBinding]
                .forEach((b) => { b.hidden = !isPerspective; });
            if (isPerspective) {
                this.renderer.perscamera.reset();
                if (this.scene.activeMesh) {
                    this.renderer.perscamera.lookAt(this.scene.activeMesh);
                }
            } else {
                this.renderer.orthocamera.reset();
            }
        })
        this.cameraPane.addBlade({ view: 'separator' });
        this.cameraPane.addButton({
            title: 'reset',
        }).on('click', (_ev) => {
            if (this.renderer.perspectiveMode) this.renderer.perscamera.reset();
            else this.renderer.orthocamera.reset();
        });
        setInterval(() => {
            [fovyBinding, nearBinding, farBinding, distanceBinding]
                .forEach((b) => { b.refresh(); });
        }, 100);
    }

    get selectOptions() {
        const options = {
            none: -1,
            ...this.scene.meshes.reduce((acc: any, c, i) => {
                acc[c.name] = i;
                return acc;
            }, {}),
        };
        return options;
    }

    private addSceneControls() {
        const uploadButton = this.scenePane.addButton({
            title: 'upload mesh',
        }).on('click', (_ev) => {
            this.meshInput.click();
        });
        this.scenePane.addBlade({ view: 'separator' });
        const colorBinding = this.scenePane.addBinding(this.ctl, 'color', { hidden: true });
        colorBinding.on('change', (ev) => {
            this.ctl.updateColor(this.ctl.idx, ev.value);
        });
        const scaleBinding = this.scenePane.addBinding(this.ctl, 'scale', { hidden: true });
        scaleBinding.on('change', (ev) => {
            this.ctl.updateScale(this.ctl.idx, ev.value.x, ev.value.y, ev.value.z);
        });
        const xyzBinding = this.scenePane.addBinding(this.ctl, 'xyz', { label: 'translate', hidden: true });
        xyzBinding.on('change', (ev) => {
            this.ctl.updateXYZ(this.ctl.idx, ev.value.x, ev.value.y, ev.value.z);
        });
        const rotFolder = this.scenePane.addFolder({ title: 'rotate', hidden: true, expanded: false, });
        rotFolder.addBinding(this.ctl, 'raxis');
        rotFolder.addBinding(this.ctl, 'rangle');
        rotFolder.addButton({ title: 'apply' })
            .on('click', (_ev) => {
                this.ctl.updateRot(
                    this.ctl.idx,
                    vec3.fromValues(
                        this.ctl.raxis.x,
                        this.ctl.raxis.y,
                        this.ctl.raxis.z
                    ),
                    Math.PI / 180 * this.ctl.rangle,
                );
            });
        this.scenePane.addBlade({ view: 'separator' });
        const deleteButton = this.scenePane.addButton({
            title: 'delete mesh',
            disabled: true,
        }).on('click', (_ev) => {
            this.scene.activeMesh = null;
            this.scene.remove(this.scene.meshes[this.ctl.idx]);
        });
        const idxBinding = this.scenePane.addBinding(this.ctl, 'idx', {
            label: 'mesh',
            index: 2,
            options: this.selectOptions,
            interval: 100,
        }).on('change', (selectEv) => {
            const idx = selectEv.value;
            [scaleBinding, xyzBinding, colorBinding, rotFolder]
                .forEach((b) => { b.hidden = idx === -1; });
            if (idx === -1) {
                this.scene.activeMesh = null;
                deleteButton.disabled = true;
                return;
            }
            deleteButton.disabled = false;
            this.scene.activeMesh = this.scene.meshes[idx];
            this.renderer.perscamera.lookAt(this.scene.activeMesh);
            this.ctl.scale = {
                x: this.scene.meshes[idx].transform.scale[0],
                y: this.scene.meshes[idx].transform.scale[1],
                z: this.scene.meshes[idx].transform.scale[2],
            };
            scaleBinding.refresh();
            this.ctl.xyz = {
                x: this.scene.meshes[idx].transform.translation[0],
                y: this.scene.meshes[idx].transform.translation[1],
                z: this.scene.meshes[idx].transform.translation[2],
            };
            xyzBinding.refresh();
            this.ctl.color = this.scene.meshes[idx].color;
            colorBinding.refresh();
        });
        setInterval(() => {
            (idxBinding as any).options = Object.entries(this.selectOptions)
                .map(([key, value]) => ({
                    text: key,
                    value: value
                }));
            if (this.scene.activeMesh)
                this.ctl.idx = this.scene.meshes.indexOf(this.scene.activeMesh);
            else this.ctl.idx = -1;
            idxBinding.refresh();
            const disabled = this.scene.points.length > 0;
            xyzBinding.disabled = disabled;
            uploadButton.disabled = disabled;
            idxBinding.disabled = disabled;
            deleteButton.disabled = disabled;
        }, 100);
    }

    uploadMesh() {
        if (!this.meshInput.files) return;
        const file = this.meshInput.files[0];
        // const type = file.name.toLowerCase().endsWith('.ply') ? "PLY" : "OBJ";
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            if (!content) {
                throw Error("could not read file");
            }
            const mesh = new Mesh(
                file.name.split('.')[0],
                parsePLY(content),
            );
            this.scene.add(mesh);
        }
        reader.readAsText(file);
    }
}