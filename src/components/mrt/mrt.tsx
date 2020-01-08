import * as React from 'react';
import './mrt.css';
import MRTViewer from '../viewer';
import { IMRTData } from '../../model/mrtTree';
import { Toolbox } from '../toolbox';

interface IState {
    canvasScale: number;
    fontScale: number;
    hideSubBranch: boolean;
    disableTextClusterSpan: boolean;
}

interface IProps {
    data: IMRTData;
}

export default class MRT extends React.Component<IProps, IState> {
    private FONT_SCALE_MAX: number = 2;
    private FONT_SCALE_MIN: number = 1;

    private CANVAS_SCALE_MAX: number = 1.6;
    private CANVAS_SCALE_MIN: number = 1;

    constructor(props: IProps) {
        super(props);

        this.state = {
            canvasScale: 1,
            fontScale: props.data.columns.length <= 6 ? 1.2 : 1,
            hideSubBranch: false,
            disableTextClusterSpan: false
        }

        this.handleScaleFont = this.handleScaleFont.bind(this);
        this.handleZoom = this.handleZoom.bind(this);
        this.handleHideSubBranch = this.handleHideSubBranch.bind(this);
        this.handleDisableTextClusterSpan = this.handleDisableTextClusterSpan.bind(this);
    }

    private handleScaleFont(larger: boolean): void {
        let scale = larger ? Math.min(this.FONT_SCALE_MAX, this.state.fontScale * 1.1) : Math.max(this.FONT_SCALE_MIN, this.state.fontScale * 0.9);
        if(scale != this.state.fontScale) {
            this.setState({fontScale: scale});
        }
    }

    private handleZoom(larger: boolean): void {
        let scale = larger ? Math.min(this.CANVAS_SCALE_MAX, this.state.canvasScale * 1.08) : Math.max(this.CANVAS_SCALE_MIN, this.state.canvasScale * 0.94);
        if(scale != this.state.canvasScale) {
            this.setState({canvasScale: scale});
        }
    }

    private handleHideSubBranch(): void {
        this.setState({hideSubBranch: !this.state.hideSubBranch});
    }

    private handleDisableTextClusterSpan(): void {
        this.setState({disableTextClusterSpan: !this.state.disableTextClusterSpan});
    }

    public componentDidUpdate(preProps: IProps): void {
        if(preProps.data != this.props.data) {
            let fontScale: number = this.props.data.columns.length <= 6 ? 1.2 : 1;
            if(fontScale != this.state.fontScale) {
                this.setState({fontScale});
            }
        }
    }

    public render() {
        const {data} = this.props;
        const { fontScale, canvasScale, hideSubBranch, disableTextClusterSpan } = this.state;

        return (
            <div className='_mrt'>
                <MRTViewer data={data} 
                    fontScale={fontScale} 
                    scale={canvasScale} 
                    hideSubBranch={hideSubBranch} 
                    disableTextClusterSpan={disableTextClusterSpan}></MRTViewer>
                <Toolbox lang={'en'} 
                    scaleFont={this.handleScaleFont} 
                    zoom={this.handleZoom} 
                    hideSubBranch={hideSubBranch} 
                    onHideSubBranch={this.handleHideSubBranch} 
                    disableTextClusterSpan={disableTextClusterSpan} 
                    onDisableTextClusterSpan={this.handleDisableTextClusterSpan} />
            </div>
        )
    }
}