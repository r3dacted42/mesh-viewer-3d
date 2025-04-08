import { mat3, mat4, vec2, vec3, vec4 } from "gl-matrix";

export default class Shader {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    positionBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;

    constructor(vertexShaderId: string, fragmentShaderId: string) {
        if (!window.glContext) throw new Error("must initialize renderer first!");
        this.gl = window.glContext;
        const vertexShaderSrc = document.getElementById(vertexShaderId)!.textContent!;
        const fragmentShaderSrc = document.getElementById(fragmentShaderId)!.textContent!;
        this.program = this.link(
            this.compile(this.gl.VERTEX_SHADER, vertexShaderSrc),
            this.compile(this.gl.FRAGMENT_SHADER, fragmentShaderSrc),
        );
        this.positionBuffer = this.gl.createBuffer()!;
        this.normalBuffer = this.gl.createBuffer()!;
        this.indexBuffer = this.gl.createBuffer()!;
    }

    compile(type: GLenum, shaderSrc: string) {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, shaderSrc);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) || "shader compile error");
        }
        return shader;
    }

    link(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(program) || "shader link error");
        }
        return program;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    createBuffer(): WebGLBuffer {
        const buffer = this.gl.createBuffer();
        if (!buffer) throw new Error("Failed to create buffer");
        return buffer;
    }

    attribute(attributeName: string) {
        return this.gl.getAttribLocation(this.program, attributeName);
    }

    uniform(uniformName: string) {
        return this.gl.getUniformLocation(this.program, uniformName);
    }

    setUniform4fv(uniformName: string, vec4: vec4) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniform4fv(uniformLocation, vec4);
    }

    setUniform3fv(uniformName: string, vec3: vec3) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniform3fv(uniformLocation, vec3);
    }

    setUniform2fv(uniformName: string, vec2: vec2) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniform2fv(uniformLocation, vec2);
    }

    setUniform1f(uniformName: string, value: number) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniform1f(uniformLocation, value);
    }

    setUniformMatrix4fv(uniformName: string, mat4: mat4) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniformMatrix4fv(uniformLocation, false, mat4);
    }

    setUniformMatrix3fv(uniformName: string, mat3: mat3) {
        const uniformLocation = this.uniform(uniformName);
        this.gl.uniformMatrix3fv(uniformLocation, false, mat3);
    }

    bindArrayBuffer(buffer: WebGLBuffer | null, data: Float32Array | Uint32Array | Uint16Array | null, target: GLenum = this.gl.ARRAY_BUFFER) {
        this.gl.bindBuffer(target, buffer);
        if (buffer && data) this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
    }

    fillAttributeData(attributeName: string, size: GLint, stride: GLsizei, offset: GLintptr) {
        const attribLocation = this.gl.getAttribLocation(this.program, attributeName);
        this.gl.enableVertexAttribArray(attribLocation);
        this.gl.vertexAttribPointer(attribLocation, size, this.gl.FLOAT, false, stride, offset);
    }

    drawArrays(numberOfElements: GLsizei, mode: GLenum = this.gl.TRIANGLES) {
        this.gl.drawArrays(mode, 0, numberOfElements);
    }

    drawElements(count: GLsizei, offset: GLintptr, type: GLenum, mode: GLenum = this.gl.TRIANGLES) {
        this.gl.drawElements(mode, count, type, offset);
    }
}