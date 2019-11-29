
interface IMRTNode {
    type: string;
    id: string;
    name: string;
    link_in: string[];
    link_out: string[];
}

interface IMRTBlock {
    name: string;
    rank: number;
    weight: number;
    nodes: IMRTNode[];
    next: IMRTBlock;
    children: IMRTBlock[];
}

interface IMRTTree {
    root: IMRTBlock;
}

export {
    IMRTNode,
    IMRTBlock,
    IMRTTree
}