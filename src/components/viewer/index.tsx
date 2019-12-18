import * as React from 'react';
import './index.less';
import { IMRTBlock, IMRTNode, IMRTData, IMRTColumn } from '../../model/mrtTree';
import chroma from 'chroma-js';
import { calcTextHeight } from '../../utils/text';
import { IClusterInfo, ILineInfo, IColumnInfo, IGrid, IGridCell, ICircleInfo, IRowInfo, IBlockInfo } from '../../model/mrtRender';

interface IState {
    inited: boolean;
}

interface IProps {
    data: IMRTData;
}

export default class MRTViewer extends React.Component<IProps, IState> {
    private _viewer: HTMLDivElement;
    private _rootLineColor: string;
    private _rootBgColor: string;

    private _parentWidth: number;
    private _parentHeight: number;
    private _globalMarginTop: number;
    private _globalWidth: number;
    private _globalHeight: number;

    private _defaultLineWidth: number;
    private _defaultCircleRadius: number; 
    private _circleMarginTop: number;
    private _columnPaddingTop: number;

    private _rootHeightTotal: number;
    private _rootTextHeight: number;
    private _rootNodeTextWidth: number;
    private _rootNodeGap: number;
    private _rootNodeMarginBottom: number;
    private _rootNodeFontSize: number;
    private _rootNodeLineHeight: number;

    private _minColumnWidth: number;
    private _columnNormalWidth: number;
    private _columnTextWidthRatio: number;
    private _columnTextExtendRatio: number;
    private _columnLineMarginLeft: number;
    private _minClusterLevel: number;

    private _rowPaddingTop: number;
    private _rowPaddingBottom: number;

    private _nodeGap: number;
    private _fontSize: number;
    private _lineHeight: number;
    private _nodeMarginLeft: number;

    private _clusterIndexes: number[];
    private _clusterColors: string[];
    private _grid: IGrid;

    private _clusterInfos: IClusterInfo[];
    private _lineInfos: ILineInfo[];
    private _circleInfos: ICircleInfo[];
    private _blockInfos: IBlockInfo[];

    constructor(props: IProps) {
        super(props);
        this.state = {
            inited: false,
        }

        let root: chroma.Color = chroma.scale()(0.5);
        this._rootLineColor = root.hex();
        this._rootBgColor = root.luminance(0.9).hex();

        this._parentWidth = 0;
        this._parentHeight = 0;

        this._minColumnWidth = 90;
        this._minClusterLevel = 2;
        this._globalMarginTop = 26;
        this._globalHeight = 2500;

        this._columnLineMarginLeft = 14;
        this._defaultLineWidth = 2;
        this._defaultCircleRadius = 9;
        this._circleMarginTop = 20;
        this._columnPaddingTop = 30;

        this._columnTextWidthRatio = 0.8;
        this._columnTextExtendRatio = 1.6;

        this._rowPaddingTop = 12;
        this._rowPaddingBottom = 10;

        this._nodeGap = 4;
        this._fontSize = 10;
        this._lineHeight = 4 + this._fontSize;
        this._nodeMarginLeft = 14;

        this._rootNodeGap = 6;
        this._rootTextHeight = 0;
        this._rootNodeTextWidth = 250;
        this._rootNodeFontSize = 14;
        this._rootNodeLineHeight = 4 + this._rootNodeFontSize;
        this._rootNodeMarginBottom = 10;

        this._clusterColors = [];
        this._lineInfos = [];
        this._circleInfos = [];
        this._blockInfos = [];

        this.handleResize = this.handleResize.bind(this);
        this.handleDoubleClickCluster = this.handleDoubleClickCluster.bind(this);
        this.mapLine = this.mapLine.bind(this);
        this.mapCircle = this.mapCircle.bind(this);
        this.mapBlock = this.mapBlock.bind(this);

        this.initData();
    }

    private initData() {
        const data: IMRTData = this.props.data;
        this._clusterIndexes = [];
        for(let block of data.blocks) {
            if(this._clusterIndexes.indexOf(block.clusterIndex) < 0) {
                this._clusterIndexes.push(block.clusterIndex);
            }
        }
        let clusterNum: number = this._clusterIndexes.length;
        this._rootTextHeight = this.calcNodesHeight(data.root, this._rootNodeTextWidth, this._rootNodeFontSize, this._rootNodeLineHeight, this._rootNodeGap) + this._rootNodeMarginBottom;
        this._rootHeightTotal = this._rootTextHeight + this._globalMarginTop;

        this._clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(clusterNum);
        this._clusterInfos = [];
        for(let i:number=0; i < clusterNum; ++i) {
            let levelMax: number = data.blocks.reduce((pre, current) => {return (current.clusterIndex == i && current.column > pre) ? current.column : pre}, 0) + 1;
            let level: number = this._minClusterLevel;
            let cluster: IClusterInfo = {
                level,
                width: 0,
                levelMax,
                bgColor: chroma(this._clusterColors[i]).luminance(0.8).hex(),
                x: 0,
                y: this._rootHeightTotal,
                levelInfos: []
            }
            this._clusterInfos.push(cluster);
        }
    }

