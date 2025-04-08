import parseOBJ, { OBJParseResult } from './parseOBJ'; // Assuming your parseOBJ.ts
import parsePLY, { PLYParseResult } from './parsePLY'; // Assuming your parsePLY.ts

interface BufferData {
    position: Float32Array;
    color?: Float32Array;
    normal?: Float32Array;
    indices?: Uint16Array | Uint32Array;
}

enum FileType {
    OBJ,
    PLY,
    UNKNOWN,
}

function getFileType(fileName: string): FileType {
    const lowerCaseName = fileName.toLowerCase();
    if (lowerCaseName.endsWith('.obj')) {
        return FileType.OBJ;
    } else if (lowerCaseName.endsWith('.ply')) {
        return FileType.PLY;
    }
    return FileType.UNKNOWN;
}

export class Primitive {
    public vertices: Float32Array;
    public colors?: Float32Array;
    public normals?: Float32Array;
    public indices?: Uint16Array | Uint32Array;
    public vertexCount: number;
    public indexCount?: number;

    constructor(bufferData: BufferData) {
        this.vertices = bufferData.position;
        this.colors = bufferData.color;
        this.normals = bufferData.normal;
        this.indices = bufferData.indices;
        this.vertexCount = this.vertices.length / 3; // Assuming 3 components per vertex (x, y, z)
        this.indexCount = this.indices ? this.indices.length : undefined;
    }

    static async load(file: File): Promise<Primitive | null> {
        const fileType = getFileType(file.name);
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async (event) => {
                const fileContent = event.target?.result as string;
                if (!fileContent) {
                    reject(new Error('Failed to read file.'));
                    return;
                }

                let parsedData: OBJParseResult | PLYParseResult | null = null;

                switch (fileType) {
                    case FileType.OBJ:
                        parsedData = parseOBJ(fileContent);
                        break;
                    case FileType.PLY:
                        parsedData = parsePLY(fileContent);
                        break;
                    case FileType.UNKNOWN:
                        reject(new Error('Unsupported file type.'));
                        return;
                }

                if (!parsedData) {
                    reject(new Error(`Failed to parse ${file.name}`));
                    return;
                }

                const bufferData: BufferData = {
                    position: new Float32Array(parsedData.position),
                };

                if ((parsedData as OBJParseResult).texcoord) {
                    // OBJ might have texture coordinates, we're not directly using them for color here
                    // You could potentially derive color from texture or handle UV mapping separately
                }

                if ((parsedData as OBJParseResult).normal || (parsedData as PLYParseResult)?.normal) {
                    bufferData.normal = new Float32Array((parsedData as OBJParseResult).normal || (parsedData as PLYParseResult)!.normal!);
                }

                if ((parsedData as PLYParseResult)?.color) {
                    bufferData.color = new Float32Array((parsedData as PLYParseResult).color!);
                } else {
                    // If no color in the file, you might want to provide a default color
                    // For simplicity, let's skip color if not in the file for OBJ (no direct color)
                }

                if ((parsedData as PLYParseResult)?.indices) {
                    // Determine if Uint16Array or Uint32Array is needed based on the number of vertices
                    const maxIndex = Math.max(...(parsedData as PLYParseResult).indices!);
                    bufferData.indices = maxIndex < 65536
                        ? new Uint16Array((parsedData as PLYParseResult).indices!)
                        : new Uint32Array((parsedData as PLYParseResult).indices!);
                }

                resolve(new Primitive(bufferData));
            };

            reader.onerror = () => {
                reject(new Error(`error reading file ${file.name}`));
            };

            reader.readAsText(file);
        });
    }
}