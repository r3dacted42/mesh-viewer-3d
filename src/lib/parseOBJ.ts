export interface OBJParseResult {
    position: number[];
    texcoord: number[];
    normal: number[];
}

export default function parseOBJ(text: string): OBJParseResult {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions: number[][] = [[0, 0, 0]];
    const objTexcoords: number[][] = [[0, 0]];
    const objNormals: number[][] = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData: number[][][] = [
        objPositions,
        objTexcoords,
        objNormals,
    ];

    // same order as `f` indices
    const webglVertexData: number[][] = [
        [],   // positions
        [],   // texcoords
        [],   // normals
    ];

    function addVertex(vert: string): void {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr, 10);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
        });
    }

    interface Keywords {
        v: (parts: string[]) => void;
        vn: (parts: string[]) => void;
        vt: (parts: string[]) => void;
        f: (parts: string[]) => void;
    }

    const keywords: Keywords = {
        v(parts: string[]): void {
            objPositions.push(parts.map(parseFloat));
        },
        vn(parts: string[]): void {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts: string[]): void {
            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts: string[]): void {
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword as keyof Keywords];
        if (!handler) {
            console.warn('unhandled keyword:', keyword); // eslint-disable-line no-console
            continue;
        }
        handler(parts);
    }

    return {
        position: webglVertexData[0],
        texcoord: webglVertexData[1],
        normal: webglVertexData[2],
    };
}