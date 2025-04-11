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
    boundingRadius: number;
    color: string;
    selectable: boolean = true;

    constructor(name: string, data: ParseResult, color = "#fff") {
        this.name = name;
        this.vertices = {
            count: data.vertexCount,
            position: new Float32Array(data.position),
            normal: data.normal ? new Float32Array(data.normal) : undefined,
            indices: data.indices ? (data.vertexCount > 65535 ? new Uint32Array(data.indices) : new Uint16Array(data.indices)) : undefined,
        };
        const { centroid, boundingRadius } = this.computeBoundingSphere(this.vertices.position);
        this.boundingRadius = boundingRadius;
        this.transform = new Transform(centroid);
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
    
    computeBoundingSphere(vertices: Float32Array) {
        const centroid = vec3.create();
        for (let i = 0; i < vertices.length; i += 3) {
            vec3.add(centroid, centroid, vec3.fromValues(vertices[i], vertices[i + 1], vertices[i + 2]));
        }
        vec3.scale(centroid, centroid, 1 / (vertices.length / 3));
        let maxDistanceSq = 0;
        for (let i = 0; i < vertices.length; i += 3) {
            const v = vec3.fromValues(vertices[i], vertices[i + 1], vertices[i + 2]);
            const distSq = vec3.squaredDistance(v, centroid);
            if (distSq > maxDistanceSq) maxDistanceSq = distSq;
        }
        return {
            centroid,
            boundingRadius: Math.sqrt(maxDistanceSq),
        };
    }

    static clone(original: Mesh, newName: string): Mesh {
        const cloned = new Mesh(newName, {
            vertexCount: original.vertices.count,
            position: Array.from(original.vertices.position),
            normal: original.vertices.normal ? Array.from(original.vertices.normal) : undefined,
            indices: original.vertices.indices ? Array.from(original.vertices.indices) : undefined,
        }, original.color);
        return cloned;
    }
}