import { IMRTBlock, IMRTNode } from "./mrtTree";

interface IClusterInfo {
    level: number;
    x: number;
    y: number;
    width: number;
    levelMax: number;
    bgColor: string;
    levelInfos: IColumnInfo[];
}

interface IColumnInfo {
    clusterIndex: number;
    indexInCluster: number;
    startRow: number;
    startColumn: number;
}

interface IRowInfo {
    height: number;
}

interface ILineInfo {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeWidth: number;
    stroke: string;
    opacity: number;
}

interface ICircleInfo {
    key: string;
    cx: number;
    cy: number;
    r: number;
    stroke: string;
    fill: string;
}

interface IBlockInfo {
    key: string;
    nodes: IMRTNode[];
    x: number;
    y: number;
    width: number;
    fontSize: number;
}

interface IGrid {
    rowNum: number;
    columnInfos: IColumnInfo[];
    rowInfos: IRowInfo[];
    cells: IGridCell[];
}

interface IGridCell {
    block: IMRTBlock | null;
    textWidth: number;
}

export {
    IClusterInfo,
    ILineInfo,
    IColumnInfo,
    IRowInfo,
    IGrid,
    IGridCell,
    ICircleInfo,
    IBlockInfo
}