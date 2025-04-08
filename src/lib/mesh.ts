import { vec3 } from "gl-matrix";
import Transform from "./transform";

export interface ParseResult {
    vertexCount: number;
    position: number[];
    normal?: number[];
    indices?: number[];
}

export default class Mesh {
    name: string;
    vertices: {
        count: number;
        position: Float32Array;
        normal?: Float32Array;
        indices?: Uint32Array | Uint16Array;
    };
    transform: Transform;
    color: string;

    constructor(name: string, data: ParseResult, color = "#fff") {
        this.name = name;
        this.vertices = {
            count: data.vertexCount,
            position: new Float32Array(data.position),
            normal: data.normal ? new Float32Array(data.normal) : undefined,
            indices: data.indices ? (data.vertexCount > 65535 ? new Uint32Array(data.indices) : new Uint16Array(data.indices)) : undefined,
        };
        this.transform = new Transform();
        this.color = color;

        if (!this.vertices.normal && this.vertices.indices) {
            this.calculateNormals();
        }
    }

    private calculateNormals() {
        const { position: positions, indices } = this.vertices;
        const normals = new Float32Array(positions.length);

        for (let i = 0; i < indices!.length; i += 3) {
            const a = indices![i] * 3;
            const b = indices![i + 1] * 3;
            const c = indices![i + 2] * 3;

            const vA = vec3.fromValues(positions[a], positions[a + 1], positions[a + 2]);
            const vB = vec3.fromValues(positions[b], positions[b + 1], positions[b + 2]);
            const vC = vec3.fromValues(positions[c], positions[c + 1], positions[c + 2]);

            const ab = vec3.create();
            const ac = vec3.create();
            const normal = vec3.create();

            vec3.subtract(ab, vB, vA);
            vec3.subtract(ac, vC, vA);
            vec3.cross(normal, ab, ac);
            vec3.normalize(normal, normal);

            for (const idx of [a, b, c]) {
                normals[idx] += normal[0];
                normals[idx + 1] += normal[1];
                normals[idx + 2] += normal[2];
            }
        }

        for (let i = 0; i < normals.length; i += 3) {
            const n = vec3.fromValues(normals[i], normals[i + 1], normals[i + 2]);
            vec3.normalize(n, n);
            normals[i] = n[0];
            normals[i + 1] = n[1];
            normals[i + 2] = n[2];
        }

        this.vertices.normal = normals;
    }
}