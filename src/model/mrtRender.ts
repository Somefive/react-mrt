import { IMRTBlock, IMRTNode } from "./mrtTree";

interface IClusterInfo {
    name: string, 
    value?: number,
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
    row: number;
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
    color: string;
    fontSize: number;
    lineHeight: number;
    fontWeight?: number | "-moz-initial" | "inherit" | "initial" | "revert" | "unset" | "normal" | "bold" | "bolder" | "lighter";
}

interface ITextInfo {
    key: string;
    text: string;
    fontSize: number;
    color: string;
    x: number;
    y: number;
    width?: number;
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
    textHeight: number;
    extend: boolean;
}

interface IHighlightRow {
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    fill: string;
}

export {
    IClusterInfo,
    ILineInfo,
    IColumnInfo,
    IRowInfo,
    IGrid,
    IGridCell,
    ICircleInfo,
    IBlockInfo,
    ITextInfo,
    IHighlightRow
}