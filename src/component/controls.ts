import { Pane } from "tweakpane";
import PerspectiveCamera from "../camera";
import Scene from "../lib/scene";
import { vec3 } from "gl-matrix";

interface iCtl {
    idx: number;
    xyz: { x: number, y: number, z: number };
    updateXYZ: CallableFunction;
    raxis: { x: number, y: number, z: number };
    rangle: number;
    updateRot: CallableFunction;
}

export default class Controls {
    camera: PerspectiveCamera;
    cameraPane: Pane;
    scene: Scene;
    scenePane: Pane;
    ctl: iCtl = {
        idx: -1,
        xyz: { x: 0, y: 0, z: 0 },
        updateXYZ: (idx: number, x: number, y: number, z: number) => {
            this.scene.meshes[idx].transform.translation = vec3.fromValues(x, -y, z);
        },
        raxis: { x: 0, y: 1, z: 0 },
        rangle: 0,
        updateRot: (idx: number, axis: vec3, angle: number) => {
            this.scene.meshes[idx].transform.rotation = { axis: axis, angle: angle };
        },
    };

    constructor(camera: PerspectiveCamera, scene: Scene) {
        this.camera = camera;
        this.cameraPane = new Pane({
            title: 'camera',
            expanded: false,
            container: document.getElementById('camera')!,
        });
        this.addCameraControls();
        this.scene = scene;
        this.scenePane = new Pane({
            title: 'scene',
            expanded: true,
            container: document.getElementById('scene')!,
        });
        this.addSceneControls();
    }

    private addCameraControls() {
        this.cameraPane.addBinding(this.camera, 'fovy', {
            min: Math.PI / 12,
            max: Math.PI - 0.01,
        });
        this.cameraPane.addBinding(this.camera, 'near');
        this.cameraPane.addBinding(this.camera, 'far');
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
        this.scenePane.addButton({
            title: 'upload mesh',
        }).on('click', (_ev) => {
            // show dialog box etc
        });
        const xyzBinding = this.scenePane.addBinding(this.ctl, 'xyz', { hidden: true });
        xyzBinding.on('change', (ev) => {
            this.ctl.updateXYZ(this.ctl.idx, ev.value.x, ev.value.y, ev.value.z);
        });
        const raxisBinding = this.scenePane.addBinding(this.ctl, 'raxis', { hidden: true });
        const rangleBinding = this.scenePane.addBinding(this.ctl, 'rangle', { hidden: true });
        raxisBinding.on('change', (ev) => {
            this.ctl.updateRot(this.ctl.idx, vec3.fromValues(ev.value.x, ev.value.y, ev.value.z), this.ctl.rangle);
        });
        rangleBinding.on('change', (ev) => {
            this.ctl.updateRot(this.ctl.idx, vec3.fromValues(this.ctl.raxis.x, this.ctl.raxis.y, this.ctl.raxis.z), ev.value);
        });
        const idxBinding = this.scenePane.addBinding(this.ctl, 'idx', {
            label: 'mesh',
            index: 1,
            options: this.selectOptions,
            interval: 100,
        }).on('change', (selectEv) => {
            const idx = selectEv.value;
            [xyzBinding, raxisBinding, rangleBinding]
                .forEach((b) => { b.hidden = idx === -1; });
            if (idx === -1) return;
            this.ctl.xyz = {
                x: this.scene.meshes[idx].transform.translation[0],
                y: -this.scene.meshes[idx].transform.translation[1],
                z: this.scene.meshes[idx].transform.translation[2],
            };
            xyzBinding.refresh();
            const rot = this.scene.meshes[idx].transform.rotation;
            this.ctl.raxis = {x: rot.axis[0], y: rot.axis[1], z: rot.axis[2]};
            this.ctl.rangle = rot.angle;
        });
        setInterval(() => {
            (idxBinding as any).options = Object.entries(this.selectOptions)
                .map(([key, value]) => ({
                    text: key,
                    value: value
                }));
            idxBinding.refresh();
        }, 1000);
    }
}