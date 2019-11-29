import * as React from 'react';
import './index.less';
import { IMRTTree, IMRTBlock, IMRTNode } from '../../model/mrtTree';
import chroma from 'chroma-js';
import { calcTextHeight } from '../../utils/text';
import { IClusterInfo } from '../../model/mrtRender';

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

    private _rootHeightTotal: number;
    private _rootNodeTextWidth: number;
    private _rootNodeGap: number;
    private _rootNodeMarginBottom: number;
    private _rootNodeFontSize: number;
    private _rootNodeLineHeight: number;

    private _minBranchWidth: number;
    private _branchNormalWidth: number;
    private _minClusterLevel: number;
    private _clusterInfos: IClusterInfo[];

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

        this._rootNodeGap = 6;
        this._rootNodeTextWidth = 250;
        this._rootNodeFontSize = 14;
        this._rootNodeLineHeight = 4 + this._rootNodeFontSize;
        this._rootNodeMarginBottom = 10;

        this.handleResize = this.handleResize.bind(this);
        this.handleDoubleClickCluster = this.handleDoubleClickCluster.bind(this);
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
            let width: number = this._branchNormalWidth * level;
            cluster.level = level;
            let widthChange: number = width - cluster.width;
            cluster.width = width;

            for(let i:number=index+1; i < this._clusterInfos.length; ++i) {
                this._clusterInfos[i].startX += widthChange;
            }
            this._globalWidth += widthChange;
        }

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

        let rootTextHeight: number = this.calcNodesHeight(data.root, this._rootNodeTextWidth, this._rootNodeFontSize, this._rootNodeLineHeight, this._rootNodeGap, this._rootNodeMarginBottom);
        this._rootHeightTotal = rootTextHeight + this._globalMarginTop;
        this._branchNormalWidth = Math.max(this._parentWidth / this.props.data.root.children.length/this._minClusterLevel, this._minBranchWidth);

        if(!this._clusterInfos || this._clusterInfos.length != data.root.children.length) {
            //初始化branchInfos
            let clusterColors: string[] = chroma.cubehelix().start(200).rotations(3).gamma(0.7).lightness([0.2, 0.6]).scale().correctLightness().colors(clusterNum);
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
                    bgColor: chroma(clusterColors[i]).luminance(0.8).hex(),
                    startX: this._globalWidth,
                    startY: this._rootHeightTotal
                }
                this._globalWidth += width;
                this._clusterInfos.push(cluster);
            }
        }else {
            //更新branchInfos
            this._globalWidth = 0;
            for(let i:number=0; i < data.root.children.length; ++i) {
                let block: IMRTBlock = data.root.children[i];
                let cluster: IClusterInfo = this._clusterInfos[i];
                let levelMax: number = this.getBranchNum(block);
                let width: number = this._branchNormalWidth * cluster.level;
                cluster.width = width;
                cluster.levelMax = levelMax;
                cluster.startX = this._globalWidth;
                cluster.startY = this._rootHeightTotal;
                this._globalWidth += width;
            }
        }
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
                                                    x={value.startX} 
                                                    y={value.startY} 
                                                    width={value.width} 
                                                    height={this._globalHeight} />
                                    })
                                }
                            </svg>
                        </div>
                    ) : null
                }
            </div>
        )
    }
}