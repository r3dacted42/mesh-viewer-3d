import { vec4 } from "gl-matrix";
import { hexToRGBA } from "./utils";
import Scene from "./scene";
import Shader from "./shader";
import PerspectiveCamera from "../camera";

export default class WebGLRenderer {
    domElement: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    camera: PerspectiveCamera;

    constructor(canvas: HTMLCanvasElement) {
        this.domElement = canvas;
        this.gl =
            this.domElement.getContext("webgl", { preserveDrawingBuffer: true }) ||
            this.domElement.getContext("experimental-webgl") as WebGLRenderingContext;
        if (!this.gl) throw new Error("WebGL not supported!");
        window.glContext = this.gl;
        // this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.clear("#242424");
        this.camera = new PerspectiveCamera(this.gl.canvas.width, this.gl.canvas.height);
    }

    setSize(width: number, height: number) {
        this.domElement.width = width;
        this.domElement.height = height;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.camera.resize(width, height);
    }

    getSize(): number[] {
        return [this.gl.canvas.width, this.gl.canvas.height];
    }

    clear(hexColor: string) {
        const rgba = hexToRGBA(hexColor);
        this.gl.clearColor(rgba[0], rgba[1], rgba[2], rgba[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setAnimationLoop(animation: CallableFunction) {
        function renderLoop() {
            animation();
            window.requestAnimationFrame(renderLoop);
        }

        renderLoop();
    }

    render(scene: Scene, shader: Shader) {
        for (const mesh of scene.drawables) {
            shader.bindArrayBuffer(shader.positionBuffer, mesh.vertices.position);
            shader.fillAttributeData("a_position", 3, 0, 0);

            if (mesh.vertices.normal) {
                shader.bindArrayBuffer(shader.normalBuffer, mesh.vertices.normal);
                shader.fillAttributeData("a_normal", 3, 0, 0);
            }

            if (mesh.vertices.indices) {
                shader.bindArrayBuffer(shader.indexBuffer, mesh.vertices.indices, this.gl.ELEMENT_ARRAY_BUFFER);
            } else {
                shader.bindArrayBuffer(null, null, this.gl.ELEMENT_ARRAY_BUFFER);
            }
            
            shader.setUniformMatrix4fv("u_projection", this.camera.projectionMatrix);
            shader.setUniformMatrix4fv("u_view", this.camera.viewMatrix);
            shader.setUniformMatrix4fv("u_model", mesh.transform.transformMatrix);
            
            const color = hexToRGBA(mesh.color);
            shader.setUniform4fv("u_color", vec4.fromValues(...color as [number, number, number, number]));

            if (mesh.vertices.indices) {
                const indexType = (mesh.vertices.indices instanceof Uint16Array) ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT;
                shader.drawElements(mesh.vertices.indices.length, 0, indexType);
            } else {
                shader.drawArrays(mesh.vertices.count);
            }
        }
    }
}