    private handleResize() {
        if(this._viewer) {
            this._parentWidth = this._viewer.offsetWidth;
            this._parentHeight = this._viewer.offsetHeight;
            this.calc();
        }
    }

    private handleDoubleClickCluster(index: number): void {
        let cluster: IClusterInfo = this._clusterInfos[index];
        if(cluster.levelMax > this._minClusterLevel) {
            let level: number = cluster.levelMax == cluster.level ? this._minClusterLevel : cluster.levelMax;
            cluster.level = level;
        }
        this.calc();
        this.forceUpdate();
    }

    private calcNodesHeight(block: IMRTBlock, width: number, fontSize: number, lineHeight: number, gap: number): number {
        let h: number = 0;
        if(block.nodes && block.nodes.length) {
            h = block.nodes.reduce((pre, cur, index): number => {
                return pre + calcTextHeight(cur.name, width, fontSize, lineHeight, "left") + (index > 0 ? gap : 0);
            }, 0);
        }
        return h;
    }

    private calc() {
        let startTime: number = new Date().getTime();
        const data: IMRTData = this.props.data;
        this._grid = {
            rowNum: 0,
            columnInfos: [],
            rowInfos: [],
            cells: []
        }
        let clusterNum: number = this._clusterIndexes.length;

        this._columnNormalWidth = Math.max(this._parentWidth / clusterNum/this._minClusterLevel, this._minColumnWidth);

        this._globalWidth = 0;
        for(let i:number=0; i < clusterNum; ++i) {
            let cluster: IClusterInfo = this._clusterInfos[i];
            let width: number = this._columnNormalWidth * cluster.level;
            cluster.width = width;
            cluster.x = this._globalWidth;
            this._globalWidth += width;
        }
        
        let liveBlocks: IMRTBlock[] = [];
        let rowMax: number = 0;
        for(let block of data.blocks) {
            let clusterInfo: IClusterInfo = this._clusterInfos[block.clusterIndex];
            if(block.column < clusterInfo.level) {
                liveBlocks.push(block);
                if(block.row > rowMax) rowMax = block.row;
            }
        }

        this._grid.rowNum = rowMax + 1;
        for(let c:number=0; c < clusterNum; ++c) {
            let clusterInfo: IClusterInfo = this._clusterInfos[c];
            for(let column:number=0; column < clusterInfo.level; ++ column) {
                let mrtColumn: IMRTColumn | null = this.getMRTColumn(c, column, data.columns);
                if(mrtColumn) {
                    this._grid.columnInfos.push({
                        clusterIndex: c,
                        indexInCluster: column,
                        startRow: mrtColumn.rowStart,
                        startColumn: this.getColumnIndexByIndexInCluster(c, mrtColumn.columnStart, this._grid.columnInfos)
                    })
                }
                for(let row:number=0; row <= rowMax; ++row) {
                    let block: IMRTBlock | null = this.getBlock(c, column, row, liveBlocks);
                    let cell: IGridCell = {
                        block,
                        textWidth: 0,
                        textHeight: 0,
                        extend: false
                    }
                    this._grid.cells.push(cell);
                }
            }
        }
        this._globalHeight = this._rootHeightTotal + this._columnPaddingTop;
        for(let row:number=0; row < this._grid.rowNum; ++row) {
            let rowHeight: number = 0;
            for(let column: number=0; column < this._grid.columnInfos.length; ++column) {
                let cell: IGridCell = this._grid.cells[column * this._grid.rowNum + row];
                if(cell.block) {
                    let rightCell: IGridCell | null = column+1 < this._grid.columnInfos.length ? this._grid.cells[(column+1) * this._grid.rowNum + row] : null;
                    if(!rightCell || (rightCell && rightCell.block)) {
                        cell.textWidth = this._columnNormalWidth * this._columnTextWidthRatio;
                    }else {
                        cell.textWidth = this._columnNormalWidth * this._columnTextExtendRatio;
                        cell.extend = true;
                    }
                    let height: number = this.calcNodesHeight(cell.block, cell.textWidth, this._fontSize, this._lineHeight, this._nodeGap) + this._rowPaddingTop + this._rowPaddingBottom;
                    cell.textHeight = height;
                    rowHeight = rowHeight < height ? height : rowHeight;
                }
            }
            this._grid.rowInfos.push({
                height: rowHeight
            })
            this._globalHeight += rowHeight;
        }

        console.log(this._grid);

        //line
        this._lineInfos.length = 0;
        this._lineInfos.push({
            key: "root_line",
            x1: this._globalWidth/2,
            y1: this._globalMarginTop,
            x2: this._globalWidth/2,
            y2: this._rootHeightTotal,
            stroke: this._rootLineColor,
            strokeWidth: this._defaultLineWidth,
            opacity: 1
        });
        let totalBridgeWidth: number = this._globalWidth - this._clusterInfos[this._clusterInfos.length-1].width;
        this._lineInfos.push({
            key: "bridge_line",
            x1: this._columnLineMarginLeft,
            y1: this._rootHeightTotal,
            x2: this._columnLineMarginLeft + totalBridgeWidth,
            y2: this._rootHeightTotal,
            stroke: this._rootLineColor,
            strokeWidth: this._defaultLineWidth,
            opacity: 1
        });
        for(let i:number=0; i < this._grid.columnInfos.length; ++i) {
            let column: IColumnInfo = this._grid.columnInfos[i];
            let startX: number = this._columnNormalWidth * i + this._columnLineMarginLeft;
            let startY: number = this._rootHeightTotal;
            if(column.indexInCluster > 0) {
                startY += this.getOffsetY(column.startRow);
                this._lineInfos.push({
                    key: `${i}_link_line`,
                    x1: column.startColumn * this._columnNormalWidth + this._columnLineMarginLeft,
                    y1: startY,
                    x2: i * this._columnNormalWidth + this._columnLineMarginLeft,
                    y2: startY,
                    stroke: this._clusterColors[column.clusterIndex],
                    strokeWidth: this._defaultLineWidth,
                    opacity: 1
                })
            }
            this._lineInfos.push({
                key: `${i}_line`,
                x1: startX,
                y1: startY,
                x2: startX,
                y2: this._globalHeight,
                stroke: this._clusterColors[column.clusterIndex],
                strokeWidth: this._defaultLineWidth,
                opacity: 1
            })
        }

        //circle / blocks
        this._circleInfos = [];
        this._blockInfos = [];
        this._circleInfos.push({
            key: "root_circle",
            cx: this._globalWidth/2,
            cy: this._globalMarginTop + this._defaultCircleRadius,
            r: this._defaultCircleRadius,
            stroke: this._rootLineColor,
            fill: this._rootBgColor
        })
        this._blockInfos.push({
            key: "root_block",
            nodes: data.root.nodes,
            x: this._globalWidth / 2 + this._nodeMarginLeft,
            y: this._globalMarginTop,
            width: this._rootNodeTextWidth,
            fontSize: this._rootNodeFontSize
        })
        for(let column: number=0; column < this._grid.columnInfos.length; ++column) {
            for(let row: number=0; row < this._grid.rowNum; ++row) {
                let cell: IGridCell = this._grid.cells[column * this._grid.rowNum + row];
                if(cell.block) {
                    let columnInfo: IColumnInfo = this._grid.columnInfos[column];
                    let rowInfo: IRowInfo = this._grid.rowInfos[row];
                    this._circleInfos.push({
                        key: `${column}_${row}_circle`,
                        cx: column * this._columnNormalWidth + this._columnLineMarginLeft,
                        cy: this._rootHeightTotal + this._circleMarginTop + this.getOffsetY(row),
                        r: this._defaultCircleRadius,
                        stroke: this._clusterColors[columnInfo.clusterIndex],
                        fill: this._clusterInfos[columnInfo.clusterIndex].bgColor
                    })
                    if(cell.extend) {
                        let x1: number = (column+1) * this._columnNormalWidth + this._columnLineMarginLeft;
                        let y1: number = this._rootHeightTotal + this.getOffsetY(row) + this._rowPaddingTop;
                        let nextColumnInfo: IColumnInfo = this._grid.columnInfos[column+1];
                        this._lineInfos.push({
                            key: `${column}_${row}_mask_line`,
                            x1,
                            y1,
                            x2: x1,
                            y2: y1 + cell.textHeight,
                            stroke: this._clusterInfos[nextColumnInfo.clusterIndex].bgColor,
                            strokeWidth: this._defaultLineWidth + 2,
                            opacity: 1
                        })
                    }
                    this._blockInfos.push({
                        key: `${column}_${row}_block`,
                        nodes: cell.block.nodes,
                        x: column * this._columnNormalWidth + this._columnLineMarginLeft + this._nodeMarginLeft,
                        y: this.getOffsetY(row) + this._rootHeightTotal + this._rowPaddingTop,
                        width: cell.textWidth,
                        fontSize: this._fontSize
                    })
                }
            }
        }

        console.log("Calc time: ", (new Date().getTime() - startTime));
    }

