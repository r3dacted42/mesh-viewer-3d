import { vec3 } from 'gl-matrix';
import Mesh from './lib/mesh';
import parsePLY from './lib/parsePLY';
import WebGLRenderer from './lib/renderer';
import Scene from './lib/scene';
import Shader from './lib/shader';
import { createCubeMesh } from './lib/utils';
import './style.css'
import Controls from './component/controls';

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const shader = new Shader('vertex-shader-3d', 'fragment-shader-3d');
shader.use();
shader.setUniform3fv('u_lightDirection', vec3.fromValues(0.5, 0.5, 1.0));

const scene = new Scene();

(async () => {
    const galleonPLY = await (await fetch("/mesh/galleon.ply")).text();
    const galleon = parsePLY(galleonPLY);
    console.log(galleon);
    if (!galleon) throw Error("ply could not be parsed");
    const galleonMesh = new Mesh(
        "galleon",
        {
            vertexCount: galleon.position.length / 3,
            position: galleon.position,
            normal: galleon.normal,
            indices: galleon.indices,
        },
    );
    console.log("Mesh has normals after construction:", !!galleonMesh.vertices.normal);
    scene.add(galleonMesh);
    galleonMesh.transform.translation = vec3.fromValues(0, 0, -400);

    console.log("Galleon mesh details:", {
        position: galleonMesh.vertices.position.slice(0, 9),  // First 3 vertices
        normals: galleonMesh.vertices.normal?.slice(0, 9),    // First 3 normals
        indices: galleonMesh.vertices.indices?.slice(0, 9),   // First 3 face indices
        vertexCount: galleonMesh.vertices.count,
        transformScale: galleonMesh.transform.scale
    });
    
    // Add specific scale for galleon
    galleonMesh.transform.scale = vec3.fromValues(2, 2, 2); // Adjust scale to make it visible
})();

const cube = createCubeMesh("testCube", "#00ff00");
cube.transform.scale = vec3.fromValues(50, 50, 50);
cube.transform.translation = vec3.fromValues(150, 0, -400);
scene.add(cube);

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

new Controls(renderer.camera, scene);