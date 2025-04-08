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

        console.log(this.vertices);
        if (!this.vertices.normal && this.vertices.indices) {
            this.calculateNormals();
        }
    }

    private calculateNormals() {
        const positions = this.vertices.position;
        const indices = this.vertices.indices!;
        const normals = new Float32Array(positions.length);

        for (let i = 0; i < indices.length; i += 3) {
            const aIndex = indices[i] * 3;
            const bIndex = indices[i + 1] * 3;
            const cIndex = indices[i + 2] * 3;

            const a = vec3.fromValues(positions[aIndex], positions[aIndex + 1], positions[aIndex + 2]);
            const b = vec3.fromValues(positions[bIndex], positions[bIndex + 1], positions[bIndex + 2]);
            const c = vec3.fromValues(positions[cIndex], positions[cIndex + 1], positions[cIndex + 2]);

            const normal = vec3.create();
            const ab = vec3.create();
            const ac = vec3.create();

            vec3.subtract(ab, b, a);
            vec3.subtract(ac, c, a);
            vec3.cross(normal, ab, ac);
            vec3.normalize(normal, normal);

            // Accumulate normals for each vertex of the triangle
            normals[aIndex] += normal[0];
            normals[aIndex + 1] += normal[1];
            normals[aIndex + 2] += normal[2];
            normals[bIndex] += normal[0];
            normals[bIndex + 1] += normal[1];
            normals[bIndex + 2] += normal[2];
            normals[cIndex] += normal[0];
            normals[cIndex + 1] += normal[1];
            normals[cIndex + 2] += normal[2];
        }

        // Normalize the accumulated normals
        for (let i = 0; i < normals.length; i += 3) {
            const v = vec3.fromValues(normals[i], normals[i + 1], normals[i + 2]);
            vec3.normalize(v, v);
            normals[i] = v[0];
            normals[i + 1] = v[1];
            normals[i + 2] = v[2];
        }

        this.vertices.normal = normals;
    }
}