    private getColumnIndexByIndexInCluster(cluster: number, index: number, columns: IColumnInfo[]): number {
        let result: number = 0;
        columns.forEach((value: IColumnInfo) => {
            if(value.clusterIndex == cluster && value.indexInCluster == index) {
                return result;
            }else {
                result += 1;
            }
        })
        return result;
    }

    private getOffsetY(start: number): number {
        let offset: number = 0;
        for(let i:number=0; i < start; ++i) {
            offset += this._grid.rowInfos[i].height;
        }
        offset += this._columnPaddingTop;
        return offset;
    }

    private getMRTColumn(cluster: number, index: number, columns: IMRTColumn[]): IMRTColumn | null {
        for(let column of columns) {
            if(column.clusterIndex == cluster && column.index == index) {
                return column;
            }
        }
        return null;
    }

    private getBlock(cluster: number, column: number, row: number, blocks: IMRTBlock[]): IMRTBlock | null {
        for(let block of blocks) {
            if(block.clusterIndex == cluster && block.column == column && block.row == row) {
                return block;
            }
        }
        return null;
    }

    private mapLine(value: ILineInfo): JSX.Element {
        return <line key={value.key}
                    x1={value.x1} 
                    x2={value.x2} 
                    y1={value.y1} 
                    y2={value.y2} 
                    stroke={value.stroke} 
                    strokeWidth={value.strokeWidth} />;
    }

