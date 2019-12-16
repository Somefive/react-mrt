import * as React from 'react';
import './index.less';
import { IMRTTree, IMRTBlock, IMRTNode } from '../../model/mrtTree';
import chroma from 'chroma-js';
import { calcTextHeight } from '../../utils/text';
import { IClusterInfo, ILineInfo } from '../../model/mrtRender';

interface IState {
    inited: boolean;
}

interface IProps {
    data: IMRTTree;
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
    private _branchPaddingTop: number;

    private _rootHeightTotal: number;
    private _rootTextHeight: number;
    private _rootNodeTextWidth: number;
    private _rootNodeGap: number;
    private _rootNodeMarginBottom: number;
    private _rootNodeFontSize: number;
    private _rootNodeLineHeight: number;

    private _minBranchWidth: number;
    private _branchNormalWidth: number;
    private _branchLineMarginLeft: number;
    private _minClusterLevel: number;
    private _clusterColors: string[];

    private _clusterInfos: IClusterInfo[];
    private _lineInfos: ILineInfo[];

    constructor(props: IProps) {
        super(props);
        this.state = {
            inited: false,
        }

        let root: chroma.Color = chroma.scale()(0.5);
        this._rootLineColor = root.hex();
        this._rootBgColor = root.luminance(0.9).hex();

        this._minBranchWidth = 90;
        this._minClusterLevel = 1;
        this._globalMarginTop = 26;
        this._globalHeight = 1500;

        this._branchLineMarginLeft = 14;
        this._defaultLineWidth = 2;
        this._defaultCircleRadius = 4;
        this._circleMarginTop = 8;
        this._branchPaddingTop = 20;

        this._rootNodeGap = 6;
        this._rootTextHeight = 0;
        this._rootNodeTextWidth = 250;
        this._rootNodeFontSize = 14;
        this._rootNodeLineHeight = 4 + this._rootNodeFontSize;
        this._rootNodeMarginBottom = 10;

        this._clusterColors = [];
        this._lineInfos = [];

        this.handleResize = this.handleResize.bind(this);
        this.handleDoubleClickCluster = this.handleDoubleClickCluster.bind(this);
        this.mapLine = this.mapLine.bind(this);

        this.initData();
    }

    private initData() {
        const data: IMRTTree = this.props.data;
        let clusterNum: number = data.root.children.length;

        this._rootTextHeight = this.calcNodesHeight(data.root, this._rootNodeTextWidth, this._rootNodeFontSize, this._rootNodeLineHeight, this._rootNodeGap, this._rootNodeMarginBottom);
        this._rootHeightTotal = this._rootTextHeight + this._globalMarginTop;
        this._branchNormalWidth = Math.max(this._parentWidth / this.props.data.root.children.length/this._minClusterLevel, this._minBranchWidth);

        this._clusterColors = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(clusterNum);
        this._clusterInfos = [];
        this._globalWidth = 0;
        for(let i:number=0; i < clusterNum; ++i) {
            let block: IMRTBlock = data.root.children[i];
            let levelMax: number = this.getBranchNum(block);
            let level: number = this._minClusterLevel;
            let width: number = this._branchNormalWidth * level;
            let cluster: IClusterInfo = {
                level,
                width,
                levelMax,
                bgColor: chroma(this._clusterColors[i]).luminance(0.8).hex(),
                x: this._globalWidth,
                y: this._rootHeightTotal
            }
            this._globalWidth += width;
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

    private getBranchNum(block: IMRTBlock, sum: number=1): number {
        if(block.next) {
            sum = this.getBranchNum(block.next, sum);
        }
        if(block.children && block.children.length) {
            for(let child of block.children) {
                sum = this.getBranchNum(child, sum);
            }
            return sum += block.children.length;
        }else {
            return sum;
        }
    }

    private calcNodesHeight(block: IMRTBlock, width: number, fontSize: number, lineHeight: number, gap: number, marginBottom: number): number {
        let h: number = 0;
        if(block.nodes && block.nodes.length) {
            h = block.nodes.reduce((pre, cur, index): number => {
                return pre + calcTextHeight(cur.name, width, fontSize, lineHeight) + (index > 0 ? gap : 0);
            }, h);
        }
        h += marginBottom;
        return h;
    }

    private calc() {
        const data: IMRTTree = this.props.data;
        let clusterNum: number = data.root.children.length;

        this._branchNormalWidth = Math.max(this._parentWidth / this.props.data.root.children.length/this._minClusterLevel, this._minBranchWidth);

        this._globalWidth = 0;
        for(let i:number=0; i < clusterNum; ++i) {
            let cluster: IClusterInfo = this._clusterInfos[i];
            let width: number = this._branchNormalWidth * cluster.level;
            cluster.width = width;
            cluster.x = this._globalWidth;
            this._globalWidth += width;
        }
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
            x1: this._branchLineMarginLeft,
            y1: this._rootHeightTotal,
            x2: this._branchLineMarginLeft + totalBridgeWidth,
            y2: this._rootHeightTotal,
            stroke: this._rootLineColor,
            strokeWidth: this._defaultLineWidth,
            opacity: 1
        });
        for(let i:number=0; i < clusterNum; ++i) {
            let cluster: IClusterInfo = this._clusterInfos[i];
            let block: IMRTBlock = data.root.children[i];
            this._lineInfos.push({
                key: `${i}_0_line`,
                x1: cluster.x + this._branchLineMarginLeft,
                y1: cluster.y,
                x2: cluster.x + this._branchLineMarginLeft,
                y2: this._globalHeight,
                stroke: this._clusterColors[i],
                strokeWidth: this._defaultLineWidth,
                opacity: 1
            })
        }
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

    private calcText(block: IMRTBlock): void {
        if(block.nodes) {
            for(let node of block.nodes) {
                // console.log("CalcTextHeight: ", node.name, calcTextHeight(node.name, 200, 16, 20));
                calcTextHeight(node.name, 200, 16, 20);
            }
            if(block.next) {
                this.calcText(block.next);
            }
            if(block.children) {
                for(let child of block.children) {
                    this.calcText(child);
                }
            }
        }
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
                            </svg>
                        </div>
                    ) : null
                }
            </div>
        )
    }
}