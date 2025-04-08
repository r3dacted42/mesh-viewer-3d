interface PLYParseResult {
    vertexCount: number;
    position: number[];
    normal?: number[];
    color?: number[];
    indices?: number[];
}

export default function parsePLY(data: string): PLYParseResult {
    const lines = data.split('\n');

    let expectedVertices: number | null = null;
    let expectedFaces: number | null = null;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexCount = 0;
    let faceCount = 0;

    let hasColor = false;
    let colorComponents = 0;
    let colorType: 'uchar' | 'float' | null = null;
    let hasNormal = false;

    let inHeader = true;

    for (const lineRaw of lines) {
        const line = lineRaw.trim();
        if (!line) continue;

        if (inHeader) {
            if (line.startsWith("format")) {
                const fileFormat = line.split(' ')[1];
                if (fileFormat.toLowerCase() !== "ascii") {
                    throw new Error(`Unsupported file format: ${fileFormat}`);
                }
                continue;
            }

            if (line.startsWith("comment")) continue;

            if (line.startsWith("element vertex")) {
                expectedVertices = parseInt(line.split(' ')[2]);
                continue;
            }

            if (line.includes("property float nx")) {
                hasNormal = true;
                continue;
            }

            if (line.includes("property uchar red") || line.includes("property float red")) {
                hasColor = true;
                colorComponents = 3;
                colorType = line.includes("uchar") ? 'uchar' : 'float';
                continue;
            }

            if (line.includes("property uchar alpha") || line.includes("property float alpha")) {
                colorComponents = 4;
                continue;
            }

            if (line.startsWith("element face")) {
                expectedFaces = parseInt(line.split(' ')[2]);
                continue;
            }

            if (line === "end_header") {
                inHeader = false;
            }

            continue;
        }

        const tokens = line.split(/\s+/).map(Number);

        if (vertexCount < (expectedVertices ?? 0) && tokens.length >= 3) {
            positions.push(tokens[0], tokens[1], tokens[2]);
            vertexCount++;

            if (hasNormal && tokens.length >= 6) {
                normals.push(tokens[3], tokens[4], tokens[5]);
            }

            if (hasColor) {
                const colorStart = hasNormal ? 6 : 3;
                const rawColors = tokens.slice(colorStart, colorStart + colorComponents);
                const scaledColors = colorType === 'uchar' ? rawColors.map(c => c / 255) : rawColors;
                colors.push(...scaledColors);
            }
            continue;
        }

        if (faceCount < (expectedFaces ?? 0)) {
            const faceMatch = line.match(/^([34])\s+(.+)/);
            if (!faceMatch) continue;

            const vertexNum = parseInt(faceMatch[1]);
            const faceIndices = faceMatch[2].trim().split(/\s+/).map(Number);
            faceCount++;

            if (vertexNum === 3) {
                indices.push(...faceIndices);
            } else if (vertexNum === 4) {
                indices.push(faceIndices[0], faceIndices[1], faceIndices[2], faceIndices[0], faceIndices[2], faceIndices[3]);
            }
        }
    }

    if (expectedVertices !== null && positions.length / 3 !== expectedVertices) {
        throw new Error(`Vertex count mismatch. Expected: ${expectedVertices}, Got: ${positions.length / 3}`);
    }

    if (expectedFaces !== null && faceCount !== expectedFaces) {
        throw new Error(`Face count mismatch. Expected: ${expectedFaces}, Got: ${faceCount}`);
    }

    const result: PLYParseResult = {
        vertexCount: expectedVertices ?? 0,
        position: positions,
        indices: indices.length > 0 ? indices : undefined,
    };

    if (normals.length > 0) result.normal = normals;
    if (colors.length > 0) result.color = colors;

    return result;
}