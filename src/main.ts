import { vec3 } from 'gl-matrix';
import Mesh from './lib/mesh';
import parsePLY from './lib/parsePLY';
import WebGLRenderer from './lib/renderer';
import Scene from './lib/scene';
import Shader from './lib/shader';
// import { createCubeMesh } from './lib/utils';
import './style.css'
import Controls from './component/controls';
import OrbitalController from './lib/orbital';
import MeshPicker from './lib/picker';
import TopDownController from './lib/topdown';
import Animator from './component/animator';

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const shader = new Shader('vertex-shader-3d', 'fragment-shader-3d');
shader.use();
shader.setUniform3fv('u_lightDirection', vec3.fromValues(0.5, 0.5, 1.0));

const scene = new Scene();

const meshLoader = async (meshName: string) => {
    const plyText = await (await fetch(`/model-viewer-3d/mesh/${meshName}.ply`)).text();
    const parseResult = parsePLY(plyText);
    if (!parseResult) throw Error(`${meshName}.ply could not be parsed`);
    const mesh = new Mesh(
        meshName,
        {
            vertexCount: parseResult.position.length / 3,
            position: parseResult.position,
            normal: parseResult.normal,
            indices: parseResult.indices,
        },
    );
    return mesh;
};

let pointMesh: Mesh | null = null;
(async () => {
    const xAxis = await meshLoader("axis");
    xAxis.name = "x_axis";
    xAxis.color = "#ff0000";
    xAxis.transform.centroid = vec3.fromValues(0, 0, 0);
    xAxis.transform.setScale(0.5, 0.5, 0.5);
    const yAxis = Mesh.clone(xAxis, "y_axis");
    yAxis.color = "#00ff00";
    yAxis.transform.centroid = vec3.fromValues(0, 0, 0);
    yAxis.transform.rotateAboutAxis('z', Math.PI / 2);
    yAxis.transform.setScale(0.5, 0.5, 0.5);
    const zAxis = Mesh.clone(xAxis, "z_axis");
    zAxis.transform.centroid = vec3.fromValues(0, 0, 0);
    zAxis.transform.rotateAboutAxis('y', -Math.PI / 2);
    zAxis.transform.setScale(0.5, 0.5, 0.5);
    zAxis.color = "#0000ff";
    scene.axes.push(xAxis, yAxis, zAxis);
    const spiderMesh = await meshLoader("big_spider");
    // spiderMesh.transform.rotateAboutAxis('x', -Math.PI / 2);
    // spiderMesh.transform.applyRotation({
    //     axis: vec3.fromValues(0, 1, 0),
    //     angle: Math.PI / 2,
    // });
    // spiderMesh.transform.addTranslation(0, -2, 1.5);
    spiderMesh.color = "#c0ffcc";
    scene.add(spiderMesh);
    pointMesh = await meshLoader("point");
}) ();

// const cube = createCubeMesh("testCube", "#00ff00");
// cube.transform.scale = vec3.fromValues(50, 50, 50);
// cube.transform.translation = vec3.fromValues(0, 0, 0);
// scene.add(cube);

const resizeCanvasToDisplaySize = () => {
    const [width, height] = renderer.getSize();
    if (canvas.clientWidth != width ||
        canvas.clientHeight != height) {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
}

function animation() {
    renderer.clear("#242424");
    renderer.render(scene, shader);
    resizeCanvasToDisplaySize();
}

renderer.setAnimationLoop(animation);

new Controls(renderer, scene);
new Animator(renderer, scene, () => { return pointMesh!; });
new OrbitalController(renderer.perscamera, renderer.domElement);
new TopDownController(renderer.orthocamera, renderer.domElement);
new MeshPicker(renderer, scene);