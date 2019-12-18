
interface IMRTNode {
    type: string;
    id: string;
    name: string;
    link_in: string[];
    link_out: string[];
}

interface IMRTBlock {
    name: string;
    clusterIndex: number;
    column: number;
    row: number;
    weight: number;
    nodes: IMRTNode[];
}

interface IMRTColumn {
    clusterIndex: number;
    index: number;
    rowStart: number;
    columnStart: number;
}

interface IMRTData {
    root: IMRTBlock;
    blocks: IMRTBlock[];
    columns: IMRTColumn[];
}

export {
    IMRTNode,
    IMRTBlock,
    IMRTData,
    IMRTColumn
}