    private mapCircle(value: ICircleInfo): JSX.Element {
        return <circle key={value.key}
                    cx={value.cx} 
                    cy={value.cy} 
                    r={value.r} 
                    stroke={value.stroke} 
                    fill={value.fill} />
    }

    private mapBlock(block: IBlockInfo): JSX.Element {
        return (
            <div key={block.key} style={{position: "absolute", left: block.x, top: block.y, width: `${block.width}px`}}>
                {
                    block.nodes.map((node: IMRTNode, index: number) => {
                        return (
                            <div key={node.id} 
                                style={{fontSize: `${block.fontSize}px`, 
                                    lineHeight: `${this._lineHeight}px`, 
                                    width: "100%", 
                                    marginTop: (index == 0 ? 0 : `${this._nodeGap}`), 
                                    textAlign: "left", 
                                    wordWrap: "break-word", 
                                    wordBreak: "break-word",
                                    display: "inline-block"}}>
                                {node.name}
                            </div>
                        )
                    })
                }
            </div>
        )
    }

    public componentDidUpdate(preProps: IProps) {
        if(preProps != this.props) {
            this.calc();
        }
    }

    public componentDidMount() {
        this.handleResize();

        window.addEventListener("resize", this.handleResize);

        this.setState({inited: true});
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);
    }

    public render() {
        const { inited } = this.state;
        return (
            <div className='_mrtviewer' ref={(e) => {this._viewer = e!;}} style={{backgroundColor: this._rootBgColor}}>
                {
                    inited ? (
                        <div className='_mrtview_canvas' style={{width: `${this._globalWidth}px`, height: `${this._globalHeight}px`}}>
                            <svg className='_mrtviewer_bg' width={this._globalWidth} height={this._globalHeight}>
                                {
                                    this._clusterInfos.map((value: IClusterInfo, index: number) => {
                                        return <rect key={index} 
                                                    onDoubleClick={() => this.handleDoubleClickCluster(index)}
                                                    fill={value.bgColor} 
                                                    x={value.x} 
                                                    y={value.y} 
                                                    width={value.width} 
                                                    height={this._globalHeight} />
                                    })
                                }
                                {
                                    this._lineInfos.map(this.mapLine)
                                }
                                {
                                    this._circleInfos.map(this.mapCircle)
                                }
                            </svg>
                            <div>
                                {
                                    this._blockInfos.map(this.mapBlock)
                                }
                            </div>
                        </div>
                    ) : null
                }
            </div>
        )
    }
}