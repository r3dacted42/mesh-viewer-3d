interface PLYParseResult {
    vertexCount: number;
    position: number[];
    normal?: number[];
    color?: number[];
    indices?: number[];
}

export default function parsePLY(data: string): PLYParseResult {
    const lines = data.split('\n');

    let expectedFaces: number | null = null;
    let expectedVertices: number | null = null;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexCount = 0;
    let facesCount = 0;

    let hasColor = false;
    let colorComponents = 0;
    let colorType: 'uchar' | 'float' | null = null;

    let hasNormal = false;

    for (let x = 0; x < lines.length; x++) {
        const line = lines[x].trim();

        if (!line || line === '') {
            continue;
        }

        if (line.startsWith("format")) {
            const fileFormat = line.trim().split(' ')[1];
            if (fileFormat.toLowerCase() !== "ascii") {
                console.log(`File format is not ascii! It is: ${fileFormat}`);
                throw new Error(`File format is not ascii! It is: ${fileFormat}`);
            }
        }

        if (line.startsWith("comment")) {
            continue;
        }

        if (line.includes("element vertex")) {
            expectedVertices = parseInt(line.match(/^element\s+vertex\s+(\d+)/)?.[1] || '0');
            continue;
        }

        if (line.includes("property float nx")) {
            hasNormal = true;
            continue;
        }
        if (line.includes("property float ny")) {
            continue;
        }
        if (line.includes("property float nz")) {
            continue;
        }

        if (line.includes("property uchar red") || line.includes("property float red")) {
            hasColor = true;
            colorComponents = 3;
            colorType = line.includes("uchar") ? 'uchar' : 'float';
            continue;
        }
        if (line.includes("property uchar green") || line.includes("property float green")) {
            continue;
        }
        if (line.includes("property uchar blue") || line.includes("property float blue")) {
            continue;
        }
        if (line.includes("property uchar alpha") || line.includes("property float alpha")) {
            colorComponents = 4;
            continue;
        }

        if (line.includes("element face")) {
            expectedFaces = parseInt(line.match(/^element\s+face\s+(\d+)/)?.[1] || '0');
            console.log(expectedFaces);
        }

        if (line.includes("end_header")) {
            continue;
        }

        const vertexMatch = line.match(/^([-|\d]+(\.\d+)?)\s+([-|\d]+(\.\d+)?)\s+([-|\d]+(\.\d+)?)((\s+([-|\d]+(\.\d+)?)){3})?((\s+([-|\d]+(\.\d+)?)){3,4})?/);
        if (vertexMatch && vertexCount < (expectedVertices || 0)) {
            vertexCount++;
            positions.push(parseFloat(vertexMatch[1]), parseFloat(vertexMatch[3]), parseFloat(vertexMatch[5]));

            if (hasNormal && vertexMatch[7]) {
                normals.push(
                    parseFloat(vertexMatch[9]),
                    parseFloat(vertexMatch[11]),
                    parseFloat(vertexMatch[13]),
                );
            }

            if (hasColor && vertexMatch[14]) {
                const colorValues = vertexMatch[16].trim().split(/\s+/).map(parseFloat);
                if (colorType === 'uchar') {
                    colors.push(...colorValues.map(c => c / 255));
                } else {
                    colors.push(...colorValues);
                }
                while (colors.length < positions.length / 3 * colorComponents) {
                    colors.push(0);
                }
            }
        }

        const faceMatch = line.match(/^([34])\s+((\d+\s*)+)$/);
        if (faceMatch && facesCount < (expectedFaces || 0)) {
            facesCount++;
            const numVertices = parseInt(faceMatch[1]);
            const faceIndices = faceMatch[2].trim().split(/\s+/).map(Number);

            // Triangulate polygons (handle triangles and quads)
            if (numVertices === 3) {
                indices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
            } else if (numVertices === 4) {
                indices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
                indices.push(faceIndices[0], faceIndices[2], faceIndices[3]);
            }
        }
    }

    if (expectedVertices !== null && positions.length / 3 !== expectedVertices) {
        console.log(`Error: total vertices read: ${positions.length / 3} does not match expected vertices: ${expectedVertices}`);
        throw new Error(`Error: total vertices read: ${positions.length / 3} does not match expected vertices: ${expectedVertices}`);
    }

    if (expectedFaces !== null && facesCount !== expectedFaces) {
        console.log(`Error: total faces read: ${facesCount} does not match expected faces: ${expectedFaces}`);
        throw new Error(`Error: total faces read: ${facesCount} does not match expected faces: ${expectedFaces}`);
    }

    const result: PLYParseResult = {
        vertexCount: expectedVertices || 0,
        position: positions,
        indices: indices.length > 0 ? indices : undefined,
    };

    if (normals.length > 0) {
        result.normal = normals;
    }

    if (colors.length > 0) {
        result.color = colors;
    }

    return result;
}